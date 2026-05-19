"""Basic smoke tests for streamfog-mcp."""

import asyncio
import json
import tempfile
from pathlib import Path


class TestLensMap:
    def test_load_lens_map_filters_underscore_keys(self):
        """Keys starting with _ should be excluded from lens map."""
        from streamfog_mcp.services.streamerbot import StreamerBotBridge

        bridge = StreamerBotBridge()
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump(
                {
                    "_comment": "metadata",
                    "beauty_smooth": "SetLens_BeautySmooth",
                    "cyber_helmet": "SetLens_CyberHelmet",
                },
                f,
            )
            tmp_path = f.name

        try:
            bridge._settings.lens_map_path = tmp_path
            result = bridge.load_lens_map()
            assert "_comment" not in result
            assert "beauty_smooth" in result
            assert "cyber_helmet" in result
            assert result["beauty_smooth"] == "SetLens_BeautySmooth"
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    def test_load_lens_map_empty_file(self):
        """Empty JSON file returns empty dict."""
        from streamfog_mcp.services.streamerbot import StreamerBotBridge

        bridge = StreamerBotBridge()
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            json.dump({}, f)
            tmp_path = f.name

        try:
            bridge._settings.lens_map_path = tmp_path
            result = bridge.load_lens_map()
            assert result == {}
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    def test_load_lens_map_missing_file(self):
        """Missing file returns empty dict gracefully."""
        from streamfog_mcp.services.streamerbot import StreamerBotBridge

        bridge = StreamerBotBridge()
        bridge._settings.lens_map_path = "/nonexistent/path.json"
        result = bridge.load_lens_map()
        assert result == {}


class TestConfig:
    def test_default_values(self):
        """Settings have expected fleet defaults."""
        from streamfog_mcp.config import StreamfogMCPSettings

        settings = StreamfogMCPSettings()
        assert settings.streamerbot_host == "127.0.0.1"
        assert settings.streamerbot_port == 8080
        assert settings.port == 10994


class TestModuleImports:
    def test_tools_import_registers_mcp(self):
        """Importing tools module triggers @mcp.tool() registrations."""
        # Side-effect: import tools to register tool decorators
        import streamfog_mcp.tools  # noqa: F401
        from streamfog_mcp._mcp import mcp

        # FastMCP 3.2 uses list_tools() to enumerate registered tools (async)
        result = asyncio.run(mcp.list_tools())
        tool_names = [t.name for t in result]
        expected = [
            "streamfog_status",
            "streamfog_set_lens",
            "streamfog_clear_effects",
            "streamfog_toggle_avatar",
            "streamfog_list_lenses",
        ]
        for name in expected:
            assert name in tool_names, f"Tool '{name}' not found in registered tools"
