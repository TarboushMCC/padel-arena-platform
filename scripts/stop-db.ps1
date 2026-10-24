$ErrorActionPreference = 'Continue'

$root = Resolve-Path "$PSScriptRoot\.."
$pgBin = Join-Path $root '.tools\pgsql\bin'
$pgData = Join-Path $root 'pgdata_test'
$pidFile = Join-Path $root '.pg.pid'
$postmasterPidFile = Join-Path $pgData 'postmaster.pid'
$pgCtlExe = Join-Path $pgBin 'pg_ctl.exe'

$stopped = $false

if ((Test-Path $pgCtlExe) -and (Test-Path $pgData)) {
  try {
    & $pgCtlExe -D $pgData -m fast -w stop 2>$null | Out-Null
  } catch {
    # Ignore and fall through to process kill fallback.
  }
  if ($LASTEXITCODE -eq 0) {
    $stopped = $true
  }
}

$running = Get-Process postgres -ErrorAction SilentlyContinue
if ($running) {
  $running | Stop-Process -Force -ErrorAction SilentlyContinue
  $stopped = $true
}

if (Test-Path $pidFile) {
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

if (-not (Get-Process postgres -ErrorAction SilentlyContinue)) {
  if (Test-Path $postmasterPidFile) {
    Remove-Item $postmasterPidFile -Force -ErrorAction SilentlyContinue
  }
}

if ($stopped) {
  Write-Output 'PostgreSQL stopped'
} else {
  Write-Output 'PostgreSQL is not running'
}
