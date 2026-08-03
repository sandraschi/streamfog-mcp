---
name: session-context
description: Lightweight Streamfog MCP session start prompt - bridge health and lens inventory
---

## Session Context (Streamfog MCP)

You can control Streamfog AR lenses, face filters, and Vtuber avatars on the
live OBS stream via the Streamer.bot bridge.

**Before starting work:**
1. Check bridge health: streamfog_status()
2. List available lenses: streamfog_list_lenses()

**At end of work, save state:**
- Confirm the last dispatched action resolved to the intended lens or effect
- If lenses.json was edited, reload with streamfog_list_lenses(reload=True)
