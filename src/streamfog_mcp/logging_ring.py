"""In-memory ring-buffer logging handler for the webapp Logs surface.

Keeps the last N log records (bounded, thread-safe via deque) and exposes
them through ``GET /api/logs`` on the FastAPI gateway. No disk persistence -
this is a live telemetry window, not an audit log.
"""

import logging
import time
from collections import deque
from typing import Any


class RingBufferHandler(logging.Handler):
    """Logging handler that retains the most recent records in memory."""

    def __init__(self, capacity: int = 500) -> None:
        super().__init__()
        self.capacity = capacity
        self._records: deque[dict[str, Any]] = deque(maxlen=capacity)

    def emit(self, record: logging.LogRecord) -> None:
        try:
            self._records.append(
                {
                    "ts": time.time(),
                    "level": record.levelname,
                    "source": record.name,
                    "message": record.getMessage(),
                }
            )
        except Exception:
            pass

    def snapshot(
        self,
        source: str | None = None,
        level: str | None = None,
        search: str | None = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """Return filtered records, newest first."""
        level_rank = {
            "DEBUG": 10,
            "INFO": 20,
            "WARNING": 30,
            "ERROR": 40,
            "CRITICAL": 50,
        }
        min_rank = level_rank.get((level or "").upper(), 0)
        out: list[dict[str, Any]] = []
        for rec in reversed(self._records):
            if source and source not in rec["source"]:
                continue
            if min_rank and level_rank.get(rec["level"], 0) < min_rank:
                continue
            if search and search.lower() not in rec["message"].lower():
                continue
            out.append(rec)
            if len(out) >= limit:
                break
        return out


_ring = RingBufferHandler()


def get_ring_handler() -> RingBufferHandler:
    """Return the shared ring buffer handler (attached to root logger)."""
    return _ring


def install_ring_handler() -> None:
    """Attach the ring handler to the root logger if not already attached."""
    root = logging.getLogger()
    if _ring not in root.handlers:
        root.addHandler(_ring)
