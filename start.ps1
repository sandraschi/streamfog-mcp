# start.ps1 - Streamfog MCP + Webapp
param([switch]$Headless, [switch]$BackendOnly, [switch]$NoBrowser)
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSCommandPath
$WebPort = 10995
$FleetStartPath = Join-Path $ProjectRoot "scripts\FleetStartMode.ps1"
if (-not (Test-Path -LiteralPath $FleetStartPath)) {
    Write-Host "ERROR: Missing vendored launcher helper: $FleetStartPath" -ForegroundColor Red
    exit 1
}
. $FleetStartPath

$ApiPort = 10994
$Mode = Initialize-FleetStartMode -Headless:$Headless -BackendOnly:$BackendOnly -NoBrowser:$NoBrowser

# Kill any existing processes on these ports
Stop-FleetPortSquatters -Ports @($ApiPort, $WebPort) -Label "streamfog"

# Start backend (dual mode: REST + MCP streamable HTTP at /mcp)
if ($Mode.RunBackend) {
    Start-FleetDetachedShell -Label "streamfog-backend" -Exe "uv" `
        -Args @("run", "python", "-m", "streamfog_mcp", "--serve", "--port", "$ApiPort") `
        -WorkingDirectory $ProjectRoot -WindowStyle $Mode.WindowStyle
}

# Readiness poll: TCP + HTTP until the backend answers (max 60s)
if ($Mode.RunBackend) {
    Write-Host "Waiting for backend on :$ApiPort ..." -ForegroundColor DarkGray
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
        if (Test-FleetHttpOk -Url "http://127.0.0.1:$ApiPort/api/health") { $ready = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $ready) {
        Write-Host "WARNING: backend did not answer /api/health within 60s" -ForegroundColor DarkYellow
    } else {
        Write-Host "Backend ready: http://localhost:$ApiPort/api/health" -ForegroundColor Green
    }
}

# Start webapp
if ($Mode.RunFrontend) {
    Push-Location (Join-Path $ProjectRoot "webapp")
    Start-Process cmd -ArgumentList "/c", "bun", "run", "dev" -WindowStyle $Mode.WindowStyle
    Pop-Location
    Start-Sleep -Seconds 2
}

Write-Host "Streamfog MCP: http://localhost:$ApiPort/api/v1/status" -ForegroundColor Green
Write-Host "MCP endpoint:  http://localhost:$ApiPort/mcp (streamable HTTP)" -ForegroundColor Green
if ($Mode.RunFrontend) {
    Write-Host "Webapp:        http://localhost:$WebPort" -ForegroundColor Green
    if (-not $Mode.SkipBrowser) {
        Write-Host "Opening webapp in default browser..." -ForegroundColor Cyan
        Start-Process "http://localhost:$WebPort"
    }
}
