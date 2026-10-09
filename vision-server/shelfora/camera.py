"""Reads frames from an existing store camera (RTSP/HTTP stream, video file or webcam) on a background thread."""
from __future__ import annotations
import threading
import time
import cv2
import numpy as np


class CameraReader:
    def __init__(self, source: str | int):
        self.source = int(source) if isinstance(source, str) and source.isdigit() else source
        self.frame: np.ndarray | None = None
        self.status = "connecting"
        self._stop = threading.Event()
        threading.Thread(target=self._run, daemon=True).start()

    def _run(self) -> None:
        while not self._stop.is_set():
            cap = cv2.VideoCapture(self.source)
            if not cap.isOpened():
                self.status = "offline"
                time.sleep(5)
                continue
            self.status = "connected"
            while not self._stop.is_set():
                ok, frame = cap.read()
                if not ok:
                    if isinstance(self.source, str) and not self.source.startswith(("rtsp", "http")):
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # loop recorded footage
                        continue
                    self.status = "reconnecting"
                    break
                self.frame = frame
            cap.release()
            time.sleep(2)

    def read(self) -> np.ndarray | None:
        return None if self.frame is None else self.frame.copy()

    def stop(self) -> None:
        self._stop.set()
