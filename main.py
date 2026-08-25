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
if hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from server.data_manager import BASE_DIR, load_monsters, load_spells
from server.http_handler import PathMonsterDBRequestHandler

PORT = int(os.environ.get("PORT", 8000))
for idx_arg, arg in enumerate(sys.argv[1:], 1):
    if arg.isdigit():
        PORT = int(arg)
    elif arg.startswith('--port='):
        try:
            PORT = int(arg.split('=')[1])
        except ValueError:
            pass
    elif arg in ('--port', '-p') and idx_arg < len(sys.argv) - 1:
        try:
            PORT = int(sys.argv[idx_arg + 1])
        except ValueError:
            pass

HTTP_SERVER = None

def start_server(ready_event):
    global PORT, HTTP_SERVER
    os.chdir(BASE_DIR)
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer.daemon_threads = True
    
    for _ in range(20):
        try:
            HTTP_SERVER = socketserver.ThreadingTCPServer(("", PORT), PathMonsterDBRequestHandler)
            break
        except OSError:
            PORT += 1
            
    ready_event.set()
    if HTTP_SERVER:
        HTTP_SERVER.serve_forever()

if __name__ == "__main__":
    monsters = load_monsters()
    spells = load_spells()
    
    ready_event = threading.Event()
    server_thread = threading.Thread(target=start_server, args=(ready_event,), daemon=True)
    server_thread.start()
    ready_event.wait()
    
    if not HTTP_SERVER:
        print("[ERROR] Could not bind server to any available port. Exiting.")
        sys.exit(1)
        
    url = f"http://localhost:{PORT}"
    if "--no-browser" not in sys.argv and not os.environ.get("NO_BROWSER"):
        try:
            webbrowser.open(url)
        except Exception:
            pass
    
    official_count = len([m for m in monsters if not m.get('IsUserCustom')])
    custom_count = len([m for m in monsters if m.get('IsUserCustom')])
    print("=" * 60)
    print("  [PathMonsterDB] Pathfinder 1e Master Sheet Server")
    print(f"  Loaded: {len(monsters):,} Monsters ({official_count:,} Official | {custom_count:,} Custom) | {len(spells):,} Spells")
    print(f"  Server Running: {url}")
    print("=" * 60)
    print("  Press CTRL+C to stop.\n")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nServer is shutting down. Goodbye!")
        if HTTP_SERVER:
            try:
                HTTP_SERVER.shutdown()
                HTTP_SERVER.server_close()
            except Exception:
                pass