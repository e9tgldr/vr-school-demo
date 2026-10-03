# vr-school-demo — STATUS (updated 2026-09-18: real Quest test session started)

PIVOT 2026-09-18 evening: the FUNCTIONAL vr-guardian demo (student VR app +
teacher laptop dashboard with live app restriction) now lives in
C:\Users\hi\Documents\vr-student-app\ — see its STATUS.md. This 3D lab scene
stays as the separate pitch visual. Its server was stopped (port 8000 now
serves vr-student-app); this project's VR-FAILSAFE watch daemon was stopped
too (it was auto-resurrecting the old server and stealing the port).

2026-09-18 network change (2nd): laptop Wi-Fi joined "Indra_Teacher" (the
teacher net) → IP 192.168.5.243. VR-TEST.ps1 re-ran, cert now covers
192.168.5.243 + localhost (exp 2028-12-21). Correct headset URL:
https://192.168.5.243:8443 . The launcher's printed "Plan B" 192.168.1.7 is
the Ethernet IP — IGNORE it; Quest must use the Wi-Fi IP. (Morning was:
Wi-Fi 192.168.7.12 / cert .7.12 — older still.)

Where the project stands when you come back. Everything below is verified.

## NEW SINCE 2026-09-11: user HAS a Meta Quest 3 — VR test kit built & verified

- `VR-FAILSAFE.ps1` (added 2026-09-18) — USB fail-safe: no-args = fix+verify
  (starts server if down under firewall-covered python, waits for Quest,
  re-applies adb reverse), `-Check` = status only, `-Watch` = keep-alive
  daemon (auto-heals server + tunnel every 5 s, logs vr-failsafe.log),
  `-StopWatch` = stop daemon. adb IS installed now at
  C:\Users\hi\bin\platform-tools (v37.0.1). USB route verified end-to-end
  2026-09-18: server UP + quest ok + tunnel YES.
- `VR-TEST.ps1` — one-stop fail-safe launcher (kills OUR stale servers only,
  self-renews cert, starts detached `serve_https.py`, TCP-verifies 8000+8443,
  prints the Quest URLs). `-USB` runs adb reverse; `-Stop` kills the server.
- `serve_https.py` — HTTPS :8443 (self-signed, TLS 1.3 verified) + HTTP :8000
  on 0.0.0.0; auto port-fallback 8443-8449 / 8000-8005; if certs break it
  degrades to HTTP-only so the desktop demo ALWAYS works.
- `certs/make_cert.py` — self-renewing cert (reused when valid & IPs match;
  regenerated on expiry/IP change). Covers Wi-Fi IP 192.168.7.109 + localhost,
  expires 2028-12-18. Laptop Ethernet 192.168.1.7 appears media-disconnected —
  Wi-Fi is the live path; rerun VR-TEST.ps1 after any network change.
