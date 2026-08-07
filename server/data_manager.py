import os
import json
from urllib.parse import parse_qs
from server.monster_formatter import parse_cr, format_monster_from_state

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MONSTERS_FILE = os.path.join(BASE_DIR, 'data', 'monsters.json')
SPELLS_FILE = os.path.join(BASE_DIR, 'data', 'spells.json')

GLOBAL_MONSTERS = []
GLOBAL_SPELLS = []
SEARCH_CACHE = {}

def clear_cache():
    global SEARCH_CACHE
    SEARCH_CACHE.clear()

def load_monsters():
    global GLOBAL_MONSTERS
    clear_cache()
    if not os.path.exists(MONSTERS_FILE):
        GLOBAL_MONSTERS = []
        return GLOBAL_MONSTERS
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
    return GLOBAL_MONSTERS

def load_spells():
    global GLOBAL_SPELLS
    if not os.path.exists(SPELLS_FILE):
        GLOBAL_SPELLS = []
        return GLOBAL_SPELLS
    try:
        with open(SPELLS_FILE, 'r', encoding='utf-8') as f:
            GLOBAL_SPELLS = json.load(f)
            for s in GLOBAL_SPELLS:
                s['_s_name'] = str(s.get('name', '')).lower().replace('-', ' ')
    except Exception as e:
        print(f"Error loading spells.json: {e}")
        GLOBAL_SPELLS = []
    return GLOBAL_SPELLS

def save_monsters():
    try:
        with open(MONSTERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(GLOBAL_MONSTERS, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving monsters.json: {e}")

def search_monsters(query_string):
    global GLOBAL_MONSTERS, SEARCH_CACHE

    if query_string in SEARCH_CACHE:
        return SEARCH_CACHE[query_string]

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
    return body

def save_monster_from_json(raw_json_str):
    global GLOBAL_MONSTERS
    data = json.loads(raw_json_str.decode('utf-8'))
    
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
    
    return json.dumps({"status": "ok", "global_index": updated_idx}).encode('utf-8')

def delete_monster(idx):
    global GLOBAL_MONSTERS
    if 0 <= idx < len(GLOBAL_MONSTERS):
        if GLOBAL_MONSTERS[idx].get('IsUserCustom', False):
            GLOBAL_MONSTERS.pop(idx)
            for i, m in enumerate(GLOBAL_MONSTERS):
                m['_global_index'] = i
                if 'OriginalState' in m and isinstance(m['OriginalState'], dict):
                    m['OriginalState']['_global_index'] = i
            save_monsters()
            clear_cache()
            return json.dumps({"status": "ok"}).encode('utf-8'), 200
        else:
            return json.dumps({"error": "Cannot delete official monsters"}).encode('utf-8'), 403
    else:
        return json.dumps({"error": "Monster not found"}).encode('utf-8'), 404

def toggle_favorite(idx):
    global GLOBAL_MONSTERS
    if 0 <= idx < len(GLOBAL_MONSTERS):
        m = GLOBAL_MONSTERS[idx]
        current_fav = m.get('IsFavorite', False)
        m['IsFavorite'] = not current_fav
        save_monsters()
        clear_cache()
        response = {"status": "success", "is_favorite": not current_fav}
        return json.dumps(response).encode('utf-8'), 200
    else:
        return json.dumps({"error": "Monster not found"}).encode('utf-8'), 404

def search_spells(query_string):
    global GLOBAL_SPELLS
    if not GLOBAL_SPELLS:
        return None, 404
    
    params = parse_qs(query_string)
    name_query = params.get('name', [''])[0].lower().replace('-', ' ')
        
    exact_match = [s for s in GLOBAL_SPELLS if name_query == s.get('_s_name', '')]
    filtered = exact_match if exact_match else [s for s in GLOBAL_SPELLS if name_query in s.get('_s_name', '')]
    filtered = filtered[:50]
    
    return json.dumps(filtered).encode('utf-8'), 200

def get_scrape_status():
    status_file = os.path.join(BASE_DIR, 'data', 'scrape_status.json')
    if os.path.exists(status_file):
        with open(status_file, 'r', encoding='utf-8') as f:
            data = f.read()
    else:
        data = json.dumps({"status": "idle", "percentage": 0})
    return data.encode('utf-8')
