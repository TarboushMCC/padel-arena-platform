$ErrorActionPreference = 'Stop'

$root = Resolve-Path "$PSScriptRoot\.."
$pgBin = Join-Path $root '.tools\pgsql\bin'
$pgData = Join-Path $root 'pgdata_test'
$pidFile = Join-Path $root '.pg.pid'
$postmasterPidFile = Join-Path $pgData 'postmaster.pid'
$pgLogFile = Join-Path $root '.pg.log'
$postgresExe = Join-Path $pgBin 'postgres.exe'
$pgCtlExe = Join-Path $pgBin 'pg_ctl.exe'
$pgIsReadyExe = Join-Path $pgBin 'pg_isready.exe'
$createdbExe = Join-Path $pgBin 'createdb.exe'
$dbHost = '127.0.0.1'
$port = 5432

function Test-DbReady {
  $result = & $pgIsReadyExe -h $dbHost -p $port -U postgres 2>&1
  return ($result -match 'accepting connections')
}

function Wait-DbReady([int]$timeoutSeconds = 120) {
  for ($i = 0; $i -lt $timeoutSeconds; $i++) {
    if (Test-DbReady) {
      return $true
    }
    Start-Sleep -Seconds 1
  }
  return $false
}

if (!(Test-Path $postgresExe)) {
  throw "PostgreSQL binaries not found at $pgBin"
}
if (!(Test-Path $pgData)) {
  throw "PostgreSQL data directory not found at $pgData. Run setup first."
}

if (Test-Path $postmasterPidFile) {
  $pidLine = Get-Content $postmasterPidFile -ErrorAction SilentlyContinue | Select-Object -First 1
  $stalePidFile = $true
  if ($pidLine -match '^\d+$') {
    $proc = Get-Process -Id ([int]$pidLine) -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -eq 'postgres') {
      $stalePidFile = $false
    }
  }
  if ($stalePidFile) {
    Remove-Item $postmasterPidFile -Force -ErrorAction SilentlyContinue
  }
}

$running = Get-Process postgres -ErrorAction SilentlyContinue | Select-Object -First 1
if ($running -and (Test-DbReady)) {
  $running.Id | Set-Content -NoNewline $pidFile
  Write-Output "PostgreSQL already running on ${dbHost}:$port (pid=$($running.Id))"
  exit 0
}

$started = $false
$startedProc = $null

if (Test-Path $pgCtlExe) {
  try {
    & $pgCtlExe -D $pgData -l $pgLogFile -o "`"-p $port -h $dbHost`"" -w start 2>$null | Out-Null
  } catch {
    # Ignore pg_ctl failures; fallback launch is handled below.
  }
  if ($LASTEXITCODE -eq 0) {
    $started = $true
  }
}

if (-not $started) {
  $startedProc = [System.Diagnostics.Process]::Start(
    $postgresExe,
    "-D `"$pgData`" -p $port -h $dbHost"
  )
  if (-not $startedProc) {
    throw 'PostgreSQL failed to launch.'
  }
}

if (-not (Wait-DbReady)) {
  $lastLogLines = ''
  if (Test-Path $pgLogFile) {
    $lastLogLines = (Get-Content $pgLogFile -Tail 20 -ErrorAction SilentlyContinue) -join "`n"
  }
  if ($startedProc -and $startedProc.HasExited) {
    throw "PostgreSQL failed to start (exit code $($startedProc.ExitCode))."
  }
  if ($lastLogLines) {
    throw "PostgreSQL failed to start. Last log lines:`n$lastLogLines"
  }
  throw 'PostgreSQL failed to start: database did not become ready in time.'
}

$serverProc = Get-Process postgres -ErrorAction SilentlyContinue | Sort-Object StartTime -Descending | Select-Object -First 1
if ($serverProc) {
  $serverProc.Id | Set-Content -NoNewline $pidFile
}

$env:PGPASSWORD = 'postgres'
& $createdbExe -h $dbHost -p $port -U postgres padel_arena 2>$null | Out-Null

$pidText = if ($serverProc) { $serverProc.Id } else { 'unknown' }
Write-Output "PostgreSQL started on ${dbHost}:$port (pid=$pidText)"
