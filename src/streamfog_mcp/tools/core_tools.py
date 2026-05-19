"""Streamfog MCP core tools — lens control, effects, and status.

[RATIONALALE] All Streamfog control flows through Streamer.bot's WebSocket API.
These tools provide a clean, deterministic interface for LLM agents to control
AR lenses, face filters, and Vtuber avatars during live OBS broadcasts without
needing to understand the underlying Streamer.bot protocol.
"""

from typing import Annotated

from pydantic import Field

from streamfog_mcp._mcp import mcp
from streamfog_mcp.services.streamerbot import StreamerBotBridge

_bridge = StreamerBotBridge()


@mcp.tool(annotations={"readOnlyHint": True})
async def streamfog_status() -> dict:
    """Check the connection status to Streamfog via the Streamer.bot bridge.

    Returns bridge connectivity, loaded lens count, and any recent errors.
    Use this before attempting lens operations to verify the bridge is healthy.

    ## Return Format
    {"success": true, "data": {"connected": bool, "host": "127.0.0.1", "port": 8080,
     "lenses_loaded": 5, "connected_at": 1715000000.0, "last_error": null}}

    ## Examples
    await streamfog_status()
    """
    status = _bridge.status()
    return {"success": True, "data": status}


@mcp.tool()
async def streamfog_set_lens(
    lens_identifier: Annotated[
        str,
        Field(
            description="The lens identifier to activate (e.g. 'cyber_helmet', 'beauty_smooth', 'vtuber'). "
            "Must match a key in lenses.json or an action name configured in Streamer.bot."
        ),
    ],
) -> dict:
    """Activate a specific AR lens or face filter in Streamfog.

    Resolves the lens identifier against the local lenses.json mapping file
    and dispatches the corresponding action to Streamer.bot. Falls back to a
    constructed action name 'SetLens_{identifier}' if no mapping found.

    ## Return Format
    {"success": true, "message": "Action 'SetLens_CyberHelmet' dispatched",
     "data": {"action": "SetLens_CyberHelmet", "lens": "cyber_helmet"}}

    ## Examples
    await streamfog_set_lens("beauty_smooth")
    await streamfog_set_lens("cyber_helmet")
    """
    if not lens_identifier.strip():
        return {"success": False, "message": "lens_identifier is required", "data": None}

    result = await _bridge.set_lens(lens_identifier.strip())
    if result["success"]:
        return {
            "success": True,
            "message": result["message"],
            "data": {"action": result["action"], "lens": lens_identifier.strip()},
        }
    return {"success": False, "message": result["message"], "data": None}


@mcp.tool()
async def streamfog_clear_effects() -> dict:
    """Strip all active AR assets, face filters, and canvas overlays in Streamfog.

    Returns the camera feed to a clean, unfiltered video baseline. Dispatches
    the 'ClearEffects' action to Streamer.bot.

    ## Return Format
    {"success": true, "message": "All effects cleared — camera returned to baseline",
     "data": {"action": "ClearEffects"}}

    ## Examples
    await streamfog_clear_effects()
    """
    result = await _bridge.clear_effects()
    if result["success"]:
        return {
            "success": True,
            "message": "All effects cleared — camera returned to baseline",
            "data": {"action": result["action"]},
        }
    return {"success": False, "message": result["message"], "data": None}


@mcp.tool()
async def streamfog_toggle_avatar() -> dict:
    """Toggle the Vtuber-style avatar overlay on or off in Streamfog.

    Dispatches the 'ToggleAvatar' action to Streamer.bot. If no avatar is
    currently active, this activates the default avatar lens. If an avatar
    is active, it deactivates it.

    ## Return Format
    {"success": true, "message": "Avatar toggled",
     "data": {"action": "ToggleAvatar"}}

    ## Examples
    await streamfog_toggle_avatar()
    """
    result = await _bridge.toggle_avatar()
    if result["success"]:
        return {
            "success": True,
            "message": "Avatar toggled",
            "data": {"action": result["action"]},
        }
    return {"success": False, "message": result["message"], "data": None}


@mcp.tool(annotations={"readOnlyHint": True})
async def streamfog_list_lenses(
    reload: Annotated[
        bool,
        Field(description="If true, reload the lens map from disk before listing."),
    ] = False,
) -> dict:
    """List all available AR lenses and face filters from the local lenses.json mapping.

    Returns all lens identifiers and their corresponding Streamer.bot action names.
    Use reload=true to force a re-read from disk if lenses.json was modified.

    ## Return Format
    {"success": true, "data": {"lenses": {"beauty_smooth": "SetLens_BeautySmooth",
     "cyber_helmet": "SetLens_CyberHelmet"}, "count": 2, "path": "lenses.json"}}

    ## Examples
    await streamfog_list_lenses()
    await streamfog_list_lenses(reload=True)
    """
    from streamfog_mcp.config import get_settings

    if reload:
        _bridge.reload_lens_map()

    settings = get_settings()
    lenses = dict(_bridge._lens_map) if hasattr(_bridge, "_lens_map") else {}
    return {
        "success": True,
        "data": {
            "lenses": lenses,
            "count": len(lenses),
            "path": settings.lens_map_path,
        },
    }
