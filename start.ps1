# start.ps1 — Streamfog MCP + Webapp
$WebPort = 10995
$ApiPort = 10994

# Kill any existing processes on these ports
Get-NetTCPConnection -LocalPort $ApiPort -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Get-NetTCPConnection -LocalPort $WebPort -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

# Start backend (dual mode: REST + MCP SSE)
$job = Start-Job -Name "streamfog-mcp" -ScriptBlock {
    Set-Location "$using:PWD"
    uv run python -m streamfog_mcp --serve --port $using:ApiPort
}
Start-Sleep -Seconds 3

# Start webapp
Push-Location webapp
Start-Process cmd -ArgumentList "/c", "npm", "run", "dev"
Pop-Location

Start-Sleep -Seconds 5
Write-Host "Streamfog MCP: http://localhost:$ApiPort/api/v1/status" -ForegroundColor Green
Write-Host "Webapp:        http://localhost:$WebPort" -ForegroundColor Green
Write-Host "MCP SSE:       http://localhost:$ApiPort/sse" -ForegroundColor Green
Write-Host ""
Write-Host "Opening webapp in default browser..." -ForegroundColor Cyan
Start-Process "http://localhost:$WebPort"
