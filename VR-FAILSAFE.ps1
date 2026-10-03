# VR-FAILSAFE.ps1 - vr-school-demo USB fail-safe (ASCII only, PS 5.1 safe)
#
# Modes:
#   (no args)   Fix + verify: start server if down, wait for Quest, set tunnel
#   -Check      Status only: report all three legs, change nothing
#   -Watch      Keep-alive daemon: auto-heal every 5 s until stopped
#   -StopWatch  Stop the keep-alive daemon
#
# Quest browser URL (USB route): http://localhost:8000  ->  Enter VR

param(
    [switch]$Check,
    [switch]$Watch,
    [switch]$StopWatch
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$adb  = 'C:\Users\hi\bin\platform-tools\adb.exe'
$py   = 'C:\Users\hi\AppData\Roaming\uv\python\cpython-3.11.15-windows-x86_64-none\python.exe'
$PidFile  = Join-Path $env:TEMP 'vr-failsafe-watch.pid'
$LogFile  = Join-Path $Root 'vr-failsafe.log'

function Test-Server {
    return [bool](Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue)
}

function Test-Device {
    if (-not (Test-Path $adb)) { return 'no-adb' }
    $out = & $adb devices 2>$null
    if ($out -match '\tdevice$')       { return 'ok' }
    if ($out -match '\tunauthorized$') { return 'unauthorized' }
    return 'none'
}

function Test-Tunnel {
    if (-not (Test-Path $adb)) { return $false }
    $out = & $adb reverse --list 2>$null
    return [bool]($out -match 'tcp:8000')
}

function Start-ServerIfDown {
    if (Test-Server) { return $true }
    Write-Host '[fix] server down - starting under firewall-covered python...'
    Start-Process -FilePath $py -ArgumentList 'serve_https.py' -WorkingDirectory $Root `
        -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $Root 'vr-server.log') `
        -RedirectStandardError  (Join-Path $Root 'vr-server.err.log')
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Server) { Write-Host '[fix] server UP (port 8000)'; return $true }
    }
    Write-Host '[!!] server FAILED to start - check vr-server.err.log'
    return $false
}

function Get-Status {
    $s = Test-Server
    $d = Test-Device
    $t = if ($d -eq 'ok') { Test-Tunnel } else { $false }
    return @{ Server = $s; Device = $d; Tunnel = $t }
}

function Show-Status {
    $st = Get-Status
    $srv = 'DOWN '; if ($st.Server) { $srv = 'UP   ' }
    $tun = 'no  '; if ($st.Tunnel) { $tun = 'YES ' }
    Write-Host ("  server : {0} (port 8000)"      -f $srv)
    Write-Host ("  Quest  : {0}"                 -f $st.Device)
    Write-Host ("  tunnel : {0} (adb reverse)"   -f $tun)
    return $st
}

function Repair {
    $st = Get-Status
    if (-not $st.Server) {
        if (-not (Start-ServerIfDown)) { return $false }
    }
    if ($st.Device -eq 'unauthorized') {
        Write-Host '[!!] Quest is UNAUTHORIZED - put the headset on, accept "Allow USB debugging?" (tick Always allow)'
        return $false
    }
    if ($st.Device -ne 'ok') {
        Write-Host '[!!] No Quest on USB - plug in the DATA cable (charge-only cables will not work)'
        return $false
    }
    if (-not $st.Tunnel) {
        & $adb reverse tcp:8000 tcp:8000 2>$null
        if (Test-Tunnel) { Write-Host '[fix] adb reverse re-established' }
        else { Write-Host '[!!] adb reverse FAILED - try: unplug/replug the cable'; return $false }
    }
    Write-Host ''
    Write-Host '[READY] On the Quest browser:  http://localhost:8000  ->  Enter VR'
    return $true
}

# ---- mode: stop watch daemon -------------------------------------------------
if ($StopWatch) {
    if (Test-Path $PidFile) {
        $old = Get-Content $PidFile -ErrorAction SilentlyContinue
        if ($old) { Stop-Process -Id $old -Force -ErrorAction SilentlyContinue }
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
        Write-Host "[watch] keep-alive daemon stopped (pid $old)"
    } else {
        Write-Host '[watch] no keep-alive daemon running'
    }
    exit 0
}

# ---- mode: check -------------------------------------------------------------
if ($Check) {
    Write-Host '=== vr-school-demo USB status ==='
    $st = Show-Status
    if ($st.Server -and $st.Device -eq 'ok' -and $st.Tunnel) { exit 0 }
    exit 1
}

# ---- mode: watch daemon ------------------------------------------------------
if ($Watch) {
    "watch start $(Get-Date -Format s)" | Add-Content $LogFile
    $prev = ''
    while ($true) {
        $st = Get-Status
        $state = "{0}|{1}|{2}" -f $st.Server, $st.Device, $st.Tunnel
        if ($state -ne $prev) {
            "state: server=$($st.Server) quest=$($st.Device) tunnel=$($st.Tunnel) $(Get-Date -Format s)" | Add-Content $LogFile
            $prev = $state
        }
        if (-not $st.Server) {
            [void](Start-ServerIfDown)
            "healed: server restarted $(Get-Date -Format s)" | Add-Content $LogFile
        }
        if ($st.Device -eq 'ok' -and -not $st.Tunnel) {
            & $adb reverse tcp:8000 tcp:8000 2>$null
            "healed: adb reverse re-set $(Get-Date -Format s)" | Add-Content $LogFile
        }
        Start-Sleep -Seconds 5
    }
    exit 0
}

# ---- default mode: fix + verify ----------------------------------------------
Write-Host '=== vr-school-demo USB fail-safe ==='
$ok = Repair
Write-Host ''
Write-Host '--- current status ---'
[void](Show-Status)
if ($ok) { exit 0 } else { exit 1 }
