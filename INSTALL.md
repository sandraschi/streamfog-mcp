# Installation

> New here? Read **"What is Streamfog?"** in the [README](README.md) first —
> it explains the app, the Streamer.bot chain, and why actions are
> fire-and-forget.

## 🚀 Quick Start (recommended)

```powershell
# Install just if you don't have it
winget install Casey.Just    # Windows
# scoop install just          # Windows (alternative)
# brew install just           # macOS
# sudo apt install just       # Debian/Ubuntu
# cargo install just          # Linux (Rust)

git clone https://github.com/sandraschi/streamfog-mcp
cd streamfog-mcp
just bootstrap   # uv sync + pre-commit hooks
start.ps1        # backend :10994 + dashboard :10995 + opens browser
```

> **Why not `pip install`?** MCP servers bundle webapps, configs, project
> scaffolding, and tooling that a flat Python package can't deliver. PyPI
> offers no safety advantage — it doesn't audit packages either. `just`
> gives you the complete, ready-to-run stack.

## Manual Setup

1. Install [Python 3.12+](https://python.org) and [uv](https://docs.astral.sh/uv/)
2. Clone and enter the repo:
   ```powershell
   git clone https://github.com/sandraschi/streamfog-mcp
   cd streamfog-mcp
   ```
3. Install dependencies:
   ```powershell
   uv sync
   ```
4. Start the server:
   ```powershell
   # stdio mode (for MCP clients like Claude Desktop / Cursor)
   uv run python -m streamfog_mcp --stdio

   # dual mode (REST + MCP endpoint :10994, for the dashboard)
   uv run python -m streamfog_mcp --serve --port 10994
   ```
5. (optional) Start the frontend:
   ```powershell
   cd webapp
   bun install
   bun run dev
   ```

## External Prerequisites

The server is useless without the two apps it controls:

1. [Streamfog](https://streamfog.com) — installed and running, camera preview visible
2. [Streamer.bot](https://streamer.bot) — installed and running
3. Streamfog → Streamer.bot integration enabled in Streamer.bot's Integrations panel
4. Streamer.bot WebSocket server enabled (Settings → WebSocket Server), port 8080
5. Actions created in Streamer.bot (`SetLens_*`, `ClearEffects`, `ToggleAvatar`)
6. `lenses.json` populated with your action → lens mappings

Full step-by-step: [docs/ONBOARDING.md](docs/ONBOARDING.md).

## ❓ Troubleshooting

| Issue | Fix |
|---|---|
| `just` not found | `winget install Casey.Just`, `scoop install just`, or `brew install just` |
| Port conflict on 10994/10995 | Close the conflicting app, then re-run `start.ps1` (it clears the ports) |
| Dependencies out of sync | `uv sync` |
| "Not connected to Streamer.bot" | Enable the WebSocket server in Streamer.bot (Settings → WebSocket Server) |
| Something else | [Open a GitHub issue](https://github.com/sandraschi/streamfog-mcp/issues) |

---

*See the main [README](README.md) for feature overview, architecture, and usage.*
