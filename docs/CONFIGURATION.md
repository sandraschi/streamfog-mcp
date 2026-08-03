# Configuration

All settings are read from environment variables with the prefix
`STREAMFOG_MCP_` or from a `.env` file at the repository root. Environment
variables take precedence over `.env`.

| Variable | Default | Description |
|----------|---------|-------------|
| `STREAMFOG_MCP_STREAMERBOT_HOST` | `127.0.0.1` | Streamer.bot WebSocket host |
| `STREAMFOG_MCP_STREAMERBOT_PORT` | `8080` | Streamer.bot WebSocket port |
| `STREAMFOG_MCP_STREAMERBOT_TOKEN` | _(empty)_ | Streamer.bot auth token (empty = no auth) |
| `STREAMFOG_MCP_LENS_MAP_PATH` | `lenses.json` | Lens-to-action mapping file path |
| `STREAMFOG_MCP_PORT` | `10994` | Backend port (dual/HTTP mode) |
| `STREAMFOG_MCP_HOST` | `127.0.0.1` | Backend bind host |
| `STREAMFOG_MCP_LOG_LEVEL` | `INFO` | Logging level (DEBUG/INFO/WARNING/ERROR) |

## Lens Map

The lens map is a JSON object mapping human-readable identifiers to
Streamer.bot action names:

```json
{
  "beauty_smooth": "SetLens_BeautySmooth",
  "cyber_helmet": "SetLens_CyberHelmet",
  "vtuber": "SetLens_VTuberAvatar"
}
```

- Keys starting with `_` are ignored (usable as comments).
- Non-string values are skipped.
- Unknown identifiers fall back to the constructed action name
  `SetLens_{identifier}`.
- Missing or invalid JSON logs a warning and leaves the map empty.

## Environment Precedence

1. Process environment variables
2. `.env` file at repo root

Reload the lens map at runtime with `streamfog_list_lenses(reload=True)` or
`POST /api/v1/lenses/reload` - no restart required for mapping edits.
