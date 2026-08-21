import os
import sys
import socketserver
import threading
import time
import webbrowser

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from server.data_manager import BASE_DIR, load_monsters, load_spells
from server.http_handler import PATHGMRequestHandler

PORT = int(os.environ.get("PORT", 8000))

def start_server(ready_event):
    global PORT
    os.chdir(BASE_DIR)
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer.daemon_threads = True
    
    httpd = None
    for _ in range(10):
        try:
            httpd = socketserver.ThreadingTCPServer(("", PORT), PATHGMRequestHandler)
            break
        except OSError:
            PORT += 1
            
    ready_event.set()
    if httpd:
        httpd.serve_forever()

if __name__ == "__main__":
    monsters = load_monsters()
    spells = load_spells()
    
    ready_event = threading.Event()
    server_thread = threading.Thread(target=start_server, args=(ready_event,), daemon=True)
    server_thread.start()
    ready_event.wait()
    
    url = f"http://localhost:{PORT}"
    try:
        webbrowser.open(url)
    except Exception:
        pass
    
    official_count = len([m for m in monsters if not m.get('IsUserCustom')])
    custom_count = len([m for m in monsters if m.get('IsUserCustom')])
    print("=" * 60)
    print("  [PATHGM] Pathfinder 1e Master Sheet Server")
    print(f"  Loaded: {len(monsters):,} Monsters ({official_count:,} Official | {custom_count:,} Custom) | {len(spells):,} Spells")
    print(f"  Server Running: {url}")
    print("=" * 60)
    print("  Press CTRL+C to stop.\n")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nServer is shutting down. Goodbye!")