import http.server
import socketserver
import webbrowser
import threading
import time
import os
import json
from urllib.parse import urlparse, parse_qs

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MONSTERS_FILE = os.path.join(BASE_DIR, 'data', 'monsters.json')
SPELLS_FILE = os.path.join(BASE_DIR, 'data', 'spells.json')

GLOBAL_MONSTERS = []
GLOBAL_SPELLS = []
SEARCH_CACHE = {}

def clear_cache():
    global SEARCH_CACHE
    SEARCH_CACHE.clear()

def parse_cr(cr_str):
    if not cr_str or cr_str == '-' or str(cr_str).lower() == 'any': 
        return -1.0
    try:
        s = str(cr_str).strip()
        if '/' in s:
            num, den = s.split('/')
            return float(num) / float(den)
        return float(s)
    except:
        return -1.0

def load_monsters():
    global GLOBAL_MONSTERS
    clear_cache()
    if not os.path.exists(MONSTERS_FILE):
        GLOBAL_MONSTERS = []
        return
    try:
        with open(MONSTERS_FILE, 'r', encoding='utf-8') as f:
            GLOBAL_MONSTERS = json.load(f)
            for m in GLOBAL_MONSTERS:
                m['_m_name'] = str(m.get('Name', '')).lower()
                m['_m_cr'] = str(m.get('CR', '')).lower()
                m['_m_type'] = str(m.get('Type', '')).lower()
                m['_m_align'] = str(m.get('Alignment', '')).lower()
                m['_m_env'] = str(m.get('Environment', '')).lower()
                m['_m_source'] = str(m.get('Source', '')).lower()
    except Exception as e:
        print(f"Error loading monsters.json: {e}")
        GLOBAL_MONSTERS = []

def load_spells():
    global GLOBAL_SPELLS
    if not os.path.exists(SPELLS_FILE):
        GLOBAL_SPELLS = []
        return
    try:
        with open(SPELLS_FILE, 'r', encoding='utf-8') as f:
            GLOBAL_SPELLS = json.load(f)
            for s in GLOBAL_SPELLS:
                s['_s_name'] = str(s.get('name', '')).lower().replace('-', ' ')
    except Exception as e:
        print(f"Error loading spells.json: {e}")
        GLOBAL_SPELLS = []

