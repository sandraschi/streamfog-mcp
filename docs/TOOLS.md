# MCP Tools Reference

All tools return `{success: bool, message: str, data: object}`. Actions are
fire-and-forget: Streamer.bot does not report outcomes, so "success" means
"dispatched", not "applied".

## streamfog_status

Check connection status to Streamfog via the Streamer.bot bridge.

**Parameters:** none

**Returns:** `{success, message, data: {connected, host, port, connected_at,
lenses_loaded, last_error}}`

Call before any lens operation to verify the bridge is healthy.

## streamfog_set_lens

Activate a specific AR lens or face filter.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `lens_identifier` | str | yes | Identifier key from lenses.json (e.g. `beauty_smooth`), or any name - falls back to action `SetLens_{identifier}` |

**Returns:** `{success, message, data: {action, lens}}`

## streamfog_clear_effects

Strip all active AR assets, face filters, and canvas overlays. Dispatches
`ClearEffects`.

**Parameters:** none

**Returns:** `{success, message, data: {action: "ClearEffects"}}`

## streamfog_toggle_avatar

Toggle the Vtuber-style avatar overlay. Dispatches `ToggleAvatar`. The
server cannot read the current avatar state; confirm visually.

**Parameters:** none

**Returns:** `{success, message, data: {action: "ToggleAvatar"}}`

## streamfog_list_lenses

List all configured lenses from lenses.json.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `reload` | bool | no | If true, re-read the map from disk before listing |

**Returns:** `{success, message, data: {lenses, count, path}}`

## MCP Resources

| URI | Description |
|-----|-------------|
| `resource://streamfog/prerequisites` | Prerequisites checklist |
| `skill://streamfog/SKILL.md` | Streamfog expert skill |

## REST Mirror

Every tool has a REST equivalent under `/api/v1/` (see README REST API
table). The REST layer shares the same bridge instance.
