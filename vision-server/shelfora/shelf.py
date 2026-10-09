"""Turns detection boxes into per-product shelf stock.

Each product owns a slot (a region of a camera frame, drawn once at setup). We count
product detections whose centre falls inside the slot, compare with how many facings
the camera sees when that slot is full, and scale to the slot's unit capacity.
"""
from __future__ import annotations
from collections import deque
from dataclasses import dataclass
from statistics import median

from .config import Product


@dataclass
class Detection:
    x1: float
    y1: float
    x2: float
    y2: float
    conf: float
    label: str = "product"

    @property
    def center(self) -> tuple[float, float]:
        return (self.x1 + self.x2) / 2, (self.y1 + self.y2) / 2


def inside(pt: tuple[float, float], slot: tuple[float, float, float, float]) -> bool:
    x, y = pt
    return slot[0] <= x < slot[2] and slot[1] <= y < slot[3]


def slot_reading(product: Product, dets: list[Detection], empty_labels: set[str]) -> dict:
    """Visible facings for one product slot in one frame."""
    mine = [d for d in dets if inside(d.center, product.slot)]
    items = [d for d in mine if d.label not in empty_labels]
    if product.model_class:
        # A multi-class model can tell items apart: only the right product counts as stock,
        # anything else in its slot is a misplaced item (planogram problem).
        facings = sum(1 for d in items if d.label == product.model_class)
        misplaced = [d.label for d in items if d.label != product.model_class and d.label != "product"]
    else:
        facings, misplaced = len(items), []
    gaps = sum(1 for d in mine if d.label in empty_labels)
    facings = min(facings, product.facings_full)
    units = round(facings / product.facings_full * product.capacity) if facings else 0
    return {"facings": facings, "gaps": gaps, "units": units, "boxes": mine, "misplaced": misplaced}


class Smoother:
    """Median of the last N readings, so one blocked view (a shopper, a trolley) doesn't flip the status."""

    def __init__(self, n: int = 3):
        self.n = n
        self.hist: dict[str, deque[int]] = {}

    def push(self, pid: str, units: int) -> int:
        h = self.hist.setdefault(pid, deque(maxlen=self.n))
        h.append(units)
        return int(round(median(h)))

    def reset(self, pid: str, units: int) -> None:
        self.hist[pid] = deque([units] * self.n, maxlen=self.n)
