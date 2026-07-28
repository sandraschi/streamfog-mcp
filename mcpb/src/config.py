"""Pydantic-settings configuration for streamfog-mcp."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class StreamfogMCPSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="STREAMFOG_MCP_", env_file=".env")

    streamerbot_host: str = "127.0.0.1"
    streamerbot_port: int = 8080
    streamerbot_token: str = ""

    lens_map_path: str = "lenses.json"

    host: str = "127.0.0.1"
    port: int = 10994
    transport: str = "stdio"
    log_level: str = "INFO"


_settings: StreamfogMCPSettings | None = None


def get_settings() -> StreamfogMCPSettings:
    global _settings
    if _settings is None:
        _settings = StreamfogMCPSettings()
    return _settings
