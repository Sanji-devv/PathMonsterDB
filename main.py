import os
import socketserver
import threading
import time
import webbrowser
from server.data_manager import BASE_DIR, load_monsters, load_spells
from server.http_handler import PATHGMRequestHandler

PORT = 8000

def start_server():
    global PORT
    os.chdir(BASE_DIR)
    socketserver.TCPServer.allow_reuse_address = True
    
    httpd = None
    for _ in range(10):
        try:
            httpd = socketserver.TCPServer(("", PORT), PATHGMRequestHandler)
            break
        except OSError:
            PORT += 1
            
    if httpd:
        httpd.serve_forever()

if __name__ == "__main__":
    monsters = load_monsters()
    spells = load_spells()
    
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    time.sleep(0.5)
    url = f"http://localhost:{PORT}"
    webbrowser.open(url)
    
    print("=" * 60)
    print("  🗡️  Pathfinder 1e Master Sheet (PATHGM) Server")
    print(f"  📊 Loaded: {len(monsters):,} Monsters | {len(spells):,} Spells")
    print(f"  🚀 Server Running: {url}")
    print("=" * 60)
    print("  Press CTRL+C to stop.\n")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nServer is shutting down. Goodbye!")