# Pre-commit hook: run Biome on frontend sources if a webapp directory exists.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Biome = "C:\Users\sandr\.local\bin\biome.exe"
if (-not (Test-Path $Biome)) { exit 0 }

$webDirs = @("webapp", "web_sota", "webapp/frontend", "web")
$found = $false
foreach ($dir in $webDirs) {
    if (Test-Path (Join-Path $Root "$dir\src")) {
        Push-Location (Join-Path $Root $dir)
        & $Biome check src/ --write 2>&1 | Out-Null
        $code = $LASTEXITCODE
        Pop-Location
        if ($code -ne 0) {
            Write-Host "Biome check failed in $dir" -ForegroundColor Red
            exit $code
        }
        $found = $true
        break
    }
}
if (-not $found) { Write-Host "No webapp dir found - Biome hook skipped" -ForegroundColor DarkGray }
exit 0
