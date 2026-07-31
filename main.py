import http.server
import socketserver
import webbrowser
import threading
import time
import os
import json
import re
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
            for idx, m in enumerate(GLOBAL_MONSTERS):
                m['_m_name'] = str(m.get('Name', '')).lower()
                m['_m_cr'] = str(m.get('CR', '')).lower()
                m['_m_type'] = str(m.get('Type', '')).lower()
                m['_m_align'] = str(m.get('Alignment', '')).lower()
                m['_m_env'] = str(m.get('Environment', '')).lower()
                m['_m_source'] = str(m.get('Source', '')).lower()
                m['_global_index'] = idx
                if 'OriginalState' in m and isinstance(m['OriginalState'], dict):
                    m['OriginalState']['_global_index'] = idx
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

def format_monster_from_state(state):
    basic = state.get('basic', {})
    dynamic = state.get('dynamic', {})
    
    def get_val(basic_key, state_key, default=''):
        if basic_key in basic:
            v = basic[basic_key]
            return v if v is not None else default
        if state_key in basic:
            v = basic[state_key]
            return v if v is not None else default
        if state_key in state:
            v = state[state_key]
            return v if v is not None else default
        return default

    name = get_val('in-name', 'Name', 'Unnamed Monster') or 'Unnamed Monster'
    cr = get_val('in-cr', 'CR', '1') or '1'
    xp = get_val('in-xp', 'XP', '')
    alignment = get_val('in-alignment', 'Alignment', 'N') or 'N'
    size = get_val('in-size', 'Size', 'Medium') or 'Medium'
    mtype = get_val('in-type', 'Type', 'Magical Beast') or 'Magical Beast'
    
    hd_amount = basic.get('in-hd-amount') or '1'
    hd_size = basic.get('in-hd-size') or '8'
    hp_val = get_val('in-hp', 'HP', '')
    
    hd_str = f"{hd_amount}d{hd_size}"
    
    fort = get_val('in-fort', 'Fort', '+0') or '+0'
    ref = get_val('in-ref', 'Ref', '+0') or '+0'
    will = get_val('in-will', 'Will', '+0') or '+0'
    
    str_val = get_val('in-str', 'Str', '10') or '10'
    dex_val = get_val('in-dex', 'Dex', '10') or '10'
    con_val = get_val('in-con', 'Con', '10') or '10'
    int_val = get_val('in-int', 'Int', '10') or '10'
    wis_val = get_val('in-wis', 'Wis', '10') or '10'
    cha_val = get_val('in-cha', 'Cha', '10') or '10'
    
    senses_list = dynamic.get('senses', [])
    senses_parts = []
    for s in senses_list:
        if isinstance(s, dict):
            n = s.get('name', '').strip()
            d = s.get('dist', '').strip()
            if n:
                senses_parts.append(f"{n} {d}".strip())
    if senses_parts:
        senses_str = ", ".join(senses_parts)
    else:
        senses_str = get_val('in-senses', 'Senses', '')
    
    skills_list = dynamic.get('skills', [])
    skills_parts = []
    for sk in skills_list:
        if isinstance(sk, dict):
            n = sk.get('name', '').strip()
            m = sk.get('mod', '').strip()
            if n:
                skills_parts.append(f"{n} {m}".strip())
    if skills_parts:
        skills_str = ", ".join(skills_parts)
    else:
        skills_str = get_val('in-skills', 'Skills', '')
    
    melee_list = dynamic.get('melee', [])
    melee_parts = []
    for atk in melee_list:
        if isinstance(atk, dict):
            if atk.get('mode') == 'raw' or 'rawText' in atk:
                txt = atk.get('rawText', '').strip()
                if txt:
                    melee_parts.append(txt)
            else:
                cnt = atk.get('count', '1')
                t = atk.get('type', 'bite')
                dice = atk.get('dice', '1d6')
                ext = atk.get('extra', '').strip()
                part = f"{cnt} {t} ({dice}" + (f" plus {ext}" if ext else "") + ")"
                melee_parts.append(part)
    if melee_parts:
        melee_str = ", ".join(melee_parts)
    else:
        melee_str = get_val('in-melee', 'Melee', '')
    
    abilities_list = dynamic.get('abilities', [])
    sa_parts = []
    for ab in abilities_list:
        if isinstance(ab, dict):
            aname = ab.get('name', '').strip()
            adesc = ab.get('desc', '').strip()
            clean_desc = re.sub('<[^<]+?>', '', adesc).strip()
            if aname:
                sa_parts.append(f"{aname} {clean_desc}".strip())
    if sa_parts:
        sa_str = "\n".join(sa_parts)
    elif 'abilities' in dynamic:
        sa_str = ''
    else:
        sa_str = state.get('Special Abilities', '')

    slas_list = dynamic.get('slas', [])
    sla_parts = []
    cl_val = basic.get('in-sla-cl') or ''
    if cl_val:
        sla_parts.append(f"({cl_val})")
    for sla in slas_list:
        if isinstance(sla, dict):
            freq = sla.get('freq', '').strip()
            spells = sla.get('spells', '')
            if isinstance(spells, list):
                spells_str = ", ".join([s.get('name') if isinstance(s, dict) else str(s) for s in spells if s])
            else:
                spells_str = str(spells).strip()
            if spells_str.startswith('[object Object]'):
                spells_str = ''
            if freq or spells_str:
                sla_parts.append(f"{freq}—{spells_str}" if (freq and spells_str) else (freq or spells_str))
    if len(sla_parts) > (1 if cl_val else 0):
        sla_str = "\n".join(sla_parts)
    elif 'slas' in dynamic:
        sla_str = ''
    else:
        sla_str = state.get('SpellLikeAbilities', '')
    
    def safe_int(val, default=0):
        try:
            if val is None:
                return default
            s = str(val).strip()
            if not s or s == '-':
                return default
            return int(s)
        except:
            return default

    ac_natural = safe_int(basic.get('in-ac-natural'))
    ac_armor = safe_int(basic.get('in-ac-armor'))
    ac_shield = safe_int(basic.get('in-ac-shield'))
    ac_deflection = safe_int(basic.get('in-ac-deflection'))
    ac_dodge = safe_int(basic.get('in-ac-dodge'))
    dex_mod = (safe_int(dex_val, 10) - 10) // 2
    
    total_ac = 10 + dex_mod + ac_natural + ac_armor + ac_shield + ac_deflection + ac_dodge
    touch_ac = 10 + dex_mod + ac_deflection + ac_dodge
    ff_ac = 10 + ac_natural + ac_armor + ac_shield + ac_deflection
    
    subtypes_raw = dynamic.get('subtypes', [])
    if isinstance(subtypes_raw, list):
        st1 = subtypes_raw[0] if len(subtypes_raw) > 0 else ''
        st2 = subtypes_raw[1] if len(subtypes_raw) > 1 else ''
    elif isinstance(subtypes_raw, str):
        st1 = subtypes_raw
        st2 = ''
    else:
        st1 = ''
        st2 = ''

    rec = {
        "Name": name,
        "CR": str(cr),
        "XP": str(xp),
        "Alignment": alignment,
        "Size": size,
        "Type": mtype,
        "subtype1": st1,
        "subtype2": st2,
        "Init": get_val('in-init', 'Init', '+0') or '+0',
        "Senses": senses_str,
        "Aura": get_val('in-aura', 'Aura', ''),
        "AC": str(total_ac),
        "AC_Touch": str(touch_ac),
        "AC_Flat-footed": str(ff_ac),
        "HP": str(hp_val),
        "HD": hd_str,
        "Fort": fort,
        "Ref": ref,
        "Will": will,
        "Speed": get_val('in-speed', 'Speed', '30 ft.') or '30 ft.',
        "Melee": melee_str,
        "Space": get_val('in-space', 'Space', '5 ft.') or '5 ft.',
        "Reach": get_val('in-reach', 'Reach', '5 ft.') or '5 ft.',
        "SpecialAttacks": get_val('in-special-attacks', 'SpecialAttacks', ''),
        "Str": str(str_val),
        "Dex": str(dex_val),
        "Con": str(con_val),
        "Int": str(int_val),
        "Wis": str(wis_val),
        "Cha": str(cha_val),
        "BaseAtk": get_val('in-bab', 'BaseAtk', '0') or '0',
        "CMB": get_val('in-cmb', 'CMB', '+0') or '+0',
        "CMD": get_val('in-cmd', 'CMD', '10') or '10',
        "Feats": get_val('in-feats', 'Feats', ''),
        "Skills": skills_str,
        "Languages": get_val('in-languages', 'Languages', ''),
        "SQ": get_val('in-sq', 'SQ', ''),
        "DR": get_val('in-dr', 'DR', ''),
        "Immune": get_val('in-immune', 'Immune', ''),
        "Resist": get_val('in-resist', 'Resist', ''),
        "SR": get_val('in-sr', 'SR', ''),
        "Environment": get_val('in-environment', 'Environment', ''),
        "Treasure": get_val('in-treasure', 'Treasure', ''),
        "IsFavorite": True,
        "IsUserCustom": True,
        "CharacterFlag": "0",
        "SpellLikeAbilities": sla_str,
        "Special Abilities": sa_str,
        "OriginalState": state,
        "_m_name": name.lower(),
        "_m_cr": str(cr).lower(),
        "_m_type": mtype.lower(),
        "_m_align": alignment.lower(),
        "_m_env": get_val('in-environment', 'Environment', '').lower(),
        "_m_source": "custom"
    }
    return rec

