"""Import side-effect hub + REST API - triggers all @mcp.tool() decorator registrations.

Unified Gateway architecture: FastAPI serves REST endpoints for the webapp
dashboard, FastMCP serves the MCP streamable-HTTP endpoint (``/mcp``) for LLM
agents. Both share a single Streamer.bot bridge instance.

The MCP endpoint is mounted into the FastAPI app so one uvicorn process serves
REST + MCP with a single CORS policy.
"""

import asyncio
import logging
import os
import sys
import time
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from streamfog_mcp._mcp import bridge, mcp
from streamfog_mcp.config import get_settings
from streamfog_mcp.errors import _error_response
from streamfog_mcp.logging_ring import get_ring_handler, install_ring_handler

# Tool registration side-effect (triggers @mcp.tool() decorators)
from . import tools  # noqa: F401

logger = logging.getLogger("streamfog-mcp")

_START_TIME = time.time()


# ── Lifespan ─────────────────────────────────────────────────────────────────

# MCP streamable-HTTP app - created before FastAPI so its lifespan can be
# composed into the parent app (FastMCP requires it or /mcp raises).
_MCP_PATH = "/mcp"
_mcp_http = mcp.http_app(path=_MCP_PATH)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    install_ring_handler()
    bridge.load_lens_map()
    logger.info(
        "Streamfog MCP startup - port=%s streamerbot=%s:%s lenses=%d",
        settings.port,
        settings.streamerbot_host,
        settings.streamerbot_port,
        len(bridge._lens_map),
    )
    async with _mcp_http.lifespan(app):
        yield
    await bridge.disconnect()


# ── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(lifespan=lifespan, title="Streamfog MCP", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:10994",
        "http://localhost:10994",
        "http://127.0.0.1:10995",
        "http://localhost:10995",
        "http://tauri.localhost",
        "https://tauri.localhost",
        "tauri://localhost",
    ],
    allow_origin_regex=r"https?://(?:[a-zA-Z0-9-]+\.ts\.net|.*?\.tail-[a-f0-9]+\.ts\.net|tauri\.localhost|localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|100\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?$|^tauri://localhost$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return _error_response(str(exc), "internal")


# ── MCP HTTP endpoint (mounted at /mcp) ─────────────────────────────────────

# NOTE: mounted AFTER the REST routes so /api/* keeps priority; the mount
# only serves paths the FastAPI routes do not match (i.e. /mcp).


# ── REST API ─────────────────────────────────────────────────────────────────


def _bridge_status() -> dict:
    return bridge.status()


@app.get("/api/health")
async def api_health():
    """Liveness probe - used by the frontend health dot and start.ps1."""
    status = _bridge_status()
    return {
        "status": "ok",
        "server": "Streamfog MCP",
        "version": "0.1.0",
        "uptime_seconds": int(time.time() - _START_TIME),
        "tool_count": len(await mcp.list_tools()),
        "providers": {"streamerbot": status},
    }


