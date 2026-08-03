# Agent Instructions — streamfog-mcp

## Identity
Streamfog MCP is an AI-driven AR lens orchestrator for live OBS streams. It controls Streamfog face filters, AR effects, and Vtuber avatars via the local Streamer.bot WebSocket bridge. Streamfog has no public API - every command is a fire-and-forget Streamer.bot `DoAction` dispatch.

## Commands
- `uv sync` — install Python deps
- `just lint` — Ruff check
- `just fix` — Ruff auto-fix
- `just fmt` — Ruff format
- `just test` — pytest (coverage-gated)
- `just serve` / `just dev` — run backend on port 10994 (dual mode: REST + MCP `/mcp`)
- `just e2e` — Playwright fleet audit
- `just build-native` — full Tauri native installer build
- `just build-native-debug` — Tauri debug build (skip PyInstaller)
- `just cua-nsis-test` — NSIS smoke test (install -> nav walk -> uninstall)
- `just cua-webapp-test` — pre-Tauri browser walk
- `just mcpb-pack` — rebuild .mcpb bundle (fresh stage)
- `start.ps1` — launch backend + webapp + open browser
- `cd webapp && bun run dev` — frontend only
- `cd webapp && bun run build` — production frontend build

## Ports (fleet-registered)
- **10994** — Backend (FastAPI REST + FastMCP streamable HTTP `/mcp`)
- **10995** — Frontend (Vite + React 19)

## Architecture
```
LLM Agent -> FastMCP (tools) -> Streamer.bot WebSocket -> Streamfog Desktop -> OBS
                   |
              FastAPI (REST) -> React Dashboard (:10995)
MCP endpoint: http://127.0.0.1:10994/mcp (streamable HTTP) or stdio
```

## Key files
- `src/streamfog_mcp/_mcp.py` — FastMCP singleton + shared bridge + resources
- `src/streamfog_mcp/server.py` — FastAPI gateway (REST routes + /mcp mount, composed lifespan)
- `src/streamfog_mcp/tools/core_tools.py` — 5 MCP tools
- `src/streamfog_mcp/services/streamerbot.py` — Streamer.bot WebSocket client
- `src/streamfog_mcp/logging_ring.py` — in-memory log ring buffer (/api/logs)
- `src/streamfog_mcp/errors.py` — `_error_response()` with logger.exception
- `src/streamfog_mcp/skills/streamfog/SKILL.md` — skill (chat preprompt, /api/skills)
- `scripts/mcpb-pack.ps1` — fresh-stage MCPB pack (src/<pkg>/ not flattened)
- `native/` — Tauri 2.0 desktop wrapper (PyInstaller sidecar, embedded resource)

## Lint/Format/Typecheck
- **Python**: Ruff (configured in pyproject.toml); `uv run pyright src/` for types
- **Frontend**: Biome (`cd webapp && bun run biome:ci`); `bun run check` (tsc --noEmit)
- Pre-commit: ruff + biome + em-dash guard (`just bootstrap` installs the hook)
- Absolute ruff path: `C:\Users\sandr\AppData\Local\Programs\Python\Python313\Scripts\ruff.exe`

## Testing
```powershell
uv run pytest tests/ -v          # 13 tests, coverage >= 30%
cd webapp && bunx playwright test  # e2e (backend auto-started)
```

## Before committing
1. Run `just lint` + `uv run pyright src/`
2. Run `just test`
3. `cd webapp && bun run check && bun run biome:ci`
4. Verify `start.ps1` works
5. Never bundle `.env` into builds - only `.env.example`

Install docs: follow mcp-central-docs/standards/AGENT_INSTALL_REFERENCE.md
