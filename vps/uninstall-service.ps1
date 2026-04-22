# Removes the AtlasSTT service. Files on disk are left alone.
[CmdletBinding()]
param([string] $ServiceName = "AtlasSTT")

$ErrorActionPreference = "Stop"
$id = [Security.Principal.WindowsIdentity]::GetCurrent()
$pr = New-Object Security.Principal.WindowsPrincipal($id)
if (-not $pr.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "Run as Administrator."
}

$nssm = (Get-Command nssm -ErrorAction SilentlyContinue)?.Source
if (-not $nssm) { throw "nssm not found on PATH." }
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $existing) {
  Write-Host "Service '$ServiceName' is not installed."
  return
}
& $nssm stop   $ServiceName confirm
& $nssm remove $ServiceName confirm
Write-Host "Removed $ServiceName."
