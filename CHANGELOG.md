# Changelog

All notable changes to streamfog-mcp will be documented in this file.

## [0.1.0] — 2026-05-19

### Added
- Initial release
- 5 MCP tools: `streamfog_set_lens`, `streamfog_clear_effects`, `streamfog_toggle_avatar`, `streamfog_list_lenses`, `streamfog_status`
- Streamer.bot WebSocket bridge (`services/streamerbot.py`)
- FastAPI REST API with 6 endpoints
- Vite + React 19 + Tailwind dark dashboard
- Pydantic-settings configuration (env prefix: `STREAMFOG_MCP_`)
- JSON lens map (`lenses.json`) with underscore-key filtering
- Fleet standard start.ps1 / start.bat with port zombie cleanup
- justfile task runner
- 5 pytest tests (lens map filtering, config defaults, tool registration)
