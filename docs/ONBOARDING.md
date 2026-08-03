# Onboarding

Streamfog MCP bridges your AI assistant to Streamfog AR lenses on a live
OBS stream. Two external applications must be installed and configured
before the tools can do anything: **Streamfog** (the renderer) and
**Streamer.bot** (the transport).

## What is Streamfog?

**Streamfog** is a Windows desktop app (https://streamfog.com) that puts AR
effects on your webcam during live streams — face filters, animated lenses,
and Vtuber-style avatars — and renders the result into OBS via a browser
source. It has **no public API**: the only way to control it is through
[Streamer.bot](https://streamer.bot), a free streamer automation tool that
Streamfog integrates with. This server is the bridge that lets an AI
assistant (or the dashboard, or a script) trigger Streamer.bot actions for
you. Everything runs locally, and actions are fire-and-forget — Streamer.bot
does not report outcomes, so verify the result on the stream preview.

## Prerequisite Checklist

1. **Streamfog** installed from https://streamfog.com and running, camera
   preview visible.
2. **Streamer.bot** installed from https://streamer.bot and running.
3. Streamfog → Streamer.bot integration enabled in Streamer.bot's
   Integrations panel.
4. Streamer.bot WebSocket server enabled (Settings → WebSocket Server).
   Default port 8080.
5. Actions created in Streamer.bot: `SetLens_*`, `ClearEffects`,
   `ToggleAvatar`.
6. `lenses.json` in the server root maps lens identifiers to those actions.
7. `STREAMFOG_MCP_STREAMERBOT_TOKEN` set in `.env` if token auth is used.

## Quick Start

```powershell
uv sync
# edit lenses.json with your Streamer.bot action names
.\start.ps1
```

The dashboard opens at http://localhost:10995. The status indicator turns
green when the Streamer.bot bridge connects. Until then, every lens action
fails with "Not connected to Streamer.bot" - that is expected behaviour,
not a bug.

## Verification

1. Dashboard shows backend online and bridge connected.
2. `streamfog_status()` reports connected=true and lenses_loaded >= 1.
3. Click a lens on the dashboard grid; the Streamfog preview applies it.
4. Click Clear All Effects; the preview returns to baseline.

## Still Stuck?

- No Streamer.bot connection → [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Action does nothing → verify the exact action name in Streamer.bot
- Authentication errors → match the token on both sides
- Ask your AI assistant to call `streamfog_status()` and read the
  `last_error` field - it names the failing layer.
