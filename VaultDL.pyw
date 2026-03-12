import sys
import os
import threading
import time
import urllib.request
import subprocess
import socket
import webbrowser

# Fix for .pyw / frozen exe: sys.stdout and sys.stderr are None,
# which crashes uvicorn's logger (calls sys.stderr.isatty()).
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")

# Handle both normal (.pyw) and PyInstaller bundled (.exe) modes
if getattr(sys, 'frozen', False):
    base_dir = sys._MEIPASS
else:
    base_dir = os.path.dirname(os.path.abspath(__file__))

backend_dir = os.path.join(base_dir, 'backend')
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from main import app
import uvicorn

PORT = 8000

def find_free_port(preferred):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("127.0.0.1", preferred))
            return preferred
        except OSError:
            s.bind(("127.0.0.1", 0))
            return s.getsockname()[1]

def wait_for_server(url, timeout=60):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            pass
        time.sleep(0.5)
    return False

def find_chrome_or_edge():
    candidates = [
        os.path.join(os.environ.get("LOCALAPPDATA", ""),      "Google", "Chrome", "Application", "chrome.exe"),
        os.path.join(os.environ.get("PROGRAMFILES", ""),      "Google", "Chrome", "Application", "chrome.exe"),
        os.path.join(os.environ.get("PROGRAMFILES(X86)", ""), "Google", "Chrome", "Application", "chrome.exe"),
        os.path.join(os.environ.get("PROGRAMFILES(X86)", ""), "Microsoft", "Edge", "Application", "msedge.exe"),
        os.path.join(os.environ.get("PROGRAMFILES", ""),      "Microsoft", "Edge", "Application", "msedge.exe"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None

if __name__ == "__main__":
    port = find_free_port(PORT)
    url = f"http://localhost:{port}/"

    # 1. Start uvicorn — this call BLOCKS (not daemon), keeps the process alive
    #    We open the browser right before starting the blocking server.
    server = uvicorn.Server(uvicorn.Config(app=app, host="127.0.0.1", port=port, log_level="error"))

    # 2. Start server in a thread just long enough to wait for it
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()

    # 3. Wait for server to be ready
    if not wait_for_server(url):
        sys.exit(1)

    # 4. Open browser — use --app mode for clean look, fallback to default browser
    browser = find_chrome_or_edge()
    if browser:
        subprocess.Popen([browser, f"--app={url}"])
    else:
        webbrowser.open(url)

    # 5. Keep the process alive as long as the server is running
    #    The exe stays in the system tray / task manager.
    #    User can close it via Task Manager, or we shut down when the server stops.
    thread.join()
