# vr-guardian 3D lab simulator (offline)

Single-folder A-Frame WebXR demo of the Мажил Кибер computer lab.
100% offline — aframe.min.js is local, and all text is drawn to canvas
textures (system font "Segoe UI"), so Mongolian Cyrillic works and there
are no font files or XHRs to fail.

## Run (desktop preview, no headset needed)

Easiest: double-click `index.html`.

Or with a local server (recommended, cleaner console):

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Open http://localhost:8000 — click and drag to look, WASD to walk.

## Controls

| Action | Desktop | VR headset |
|---|---|---|
| Look | drag mouse | head tracking |
| Walk | WASD | teleport pads (green rings, laser-point + trigger) |
| Toggle a PC duty/violation | click the monitor | laser-point + trigger |
| Clear all violations | click the wall dashboard | laser-point + trigger |

## Demo story

1 PC starts red (violation) and one yellow (raised hand). The wall
dashboard counts violations. Click the red PC's monitor to switch it back
to duty, or click the dashboard to clear everything at once.

## VR test (Quest 3 or any WebXR headset)

One-stop fail-safe launcher:

```powershell
powershell -ExecutionPolicy Bypass -File VR-TEST.ps1        # Wi-Fi route
powershell -ExecutionPolicy Bypass -File VR-TEST.ps1 -USB   # after adb is installed
powershell -ExecutionPolicy Bypass -File VR-TEST.ps1 -Stop  # stop server
```

It kills stale demo servers, self-renews the HTTPS cert (`certs/make_cert.py`),
starts a detached fail-safe server (`serve_https.py`: HTTPS :8443 + HTTP :8000,
auto port fallback, HTTP-only fallback if certs break), verifies both ports,
then prints the exact Quest steps. Step-by-step headset instructions and
troubleshooting: `TEST-CHECKLIST.md`.

- Plan A (USB, most reliable): `adb reverse tcp:8000 tcp:8000` → the Quest
  browser opens `http://localhost:8000` — localhost is a secure context, so
  **Enter VR** works with zero certificate steps.
- Plan B (Wi-Fi): Quest browser → `https://<laptop-IP>:8443` → accept the
  self-signed cert warning → **Enter VR**. WebXR needs a secure context, so
  plain `http://<LAN-IP>` will NOT show the VR button.

## Files

- `index.html` — scene markup (room, dashboard, teleport pads, rig, error banner)
- `app.js` — `canvas-label` component (Unicode text → canvas texture),
  16 student PCs, duty/hand/violation state machine, click handling,
  VR cursor sync, comfort-fade teleport
- `aframe.min.js` — A-Frame 1.7.0 runtime (local copy)
- `serve.ps1` — plain desktop server on port 8000
- `VR-TEST.ps1` — one-stop fail-safe VR test launcher (-USB / -Stop)
- `serve_https.py` — HTTPS :8443 + HTTP :8000 static server (fail-safe)
- `certs/make_cert.py` — self-renewing self-signed HTTPS cert (pure local)
- `TEST-CHECKLIST.md` — printable Quest test steps + troubleshooting
- `STATUS.md` — where the project stands + next steps