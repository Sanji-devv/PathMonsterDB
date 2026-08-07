import http.server
import urllib.request
from urllib.parse import urlparse
from server.data_manager import (
    search_monsters,
    search_spells,
    get_scrape_status,
    save_monster_from_json,
    delete_monster,
    toggle_favorite
)

class PATHGMRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        if parsed_url.path == '/api/search':
            self._handle_search(parsed_url.query)
        elif parsed_url.path == '/api/spells':
            self._handle_spells(parsed_url.query)
        elif parsed_url.path == '/api/proxy':
            self._handle_proxy(parsed_url.query)
        elif parsed_url.path == '/api/scrape_status':
            self._handle_scrape_status()
        else:
            super().do_GET()

    def _handle_scrape_status(self):
        body = get_scrape_status()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(body)

    def _handle_proxy(self, query):
        from urllib.parse import parse_qs
        qs = parse_qs(query)
        target_url = qs.get('url', [''])[0]
        if not target_url:
            self.send_response(400)
            self.end_headers()
            return
            
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
                body, status_code = toggle_favorite(idx)
                self.send_response(status_code)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(body)
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
                body, status_code = delete_monster(idx)
                self.send_response(status_code)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(body)
            except ValueError:
                self.send_error(400, "Invalid index")
        else:
            self.send_error(404)

    def _handle_search(self, query_string):
        body = search_monsters(query_string)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _handle_save(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length)
            body = save_monster_from_json(raw)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            print("Error saving monster:", e)
            self.send_error(500, str(e))

    def _handle_spells(self, query_string):
        try:
            body, status_code = search_spells(query_string)
            if status_code != 200:
                self.send_error(status_code, "Spells data not found")
                return
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            print(f"Error handling spell search: {e}")
            self.send_response(500)
            self.end_headers()

    def log_message(self, format, *args):
        if args and len(args) >= 2 and str(args[1]) not in ('200', '304'):
            super().log_message(format, *args)
