from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path
import yaml


@dataclass
class Camera:
    id: str
    label: str
    name: str
    section: str
    racks: list[str]
    source: str | int  # "simulated", an RTSP/HTTP URL, a video file path, or a webcam index
    resolution: str = "1080p"
    fps: int = 15


@dataclass
class Product:
    id: str
    name: str
    category: str
    section: str
    shelf: str
    camera: str
    capacity: int
    facings_full: int  # facings the camera sees when the slot is full
    normal_rate: float  # units/hour baseline until enough POS history exists
    slot: tuple[float, float, float, float]  # normalized x1, y1, x2, y2
    color: str = "#888888"
    shape: str = "box"
    demo: dict = field(default_factory=dict)
    model_class: str | None = None  # detector class name for this product, when using a multi-class model


@dataclass
class Config:
    store: dict
    detector: dict
    pipeline: dict
    sales: dict
    demo: dict
    cameras: list[Camera]
    products: list[Product]

    @property
    def simulated(self) -> bool:
        return all(c.source == "simulated" for c in self.cameras)


def load(path: str | Path = "config/store.yaml") -> Config:
    raw = yaml.safe_load(Path(path).read_text())
    return Config(
        store=raw["store"], detector=raw["detector"], pipeline=raw["pipeline"], sales=raw["sales"],
        demo=raw.get("demo", {}),
        cameras=[Camera(**c) for c in raw["cameras"]],
        products=[Product(**{**p, "slot": tuple(p["slot"])}) for p in raw["products"]],
    )
