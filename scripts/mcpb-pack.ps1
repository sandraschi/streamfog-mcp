param([string]$RepoRoot)
$ErrorActionPreference = "Stop"
Set-Location $RepoRoot

$proj = Get-Content pyproject.toml -Raw
$name = if ($proj -match '(?m)^name = "(.*)"') { $matches[1] } else { Split-Path -Leaf $PWD }
$ver = if ($proj -match '(?m)^version = "(.*)"') { $matches[1] } else { "0.1.0" }
$pkg = $name -replace '-', '_'

# ── Fresh stage: wipe + recopy so the bundle can never go stale ────────────
New-Item -ItemType Directory -Force -Path dist, mcpb | Out-Null
Remove-Item "$RepoRoot\mcpb\src" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$RepoRoot\mcpb\run_server.py" -Force -ErrorAction SilentlyContinue
Remove-Item "$RepoRoot\mcpb\manifest.json" -Force -ErrorAction SilentlyContinue
Remove-Item "$RepoRoot\mcpb\pyproject.toml" -Force -ErrorAction SilentlyContinue

# Copy the package directory as-is (src/<pkg>/ -> mcpb/src/<pkg>/, NOT flattened)
Copy-Item "$RepoRoot\src\$pkg" "$RepoRoot\mcpb\src\$pkg" -Recurse -Force
Copy-Item "$RepoRoot\run_server.py" "$RepoRoot\mcpb\run_server.py" -Force
Copy-Item "$RepoRoot\pyproject.toml" "$RepoRoot\mcpb\pyproject.toml" -Force
Copy-Item "$RepoRoot\.mcpbignore" "$RepoRoot\mcpb\.mcpbignore" -Force

# Strip __pycache__ from the staged copy
Get-ChildItem "$RepoRoot\mcpb\src" -Recurse -Directory -Filter "__pycache__" |
    ForEach-Object { Remove-Item $_.FullName -Recurse -Force }
Get-ChildItem "$RepoRoot\mcpb\src" -Recurse -Filter "*.pyc" |
    ForEach-Object { Remove-Item $_.FullName -Force }

# ── Manifest (regenerated every pack - tool list must match src) ────────────
$desc = if ($proj -match '(?m)^description = "(.*)"') { $matches[1] } else { "MCP server: $name" }
$json = @{
    manifest_version = "0.2"
    name             = $name
    version          = $ver
    description      = $desc
    author           = @{ name = "sandraschi" }
    server           = @{
        type        = "python"
        entry_point = "run_server.py"
        mcp_config  = @{
            command = "uv"
            args    = @("run", "--directory", '${PWD}', "run_server.py")
            env     = @{ PYTHONPATH = '${PWD}/src'; PYTHONUNBUFFERED = "1" }
        }
    }
    tools            = @(
        @{ name = "streamfog_status";        description = "Bridge connection health + lens count" },
        @{ name = "streamfog_set_lens";      description = "Activate a specific AR lens or face filter" },
        @{ name = "streamfog_clear_effects"; description = "Strip all effects, return camera to baseline" },
        @{ name = "streamfog_toggle_avatar"; description = "Toggle Vtuber-style avatar on/off" },
        @{ name = "streamfog_list_lenses";   description = "List all configured lenses from lenses.json" }
    )
} | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText("$RepoRoot\mcpb\manifest.json", $json, [System.Text.UTF8Encoding]::new($false))
Write-Host "  Manifest regenerated (5 tools)" -ForegroundColor Yellow

# ── Icon (256x256) ──────────────────────────────────────────────────────────
New-Item -ItemType Directory -Force -Path "$RepoRoot\mcpb\assets" | Out-Null
$iconSrc = "$RepoRoot\native\icons\128x128@2x.png"
if (-not (Test-Path "$RepoRoot\mcpb\assets\icon.png") -and (Test-Path $iconSrc)) {
    Copy-Item $iconSrc "$RepoRoot\mcpb\assets\icon.png" -Force
    Write-Host "  Icon: copied native 256x256 icon" -ForegroundColor Yellow
}
if (-not (Test-Path "$RepoRoot\mcpb\assets\icon.png")) {
    throw "assets/icon.png missing - provide a 256x256 icon before packing"
}

# ── Prompts gate (3-4-100) ──────────────────────────────────────────────────
$sysWords = if (Test-Path "$RepoRoot\mcpb\assets\prompts\system.md") { (Get-Content "$RepoRoot\mcpb\assets\prompts\system.md" -Raw).Split(' ').Count } else { 0 }
$usrWords = if (Test-Path "$RepoRoot\mcpb\assets\prompts\user.md") { (Get-Content "$RepoRoot\mcpb\assets\prompts\user.md" -Raw).Split(' ').Count } else { 0 }
$exCount = if (Test-Path "$RepoRoot\mcpb\assets\prompts\examples.json") { @((Get-Content "$RepoRoot\mcpb\assets\prompts\examples.json" -Raw | ConvertFrom-Json)).Count } else { 0 }
if ($sysWords -lt 3000 -or $usrWords -lt 4000 -or $exCount -lt 100) {
    throw "Prompt gate failed: system.md=$sysWords words (>=3000), user.md=$usrWords words (>=4000), examples.json=$exCount entries (>=100)"
}
Write-Host "  Prompt gate: system=$sysWords user=$usrWords examples=$exCount OK" -ForegroundColor Green

# ── Pack ────────────────────────────────────────────────────────────────────
npx --yes @anthropic-ai/mcpb pack "$RepoRoot\mcpb" "$RepoRoot\dist\$name-v$ver.mcpb"
if ($LASTEXITCODE -ne 0) { throw "mcpb pack failed" }

# ── Verify bundle imports itself from a clean sys.path ──────────────────────
$stage = "$RepoRoot\mcpb\src"
uv run python -c "import sys, importlib.util as u; sys.path.insert(0, r'$stage'); s = u.find_spec('$pkg'); assert s and r'$stage' in s.origin, f'import origin: {s.origin if s else None}'; print('bundle self-import OK:', s.origin)"

Write-Host "Bundle: $RepoRoot\dist\$name-v$ver.mcpb" -ForegroundColor Green
