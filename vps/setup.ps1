# ============================================================================
# Atlas STT — Windows VPS one-click installer
#
# Run once as Administrator from the folder containing this file:
#
#   Set-ExecutionPolicy -Scope Process Bypass
#   .\setup.ps1
#
# What it does:
#   1. Verifies admin
#   2. Installs (via winget) Python 3.12, ffmpeg, and nssm if missing
#   3. Downloads whisper.cpp Windows binary + the Hebrew-capable model
#   4. Creates a .venv and installs requirements.txt
#   5. Creates .env from template if missing and opens it for editing
#   6. Installs + starts the "AtlasSTT" Windows service (NSSM)
#   7. Prints the local health URL
#
# Idempotent — safe to re-run.
# ============================================================================

[CmdletBinding()]
param(
  [string] $WhisperVersion  = "v1.7.4",
  [string] $ModelFileName   = "ggml-large-v3-turbo-q5_0.bin",
  [string] $ServiceName     = "AtlasSTT"
)

$ErrorActionPreference = "Stop"
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# --- Helpers -----------------------------------------------------------------

function Assert-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $pr = New-Object Security.Principal.WindowsPrincipal($id)
  if (-not $pr.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "setup.ps1 must be run as Administrator. Right-click PowerShell -> Run as administrator."
  }
}

function Ensure-Winget-Package {
  param([string]$Id, [string]$FriendlyName)
  $probe = winget list --id $Id --exact --accept-source-agreements 2>$null | Out-String
  if ($probe -match $Id) {
    Write-Host "  [ok] $FriendlyName already installed" -ForegroundColor DarkGray
    return
  }
  Write-Host "  installing $FriendlyName ($Id)..." -ForegroundColor Cyan
  winget install --exact --silent --id $Id --accept-source-agreements --accept-package-agreements
}

function Download-File {
  param([string]$Url, [string]$Dest)
  $destPath = [System.IO.Path]::GetFullPath($Dest)
  $destDir  = Split-Path $destPath -Parent
  if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }
  if (Test-Path $destPath) {
    Write-Host "  [cached] $destPath" -ForegroundColor DarkGray
    return
  }
  Write-Host "  downloading $Url" -ForegroundColor Cyan
  # Use BITS if available for resumable transfers of the big model file
  try {
    Import-Module BitsTransfer -ErrorAction Stop
    Start-BitsTransfer -Source $Url -Destination $destPath
  } catch {
    Invoke-WebRequest -Uri $Url -OutFile $destPath -UseBasicParsing
  }
}

function Ensure-Path {
  param([string]$Dir)
  $pathParts = ($env:Path -split ';')
  if ($pathParts -notcontains $Dir) {
    $env:Path = "$Dir;$env:Path"
    [Environment]::SetEnvironmentVariable(
      'Path',
      ([Environment]::GetEnvironmentVariable('Path','Machine') + ";$Dir"),
      'Machine'
    )
  }
}

# --- Start -------------------------------------------------------------------

Assert-Admin
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
Write-Host ""
Write-Host "==> Atlas STT installer" -ForegroundColor Green
Write-Host "    root: $root"
Write-Host "    whisper.cpp: $WhisperVersion"
Write-Host "    model: $ModelFileName"
Write-Host ""

# --- 1. System packages ------------------------------------------------------

Write-Host "[1/7] system packages" -ForegroundColor Yellow
if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
  throw "winget not found. Install App Installer from the Microsoft Store, then re-run."
}
Ensure-Winget-Package -Id "Python.Python.3.12" -FriendlyName "Python 3.12"
Ensure-Winget-Package -Id "Gyan.FFmpeg"        -FriendlyName "ffmpeg"
Ensure-Winget-Package -Id "NSSM.NSSM"          -FriendlyName "NSSM (service manager)"

# Refresh PATH so just-installed tools resolve for the rest of the script
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path","User")

$python = (Get-Command python -ErrorAction SilentlyContinue)?.Source
if (-not $python) {
  $python = (Get-Command py -ErrorAction SilentlyContinue)?.Source
}
if (-not $python) { throw "Python 3.12 install failed — restart terminal and re-run." }

