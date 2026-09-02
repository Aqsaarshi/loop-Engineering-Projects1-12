import http.server
import socketserver
import json
import os
from datetime import datetime

LOG_FILE = "approval.log"
BEARER_TOKEN = "GATE-KEY-12345"
PORT = 5000

# Create log file if it doesn't exist
if not os.path.exists(LOG_FILE):
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.write("approval log initialized\n")

class GatedHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        # Check path
        if self.path != "/approve":
            self.send_response(404)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "not found"}).encode())
            return

        # Check bearer token
        auth = self.headers.get("Authorization", "")
        if auth != f"Bearer {BEARER_TOKEN}":
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "invalid token"}).encode())
            return

        # Perform small reversible action: append to log
        timestamp = datetime.now().isoformat()
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"{timestamp}: approved\n")

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "approved", "logged": timestamp}).encode())

    def log_message(self, format, *args):
        # Suppress default logging to keep stdout clean
        pass

with socketserver.TCPServer(("", PORT), GatedHandler) as httpd:
    print(f"Routine B server listening on http://localhost:{PORT}/approve")
    print(f"Bearer token: {BEARER_TOKEN}")
    print("Store this as: $env:B_TOKEN = 'GATE-KEY-12345'")
    httpd.serve_forever()