import http.server
import json
import urllib.request
from urllib.parse import urlparse, parse_qs
from server.data_manager import (
    BASE_DIR,
    search_monsters,
    search_spells,
    get_scrape_status,
    save_monster_from_json,
    delete_monster,
    toggle_favorite,
    export_monsters_dataset,
    import_monsters_from_json,
    get_user_folders,
    create_or_update_folder,
    delete_folder,
    add_monster_to_folder,
    remove_monster_from_folder,
    get_folder_monsters
)
from server.auth import (
    register_user,
    login_user,
    logout_user,
    get_user_by_token,
    get_authenticated_user_from_headers
)

class PathMonsterDBRequestHandler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.html': 'text/html; charset=utf-8',
    }

    def address_string(self):
        # Avoid slow reverse DNS lookup on Windows
        return str(self.client_address[0])

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Content-Length', '0')
        self.end_headers()

    def _send_redirect(self, location, status_code=302):
        self.send_response(status_code)
        self.send_header('Location', location)
        self.send_header('Content-Length', '0')
        self.end_headers()

    def _send_json(self, data, status_code=200):
        if isinstance(data, (dict, list)):
            body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        elif isinstance(data, str):
            body = data.encode('utf-8')
        else:
            body = data
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        self.wfile.flush()

    def do_GET(self):
        try:
            parsed_url = urlparse(self.path)
            if parsed_url.path in ('', '/'):
                cookie_header = self.headers.get('Cookie', '')
                last_page = '/html/index.html'
                if 'pathgm_last_page=' in cookie_header:
                    for c in cookie_header.split(';'):
                        parts = c.strip().split('=')
                        if len(parts) == 2 and parts[0] == 'pathgm_last_page':
                            val = parts[1].strip()
                            if val in ('/html/index.html', '/html/database.html', 'index.html', 'database.html'):
                                last_page = val if val.startswith('/html/') else f'/html/{val}'
                                break
                self._send_redirect(last_page)
                return
            elif parsed_url.path == '/index.html':
                self._send_redirect('/html/index.html')
                return
            elif parsed_url.path == '/database.html':
                self._send_redirect('/html/database.html')
                return
            elif parsed_url.path in ('/style.css', '/themes.css'):
                self._send_redirect(f'/css{parsed_url.path}')
                return
            elif parsed_url.path.startswith('/html/data/'):
                self._send_redirect(parsed_url.path.replace('/html/data/', '/data/'))
                return
            elif parsed_url.path in ('/script.js', '/database.js'):
                self._send_redirect(f'/js{parsed_url.path}')
                return
            elif parsed_url.path == '/api/search':
                self._handle_search(parsed_url.query)
            elif parsed_url.path == '/api/spells':
                self._handle_spells(parsed_url.query)
            elif parsed_url.path == '/api/proxy':
                self._handle_proxy(parsed_url.query)
            elif parsed_url.path == '/api/scrape_status':
                self._handle_scrape_status()
            elif parsed_url.path == '/api/auth/me':
                self._handle_auth_me()
            elif parsed_url.path in ('/api/database/export', '/api/export/database', '/api/export'):
                self._handle_database_export(parsed_url.query)
            elif parsed_url.path == '/api/folders':
                self._handle_get_folders()
            elif parsed_url.path.startswith('/api/folders/') and parsed_url.path.endswith('/monsters'):
                self._handle_get_folder_monsters(parsed_url.path)
            else:
                super().do_GET()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass

    def _handle_scrape_status(self):
        body = get_scrape_status()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        self.wfile.flush()

    def _handle_auth_me(self):
        user = get_authenticated_user_from_headers(self.headers)
        if user:
            self._send_json({"status": "ok", "user": user}, 200)
        else:
            self._send_json({"status": "error", "message": "Unauthorized"}, 401)

    def _handle_proxy(self, query):
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
                self.wfile.flush()
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))
            self.wfile.flush()

    def do_POST(self):
        try:
            parsed_url = urlparse(self.path)
            if parsed_url.path == '/api/auth/register':
                self._handle_auth_register()
            elif parsed_url.path == '/api/auth/login':
                self._handle_auth_login()
            elif parsed_url.path == '/api/auth/logout':
                self._handle_auth_logout()
            elif parsed_url.path.startswith('/api/favorite/'):
                user = get_authenticated_user_from_headers(self.headers)
                length = int(self.headers.get('Content-Length', 0))
                if length > 0:
                    self.rfile.read(length)
                idx_str = parsed_url.path.rstrip('/').split('/')[-1]
                try:
                    idx = int(idx_str)
                    body, status_code = toggle_favorite(idx, user=user)
                except ValueError:
                    body, status_code = toggle_favorite(idx_str, user=user)
                self.send_response(status_code)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                self.wfile.flush()
            elif parsed_url.path == '/api/save':
                self._handle_save()
            elif parsed_url.path in ('/api/database/import', '/api/import'):
                self._handle_database_import()
            elif parsed_url.path == '/api/folders':
                self._handle_save_folder()
            elif parsed_url.path == '/api/folders/add':
                self._handle_add_to_folder()
            elif parsed_url.path == '/api/folders/remove':
                self._handle_remove_from_folder()
            else:
                self.send_error(404)
        except ValueError:
            self.send_error(400, "Invalid index")
        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_error(500, str(e))

    def _handle_auth_register(self):
        length = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(length).decode('utf-8') if length > 0 else "{}"
        try:
            data = json.loads(raw)
        except Exception:
            self._send_json({"status": "error", "message": "Invalid JSON"}, 400)
            return
        res, status_code = register_user(data)
        self._send_json(res, status_code)

    def _handle_auth_login(self):
        length = int(self.headers.get('Content-Length', 0))
        raw = self.rfile.read(length).decode('utf-8') if length > 0 else "{}"
        try:
            data = json.loads(raw)
        except Exception:
            self._send_json({"status": "error", "message": "Invalid JSON"}, 400)
            return
        res, status_code = login_user(data)
        self._send_json(res, status_code)

    def _handle_auth_logout(self):
        auth_header = self.headers.get('Authorization', '')
        token = auth_header[7:].strip() if auth_header.startswith('Bearer ') else ''
        if not token:
            length = int(self.headers.get('Content-Length', 0))
            if length > 0:
                raw = self.rfile.read(length).decode('utf-8')
                try:
                    data = json.loads(raw)
                    token = data.get('token', '')
                except Exception:
                    pass
        res, status_code = logout_user(token)
        self._send_json(res, status_code)

    def do_DELETE(self):
        try:
            user = get_authenticated_user_from_headers(self.headers)
            length = int(self.headers.get('Content-Length', 0))
            if length > 0:
                self.rfile.read(length)
            parsed_url = urlparse(self.path)
            if parsed_url.path.startswith('/api/delete/'):
                target_str = parsed_url.path.rstrip('/').split('/')[-1]
                try:
                    target_arg = int(target_str)
                except ValueError:
                    target_arg = target_str
                body, status_code = delete_monster(target_arg, user=user)
                self.send_response(status_code)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                self.wfile.flush()
            elif parsed_url.path.startswith('/api/folders/'):
                self._handle_delete_folder(parsed_url.path)
            else:
                self.send_error(404)
        except Exception as e:
            self.send_error(500, str(e))

    def _handle_search(self, query_string):
        user = get_authenticated_user_from_headers(self.headers)
        body = search_monsters(query_string, user=user)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        self.wfile.flush()

    def _handle_save(self):
        try:
            user = get_authenticated_user_from_headers(self.headers)
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length)
            body = save_monster_from_json(raw, user=user)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
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
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
        except Exception as e:
            print(f"Error handling spell search: {e}")
            self.send_response(500)
            self.end_headers()
    def _handle_database_export(self, query_string):
        try:
            user = get_authenticated_user_from_headers(self.headers)
            qs = parse_qs(query_string)
            scope = qs.get('scope', ['all'])[0]
            body = export_monsters_dataset(scope=scope, user=user, query_string=query_string)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Content-Disposition', f'attachment; filename="pathmonsterdb_{scope}_monsters.json"')
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
        except Exception as e:
            print(f"Error handling database export: {e}")
            self.send_error(500, str(e))

    def _handle_database_import(self):
        try:
            user = get_authenticated_user_from_headers(self.headers)
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length)
            body, status_code = import_monsters_from_json(raw, user=user)
            self.send_response(status_code)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            self.wfile.flush()
        except Exception as e:
            print(f"Error handling database import: {e}")
            self.send_error(500, str(e))

    def _handle_get_folders(self):
        try:
            user = get_authenticated_user_from_headers(self.headers)
            folders = get_user_folders(user)
            self._send_json({"status": "ok", "folders": folders}, 200)
        except Exception as e:
            self._send_json({"status": "error", "message": str(e)}, 500)

    def _handle_get_folder_monsters(self, path):
        try:
            user = get_authenticated_user_from_headers(self.headers)
            parts = path.strip('/').split('/')
            if len(parts) >= 3:
                folder_id = parts[2]
                monsters = get_folder_monsters(folder_id, user)
                self._send_json({"status": "ok", "monsters": monsters}, 200)
            else:
                self._send_json({"status": "error", "message": "Invalid folder path"}, 400)
        except Exception as e:
            self._send_json({"status": "error", "message": str(e)}, 500)

    def _handle_save_folder(self):
        try:
            user = get_authenticated_user_from_headers(self.headers)
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length).decode('utf-8') if length > 0 else "{}"
            data = json.loads(raw)
            folder = create_or_update_folder(data, user)
            self._send_json({"status": "ok", "folder": folder}, 200)
        except json.JSONDecodeError:
            self._send_json({"status": "error", "message": "Invalid JSON"}, 400)
        except Exception as e:
            self._send_json({"status": "error", "message": str(e)}, 500)

    def _handle_add_to_folder(self):
        try:
            user = get_authenticated_user_from_headers(self.headers)
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length).decode('utf-8') if length > 0 else "{}"
            data = json.loads(raw)
            folder_id = data.get('folder_id')
            monster_key = data.get('monster_key')
            if not folder_id or not monster_key:
                self._send_json({"status": "error", "message": "folder_id and monster_key are required"}, 400)
                return
            folder = add_monster_to_folder(folder_id, monster_key, user)
            if folder:
                self._send_json({"status": "ok", "folder": folder}, 200)
            else:
                self._send_json({"status": "error", "message": "Folder not found"}, 404)
        except Exception as e:
            self._send_json({"status": "error", "message": str(e)}, 500)

    def _handle_remove_from_folder(self):
        try:
            user = get_authenticated_user_from_headers(self.headers)
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length).decode('utf-8') if length > 0 else "{}"
            data = json.loads(raw)
            folder_id = data.get('folder_id')
            monster_key = data.get('monster_key')
            if not folder_id or not monster_key:
                self._send_json({"status": "error", "message": "folder_id and monster_key are required"}, 400)
                return
            folder = remove_monster_from_folder(folder_id, monster_key, user)
            if folder:
                self._send_json({"status": "ok", "folder": folder}, 200)
            else:
                self._send_json({"status": "error", "message": "Folder not found"}, 404)
        except Exception as e:
            self._send_json({"status": "error", "message": str(e)}, 500)

    def _handle_delete_folder(self, path):
        try:
            user = get_authenticated_user_from_headers(self.headers)
            folder_id = path.rstrip('/').split('/')[-1]
            success = delete_folder(folder_id, user)
            if success:
                self._send_json({"status": "ok"}, 200)
            else:
                self._send_json({"status": "error", "message": "Folder not found"}, 404)
        except Exception as e:
            self._send_json({"status": "error", "message": str(e)}, 500)

    def log_request(self, code='-', size='-'):
        pass

    def log_message(self, format, *args):
        pass

# Backward compatibility alias
PATHGMRequestHandler = PathMonsterDBRequestHandler
