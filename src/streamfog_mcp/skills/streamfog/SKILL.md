---
name: streamfog-expert
description: Streamfog AR lens and face-filter orchestration for live OBS streams via Streamer.bot
---

# Streamfog Expert

You are operating an AI-driven AR lens orchestrator for live OBS broadcasts. You
control Streamfog face filters, AR effects, and Vtuber avatars by dispatching
actions to Streamer.bot over its local WebSocket bridge. There is no direct
Streamfog API - every command is a fire-and-forget Streamer.bot action.

## Architecture

```
LLM Agent -> streamfog-mcp (FastMCP) -> Streamer.bot WebSocket -> Streamfog Desktop -> OBS
```

## Tools

### Lens Control
- `streamfog_set_lens(lens_identifier)` - Activate a lens. The identifier must
  match a key in `lenses.json`, or falls back to action name `SetLens_{id}`.
- `streamfog_clear_effects()` - Strip all AR assets and return the camera to a
  clean baseline (action `ClearEffects`).
- `streamfog_toggle_avatar()` - Toggle the Vtuber avatar overlay (action
  `ToggleAvatar`).

### Discovery
- `streamfog_list_lenses(reload=False)` - List configured lenses and their
  Streamer.bot action names. Use `reload=True` after editing `lenses.json`.
- `streamfog_status()` - Bridge connectivity, loaded lens count, last error.
  Run this BEFORE any lens operation to verify the bridge is healthy.

## Best Practices

1. **Check the bridge first**: call `streamfog_status()` before attempting any
   lens operation. If the bridge is disconnected, tell the user to start
   Streamer.bot (Settings -> WebSocket Server) rather than failing silently.
2. **Resolve identifiers before dispatch**: call `streamfog_list_lenses()` to
   confirm the identifier exists in the mapping before `streamfog_set_lens`.
3. **Fire-and-forget semantics**: Streamer.bot does not report action success.
   A dispatched action means "sent", not "applied". Inform the user that lens
   activation is best-effort.
4. **Reload after edits**: if the user edits `lenses.json`, call
   `streamfog_list_lenses(reload=True)` to refresh the in-memory map.
5. **Batching**: multiple lens changes during a live stream can flicker the
   camera. Prefer one intentional change per request.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `STREAMFOG_MCP_STREAMERBOT_HOST` | `127.0.0.1` | Streamer.bot WebSocket host |
| `STREAMFOG_MCP_STREAMERBOT_PORT` | `8080` | Streamer.bot WebSocket port |
| `STREAMFOG_MCP_STREAMERBOT_TOKEN` | - | Streamer.bot auth token |
| `STREAMFOG_MCP_LENS_MAP_PATH` | `lenses.json` | Lens-to-action mapping file |
| `STREAMFOG_MCP_PORT` | `10994` | Backend port |

## Troubleshooting

- **"Not connected to Streamer.bot"**: Streamer.bot is not running or the
  WebSocket server is disabled. Enable Settings -> WebSocket Server.
- **"Failed to dispatch"**: token auth mismatch - check
  `STREAMFOG_MCP_STREAMERBOT_TOKEN` matches the Streamer.bot WebSocket token.
- **Action sent but nothing happens**: the action name in `lenses.json` does
  not exist in Streamer.bot. Verify the action name in Streamer.bot's Actions
  panel, then update `lenses.json` and reload.
