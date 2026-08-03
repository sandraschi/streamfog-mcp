"""Entry point for PyInstaller-bundled server - dual transport.

Detects MCP_PORT/PORT env vars (set by the Tauri wrapper) and switches to
HTTP/dual mode; otherwise falls back to stdio for Claude Desktop / Cursor.
"""

import os
import sys

sys.path.insert(0, ".")

port = os.environ.get("MCP_PORT") or os.environ.get("PORT")
if port:
    host = os.environ.get("MCP_HOST", "127.0.0.1")
    # Overwrite frozen argv so argparse in main() sees our flags
    sys.argv = ["run_server.py", "--serve", "--host", host, "--port", str(port)]

from streamfog_mcp.server import main

main()