def save_monsters():
    try:
        with open(MONSTERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(GLOBAL_MONSTERS, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving monsters.json: {e}")

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        print("DEBUG:", parsed_url.path, parsed_url.query)
        if parsed_url.path == '/api/search':
            self._handle_search(parsed_url.query)
        elif parsed_url.path == '/api/spells':
            self._handle_spells(parsed_url.query)
        elif parsed_url.path == '/api/proxy':
            self._handle_proxy(parsed_url.query)
        else:
            super().do_GET()

    def _handle_proxy(self, query):
        qs = parse_qs(query)
        target_url = qs.get('url', [''])[0]
        if not target_url:
            self.send_response(400)
            self.end_headers()
            return
            
        import urllib.request
        try:
            req = urllib.request.Request(target_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                html = response.read().decode('utf-8', errors='ignore')
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                self.wfile.write(html.encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))

    def do_POST(self):
        parsed_url = urlparse(self.path)
        if parsed_url.path.startswith('/api/favorite/'):
            try:
                idx = int(parsed_url.path.split('/')[-1])
                self._handle_toggle_favorite(idx)
            except ValueError:
                self.send_error(400, "Invalid index")
        elif parsed_url.path == '/api/save':
            self._handle_save()
        else:
            self.send_error(404)

    def do_DELETE(self):
        if self.path.startswith('/api/delete/'):
            try:
                idx = int(self.path.split('/')[-1])
                self._handle_delete(idx)
            except ValueError:
                self.send_error(400, "Invalid index")
        else:
            self.send_error(404)

    def _handle_search(self, query_string):
        global GLOBAL_MONSTERS, SEARCH_CACHE

        if query_string in SEARCH_CACHE:
            body = SEARCH_CACHE[query_string]
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(body))
            self.end_headers()
            self.wfile.write(body)
            return

        params = parse_qs(query_string)
        
        name = params.get('name', [''])[0].lower()
        cr = params.get('cr', [''])[0].lower()
        mtype = params.get('type', [''])[0].lower()
        alignment = params.get('alignment', [''])[0].lower()
        environment = params.get('environment', [''])[0].lower()
        category = params.get('category', ['all'])[0].lower()
        
        page = int(params.get('page', ['1'])[0])
        per_page = int(params.get('per_page', ['50'])[0])
        
        filtered = []
        for i, m in enumerate(GLOBAL_MONSTERS):
            is_custom = m.get('IsUserCustom', False)
            is_npc = str(m.get('CharacterFlag', '0')) == '1'
            is_fav = m.get('IsFavorite', False)
            
            if category == 'favorites' and not is_fav:
                continue
            if category == 'official_monster' and (is_custom or is_npc):
                continue
            if category == 'official_npc' and (is_custom or not is_npc):
                continue
            if category == 'custom' and not is_custom:
                continue
            
            m_source = m.get('_m_source', '')
            if category == 'unique_monster' and m_source != 'd20pfsrd - unique monsters':
                continue
            if category == '3pp_monster':
                if 'tome of horrors' not in m_source and 'toh' not in m_source and 'misfit monsters' not in m_source:
                    continue
                
            m_name = m.get('_m_name', '')
            m_cr = m.get('_m_cr', '')
            m_type = m.get('_m_type', '')
            m_align = m.get('_m_align', '')
            m_env = m.get('_m_env', '')
            
            if name and name not in m_name:
                continue
            if cr and cr != "any" and cr != m_cr:
                continue
            if mtype and mtype != "any" and mtype not in m_type:
                continue
            if alignment and alignment != m_align:
                continue
            if environment and environment not in m_env:
                continue
                
            m['_global_index'] = i
            filtered.append(m)
            
        sort_by = params.get('sort', ['default'])[0].lower()
        if sort_by == 'default' or sort_by == 'name_asc':
            filtered.sort(key=lambda x: str(x.get('Name', '')).lower())
        elif sort_by == 'newest':
            filtered.reverse()
        elif sort_by == 'cr_desc':
            filtered.sort(key=lambda x: parse_cr(x.get('CR', '')), reverse=True)
        elif sort_by == 'cr_asc':
            filtered.sort(key=lambda x: parse_cr(x.get('CR', '')))
        elif sort_by == 'name_desc':
            filtered.sort(key=lambda x: str(x.get('Name', '')).lower(), reverse=True)
            
        total_count = len(filtered)
        start = (page - 1) * per_page
        end = start + per_page
        page_data = filtered[start:end]
        
        response = {
            "total_count": total_count,
            "page": page,
            "per_page": per_page,
            "data": page_data
        }
        
        body = json.dumps(response).encode('utf-8')
        SEARCH_CACHE[query_string] = body
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)

    def _handle_save(self):
        global GLOBAL_MONSTERS
        try:
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length)
            new_monster = json.loads(raw.decode('utf-8'))
            
            new_monster['IsUserCustom'] = True
            
            state = new_monster.get('OriginalState', new_monster)
            basic = state.get('basic', {})
            new_monster['Name'] = basic.get('in-name', 'Unnamed Monster')
            new_monster['CR'] = basic.get('in-cr', '?')
            new_monster['Type'] = basic.get('in-type', 'Unknown')
            new_monster['Alignment'] = basic.get('in-alignment', 'TN')
            new_monster['Size'] = basic.get('in-size', 'Medium')
            
            new_monster['_m_name'] = str(new_monster.get('Name', '')).lower()
            new_monster['_m_cr'] = str(new_monster.get('CR', '')).lower()
            new_monster['_m_type'] = str(new_monster.get('Type', '')).lower()
            new_monster['_m_align'] = str(new_monster.get('Alignment', '')).lower()
            new_monster['_m_env'] = str(new_monster.get('Environment', '')).lower()
            new_monster['_m_source'] = str(new_monster.get('Source', '')).lower()
            
            GLOBAL_MONSTERS.append(new_monster)
            save_monsters()
            clear_cache()
            
            body = json.dumps({"status": "ok"}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(body))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            self.send_error(500, str(e))

    def _handle_delete(self, idx):
        global GLOBAL_MONSTERS
        try:
            if 0 <= idx < len(GLOBAL_MONSTERS):
                if GLOBAL_MONSTERS[idx].get('IsUserCustom', False):
                    GLOBAL_MONSTERS.pop(idx)
                    save_monsters()
                    clear_cache()
                    body = json.dumps({"status": "ok"}).encode('utf-8')
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Content-Length', len(body))
                    self.end_headers()
                    self.wfile.write(body)
                else:
                    self.send_error(403, "Cannot delete official monsters")
            else:
                self.send_error(404, "Monster not found")
        except Exception as e:
            self.send_error(500, str(e))

    def _handle_toggle_favorite(self, idx):
        if 0 <= idx < len(GLOBAL_MONSTERS):
            m = GLOBAL_MONSTERS[idx]
            current_fav = m.get('IsFavorite', False)
            m['IsFavorite'] = not current_fav
            save_monsters()
            clear_cache()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {"status": "success", "is_favorite": not current_fav}
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.send_error(404, "Monster not found")

    def _handle_spells(self, query_string):
        try:
            global GLOBAL_SPELLS
            if not GLOBAL_SPELLS:
                self.send_error(404, "spells data not loaded")
                return
            
            params = parse_qs(query_string)
            name_query = params.get('name', [''])[0].lower().replace('-', ' ')
                
            exact_match = [s for s in GLOBAL_SPELLS if name_query == s.get('_s_name', '')]
            filtered = exact_match if exact_match else [s for s in GLOBAL_SPELLS if name_query in s.get('_s_name', '')]
            
            body = json.dumps(filtered).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(body))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            print(f"Error handling spell search: {e}")
            self.send_response(500)
            self.end_headers()

    def log_message(self, format, *args):
        if args and len(args) >= 2 and str(args[1]) not in ('200', '304'):
            super().log_message(format, *args)


def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    
    global PORT
    for _ in range(10):
        try:
            httpd = socketserver.TCPServer(("", PORT), Handler)
            break
        except OSError:
            PORT += 1
            
    print(f"Local server started: http://localhost:{PORT}")
    httpd.serve_forever()

if __name__ == "__main__":
    print("Pathfinder 1e Monster Creator is starting...")
    print("Loading monster database into memory... This might take a few seconds.")
    load_monsters()
    print(f"Loaded {len(GLOBAL_MONSTERS)} monsters.")
    print("Loading spell database into memory...")
    load_spells()
    print(f"Loaded {len(GLOBAL_SPELLS)} spells.")
    
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    time.sleep(0.5)
    
    url = f"http://localhost:{PORT}"
    print(f"Opening browser: {url}")
    webbrowser.open(url)
    
    print("\nServer is running. Press CTRL+C in this window to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nServer is shutting down. Goodbye!")