@app.get("/api/v1/status")
async def api_status():
    """Server status including Streamer.bot bridge health."""
    return {
        "ok": True,
        "version": "0.1.0",
        "bridge": _bridge_status(),
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


@app.get("/api/tools")
async def api_tools():
    """Dynamic MCP tool list - drives the Tools page (never hardcoded)."""
    tools_list = await mcp.list_tools()
    return {
        "success": True,
        "data": {
            "tools": [
                {
                    "name": t.name,
                    "description": t.description,
                    "input_schema": t.parameters,
                }
                for t in tools_list
            ],
            "count": len(tools_list),
        },
    }


@app.get("/api/capabilities")
async def api_capabilities():
    """Capability discovery - what this server can do and how to reach it."""
    tools_list = await mcp.list_tools()
    return {
        "app_name": "Streamfog MCP",
        "version": "0.1.0",
        "ports": {"backend": 10994, "frontend": 10995},
        "tools": [t.name for t in tools_list],
        "features": {
            "lens_control": True,
            "avatar": True,
            "effects_clear": True,
            "bridge_status": True,
            "local_llm_chat": True,
            "skills": True,
            "mcp_streamable_http": _MCP_PATH,
        },
    }


_SKILLS_DIR = Path(__file__).parent / "skills"


@app.get("/api/skills")
async def api_skills():
    """List available skills (skill:// resources for the Chat preprompt)."""
    skills = []
    if _SKILLS_DIR.is_dir():
        for skill_dir in sorted(_SKILLS_DIR.iterdir()):
            skill_md = skill_dir / "SKILL.md"
            if skill_dir.is_dir() and skill_md.exists():
                skills.append({"name": skill_dir.name, "uri": f"skill://{skill_dir.name}/SKILL.md"})
    return {"success": True, "data": {"skills": skills, "count": len(skills)}}


@app.get("/api/skills/{skill_name}")
async def api_skill_content(skill_name: str):
    """Return the raw SKILL.md content for a named skill."""
    safe = Path(skill_name).name
    skill_md = _SKILLS_DIR / safe / "SKILL.md"
    if not skill_md.exists():
        raise HTTPException(status_code=404, detail=f"skill '{safe}' not found")
    return {"success": True, "name": safe, "content": skill_md.read_text(encoding="utf-8")}


_LLM_PROVIDERS: list[dict] = [
    {
        "name": "ollama",
        "base": "http://127.0.0.1:11434",
        "models_path": "/api/tags",
        "model_key": "models",
        "name_key": "name",
    },
    {
        "name": "lmstudio",
        "base": "http://127.0.0.1:1234",
        "models_path": "/v1/models",
        "model_key": "data",
        "name_key": "id",
    },
    {
        "name": "vllm",
        "base": "http://127.0.0.1:8000",
        "models_path": "/v1/models",
        "model_key": "data",
        "name_key": "id",
    },
]


@app.get("/api/llm/discover")
async def api_llm_discover():
    """Probe local LLM providers (Ollama / LM Studio / vLLM) for the Chat page."""
    discovered = []
    async with httpx.AsyncClient(timeout=3) as client:
        for provider in _LLM_PROVIDERS:
            try:
                r = await client.get(provider["base"] + provider["models_path"])
                if r.status_code != 200:
                    continue
                payload = r.json()
                models = [
                    m[provider["name_key"]]
                    for m in payload.get(provider["model_key"], [])
                    if isinstance(m, dict) and provider["name_key"] in m
                ]
                discovered.append(
                    {
                        "name": provider["name"],
                        "base": provider["base"],
                        "port": int(provider["base"].rsplit(":", 1)[1]),
                        "models": models[:50],
                    }
                )
            except Exception:
                continue

    gpu = {"detected": False, "name": None}
    try:
        nvidia = await asyncio.create_subprocess_exec(
            "nvidia-smi",
            "--query-gpu=name",
            "--format=csv,noheader",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
        )
        out, _ = await asyncio.wait_for(nvidia.communicate(), timeout=5)
        if out.strip():
            gpu = {"detected": True, "name": out.decode().strip().splitlines()[0].strip()}
    except Exception:
        pass

    return {
        "success": True,
        "data": {"providers": discovered, "count": len(discovered), "gpu": gpu},
    }


@app.get("/api/logs")
async def api_logs(
    source: str | None = None,
    level: str | None = None,
    search: str | None = None,
    limit: int = 100,
):
    """Ring-buffer log window for the Logs surface (live, in-memory)."""
    records = get_ring_handler().snapshot(source=source, level=level, search=search, limit=min(max(limit, 1), 500))
    return {"success": True, "data": {"records": records, "count": len(records)}}


@app.get("/api/v1/diagnostics")
async def api_diagnostics():
    """Full diagnostics - tool list, system info, errors (CUA-NSIS gate)."""
    tools_list = await mcp.list_tools()
    errors = [rec for rec in get_ring_handler().snapshot(level="ERROR", limit=20)]
    return {
        "status": "ok",
        "server": "Streamfog MCP",
        "version": "0.1.0",
        "uptime_seconds": int(time.time() - _START_TIME),
        "tool_count": len(tools_list),
        "tools": [{"name": t.name} for t in tools_list],
        "system": {"windows": os.name == "nt", "platform": sys.platform},
        "bridge": _bridge_status(),
        "errors": errors,
    }


# ── Entry point ──────────────────────────────────────────────────────────────

app.mount("/", _mcp_http)


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
        asyncio.run(_run_stdio())
    else:
        logging.basicConfig(
            level=get_settings().log_level,
            format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        )
        logger.info("Starting Streamfog MCP on %s:%s (mode=%s)", args.host, args.port, mode)
        uvicorn.run(app, host=args.host, port=args.port, log_level="info")


if __name__ == "__main__":
    main()
