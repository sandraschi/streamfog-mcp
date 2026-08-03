
## [0.2.0] — 2026-08-03

### Added
- MCP streamable HTTP endpoint at /mcp now actually served (dual mode mounts FastMCP http_app; fixes phantom `FastMCP.from_fastapi` dead code)
- REST: /api/health, /api/tools (dynamic), /api/capabilities, /api/skills, /api/llm/discover (Ollama/LM Studio/vLLM + GPU), /api/logs (ring buffer), /api/v1/diagnostics
- Webapp rebuilt: AppLayout (sidebar + topbar), Dashboard with hero + KPI cards + data-testid, Tools page, Chat page (skill-first, 4 personalities, localStorage, export), Settings page, Help page, Logs modal (Ctrl+L)
- Zustand LLM store, exponential-backoff health polling, Ctrl+Scroll zoom (useZoom, tauri-zoom), Tauri backend-status listener + Restart Backend button
- Session context injection: .claude-plugin hooks, .cursorrules, .windsurfrules, .opencode skill, .agents skill, copilot-instructions
- docs/: CONFIGURATION, DEVELOPMENT, TOOLS, TROUBLESHOOTING, ONBOARDING
- llms.txt + llms-full.txt, glama.json, renovate.json
- CI: .github/workflows/ci.yml (ruff, pyright, pytest, biome, tsc, build; node 22, bun)
- Pre-commit: ruff + biome + em-dash guard; .gitattributes LF
- Playwright e2e: 6 tests (health, tools, REST, SPA load, nav walk, console errors)
- MCPB: fresh-stage pack script (mcpb/src/streamfog_mcp not flattened), 3-4-100 prompts (3126/4156/104), icon.png, manifest tools list
- Skills: streamfog SKILL.md + skill:// resource + /api/skills endpoints
- run_server.py dual transport (MCP_PORT/PORT -> HTTP mode)
- uv.lock now committed; coverage gate (30%) + pyright in dev deps

### Fixed
- CRITICAL: tauri.conf.json + native/build.ps1 bundled `.env` — now bundle `.env.example` only
- CORS allow_origin_regex now unconditional (Tailscale/LAN/tauri.localhost)
- hooks.nsh killed wrong process names (streamfog-backend.exe vs streamfog-mcp-backend.exe)
- `except Exception: pass` in bridge disconnect now logs
- Dashboard hardcoded ports removed; text-xs / text-slate-500 contrast fixes
- start.ps1: readiness poll instead of fixed sleeps; correct /mcp URL
- cua-nsis-config.json: correct process names + nav_routes + frontend_port

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


