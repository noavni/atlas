# Run the server in-terminal for debugging (no Windows Service).
# Reads .env via python-dotenv inside server.py... actually we load env here:
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$envPath = Join-Path $root ".env"
if (Test-Path $envPath) {
  foreach ($line in Get-Content $envPath) {
    if ($line -match '^\s*#') { continue }
    if ($line -notmatch '=') { continue }
    $k,$v = $line.Split('=',2)
    [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim(), "Process")
  }
}

$venvPy = Join-Path $root ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPy)) {
  throw "No venv — run setup.ps1 first."
}
& $venvPy -m uvicorn server:app --host 127.0.0.1 --port 8080 --reload
