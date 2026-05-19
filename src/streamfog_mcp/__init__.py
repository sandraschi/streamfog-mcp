"""Streamfog MCP — AR lens and face-filter orchestration for OBS live streams.

Streamfog is a third-party real-time AR platform for live streamers, built on
Snap's Camera Kit. This MCP server bridges Streamfog to agentic automation via
Streamer.bot's local WebSocket API, enabling LLM-driven lens control, effect
toggling, and avatar switching during live broadcasts.
"""

import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
