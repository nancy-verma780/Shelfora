"""YOLO product detector (Ultralytics). Loaded lazily so the service can run in demo mode without torch."""
from __future__ import annotations
from pathlib import Path
import numpy as np

from .shelf import Detection


class Detector:
    def __init__(self, weights: str, conf: float = 0.35, iou: float = 0.5, imgsz: int = 1024):
        if not Path(weights).exists():
            raise FileNotFoundError(
                f"No trained weights at {weights}. Train with scripts/train.py (or the Colab notebook) and copy best.pt there."
            )
        from ultralytics import YOLO  # heavy import, only when a real camera is used
        self.model = YOLO(weights)
        self.conf, self.iou, self.imgsz = conf, iou, imgsz
        self.names = self.model.names

    def __call__(self, frame: np.ndarray) -> list[Detection]:
        h, w = frame.shape[:2]
        res = self.model.predict(frame, conf=self.conf, iou=self.iou, imgsz=self.imgsz, verbose=False, max_det=1500)[0]
        out = []
        for (x1, y1, x2, y2), c, k in zip(res.boxes.xyxy.tolist(), res.boxes.conf.tolist(), res.boxes.cls.tolist()):
            out.append(Detection(x1 / w, y1 / h, x2 / w, y2 / h, float(c), str(self.names[int(k)])))
        return out
