# streamfog-mcp (MCPB Bundle)

Streamfog MCP server — AR lens and face-filter orchestration for OBS live streams via Streamer.bot bridge

## Usage

Add to \claude_desktop_config.json\:
\\\json
{
  "mcpServers": {
    "streamfog-mcp": {
      "command": "uv",
      "args": ["run", "--directory", "\D:\Dev\repos", "python", "-m", "streamfog_mcp"],
      "env": { "PYTHONPATH": "\D:\Dev\repos/src" }
    }
  }
}
\\\

## Tools

- **lifespan**: lifespan

## Requirements

- Python 3.12+
- uv
