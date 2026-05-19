# streamfog-mcp task runner (fleet standard)
# Usage: just [recipe]

set positional-arguments := true

# Install deps + create venv
bootstrap:
    uv sync

# Run backend (stdio transport)
serve:
    uv run python -m streamfog_mcp --serve --port 10994

# Run backend + webapp (dual mode)
dev:
    uv run python -m streamfog_mcp --serve --port 10994

# Lint Python
lint:
    C:\Users\sandr\AppData\Local\Programs\Python\Python313\Scripts\ruff.exe check src/ tests/

# Auto-fix lint issues
fix:
    C:\Users\sandr\AppData\Local\Programs\Python\Python313\Scripts\ruff.exe check --fix src/ tests/

# Run tests
test:
    uv run pytest tests/ -v

# Clean build artifacts
clean:
    Remove-Item -Recurse -Force .venv, .ruff_cache, __pycache__, src/streamfog_mcp/__pycache__, tests/__pycache__, webapp/node_modules, webapp/dist -ErrorAction SilentlyContinue

# Health check
health:
    curl -s http://localhost:10994/api/v1/status | ConvertFrom-Json

# Build Tauri native desktop app (release — full pipeline)
build-native:
    Set-Location '{{justfile_directory()}}\native'
    $env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
    .\build.ps1

# Build Tauri native app (debug, skip PyInstaller)
build-native-debug:
    Set-Location '{{justfile_directory()}}\native'
    $env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"
    npx @tauri-apps/cli build --debug
