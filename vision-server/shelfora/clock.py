import time


class Clock:
    """Store time. Runs faster than real time in demo mode so stock visibly drains."""

    def __init__(self, speed: float = 1.0):
        self.speed = speed
        self._real0 = time.time()
        self._store0 = time.time()

    def now(self) -> float:
        return self._store0 + (time.time() - self._real0) * self.speed
