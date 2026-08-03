# Streamfog MCP

<p align="center">
  <a href="https://github.com/casey/just"><img src="https://img.shields.io/badge/just-ready_to_go-7c5cfc?style=flat-square&logo=just&logoColor=white" alt="Just"></a>
  <a href="https://github.com/astral-sh/ruff"><img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json" alt="Ruff"></a>
  <a href="https://python.org"><img src="https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"></a>
  <a href="https://biomejs.dev"><img src="https://img.shields.io/badge/Linted_with-Biome-60a5fa?style=flat-square&logo=biome&logoColor=white" alt="Biome"></a>
  <a href="https://github.com/PrefectHQ/fastmcp"><img src="https://img.shields.io/badge/FastMCP-3.4-7c5cfc?style=flat-square" alt="FastMCP"></a>
</p>


> 📖 **[Installation Guide](INSTALL.md)** — quick start, manual setup, and troubleshooting
> 📖 **[Docs](docs/)** — [Configuration](docs/CONFIGURATION.md) · [Tools](docs/TOOLS.md) · [Troubleshooting](docs/TROUBLESHOOTING.md) · [Development](docs/DEVELOPMENT.md)
> 🤖 **[llms-full.txt](llms-full.txt)** — full LLM-readable documentation

**AI-driven AR lens orchestrator for live OBS streams.** Control Streamfog face filters, AR effects, and Vtuber avatars through MCP tools via the local Streamer.bot WebSocket bridge. Your AI assistant becomes a stream producer.

