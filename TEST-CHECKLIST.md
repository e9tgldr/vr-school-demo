# Quest 3 VR test — fail-safe checklist

Print this or keep it open on your phone. Total time: ~5 minutes.
The server must show "READY" in VR-TEST.ps1 before you put the headset on.

---

## BEFORE (on the laptop, once)

1. Double-click nothing — run this:
   `powershell -ExecutionPolicy Bypass -File VR-TEST.ps1`
   Wait for green **READY**. Do not close the PowerShell window is fine —
   the server survives even if you close it (it runs detached).
2. Desktop sanity check: open `http://localhost:8000` in Chrome/Edge.
   You must see the 3D lab. If yes, laptop side is 100% done.

## PLAN A — USB cable (most reliable, no certificate step)

One-time setup (do it now, before the test day):
- On the Quest: Settings → System → Developer → turn ON **USB debugging**
  (Quest asks you to allow it from the headset itself).
- Install adb (one-time): download "platform-tools" from
  https://developer.android.com/tools/releases/platform-tools , unzip to
  `C:\Users\hi\bin\platform-tools`, then run
  `VR-TEST.ps1 -USB` — it will find adb there automatically.

Test-day flow:
1. Connect Quest → laptop with a USB-C cable.
2. Put the headset on. A popup asks "Allow USB debugging" → **Allow**.
3. On the laptop run: `powershell -ExecutionPolicy Bypass -File VR-TEST.ps1 -USB`
4. In the Quest browser open:  **http://localhost:8000**
5. Click **Enter VR** (bottom right). Done.

Why this always works: `localhost` is a secure context even over plain HTTP,
so the VR button enables with zero certificate steps.

## PLAN B — Wi-Fi (no cable, one extra step: accept the cert)

1. Quest must be on the SAME Wi-Fi as the laptop (laptop Wi-Fi IP is 192.168.7.109 —
   if VR-TEST printed a different IP, use the printed one).
2. In the Quest browser open the **https://…:8443** address printed by VR-TEST.ps1.
3. The browser shows a big warning ("Your connection is not private") —
   this is EXPECTED (self-signed cert). Tap **Advanced** → **Proceed anyway**.
4. Now click **Enter VR**.
5. If "Enter VR" never appears: in Quest browser settings → Site settings →
   find the site → allow **Immersive sessions**, then reload the page.

## IN VR (once you're in)

| Want to… | Do this |
|---|---|
| Point / press things | Hold trigger, aim the laser at a monitor |
| Turn a red PC back to duty | Laser at its monitor → trigger |
| Clear ALL violations | Laser at the wall dashboard → trigger |
| Move | Point at a green floor ring → trigger (comfort fade included) |
| Look around | Just turn your head |

Demo story for the principal: 1 PC starts red (violation), 1 yellow (hand raised),
dashboard counts live. Show a violation, then click it away = vr-guardian working.

## IF SOMETHING FAILS

| Symptom | Fix |
|---|---|
| VR-TEST says FAIL: HTTP 8000 | Re-run `VR-TEST.ps1` (it kills stale servers first). Check `vr-server.log`. |
| "Enter VR" button missing | You're on http://LAN-IP (not localhost, not https). Use Plan A or B. |
| Clicked Enter VR, nothing happens | Headset popup for WebXR permission was dismissed → reload page, click again, allow. |
| Wi-Fi cert page loops | Use Plan A (USB). Cert also auto-renews if you just re-run VR-TEST.ps1. |
| Everything broke | Reboot laptop, re-run `VR-TEST.ps1`. The demo is 100% offline — no internet needed. |
| Server stopped mid-demo | Run `VR-TEST.ps1` again; refresh the browser page in the Quest (library → reload). |

## STOP / CLEANUP

`powershell -ExecutionPolicy Bypass -File VR-TEST.ps1 -Stop`