## Session Context (Streamfog MCP)

You can control Streamfog AR lenses, face filters, and Vtuber avatars on the
live OBS stream via the Streamer.bot bridge. Tools: streamfog_status,
streamfog_set_lens, streamfog_clear_effects, streamfog_toggle_avatar,
streamfog_list_lenses.

**Before starting work:**
1. Check bridge health: streamfog_status()
2. List available lenses: streamfog_list_lenses()

**At end of work:**
- Confirm the dispatched action resolved to the intended lens or effect
- If lenses.json was edited, reload with streamfog_list_lenses(reload=True)
