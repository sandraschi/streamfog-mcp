"""Import side-effect hub + REST API — triggers all @mcp.tool() decorator registrations.

Unified Gateway architecture: FastAPI serves REST endpoints for the webapp
dashboard, FastMCP serves MCP tools for LLM agents. Both share a single
Streamer.bot bridge instance.
"""

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastmcp import FastMCP

from streamfog_mcp._mcp import bridge, mcp
from streamfog_mcp.config import get_settings

# Tool registration side-effect (triggers @mcp.tool() decorators)
from . import tools  # noqa: F401

logger = logging.getLogger("streamfog-mcp")


# ── Lifespan ─────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    bridge.load_lens_map()
    logger.info(
        "Streamfog MCP startup — port=%s streamerbot=%s:%s lenses=%d",
        settings.port,
        settings.streamerbot_host,
        settings.streamerbot_port,
        len(bridge._lens_map),
    )
    yield
    await bridge.disconnect()


# ── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(lifespan=lifespan, title="Streamfog MCP", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

mcp_app = FastMCP.from_fastapi(app, name="Streamfog MCP")


# ── REST API ─────────────────────────────────────────────────────────────────


@app.get("/api/v1/status")
async def api_status():
    """Server status including Streamer.bot bridge health."""
    bridge_status = bridge.status()
    return {
        "ok": True,
        "version": "0.1.0",
        "bridge": bridge_status,
        "lenses": len(bridge._lens_map),
    }


@app.get("/api/v1/lenses")
async def api_list_lenses():
    """List all configured lenses and their action mappings."""
    return {
        "success": True,
        "data": {
        "lenses": bridge._lens_map,
        "count": len(bridge._lens_map),
        "path": get_settings().lens_map_path,
        },
    }


@app.post("/api/v1/lenses/set")
async def api_set_lens(body: dict):
    """Activate a lens via REST POST body: {"lens_identifier": "beauty_smooth"}"""
    from streamfog_mcp.tools.core_tools import streamfog_set_lens

    lens_id = body.get("lens_identifier", "")
    return await streamfog_set_lens(lens_identifier=lens_id)


@app.post("/api/v1/effects/clear")
async def api_clear_effects():
    """Clear all active effects via REST."""
    from streamfog_mcp.tools.core_tools import streamfog_clear_effects

    return await streamfog_clear_effects()


@app.post("/api/v1/avatar/toggle")
async def api_toggle_avatar():
    """Toggle avatar via REST."""
    from streamfog_mcp.tools.core_tools import streamfog_toggle_avatar

    return await streamfog_toggle_avatar()


@app.post("/api/v1/lenses/reload")
async def api_reload_lenses():
    """Reload the lens map from disk."""
    lenses = bridge.reload_lens_map()
    return {"success": True, "data": {"lenses": lenses, "count": len(lenses)}}


# ── Entry point ──────────────────────────────────────────────────────────────


async def _run_stdio():
    await mcp.run_stdio_async()


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Streamfog MCP Server")
    parser.add_argument("--mode", choices=["stdio", "http", "dual"], default="stdio")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=10994)
    parser.add_argument("--serve", action="store_true", default=False, help="Alias for --mode dual")
    args = parser.parse_args()

    mode = "dual" if args.serve else args.mode

    if mode == "stdio":
        import asyncio

        asyncio.run(_run_stdio())
    else:
        logger.info("Starting Streamfog MCP on %s:%s (mode=%s)", args.host, args.port, mode)
        uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
