# Streamfog MCP — Product Requirements

**Version**: 0.2.0 (2026-08-03)
**Status**: Shipped
**Repo**: https://github.com/sandraschi/streamfog-mcp

## Purpose

Streamfog MCP gives AI assistants (and a dashboard, and scripts) control over
Streamfog's AR lenses, face filters, and Vtuber avatars during live OBS
streams. Streamfog has no public API, so every command is dispatched as a
named action to Streamer.bot, which forwards it to the Streamfog desktop app.
The result: an agent becomes a stream producer — switching lenses, clearing
effects, and toggling avatars on demand, without touching Streamer.bot
manually.

## Problem Statement

- Streamfog (streamfog.com) is a Windows AR-effects app with **no API, CLI,
  or plugin SDK**. It is a black box that only responds to Streamer.bot.
- Streamer.bot exposes a local WebSocket `DoAction` interface keyed by exact
  action name, but it is not agent-friendly and reports no outcomes.
- Without a bridge, automating lens control requires brittle UI scripting or
  manual clicks.

## Solution

A FastMCP server that exposes five tools — `streamfog_status`,
`streamfog_set_lens`, `streamfog_clear_effects`, `streamfog_toggle_avatar`,
`streamfog_list_lenses` — plus a REST gateway, a React dashboard, a Tauri
desktop wrapper, and an MCPB bundle. All surfaces share one Streamer.bot
WebSocket bridge.

## Architecture

```
LLM Agent -> streamfog-mcp (:10994) -> Streamer.bot WebSocket (:8080) -> Streamfog Desktop -> OBS
                         \-> FastAPI REST (/api/*) -> React Dashboard (:10995)
MCP endpoint: http://127.0.0.1:10994/mcp (streamable HTTP) or stdio
```

- **MCP tools**: stdio (Claude Desktop, Cursor, opencode) or streamable HTTP.
- **REST**: `/api/health`, `/api/tools`, `/api/capabilities`, `/api/skills`,
  `/api/llm/discover`, `/api/logs`, `/api/v1/*` (lenses, effects, avatar,
  status, diagnostics).
- **Dashboard**: React 19 + Vite + Tailwind + Zustand — Dashboard, Tools,
  Chat (local LLM, skill-first), Settings, Help, Logs modal.
- **Native**: Tauri 2.0 NSIS installer with embedded PyInstaller backend
  (dual transport via MCP_PORT env).

## Shipped Features (v0.2.0)

- 5 MCP tools with structured `{success, message, data}` returns, docstrings
  with Return Format + Examples, tool annotations
- Dual transport: stdio + streamable HTTP at `/mcp` (single uvicorn process)
- Lens map (`lenses.json`) with underscore-key filtering and fallback
  `SetLens_{id}` action construction
- Auto-connecting Streamer.bot WebSocket bridge (token auth, ping keepalive)
- Dynamic tool discovery (`/api/tools`), capability discovery
  (`/api/capabilities`), skills (`/api/skills` + `skill://` resource)
- Local LLM discovery (Ollama/LM Studio/vLLM) + GPU detection
- In-memory log ring buffer (`/api/logs`) + diagnostics endpoint
- Webapp: hero + KPIs, lens grid, skill-first chat with 4 personalities,
  provider/model selection, exponential-backoff health, Ctrl+Scroll zoom,
  Tauri backend-status listener
- Session context injection: Claude Code hooks, Cursor/Windsurf rules,
  OpenCode/Antigravity skills, Copilot instructions
- Packaging: MCPB bundle (3-4-100 prompts), Tauri NSIS, CI five-gate,
  pre-commit (ruff/biome/em-dash), Playwright e2e

## Non-Goals

- No lens preview or thumbnail retrieval (Streamfog exposes none)
- No outcome confirmation (Streamer.bot actions are fire-and-forget)
- No multi-machine remote control (localhost design; secure tunnels are the
  operator's responsibility)
- No alternative transports (Lumia/Crowd Control noted for future work)

## Success Criteria

- An agent can switch any configured lens, clear effects, and toggle the
  avatar with tool calls alone
- Dashboard and MCP tools stay consistent (shared bridge)
- Installer + bundle ship without the user touching a terminal
- All five gates green (ruff, pyright, pytest, tsc, biome) + e2e suite
