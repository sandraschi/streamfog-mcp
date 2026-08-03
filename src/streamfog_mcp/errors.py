"""Shared error-response helper with auto-logging (fleet Pattern 3).

Every ``except`` block that returns a structured error dict through
``_error_response`` automatically emits a full traceback via
``logger.exception`` - no per-call-site logging needed.
"""

import logging

logger = logging.getLogger("streamfog-mcp")


def _error_response(error: str, error_type: str = "general", **kwargs) -> dict:
    """Auto-logging error response - traceback logged before returning to caller."""
    logger.exception("Tool/API error: %s [%s]", error, error_type)
    return {
        "success": False,
        "error": error,
        "error_type": error_type,
        "message": error,
        **kwargs,
    }
