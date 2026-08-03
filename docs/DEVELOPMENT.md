# Development Guide

## Setup

```powershell
uv sync                 # Python deps (creates .venv)
cd webapp
bun install             # frontend deps (bun.lock)
```

## Run

```powershell
.\start.ps1             # backend :10994 + webapp :10995 + opens browser
uv run -m streamfog_mcp --stdio        # MCP-only (stdio)
uv run -m streamfog_mcp --serve --port 10994   # dual mode (REST + MCP /mcp)
```

## Lint / Typecheck / Test

```powershell
just lint               # ruff check src/ tests/
just fix                # ruff auto-fix
just test               # pytest
uv run pyright src/     # Python types
cd webapp && bun run check     # tsc --noEmit
cd webapp && bun run biome:ci  # biome
cd webapp && npx playwright test   # e2e (starts backend automatically)
```

## Structure

```
src/streamfog_mcp/
├── _mcp.py              FastMCP singleton + shared bridge + resources
├── server.py            FastAPI gateway (REST + /mcp mount) + entry point
├── config.py            Pydantic settings (STREAMFOG_MCP_ prefix)
├── errors.py            _error_response() with logger.exception
├── logging_ring.py      In-memory ring buffer for /api/logs
├── tools/core_tools.py  5 MCP tools
├── services/streamerbot.py  Streamer.bot WebSocket client
└── skills/streamfog/SKILL.md  Skill (Chat preprompt, /api/skills)
```

## Adding a Tool

1. Add `@mcp.tool(...)` in `src/streamfog_mcp/tools/` (imported via `tools/__init__.py`).
2. Docstring: summary + `## Return Format` + `## Examples`; params via
   `Annotated[str, Field(description=...)]`.
3. Return `{success, message, data}`.
4. Add REST route in `server.py` if the dashboard needs it.
5. Add a test in `tests/`; update `docs/TOOLS.md` + README tool table.

## Ports

Backend 10994 / Frontend 10995 - fleet-registered in WEBAPP_PORTS.md. Never
change without updating the registry. Adjacent pair, not in forbidden range.

## Pre-commit

```powershell
just bootstrap   # uv sync + pre-commit install
```

Hooks: ruff (fix + format), Biome (webapp), em-dash guard.

## Native (Tauri)

```powershell
just build-native       # full NSIS pipeline (PyInstaller + Tauri)
just build-native-debug # debug build, skip PyInstaller
just cua-nsis-test      # install -> launch -> nav walk -> uninstall
just cua-webapp-test    # pre-Tauri browser walk
```

Never bundle `.env` - `native/build.ps1` bundles `.env.example` only.