class Handler(http.server.SimpleHTTPRequestHandler):
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
        status_file = os.path.join(BASE_DIR, 'data', 'scrape_status.json')
        if os.path.exists(status_file):
            with open(status_file, 'r', encoding='utf-8') as f:
                data = f.read()
        else:
            data = json.dumps({"status": "idle", "percentage": 0})
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(data.encode('utf-8'))

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
        
        try:
            page = max(1, int(params.get('page', ['1'])[0]))
        except (ValueError, TypeError):
            page = 1
            
        try:
            per_page = max(1, min(200, int(params.get('per_page', ['50'])[0])))
        except (ValueError, TypeError):
            per_page = 50
        
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
            
            m_source = str(m.get('_m_source') or m.get('Source') or '').lower()
            if category == 'unique_monster' and 'unique monsters' not in m_source:
                continue
            if category == '3pp_monster':
                if 'tome of horrors' not in m_source and 'toh' not in m_source and 'misfit monsters' not in m_source:
                    continue

            m_name = str(m.get('_m_name') or m.get('Name') or '').lower()
            m_cr = str(m.get('_m_cr') or m.get('CR') or '').lower()
            m_type = str(m.get('_m_type') or m.get('Type') or '').lower()
            m_align = str(m.get('_m_align') or m.get('Alignment') or '').lower()
            m_env = str(m.get('_m_env') or m.get('Environment') or '').lower()
            
            if name and name not in m_name:
                continue
            if cr and cr != "any":
                t_cr = parse_cr(cr)
                m_cr_val = parse_cr(m_cr)
                if t_cr >= 0 and m_cr_val >= 0:
                    if abs(t_cr - m_cr_val) > 0.01:
                        continue
                elif cr != m_cr:
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
            filtered.sort(key=lambda x: str(x.get('Name') or '').lower())
        elif sort_by == 'newest':
            filtered.reverse()
        elif sort_by == 'cr_desc':
            filtered.sort(key=lambda x: parse_cr(x.get('CR', '')), reverse=True)
        elif sort_by == 'cr_asc':
            filtered.sort(key=lambda x: parse_cr(x.get('CR', '')))
        elif sort_by == 'name_desc':
            filtered.sort(key=lambda x: str(x.get('Name') or '').lower(), reverse=True)
            
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
            data = json.loads(raw.decode('utf-8'))
            
            if 'basic' in data:
                state = data
            elif 'OriginalState' in data:
                state = data['OriginalState']
            else:
                state = {'basic': data, 'dynamic': {}}

            target_idx = state.get('_global_index')
            if target_idx is None and '_global_index' in data:
                target_idx = data['_global_index']
                
            monster_rec = format_monster_from_state(state)
            
            updated_idx = None
            if target_idx is not None:
                try:
                    idx = int(target_idx)
                    if 0 <= idx < len(GLOBAL_MONSTERS) and GLOBAL_MONSTERS[idx].get('IsUserCustom', False):
                        monster_rec['_global_index'] = idx
                        if 'OriginalState' in monster_rec and isinstance(monster_rec['OriginalState'], dict):
                            monster_rec['OriginalState']['_global_index'] = idx
                        GLOBAL_MONSTERS[idx] = monster_rec
                        updated_idx = idx
                except ValueError:
                    pass
            
            if updated_idx is None:
                name_lower = monster_rec['_m_name']
                for idx, m in enumerate(GLOBAL_MONSTERS):
                    if m.get('IsUserCustom', False) and m.get('_m_name') == name_lower:
                        monster_rec['_global_index'] = idx
                        if 'OriginalState' in monster_rec and isinstance(monster_rec['OriginalState'], dict):
                            monster_rec['OriginalState']['_global_index'] = idx
                        GLOBAL_MONSTERS[idx] = monster_rec
                        updated_idx = idx
                        break
                        
            if updated_idx is None:
                new_idx = len(GLOBAL_MONSTERS)
                monster_rec['_global_index'] = new_idx
                if 'OriginalState' in monster_rec and isinstance(monster_rec['OriginalState'], dict):
                    monster_rec['OriginalState']['_global_index'] = new_idx
                GLOBAL_MONSTERS.append(monster_rec)
                updated_idx = new_idx
                
            save_monsters()
            clear_cache()
            
            body = json.dumps({"status": "ok", "global_index": updated_idx}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(body))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            print("Error saving monster:", e)
            self.send_error(500, str(e))

    def _handle_delete(self, idx):
        global GLOBAL_MONSTERS
        try:
            if 0 <= idx < len(GLOBAL_MONSTERS):
                if GLOBAL_MONSTERS[idx].get('IsUserCustom', False):
                    GLOBAL_MONSTERS.pop(idx)
                    for i, m in enumerate(GLOBAL_MONSTERS):
                        m['_global_index'] = i
                        if 'OriginalState' in m and isinstance(m['OriginalState'], dict):
                            m['OriginalState']['_global_index'] = i
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
            filtered = filtered[:50]
            
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
    if not GLOBAL_MONSTERS:
        load_monsters()
    if not GLOBAL_SPELLS:
        load_spells()
    
    global PORT
    httpd = None
    for _ in range(10):
        try:
            httpd = socketserver.TCPServer(("", PORT), Handler)
            break
        except OSError:
            PORT += 1
            
    if httpd:
        httpd.serve_forever()
            
if __name__ == "__main__":
    load_monsters()
    load_spells()
    
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    time.sleep(0.5)
    url = f"http://localhost:{PORT}"
    webbrowser.open(url)
    
    print("=" * 60)
    print("  🗡️  Pathfinder 1e Master Sheet (PATHGM) Server")
    print(f"  📊 Loaded: {len(GLOBAL_MONSTERS):,} Monsters | {len(GLOBAL_SPELLS):,} Spells")
    print(f"  🚀 Server Running: {url}")
    print("=" * 60)
    print("  Press CTRL+C to stop.\n")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nServer is shutting down. Goodbye!")