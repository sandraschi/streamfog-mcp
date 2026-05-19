"""Streamer.bot WebSocket client for dispatching lens actions.

Streamer.bot exposes a local WebSocket server (default ws://127.0.0.1:8080)
that accepts JSON-RPC-style commands. This service connects to it and sends
"DoAction" requests to trigger pre-configured Streamfog lens actions.

Protocol reference: https://docs.streamer.bot/api/servers/websocket
"""

import json
import logging
import pathlib
import time

from streamfog_mcp.config import get_settings

logger = logging.getLogger("streamfog-mcp.bridge")


class StreamerBotBridge:
    """Manages the WebSocket connection to a local Streamer.bot instance."""

    def __init__(self):
        self._settings = get_settings()
        self._ws = None
        self._lens_map: dict[str, str] = {}
        self._connected_at: float | None = None
        self._last_error: str | None = None

    # ── Lens map ────────────────────────────────────────────────────────────

    def load_lens_map(self) -> dict[str, str]:
        """Load lens→action mappings from the configured JSON file."""
        path = pathlib.Path(self._settings.lens_map_path)
        if not path.exists():
            logger.warning("Lens map file not found: %s", path)
            self._lens_map = {}
            return {}

        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            if not isinstance(data, dict):
                logger.error("Lens map is not a JSON object: %s", path)
                self._lens_map = {}
                return {}
            self._lens_map = {k: v for k, v in data.items() if isinstance(v, str) and not k.startswith("_")}
            logger.info("Loaded %d lens→action mappings from %s", len(self._lens_map), path)
            return dict(self._lens_map)
        except (json.JSONDecodeError, OSError) as e:
            logger.error("Failed to load lens map: %s", e)
            self._last_error = str(e)
            return {}

    def reload_lens_map(self) -> dict[str, str]:
        """Reload the lens map from disk."""
        return self.load_lens_map()

    # ── Connection ──────────────────────────────────────────────────────────

    async def connect(self) -> bool:
        """Connect to the Streamer.bot WebSocket server."""
        try:
            import websockets
        except ImportError:
            logger.error("websockets package not installed. Run: uv pip install websockets")
            self._last_error = "websockets package not installed"
            return False

        host = self._settings.streamerbot_host
        port = self._settings.streamerbot_port
        uri = f"ws://{host}:{port}"

        try:
            self._ws = await websockets.connect(uri, ping_interval=30, ping_timeout=10, open_timeout=5)
            self._connected_at = time.time()
            self._last_error = None
            logger.info("Connected to Streamer.bot at %s", uri)

            # Send auth if token configured
            if self._settings.streamerbot_token:
                await self._send_auth()

            return True
        except Exception as e:
            self._ws = None
            self._last_error = str(e)
            logger.error("Failed to connect to Streamer.bot: %s", e)
            return False

    async def disconnect(self) -> None:
        """Disconnect from the Streamer.bot WebSocket server."""
        if self._ws:
            try:
                await self._ws.close()
            except Exception:
                pass
            self._ws = None
            self._connected_at = None
            logger.info("Disconnected from Streamer.bot")

    async def _send_auth(self) -> None:
        """Send authentication token to Streamer.bot."""
        if not self._ws:
            return
        msg = {
            "request": "Authenticate",
            "id": f"auth-streamfog-mcp-{int(time.time())}",
            "token": self._settings.streamerbot_token,
        }
        await self._ws.send(json.dumps(msg))

    # ── Action dispatch ─────────────────────────────────────────────────────

    async def do_action(self, action_name: str, args: dict | None = None) -> dict:
        """Send a DoAction command to Streamer.bot.

        Returns:
            {"success": bool, "message": str, "action": str}
        """
        if not self._ws:
            success = await self.connect()
            if not success:
                return {"success": False, "message": f"Not connected to Streamer.bot: {self._last_error}", "action": action_name}

        request_id = f"mcp-{int(time.time() * 1000)}"
        msg = {
            "request": "DoAction",
            "action": {"name": action_name},
            "id": request_id,
        }
        if args:
            msg["action"]["arguments"] = args

        try:
            await self._ws.send(json.dumps(msg))
            logger.info("Dispatched action '%s' to Streamer.bot (id=%s)", action_name, request_id)
            return {"success": True, "message": f"Action '{action_name}' dispatched", "action": action_name, "request_id": request_id}
        except Exception as e:
            self._ws = None
            self._last_error = str(e)
            logger.error("Failed to dispatch action '%s': %s", action_name, e)
            return {"success": False, "message": f"Dispatch failed: {e}", "action": action_name}

    async def set_lens(self, lens_identifier: str) -> dict:
        """Resolve a lens identifier to an action name and dispatch it.

        First checks the lens map. Falls back to constructing an action name
        from the identifier directly: 'SetLens_{identifier}'.
        """
        if lens_identifier in self._lens_map:
            action_name = self._lens_map[lens_identifier]
        else:
            # Fallback: construct action name from identifier
            action_name = f"SetLens_{lens_identifier}"

        return await self.do_action(action_name)

    async def clear_effects(self) -> dict:
        """Dispatch the ClearEffects action."""
        return await self.do_action("ClearEffects")

    async def toggle_avatar(self) -> dict:
        """Dispatch the ToggleAvatar action."""
        return await self.do_action("ToggleAvatar")

    @property
    def is_connected(self) -> bool:
        return self._ws is not None and not self._ws.closed if self._ws else False

    @property
    def connected_at(self) -> float | None:
        return self._connected_at

    @property
    def last_error(self) -> str | None:
        return self._last_error

    def status(self) -> dict:
        """Return current bridge status."""
        return {
            "connected": self.is_connected,
            "host": self._settings.streamerbot_host,
            "port": self._settings.streamerbot_port,
            "connected_at": self._connected_at,
            "last_error": self._last_error,
            "lenses_loaded": len(self._lens_map),
        }
