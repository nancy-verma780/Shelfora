"""Demo store: a simulated shelf that sells and gets restocked, rendered as a camera frame.

The simulator only stands in for the camera and the POS. Its frames go through the same
detection-to-slot code as a real camera, so the rest of the pipeline is exercised for real.
"""
from __future__ import annotations
import math
import random
import cv2
import numpy as np

from .config import Camera, Product
from .shelf import Detection

W, H = 1280, 720


def _bgr(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return (b, g, r)


class SimStore:
    def __init__(self, products: list[Product], seed: int = 7):
        self.rng = random.Random(seed)
        self.products = {p.id: p for p in products}
        self.units = {p.id: float(p.demo.get("units", p.capacity)) for p in products}
        self.velocity = {p.id: float(p.demo.get("velocity", 1.0)) for p in products}

    def tick(self, store_seconds: float) -> list[tuple[str, int]]:
        """Advance the shop. Returns POS sales [(product_id, qty)] for the period."""
        sales = []
        hours = store_seconds / 3600
        for pid, p in self.products.items():
            if self.units[pid] <= 0:
                continue
            lam = p.normal_rate * self.velocity[pid] * hours
            qty = min(int(self.units[pid]), self._poisson(lam))
            if qty:
                self.units[pid] -= qty
                sales.append((pid, qty))
        return sales

    def _poisson(self, lam: float) -> int:
        if lam <= 0:
            return 0
        L, k, p = math.exp(-lam), 0, 1.0
        while True:
            p *= self.rng.random()
            if p <= L:
                return k
            k += 1

    def refill(self, pid: str) -> None:
        self.units[pid] = self.products[pid].capacity

    def render(self, cam: Camera) -> tuple[np.ndarray, list[Detection]]:
        """Draw what the camera would see and return ground-truth boxes (with ~3% misses, like a real detector)."""
        img = np.full((H, W, 3), (58, 64, 62), np.uint8)
        cv2.rectangle(img, (0, 0), (W, 40), (30, 33, 32), -1)
        dets: list[Detection] = []
        for p in (x for x in self.products.values() if x.camera == cam.id):
            x1, y1, x2, y2 = (int(p.slot[0] * W), int(p.slot[1] * H), int(p.slot[2] * W), int(p.slot[3] * H))
            board = y2 - 12
            cv2.rectangle(img, (x1 - 2, board), (x2 + 2, board + 10), (200, 206, 202), -1)
            visible = 0 if self.units[p.id] <= 0 else max(1, math.ceil(self.units[p.id] / p.capacity * p.facings_full))
            pw = (x2 - x1 - 12) / p.facings_full
            ph = int((y2 - y1) * (0.75 if p.shape in ("bottle", "jug", "carton", "tube") else 0.55))
            for f in range(visible):
                bx1 = int(x1 + 6 + f * pw + 2)
                bx2 = int(x1 + 6 + (f + 1) * pw - 2)
                by1 = board - ph
                cv2.rectangle(img, (bx1, by1), (bx2, board), _bgr(p.color), -1)
                cv2.rectangle(img, (bx1 + 3, by1 + ph // 3), (bx2 - 3, by1 + ph // 2), (235, 235, 235), -1)
                if self.rng.random() > 0.03:
                    dets.append(Detection(bx1 / W, by1 / H, bx2 / W, board / H, round(self.rng.uniform(0.62, 0.97), 2)))
        cv2.putText(img, "SIMULATED CAMERA - demo store", (16, 27), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (170, 180, 175), 1, cv2.LINE_AA)
        noise = np.random.default_rng().normal(0, 6, img.shape).astype(np.int16)
        img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        return img, dets
