"""FastMCP singleton — created before tools are imported to break circular dependency."""

from fastmcp import FastMCP

DESCRIPTION = """\
# Streamfog MCP — AR Lens Orchestrator for Live Streams

Control Streamfog AR lenses, face filters, and Vtuber avatars during live
OBS Studio broadcasts. Bridges to Streamfog via the local Streamer.bot
WebSocket API — no direct Streamfog API required.

## Architecture

```
[LLM Agent] → [streamfog-mcp] → [Streamer.bot WebSocket] → [Streamfog Desktop] → [OBS Browser Source]
```

## Prerequisites

1. **Streamfog** desktop app installed and running
2. **Streamer.bot** installed and running on the same machine
3. Streamer.bot configured with the Streamfog integration plugin
4. Actions defined in Streamer.bot that map to Streamfog lens operations

## Configuration

Set environment variables or create `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `STREAMFOG_MCP_STREAMERBOT_HOST` | `127.0.0.1` | Streamer.bot WebSocket host |
| `STREAMFOG_MCP_STREAMERBOT_PORT` | `8080` | Streamer.bot WebSocket port |
| `STREAMFOG_MCP_STREAMERBOT_TOKEN` | — | Streamer.bot auth token (optional) |
| `STREAMFOG_MCP_LENS_MAP_PATH` | `./lenses.json` | Path to lens→action mapping file |

## Lens Mapping

Create a `lenses.json` file mapping human-readable lens identifiers to
Streamer.bot action names:

```json
{
  "cyber_helmet": "SetLens_CyberHelmet",
  "beauty_smooth": "SetLens_BeautySmooth",
  "vtuber_avatar": "SetLens_VTuberAvatar",
  "clear": "ClearAllEffects"
}
```

## Tool Categories

- **Lens Control** (3 tools): set_lens, clear_effects, toggle_avatar
- **Discovery** (2 tools): list_lenses, status

Repo: https://github.com/sandraschi/streamfog-mcp
"""

mcp = FastMCP(
    "streamfog-mcp",
    version="0.1.0",
    instructions=DESCRIPTION,
)


@mcp.resource("resource://streamfog/prerequisites")
def get_prerequisites() -> str:
    return """\
# Streamfog MCP — Prerequisites Checklist

1. [ ] Streamfog installed from https://streamfog.com
2. [ ] Streamer.bot installed from https://streamer.bot
3. [ ] Streamfog → Streamer.bot integration enabled in Streamfog's Integrations panel
4. [ ] Streamer.bot WebSocket server enabled (Settings → WebSocket Server)
5. [ ] Actions created in Streamer.bot: SetLens_*, ClearEffects, ToggleAvatar
6. [ ] lenses.json populated with your action→lens mappings
7. [ ] STREAMFOG_MCP_STREAMERBOT_TOKEN set if using token auth
"""
