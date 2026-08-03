# Troubleshooting

## Symptom: "Not connected to Streamer.bot"

**Cause:** Streamer.bot is not running, or its WebSocket server is disabled,
or the configured port does not match.

**Fix:** Open Streamer.bot → Settings → WebSocket Server → enable. Verify
`STREAMFOG_MCP_STREAMERBOT_PORT` (default 8080) matches the Streamer.bot
setting. Restart the server after changing configuration.

## Symptom: Dispatch failed / authentication error

**Cause:** Token mismatch.

**Fix:** Either disable token authentication in Streamer.bot, or set
`STREAMFOG_MCP_STREAMERBOT_TOKEN` to the exact token shown in Streamer.bot.
Tokens are case-sensitive.

## Symptom: Action dispatched but nothing happens on stream

**Causes (check in order):**

1. The action name in lenses.json does not exist in Streamer.bot (exact
   match required, including capitalization).
2. Streamfog is not running.
3. The Streamfog integration is not enabled in Streamer.bot.

**Fix:** Verify the action name in Streamer.bot → Actions panel, update
lenses.json, and reload (`streamfog_list_lenses(reload=True)`).

## Symptom: Zero lenses loaded

**Cause:** lenses.json missing, empty, or invalid at
`STREAMFOG_MCP_LENS_MAP_PATH`.

**Fix:** Create/repair the mapping file. Keys starting with `_` are ignored;
values must be strings. Reload or restart.

## Symptom: Dashboard shows "Backend offline"

**Cause:** Server process not running, or port 10994 occupied.

**Fix:** Close the conflicting process, start the server. The dashboard
retries with exponential backoff (1s → 16s) and recovers automatically.

## Symptom: MCP client cannot reach the server

**Cause:** Wrong transport or endpoint configuration.

**Fix:** stdio clients must point at the `streamfog-mcp` command (or
`uv run -m streamfog_mcp --stdio`). HTTP clients must use
`http://127.0.0.1:10994/mcp` with the streamable HTTP protocol.

## Symptom: Frozen backend in Tauri app

**Cause:** Backend crash on spawn.

**Fix:** Read `%LOCALAPPDATA%\{identifier}\logs\backend-spawn.log` (or the
app log dir) for the spawn failure. Verify the PyInstaller binary passes the
size gate (>= 5 MB) in `native/build.ps1`.

## Diagnostic Endpoints

- `GET /api/health` — liveness, tool count, bridge state
- `GET /api/v1/diagnostics` — tool list, platform, bridge, recent errors
- `GET /api/logs?level=ERROR` — live error window (ring buffer, last 500)
- `streamfog_status()` MCP tool — last_error field
