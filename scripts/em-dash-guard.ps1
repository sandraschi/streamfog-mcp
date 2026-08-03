# Em-dash guard: fail if U+2014 appears in fleet script files.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$emDash = [char]0x2014
$files = Get-ChildItem -LiteralPath $Root -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Name -match '\.ps1$|\.bat$|^justfile$' -and
        $_.FullName -notmatch '\.venv|node_modules|build|dist|target|gen'
    }
$hits = $files | Select-String -Pattern $emDash
if ($hits) {
    $hits | Select-Object -First 5 | ForEach-Object { Write-Host "EM DASH: $($_.Path):$($_.LineNumber)" -ForegroundColor Red }
    Write-Error "Em dash (U+2014) found in ps1/bat/justfile - use ASCII hyphen"
    exit 1
}
Write-Host "Em-dash guard: clean" -ForegroundColor DarkGray
exit 0
