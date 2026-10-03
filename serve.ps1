# Serves the vr-school-demo folder on http://localhost:8000
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "vr-guardian 3D lab demo -> http://localhost:8000  (Ctrl+C to stop)"
Write-Host ""
try {
  # -StaticContentTtl 0 and DisableDirListing are skipped for PS 5.1 compatibility
  python -m http.server 8000 --bind 127.0.0.1 --directory $dir
} finally {
  Write-Host "Server stopped."
}