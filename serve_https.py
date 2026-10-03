# vr-school-demo fail-safe server.
#   - HTTPS on 0.0.0.0:8443 (self-signed cert from certs/make_cert.py)
#     -> headset browser over Wi-Fi, "Enter VR" available after trusting the cert
#   - HTTP on 0.0.0.0:8000  -> desktop preview + USB adb (http://localhost:8000)
# If certs are missing/broken, HTTPS is skipped and HTTP still serves (fail-safe).
# If a port is taken, the next port (8443..8449 / 8000..8005) is used and the
# real URLs are printed. Ctrl+C stops both.
import os
import ssl
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
CERT_DIR = os.path.join(ROOT, "certs")
CERT_FILE = os.path.join(CERT_DIR, "cert.pem")
KEY_FILE = os.path.join(CERT_DIR, "cert.key")
PORTS_HTTPS = list(range(8443, 8450))
PORTS_HTTP = list(range(8000, 8006))


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):  # keep the console readable
        pass

    def end_headers(self):
        # never cache during a demo — edits show up on refresh
        self.send_header("Cache-Control", "no-store")
        SimpleHTTPRequestHandler.end_headers(self)


def make_server(port, handler):
    return ThreadingHTTPServer(("0.0.0.0", port), handler)


def start_https():
    if not (os.path.exists(CERT_FILE) and os.path.exists(KEY_FILE)):
        print("[HTTPS] SKIPPED — no cert (run certs/make_cert.py). HTTP still works.")
        return None
    try:
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(CERT_FILE, KEY_FILE)
    except Exception as exc:
        print("[HTTPS] SKIPPED — cert load failed: %r. HTTP still works." % exc)
        return None
    handler = partial(QuietHandler, directory=ROOT)
    for port in PORTS_HTTPS:
        try:
            srv = make_server(port, handler)
        except OSError:
            print("[HTTPS] port %d busy, trying next..." % port)
            continue
        srv.socket = ctx.wrap_socket(srv.socket, server_side=True)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        print("[HTTPS] serving ->  https://%s:%d  (and https://localhost:%d)" % (MY_IP, port, port))
        return srv
    print("[HTTPS] all ports 8443-8449 busy — HTTPS disabled, HTTP still works.")
    return None


def start_http():
    handler = partial(QuietHandler, directory=ROOT)
    for port in PORTS_HTTP:
        try:
            srv = make_server(port, handler)
        except OSError:
            print("[HTTP]  port %d busy, trying next..." % port)
            continue
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        print("[HTTP]  serving ->  http://%s:%d   (desktop + USB adb)" % (MY_IP, port))
        return srv
    print("[HTTP] all ports 8000-8005 busy — nothing left to try.")
    return None


def pick_ip():
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
        finally:
            s.close()
    except Exception:
        return "127.0.0.1"


if __name__ == "__main__":
    MY_IP = pick_ip()
    print("=" * 62)
    print(" vr-school-demo server  (Ctrl+C to stop)")
    print("=" * 62)
    start_https()
    http_srv = start_http()
    if not http_srv:
        print("FATAL: could not bind any HTTP port.")
        sys.exit(1)
    print("-" * 62)
    print(" Quest (Wi-Fi):   open https://%s:8443  -> accept cert -> Enter VR" % MY_IP)
    print(" Quest (USB):     adb reverse tcp:8000 tcp:8000 -> http://localhost:8000")
    print(" Desktop preview: http://localhost:8000")
    print("=" * 62)
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        print("\nServer stopped.")