| | |
|--:|--|
| **You might use this if…** | You want your AI to switch AR lenses, toggle Vtuber avatars, or clear effects during live OBS broadcasts — controlled by Twitch chat events, channel points, or agentic automation. |
| **What it connects to** | [Streamfog](https://streamfog.com) desktop app → [Streamer.bot](https://streamer.bot) WebSocket → this MCP server |
| **Ports** | Backend **10994**, Dashboard **10995** |
| **Start** | `just bootstrap` then `start.ps1` |

## Architecture

```
┌─────────────┐     MCP            ┌──────────────────┐     WebSocket      ┌──────────────┐
│  LLM Agent  │ ───────────────→  │  streamfog-mcp   │ ────────────────→ │ Streamer.bot  │
│  (Claude,   │ ←───────────────  │  :10994 (FastMCP) │ ←──────────────── │ :8080         │
│   Gemini)   │   stdio / /mcp    │  :10995 (React)   │   DoAction JSON   │               │
└─────────────┘                  └──────────────────┘                    └──────┬────────┘
                                                                                │ Native Hook
                                                                         ┌──────▼────────┐
                                                                         │  Streamfog    │
                                                                         │  Desktop App  │
                                                                         └──────┬────────┘
                                                                                │ Browser Source
                                                                         ┌──────▼────────┐
                                                                         │  OBS Studio   │
                                                                         └───────────────┘
```

The MCP endpoint is served at `http://127.0.0.1:10994/mcp` (streamable HTTP)
in dual mode, alongside the REST API and dashboard.

## Quick Start

```powershell
uv sync
# Edit lenses.json with your Streamer.bot action names
# Set STREAMFOG_MCP_STREAMERBOT_TOKEN in .env if using auth
.\start.ps1
```

MCP-only via stdio (for Cursor, Claude Desktop):

```powershell
uv run -m streamfog_mcp --stdio
```

## Prerequisites

1. [Streamfog](https://streamfog.com) installed and running
2. [Streamer.bot](https://streamer.bot) installed and running
3. Streamfog → Streamer.bot integration enabled in Streamfog's Integrations panel
4. Streamer.bot WebSocket server enabled (Settings → WebSocket Server)
5. Actions created in Streamer.bot (e.g. `SetLens_BeautySmooth`, `ClearEffects`, `ToggleAvatar`)
6. `lenses.json` populated with your action→lens mappings

See [docs/ONBOARDING.md](docs/ONBOARDING.md) for the step-by-step walkthrough.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `STREAMFOG_MCP_STREAMERBOT_HOST` | `127.0.0.1` | Streamer.bot WebSocket host |
| `STREAMFOG_MCP_STREAMERBOT_PORT` | `8080` | Streamer.bot WebSocket port |
| `STREAMFOG_MCP_STREAMERBOT_TOKEN` | — | Streamer.bot auth token |
| `STREAMFOG_MCP_LENS_MAP_PATH` | `lenses.json` | Path to lens→action mapping file |
| `STREAMFOG_MCP_PORT` | `10994` | Backend port |
| `STREAMFOG_MCP_LOG_LEVEL` | `INFO` | Logging level |

## Lens Map (`lenses.json`)

```json
{
  "beauty_smooth": "SetLens_BeautySmooth",
  "cyber_helmet": "SetLens_CyberHelmet",
  "vtuber_avatar": "SetLens_VTuberAvatar"
}
```

Keys are human-readable lens identifiers used in MCP tool calls. Values are the corresponding Streamer.bot action names. Keys starting with `_` are ignored; unknown identifiers fall back to the action `SetLens_{identifier}`.

## MCP Tools (5)

### Lens Control
| Tool | Description |
|------|-------------|
| `streamfog_set_lens` | Activate a specific AR lens or face filter |
| `streamfog_clear_effects` | Strip all effects, return camera to baseline |
| `streamfog_toggle_avatar` | Toggle Vtuber-style avatar on/off |

### Discovery — READ_ONLY
| Tool | Description |
|------|-------------|
| `streamfog_list_lenses` | List all configured lenses from lenses.json |
| `streamfog_status` | Bridge connection health + lens count |

## REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Liveness probe (status, version, uptime, tool count, bridge) |
| `/api/v1/status` | GET | Server + bridge health |
| `/api/v1/lenses` | GET | List all lenses |
| `/api/v1/lenses/set` | POST | Activate a lens (`{"lens_identifier": "beauty_smooth"}`) |
| `/api/v1/lenses/reload` | POST | Reload lens map from disk |
| `/api/v1/effects/clear` | POST | Clear all effects |
| `/api/v1/avatar/toggle` | POST | Toggle avatar |
| `/api/tools` | GET | Dynamic MCP tool list with schemas |
| `/api/capabilities` | GET | Capability discovery |
| `/api/skills` | GET | Skill list |
| `/api/skills/{name}` | GET | Skill content (markdown) |
| `/api/llm/discover` | GET | Local LLM provider probe (Ollama/LM Studio/vLLM) + GPU |
| `/api/logs` | GET | Ring-buffer log window |
| `/api/v1/diagnostics` | GET | Tool list, system info, errors |

## Web Dashboard

Dark SOTA dashboard at `:10995` (React + Vite + Tailwind + Zustand):

- **Dashboard** — hero + KPI cards (server, tools, bridge, uptime), lens grid, quick actions, exponential-backoff health
- **Tools** — dynamic tool list with schemas from `/api/tools`
- **Chat** — skill-first local LLM chat (Ollama/LM Studio/vLLM), 4 personalities, localStorage history, export
- **Settings** — backend health + LLM provider detection
- **Help** — architecture, env reference, troubleshooting
- **Logs** — live ring-buffer modal (Ctrl+L)

Keyboard: Ctrl+Scroll zoom, Ctrl+0 reset, Ctrl+L logs.

## Project Structure

```
streamfog-mcp/
├── src/streamfog_mcp/
│   ├── _mcp.py              FastMCP singleton + resources
│   ├── server.py            FastAPI gateway (REST + /mcp mount)
│   ├── __main__.py          CLI entry (--stdio / --serve)
│   ├── config.py            Pydantic settings (STREAMFOG_MCP_ prefix)
│   ├── errors.py            _error_response() with logger.exception
│   ├── logging_ring.py      Ring buffer for /api/logs
│   ├── skills/streamfog/    SKILL.md (chat preprompt)
│   ├── tools/core_tools.py  5 @mcp.tool() decorators
│   └── services/streamerbot.py  Streamer.bot WebSocket client
├── webapp/                  Vite + React 19 + Tailwind + Zustand
├── native/                  Tauri 2.0 desktop wrapper
├── lenses.json              Lens → action mapping
├── pyproject.toml / uv.lock
├── start.ps1 / start.bat
├── justfile
└── tests/                   13 tests (units + endpoint + e2e)
```

## Verification

```powershell
just lint          # ruff
just test          # pytest (coverage-gated)
uv run pyright src/  # types
cd webapp && bun run check && bun run biome:ci
cd webapp && bunx playwright test   # e2e
```

## Known Limitations

- Streamfog does not expose a native CLI or local API — all control goes through Streamer.bot
- Lens activation is fire-and-forget (Streamer.bot does not report success/failure for actions)
- No lens preview or thumbnail retrieval (Streamfog desktop is a black box)
- Lumia/Crowd Control bridge path is documented but not yet implemented as an alternative transport