- `TEST-CHECKLIST.md` — printable Quest steps: Plan A USB (adb reverse →
  http://localhost:8000, no cert steps; adb NOT yet installed) / Plan B Wi-Fi
  (https://IP:8443 → accept cert warning → Enter VR).
- Scene hardening (verified by headless file:// screenshot 2026-09-15):
  desktop cursor auto-hides in VR (lasers take over), teleport = comfort fade
  (~300 ms black dip), fatal-error banner + 12 s load watchdog, double-build
  guard. End-to-end run verified: HTTP 200 + TLS handshake OK.

## HOW TO RUN

- Desktop preview: double-click index.html, or serve.ps1 → localhost:8000
- VR test: `powershell -ExecutionPolicy Bypass -File VR-TEST.ps1`
  (follow TEST-CHECKLIST.md)

## WORKING NOW (verified by headless-browser screenshots)

- TEACHER PANEL v2 (2026-09-18 evening): small ПАНЕЛЬ button on the LEFT
  wrist summons a big floating panel (id teacher-panel) locked ~1 m in front
  of the face — child of #camera, position 0 -0.1 -1.05. Board 0.88x0.75,
  8 seat chips (4 cols x 2 rows, lab has 8 desks x 1 PC — "16 PCs" in old
  notes was wrong), chip 0.17x0.125, live #tp-viol count, ЦЭВЭРЛЭХ clears
  all, X closes. Wrist button toggles; X closes; both VR-only (syncCursor →
  syncTeacherUI hides everything on desktop). panelOpen state var.

- 3D computer lab: room, ceiling lights, 2 rows × 4 desks, chairs, monitors.
- 16 PCs with 3 states: duty (blue) / hand raised (yellow) / violation (red).
- Desk status dots (blinking) + floating Mongolian labels above each PC.
- Wall dashboard: "vr-guardian: ACTIVE" / "ХАРИУЦЛАГА ШААРДЛАТАЙ",
  violation counter, pulse dot — live-updates on every toggle.
- Click a red monitor → back to duty; click the dashboard → clear all.
- Teleport pads (green rings, clickable) + WASD + mouse-look.
- VR button (bottom-right) shows in any WebXR browser.
- Desktop preview works even by double-clicking index.html (canvas labels
  need no server; file:// XHR restrictions don't apply to them).

## HOW TO RUN

- Double-click index.html, or
- `powershell -ExecutionPolicy Bypass -File serve.ps1` → http://localhost:8000

## HOW IT WAS VERIFIED (latest)

- 2026-09-15: VR-TEST.ps1 full run → READY; HTTP 200; TLS 1.3 handshake OK.
- 2026-09-15: headless file:// screenshot after scene edits — scene, labels,
  dashboard, Enter VR button, visible desktop cursor, no error banner.
- `node --check app.js` → exit 0. `py_compile` both python files → OK.

## GOTCHAS DISCOVERED (do not re-fight these)

1. A-Frame's registry fonts (Roboto-msdf, DejaVu-sdf) are ASCII-only (95
   chars) — NO Cyrillic. That's why text is canvas-drawn now. Deleted
   Roboto/DejaVu files on purpose.
2. A-Frame text picks the MSDF shader only if the font string contains
   "-msdf."; solid colored blocks = SDF shader on an MSDF atlas.
3. file:// blocks font/asset XHRs — fine since canvas labels need none.
4. The headless screenshot tool goes through the system proxy, which is
   currently dead (ERR_PROXY_CONNECTION_FAILED) — it CANNOT reach
   http://127.0.0.1. Verify via file:// paths instead.
5. A-Frame 1.7.0 a-text `width` etc. fine, but for any new labels use the
   `canvas-label` component in app.js (value/color/width/align/px).
6. PowerShell 5.1 parses BOM-less UTF-8 .ps1 as ANSI — em-dashes break the
   parser. Keep VR-TEST.ps1 ASCII-only (rewritten 2026-09-15 after this bit).
7. `python serve_https.py` run detached buffers stdout — VR-TEST.ps1 does NOT
   parse the log for the Quest URL; it probes ports directly instead.
8. Cert reuse check compares SAN IP strings; IPv4Address vs string set
   mismatch was fixed in make_cert.py (cert_covers).
9. Firewall gotcha (2026-09-18): existing "python.exe" Allow rules (Public)
   are pinned to uv path cpython-3.11.15-windows-x86_64-none\python.exe, but
   the default `python` resolves to cpython-3.11-windows-x86_64-none (no
   .15) — exact-path mismatch → silent inbound block → Quest "can't be
   reached" on same Wi-Fi. FIX: launch serve_https.py with the .15.15 python
   explicitly (no admin needed). Port-based rules (8000-8005/8443-8449 Any)
   via elevated PowerShell were attempted but UAC was never approved.
   Laptop Wi-Fi at school = Indra_Teacher (Public), IP 192.168.5.243.
10. file:// masks script errors as "Script error." with no details — to get
    the real message + line, inline app.js into a copy of index.html and
    load that (fatal banner now prints e.message + file:line). Also PS 5.1
    Get-Content -Raw corrupts BOM-less UTF-8 Cyrillic when inlining — test
    copy only shows mojibake text, fine for layout checks, not text checks.

## NEXT STEPS (when you return)

- [x] 2026-09-18 REAL QUEST TEST: PASSED. USB route (adb reverse, platform-tools
      installed at C:\Users\hi\bin\platform-tools), keep-alive daemon
      (VR-FAILSAFE.ps1 -Watch) running; user reports scene "normal" in-headset.
      First verified in-VR run of the demo.
- [x] 2026-09-18 polish round DONE (verified by headless file:// screenshots):
      floating labels smaller (width 1.3), school sign "МАЖИЛ КИБЕР +
      vr-guardian сургалтын лаб" centered above the dashboard (keep everything
      above y=3.4 — the dashboard box top edge is 3.35 and occludes lower
      text), ambient hum (ambience.wav, seamless 4 s loop, generated by
      _gen_amb.py — all tone freqs are integer multiples of 1/dur; a-sound
      autoplay + app.js kickAmbience on first click/enter-vr for Quest
      autoplay policy). Quest side needs a page RELOAD to see these.
- [ ] Hook the dashboard to the REAL vr-guardian hub later (fetch
      http://192.168.1.6 status) — nice-to-have, not needed for pitch.
- [ ] For the principal demo: keep this page open on the lab PC before
      the pitch; WASD + click tells the story.
