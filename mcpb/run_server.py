"""Entry point for PyInstaller-bundled server."""
import _strptime  # noqa: F401
import sys
sys.path.insert(0, ".")

from streamfog_mcp.server import main

main()