$ffmpeg = (Get-Command ffmpeg -ErrorAction SilentlyContinue)?.Source
if (-not $ffmpeg) { throw "ffmpeg not resolvable on PATH — close + reopen PowerShell and re-run." }
$nssm = (Get-Command nssm -ErrorAction SilentlyContinue)?.Source
if (-not $nssm) { throw "nssm not resolvable on PATH — close + reopen PowerShell and re-run." }

# --- 2. whisper.cpp Windows binary ------------------------------------------

Write-Host "[2/7] whisper.cpp binary" -ForegroundColor Yellow
$whisperDir  = Join-Path $root "whisper"
$whisperZip  = Join-Path $root "whisper.zip"
$whisperUrl  = "https://github.com/ggerganov/whisper.cpp/releases/download/$WhisperVersion/whisper-blas-bin-x64.zip"
$whisperExe  = Join-Path $whisperDir "whisper-cli.exe"
if (-not (Test-Path $whisperExe)) {
  $legacyMain = Join-Path $whisperDir "main.exe"
  if (-not (Test-Path $legacyMain)) {
    Download-File -Url $whisperUrl -Dest $whisperZip
    if (Test-Path $whisperDir) { Remove-Item -Recurse -Force $whisperDir }
    Expand-Archive -Path $whisperZip -DestinationPath $whisperDir -Force
    # Some release zips nest everything in a subfolder — flatten it.
    $inner = Get-ChildItem -Directory $whisperDir | Select-Object -First 1
    if ($inner -and -not (Test-Path (Join-Path $whisperDir 'whisper-cli.exe')) -and -not (Test-Path (Join-Path $whisperDir 'main.exe'))) {
      Get-ChildItem $inner.FullName | Move-Item -Destination $whisperDir
      Remove-Item -Recurse -Force $inner.FullName
    }
    Remove-Item -Force $whisperZip
  }
  if (-not (Test-Path $whisperExe) -and -not (Test-Path $legacyMain)) {
    throw "whisper.cpp binary not found after extract."
  }
}
Write-Host "  [ok] whisper.cpp ready at $whisperDir" -ForegroundColor DarkGray

# --- 3. Model download -------------------------------------------------------

Write-Host "[3/7] model" -ForegroundColor Yellow
$modelsDir = Join-Path $root "models"
if (-not (Test-Path $modelsDir)) { New-Item -ItemType Directory -Path $modelsDir | Out-Null }
$modelPath = Join-Path $modelsDir $ModelFileName
$modelUrl  = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/$ModelFileName"
Download-File -Url $modelUrl -Dest $modelPath
$modelSize = [math]::Round((Get-Item $modelPath).Length / 1MB, 1)
Write-Host "  [ok] $ModelFileName ($modelSize MB)" -ForegroundColor DarkGray

# --- 4. venv + deps ----------------------------------------------------------

Write-Host "[4/7] python venv + deps" -ForegroundColor Yellow
$venv = Join-Path $root ".venv"
if (-not (Test-Path $venv)) {
  & $python -m venv $venv
}
$venvPy = Join-Path $venv "Scripts\python.exe"
& $venvPy -m pip install --upgrade pip | Out-Null
& $venvPy -m pip install -r (Join-Path $root "requirements.txt")

# --- 5. .env -----------------------------------------------------------------

Write-Host "[5/7] .env" -ForegroundColor Yellow
$envPath    = Join-Path $root ".env"
$envSample  = Join-Path $root ".env.example"
if (-not (Test-Path $envPath)) {
  Copy-Item $envSample $envPath
  Write-Host "  created .env from .env.example — fill in the three REQUIRED values:" -ForegroundColor Yellow
  Write-Host "    WORKER_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
  Write-Host "  opening .env in notepad..." -ForegroundColor Yellow
  Start-Process notepad $envPath -Wait
} else {
  Write-Host "  [ok] .env already present" -ForegroundColor DarkGray
}

