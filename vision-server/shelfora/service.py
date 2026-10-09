"""The Shelfora pipeline: every few seconds, look at each camera and update shelf stock."""
from __future__ import annotations
import threading
import time
from collections import deque

import cv2
import numpy as np

from .camera import CameraReader
from .clock import Clock
from .config import Config
from .sales import SalesLog, window_hours
from .shelf import Detection, Smoother, slot_reading
from .simulate import SimStore

BOX = {"in_stock": (155, 211, 69), "low_stock": (71, 181, 255), "out_of_stock": (91, 107, 255)}


class Pipeline:
    def __init__(self, cfg: Config, db_path: str = "data/sales.db"):
        self.cfg = cfg
        self.sim = cfg.simulated
        self.clock = Clock(cfg.demo.get("speed", 60) if self.sim else 1)
        self.sales = SalesLog(db_path)
        self.smoother = Smoother(cfg.pipeline.get("smoothing_frames", 3))
        self.lock = threading.Lock()
        self.events: deque[dict] = deque(maxlen=200)
        self._seq = 0
        self.listeners: list = []
        self.frames: dict[str, bytes] = {}
        self.cam_status: dict[str, str] = {}
        self._build()
        threading.Thread(target=self._loop, daemon=True).start()

    # ── setup ────────────────────────────────────────────────────────────────
    def _build(self) -> None:
        cfg, now = self.cfg, self.clock.now()
        self.store = SimStore(cfg.products) if self.sim else None
        self.readers = {} if self.sim else {c.id: CameraReader(c.source) for c in cfg.cameras}
        self.detector = None
        if not self.sim:
            from .detector import Detector
            d = cfg.detector
            self.detector = Detector(d["weights"], d.get("conf", 0.35), d.get("iou", 0.5))
        self.state = {
            p.id: {
                "units": int(p.demo.get("units", p.capacity)) if self.sim else 0,
                "last_seen": now,
                "last_refill": now - p.demo.get("last_refill_min", 0) * 60 if self.sim else now,
                "empty_since": None,
                "status": None,
            }
            for p in cfg.products
        }
        if self.sim:
            self._seed_sales(now)
        for pid, s in self.state.items():
            self.smoother.reset(pid, s["units"])
            s["status"] = self._status(pid, s["units"])
            if s["units"] == 0:
                s["empty_since"] = now - 20 * 60

    def _seed_sales(self, now: float) -> None:
        """Give the demo an hour of POS history so velocity is meaningful from the first second."""
        self.sales.clear()
        rows = []
        window = self.cfg.sales.get("velocity_window_min", 60)
        for p in self.cfg.products:
            v = p.demo.get("velocity", 1.0)
            per_min = p.normal_rate * v / 60
            empty_offset = 20 * 60 if p.demo.get("units", 1) == 0 else 0
            acc = 0.0
            span = int(window_hours(p.normal_rate, window) * 60 * 1.5)  # covers the look-back while the demo clock runs
            for m in range(span):
                acc += per_min
                if acc >= 1:
                    q = int(acc)
                    acc -= q
                    rows.append((p.id, now - empty_offset - (span - m) * 60, q))
        self.sales.add(rows)

    # ── loop ─────────────────────────────────────────────────────────────────
    def _loop(self) -> None:
        interval = self.cfg.pipeline.get("interval_sec", 3)
        last = self.clock.now()
        while True:
            time.sleep(interval)
            now = self.clock.now()
            try:
                if self.sim:
                    sold = self.store.tick(now - last)
                    if sold:
                        self.sales.add([(pid, now - self.clock.speed * interval * 0.5, q) for pid, q in sold])
                self.scan(now)
            except Exception as e:  # keep the service alive if one camera misbehaves
                self._event("error", None, f"Scan failed: {e}")
            last = now

    def scan(self, now: float) -> None:
        empty_labels = set(self.cfg.detector.get("empty_classes", []))
        for cam in self.cfg.cameras:
            if self.sim:
                frame, dets = self.store.render(cam)
                self.cam_status[cam.id] = "connected"
            else:
                r = self.readers[cam.id]
                self.cam_status[cam.id] = r.status
                frame = r.read()
                if frame is None:
                    continue
                dets = self.detector(frame)
            self._apply(cam.id, frame, dets, empty_labels, now)

    def _apply(self, cam_id: str, frame: np.ndarray, dets: list[Detection], empty_labels: set[str], now: float) -> None:
        h, w = frame.shape[:2]
        with self.lock:
            for p in (x for x in self.cfg.products if x.camera == cam_id):
                reading = slot_reading(p, dets, empty_labels)
                units = self.smoother.push(p.id, reading["units"])
                s = self.state[p.id]
                s["units"], s["last_seen"] = units, now
                status = self._status(p.id, units)
                if status != s["status"]:
                    if status == "out_of_stock":
                        s["empty_since"] = now
                        self._event("out_of_stock", p.id, f"{p.name} is out of stock")
                    elif status == "low_stock" and s["status"] == "in_stock":
                        self._event("low_stock", p.id, f"{p.name} is running low")
                    s["status"] = status
                if status != "out_of_stock":
                    s["empty_since"] = None
                wrong = sorted(set(reading["misplaced"]))
                if wrong and wrong != s.get("misplaced"):
                    self._event("misplaced", p.id, f"{', '.join(wrong)} spotted in {p.name}'s spot (Rack {p.shelf})")
                s["misplaced"] = wrong
                color = BOX[status]
                for d in reading["boxes"]:
                    cv2.rectangle(frame, (int(d.x1 * w), int(d.y1 * h)), (int(d.x2 * w), int(d.y2 * h)), color, 2)
                if status == "out_of_stock":
                    x1, y1, x2, y2 = (int(p.slot[0] * w), int(p.slot[1] * h), int(p.slot[2] * w), int(p.slot[3] * h))
                    cv2.rectangle(frame, (x1 + 4, y1 + 6), (x2 - 4, y2 - 8), color, 2)
                    cv2.putText(frame, f"{p.name[:18]} empty", (x1 + 8, y1 + 22), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA)
            ok, jpg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 78])
            if ok:
                self.frames[cam_id] = jpg.tobytes()

    def _status(self, pid: str, units: int) -> str:
        p = next(x for x in self.cfg.products if x.id == pid)
        if units <= 0:
            return "out_of_stock"
        return "low_stock" if units <= p.capacity * self.cfg.pipeline.get("low_stock_threshold", 0.25) else "in_stock"

    def _event(self, kind: str, pid: str | None, text: str) -> None:
        self._seq += 1
        ev = {"seq": self._seq, "kind": kind, "productId": pid, "text": text, "at": time.time()}
        self.events.append(ev)
        for fn in list(self.listeners):
            fn(ev)

    # ── API helpers ──────────────────────────────────────────────────────────
    def records(self) -> list[dict]:
        """Product records in the shape the dashboard's ProductRecord type expects."""
        now = self.clock.now()
        s_cfg = self.cfg.sales
        out = []
        with self.lock:
            for p in self.cfg.products:
                s = self.state[p.id]
                # When the shelf is empty sales stop, so measure speed up to the moment it ran out.
                ref = s["empty_since"] or now
                current, normal = self.sales.rates(p.id, ref, p.normal_rate, s_cfg.get("velocity_window_min", 60),
                                                   s_cfg.get("baseline_days", 28), self.cfg.store.get("open_hours", 14))
                out.append({
                    "id": p.id, "name": p.name, "category": p.category, "section": p.section, "shelf": p.shelf,
                    "camera": p.camera, "shelfCapacity": p.capacity, "estimatedStock": s["units"],
                    "normalSalesRate": round(normal, 2), "salesVelocity": round(current / normal, 2),
                    "lastDetectedMin": round((now - s["last_seen"]) / 60 / (self.clock.speed if self.sim else 1)),
                    "lastRefillMin": round((now - s["last_refill"]) / 60),
                    "color": p.color, "shape": p.shape,
                })
        return out

    def refill(self, pid: str, by: str) -> bool:
        p = next((x for x in self.cfg.products if x.id == pid), None)
        if not p:
            return False
        now = self.clock.now()
        with self.lock:
            if self.sim:
                self.store.refill(pid)
            s = self.state[pid]
            s["last_refill"] = now
            if self.sim:  # a real camera confirms on its next scan
                s["units"], s["status"], s["empty_since"] = p.capacity, "in_stock", None
                self.smoother.reset(pid, p.capacity)
        self._event("refilled", pid, f"{p.name} refilled by {by}")
        return True

    def cameras(self) -> list[dict]:
        return [{"id": c.id, "label": c.label, "name": c.name, "section": c.section, "racks": c.racks,
                 "resolution": c.resolution, "fps": c.fps, "status": self.cam_status.get(c.id, "connecting")}
                for c in self.cfg.cameras]

    def reset_demo(self) -> None:
        with self.lock:
            self.clock = Clock(self.clock.speed)
            self._build()
        self._event("reset", None, "Demo store restored")
