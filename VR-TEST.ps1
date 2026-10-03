# VR-TEST.ps1 - one-stop fail-safe launcher for the Quest 3 VR test.
#   1. kills stale demo servers (only OURS - never touches other python apps)
#   2. (re)generates the HTTPS cert if missing/expiring/IP changed
#   3. starts the fail-safe server detached (survives this window closing)
#   4. verifies HTTPS + HTTP are actually listening and the page is served
#   5. prints the exact Quest steps; -USB does the adb reverse for you
#   Re-run any time; -Stop kills the server.
# NOTE: keep this file ASCII-only (PowerShell 5.1 misreads BOM-less UTF-8).
param([switch]$USB, [switch]$Stop)
$ErrorActionPreference = 'Continue'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $dir 'vr-server.pid'

function Test-Port([string]$ip, [int]$port) {
  $c = New-Object Net.Sockets.TcpClient
  try {
    $t = $c.ConnectAsync($ip, $port)
    if (-not $t.Wait(1000)) { return $false }
    return $c.Connected
  } catch { return $false } finally { $c.Dispose() }
}

if ($Stop) {
  if (Test-Path $pidFile) {
    $old = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($old) { Stop-Process -Id $old -Force -ErrorAction SilentlyContinue; Write-Host "Stopped server (pid $old)." }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
  } else { Write-Host "No pid file - server not started by this launcher." }
  exit 0
}

Write-Host ""
Write-Host "=== vr-school-demo VR test - fail-safe launcher ===" -ForegroundColor Cyan

# 0. python present?
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { Write-Host "FAIL: python not on PATH." -ForegroundColor Red; exit 1 }

# 1. kill stale copies of OUR servers only (serve_https.py / http.server on 8000)
Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
  $cl = $_.CommandLine
  if (($cl -match 'serve_https\.py') -or ($cl -match 'http\.server' -and $cl -match ' 8000')) {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Host "Killed stale demo server (pid $($_.ProcessId))."
  }
}

# 2. cert (self-renewing; failure is not fatal - USB route needs no cert)
Write-Host "[2/4] HTTPS certificate..." -NoNewline
Write-Host ""
python (Join-Path $dir 'certs\make_cert.py')
if ($LASTEXITCODE -ne 0) { Write-Host "  (cert failed - Wi-Fi VR won't enable; USB route still fine)" -ForegroundColor Yellow }

# 3. start server detached
$log = Join-Path $dir 'vr-server.log'
$proc = Start-Process -FilePath 'python' -ArgumentList (Join-Path $dir 'serve_https.py') `
  -WorkingDirectory $dir -WindowStyle Hidden -PassThru `
  -RedirectStandardOutput $log -RedirectStandardError (Join-Path $dir 'vr-server.err.log')
$proc.Id | Set-Content $pidFile
Write-Host "[3/4] Server starting (pid $($proc.Id), log vr-server.log)..."

# 4. verify it is actually up
$okHttp = $false; $okHttps = $false
for ($i = 0; $i -lt 12; $i++) {
  Start-Sleep -Milliseconds 700
  $okHttp = Test-Port '127.0.0.1' 8000
  $okHttps = Test-Port '127.0.0.1' 8443
  if ($okHttp) { break }
}
if (-not $okHttp) {
  Write-Host "FAIL: HTTP 8000 not answering. Last log lines:" -ForegroundColor Red
  Get-Content $log -Tail 15 -ErrorAction SilentlyContinue
  exit 1
}
$page = Invoke-WebRequest 'http://localhost:8000' -UseBasicParsing -TimeoutSec 5
if ($page.Content -notmatch 'a-scene') { Write-Host "WARN: page served but looks wrong - check vr-server.log" -ForegroundColor Yellow }

# USB plan A: adb reverse so the Quest can use trusted http://localhost:8000
if ($USB) {
  $adb = Get-Command adb -ErrorAction SilentlyContinue
  if (-not $adb) {
    $adbPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
    if (Test-Path $adbPath) { $adb = $adbPath }
    elseif (Test-Path 'C:\Users\hi\bin\platform-tools\adb.exe') { $adb = 'C:\Users\hi\bin\platform-tools\adb.exe' }
  }
  if ($adb) {
    & $adb reverse tcp:8000 tcp:8000
    Write-Host "[USB] adb reverse OK -> Quest browser:  http://localhost:8000" -ForegroundColor Green
  } else {
    Write-Host "[USB] adb.exe not found - see TEST-CHECKLIST.md 'Plan A setup'." -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "READY - headset on" -ForegroundColor Green
$ipLine = ''
foreach ($candidate in @('192.168.7.109', '192.168.1.7')) {
  if (Test-Port $candidate 8443) { $ipLine = $candidate; break }
}
if (-not $ipLine) {
  $ipLine = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' } |
    Select-Object -First 1).IPAddress
}
if (-not $ipLine) { $ipLine = '(no-LAN-IP-found)' }
if ($okHttps) {
  Write-Host "  Wi-Fi (Plan B):  Quest browser -> https://${ipLine}:8443  -> ACCEPT CERT -> Enter VR"
}
Write-Host "  USB (Plan A):    Quest browser -> http://localhost:8000  -> Enter VR"
Write-Host "  Desktop preview: http://localhost:8000"
Write-Host "  Stop server:     powershell -File VR-TEST.ps1 -Stop"
Write-Host ""
Write-Host "Print/open TEST-CHECKLIST.md and follow it step by step." -ForegroundColor Cyan