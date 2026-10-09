"""POS sales store. Gives Shelfora each product's current selling speed vs its normal speed."""
from __future__ import annotations
import sqlite3
import threading
from pathlib import Path


def window_hours(normal_rate: float, window_min: int = 60, expected_sales: float = 8, cap_h: float = 12) -> float:
    return min(cap_h, max(window_min / 60, expected_sales / max(normal_rate, 0.01)))


class SalesLog:
    def __init__(self, path: str | Path = "data/sales.db"):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(str(path), check_same_thread=False)
        self.lock = threading.Lock()
        self.db.execute("CREATE TABLE IF NOT EXISTS sales (product_id TEXT, ts REAL, qty INTEGER)")
        self.db.execute("CREATE INDEX IF NOT EXISTS ix_sales ON sales(product_id, ts)")
        self.db.commit()

    def add(self, rows: list[tuple[str, float, int]]) -> int:
        with self.lock:
            self.db.executemany("INSERT INTO sales VALUES (?, ?, ?)", rows)
            self.db.commit()
        return len(rows)

    def clear(self) -> None:
        with self.lock:
            self.db.execute("DELETE FROM sales")
            self.db.commit()

    def units_between(self, pid: str, t0: float, t1: float) -> int:
        with self.lock:
            r = self.db.execute("SELECT COALESCE(SUM(qty),0) FROM sales WHERE product_id=? AND ts>=? AND ts<?", (pid, t0, t1)).fetchone()
        return int(r[0])

    def history_days(self, pid: str, now: float) -> float:
        with self.lock:
            r = self.db.execute("SELECT MIN(ts) FROM sales WHERE product_id=?", (pid,)).fetchone()
        return 0.0 if r[0] is None else (now - r[0]) / 86400

    def rates(self, pid: str, now: float, fallback_normal: float, window_min: int, baseline_days: int, open_hours: float) -> tuple[float, float]:
        """(current units/hr over the window, normal units/hr). Normal comes from POS history once a week exists."""
        # Slow sellers need a longer look-back, or one sale reads as a spike: use enough time
        # to expect ~8 sales at the normal rate (between window_min and 12 hours).
        window_h = window_hours(fallback_normal, window_min)
        current = self.units_between(pid, now - window_h * 3600, now) / window_h
        days = min(self.history_days(pid, now), baseline_days)
        if days >= 7:
            sold = self.units_between(pid, now - days * 86400, now - window_h * 3600)
            normal = sold / (days * open_hours) if sold else fallback_normal
        else:
            normal = fallback_normal
        return current, max(normal, 0.01)
