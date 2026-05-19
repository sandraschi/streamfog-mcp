# Agent Instructions — streamfog-mcp

## Identity
Streamfog MCP is an AI-driven AR lens orchestrator for live OBS streams. It controls Streamfog face filters, AR effects, and Vtuber avatars via the local Streamer.bot WebSocket bridge.

## Commands
- `uv sync` — install Python deps
- `just lint` — Ruff check
- `just fix` — Ruff auto-fix
- `just test` — pytest
- `just serve` — run backend on port 10994
- `just dev` — alias for serve
- `just build-native` — full Tauri native installer build
- `just build-native-debug` — Tauri debug build (skip PyInstaller)
- `start.ps1` — launch backend + webapp + open browser
- `cd webapp && npm run dev` — frontend only
- `cd webapp && npm run build` — production frontend build

## Ports (fleet-registered)
- **10994** — Backend (FastAPI + FastMCP SSE)
- **10995** — Frontend (Vite + React 19)

## Architecture
```
LLM Agent → FastMCP (tools) → Streamer.bot WebSocket → Streamfog Desktop → OBS
                   ↓
              FastAPI (REST) → React Dashboard (:10995)
```

## Key files
- `src/streamfog_mcp/_mcp.py` — FastMCP singleton + shared bridge
- `src/streamfog_mcp/server.py` — Unified FastAPI + FastMCP gateway
- `src/streamfog_mcp/tools/core_tools.py` — 5 MCP tools
- `src/streamfog_mcp/services/streamerbot.py` — Streamer.bot WebSocket client
- `native/` — Tauri 2.0 desktop wrapper (PyInstaller sidecar)

## Lint/Format
- **Python**: Ruff (configured in pyproject.toml)
- **Frontend**: Biome (`cd webapp && npx biome check`)
- Absolute ruff path: `C:\Users\sandr\AppData\Local\Programs\Python\Python313\Scripts\ruff.exe`

## Testing
```powershell
uv run pytest tests/ -v
```

## Before committing
1. Run `just lint`
2. Run `just test`
3. Verify `start.ps1` works
