"""HTTP + WebSocket API consumed by the Shelfora dashboard.

Run:  uvicorn shelfora.api:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations
import asyncio
import csv
import io
import os
import time

from fastapi import Body, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from . import config
from .service import Pipeline


class SaleIn(BaseModel):
    product_id: str
    qty: int = 1
    ts: float | None = None  # unix seconds; defaults to now


class RefillIn(BaseModel):
    by: str = "Store staff"


def create_app(config_path: str | None = None) -> FastAPI:
    cfg = config.load(config_path or os.getenv("SHELFORA_CONFIG", "config/store.yaml"))
    pipe = Pipeline(cfg, os.getenv("SHELFORA_DB", "data/sales.db"))
    app = FastAPI(title="Shelfora Vision API", version="0.2.0")
    app.add_middleware(CORSMiddleware, allow_origins=os.getenv("SHELFORA_CORS", "*").split(","), allow_methods=["*"], allow_headers=["*"])
    app.state.pipe = pipe

    @app.get("/health")
    def health():
        return {"ok": True, "mode": "demo" if pipe.sim else "live", "store": cfg.store["name"],
                "cameras": pipe.cameras(), "products": len(cfg.products)}

    @app.get("/products")
    def products():
        return pipe.records()

    @app.get("/cameras")
    def cameras():
        return pipe.cameras()

    @app.get("/cameras/{cam_id}/frame.jpg")
    def frame(cam_id: str):
        jpg = pipe.frames.get(cam_id)
        if not jpg:
            raise HTTPException(404, "No frame yet from this camera")
        return Response(jpg, media_type="image/jpeg", headers={"Cache-Control": "no-store"})

    @app.post("/products/{pid}/refill")
    def refill(pid: str, body: RefillIn = Body(default=RefillIn())):
        if not pipe.refill(pid, body.by):
            raise HTTPException(404, "Unknown product")
        return {"ok": True, "productId": pid, "by": body.by}

    @app.post("/sales")
    def sales(rows: list[SaleIn]):
        """POS webhook: send each sale (or a batch) as it rings up."""
        known = {p.id for p in cfg.products}
        now = pipe.clock.now()
        good = [(r.product_id, r.ts or now, r.qty) for r in rows if r.product_id in known]
        return {"ok": True, "accepted": pipe.sales.add(good), "rejected": len(rows) - len(good)}

    @app.post("/sales/csv")
    def sales_csv(text: str = Body(..., media_type="text/csv")):
        """End-of-day POS export: columns product_id, qty, timestamp (unix seconds or ISO)."""
        from datetime import datetime
        known = {p.id for p in cfg.products}
        rows = []
        for r in csv.DictReader(io.StringIO(text)):
            ts = r.get("timestamp", "")
            t = float(ts) if ts.replace(".", "", 1).isdigit() else datetime.fromisoformat(ts).timestamp() if ts else time.time()
            if r.get("product_id") in known:
                rows.append((r["product_id"], t, int(r.get("qty") or 1)))
        return {"ok": True, "accepted": pipe.sales.add(rows)}

    @app.get("/events")
    def events(since: int = 0):
        return [e for e in pipe.events if e["seq"] > since]

    @app.post("/demo/reset")
    def reset():
        if not pipe.sim:
            raise HTTPException(400, "Only available in demo mode")
        pipe.reset_demo()
        return {"ok": True}

    @app.websocket("/ws")
    async def ws(sock: WebSocket):
        await sock.accept()
        loop = asyncio.get_running_loop()
        q: asyncio.Queue = asyncio.Queue()
        listener = lambda ev: loop.call_soon_threadsafe(q.put_nowait, ev)  # noqa: E731
        pipe.listeners.append(listener)
        try:
            while True:
                try:
                    ev = await asyncio.wait_for(q.get(), timeout=cfg.pipeline.get("interval_sec", 3))
                    await sock.send_json({"type": "event", "event": ev})
                except asyncio.TimeoutError:
                    await sock.send_json({"type": "products", "products": pipe.records()})
        except WebSocketDisconnect:
            pass
        finally:
            pipe.listeners.remove(listener)

    return app


app = create_app() if os.getenv("SHELFORA_NO_AUTOAPP") != "1" else None