# Validate .env has the minimum secrets
$envContent = Get-Content $envPath -Raw
foreach ($key in @("WORKER_SECRET","SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY")) {
  if ($envContent -notmatch "(?m)^\s*${key}\s*=\s*\S") {
    throw ".env is missing a value for $key"
  }
  if ($envContent -match "(?m)^\s*${key}\s*=\s*(change-me|YOUR_)") {
    throw ".env still has the placeholder value for $key — fill in a real value and re-run."
  }
}

# --- 6. Windows service via NSSM --------------------------------------------

Write-Host "[6/7] NSSM service ($ServiceName)" -ForegroundColor Yellow
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
  & $nssm stop  $ServiceName confirm | Out-Null
  & $nssm remove $ServiceName confirm | Out-Null
  Start-Sleep -Seconds 1
}

$uvicornArgs = "-m uvicorn server:app --host 127.0.0.1 --port 8080 --workers 1 --no-access-log"
& $nssm install $ServiceName $venvPy $uvicornArgs | Out-Null
& $nssm set $ServiceName AppDirectory $root | Out-Null
& $nssm set $ServiceName AppEnvironmentExtra "PYTHONUNBUFFERED=1" | Out-Null
# Load .env by having the service source it — NSSM reads plain text env file
& $nssm set $ServiceName AppStdout (Join-Path $root "service.log") | Out-Null
& $nssm set $ServiceName AppStderr (Join-Path $root "service.err.log") | Out-Null
& $nssm set $ServiceName AppRotateFiles 1 | Out-Null
& $nssm set $ServiceName AppRotateOnline 1 | Out-Null
& $nssm set $ServiceName AppRotateBytes 5242880 | Out-Null
& $nssm set $ServiceName Start SERVICE_AUTO_START | Out-Null
& $nssm set $ServiceName ObjectName LocalSystem | Out-Null

# NSSM supports loading env vars from a file via AppEnvironmentExtra — but
# its format is NUL-delimited. Simpler: parse .env here and set each var.
$envMap = @{}
foreach ($line in Get-Content $envPath) {
  if ($line -match '^\s*#') { continue }
  if ($line -notmatch '=') { continue }
  $k,$v = $line.Split('=',2)
  $envMap[$k.Trim()] = $v.Trim()
}
$envList = ($envMap.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "`0"
& $nssm set $ServiceName AppEnvironmentExtra $envList | Out-Null

& $nssm start $ServiceName | Out-Null
Start-Sleep -Seconds 2

# --- 7. Smoke test -----------------------------------------------------------

Write-Host "[7/7] smoke test" -ForegroundColor Yellow
try {
  $h = Invoke-RestMethod -Uri "http://127.0.0.1:8080/health" -TimeoutSec 8
  if ($h.ok) {
    Write-Host "  [ok] /health -> ok" -ForegroundColor Green
  } else {
    Write-Host "  /health returned but ok=false:" -ForegroundColor Red
    $h | ConvertTo-Json -Compress | Write-Host
  }
} catch {
  Write-Host "  smoke test failed — check service.log / service.err.log in $root" -ForegroundColor Red
  throw
}

Write-Host ""
Write-Host "==> done" -ForegroundColor Green
Write-Host "    Service : $ServiceName  (Get-Service $ServiceName)"
Write-Host "    Logs    : $root\service.log"
Write-Host "    Health  : http://127.0.0.1:8080/health"
Write-Host ""
Write-Host "    Next: expose 8080 publicly. Pick one:"
Write-Host "      - Cloudflare Tunnel (zero ports, free):"
Write-Host "          winget install Cloudflare.cloudflared"
Write-Host "          cloudflared tunnel login"
Write-Host "          cloudflared tunnel create atlas-stt"
Write-Host "          cloudflared tunnel route dns atlas-stt atlas-stt.yourdomain.com"
Write-Host "          cloudflared tunnel --url http://127.0.0.1:8080 run atlas-stt"
Write-Host "      - Caddy + open :443 — see README.md"
Write-Host ""
Write-Host "    Then set on Vercel:"
Write-Host "      VPS_URL=https://atlas-stt.yourdomain.com"
Write-Host "      VPS_WORKER_SECRET=<the WORKER_SECRET from .env>"
