
## [Unreleased] — 2026-06-14

### Fixed
- Tauri build: resolved Rust crate conflict (brotli/alloc-no-stdlib)
- Tauri build: fixed PyInstaller path mismatch (hyphen to underscore in src dirs)
- Tauri build: fixed TypeScript errors (unused imports, useRef arg, import.meta.env)
- Tauri CORS: allow_origins includes tauri://localhost for WebView access

### Added
- CUA-NSIS: just cua-nsis-test recipe, smoke script, config
- CUA-NSIS: build.ps1 now copies NSIS installer to dist/
- CUA-NSIS: 11-phase smoke test (install, launch, WebView OCR, diagnostics, uninstall)
- CUA-NSIS: local certification — all 11 phases pass locally (2026-06-14)

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


