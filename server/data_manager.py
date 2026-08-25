import os
import json
import uuid
import time
from urllib.parse import parse_qs, urlencode
from server.monster_formatter import parse_cr, format_monster_from_state

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MONSTERS_FILE = os.path.join(BASE_DIR, 'data', 'monsters.json')
CUSTOM_MONSTERS_FILE = os.path.join(BASE_DIR, 'data', 'custom_monsters.json')
FAVORITES_FILE = os.path.join(BASE_DIR, 'data', 'favorites.json')
SPELLS_FILE = os.path.join(BASE_DIR, 'data', 'spells.json')

GLOBAL_MONSTERS = []
GLOBAL_SPELLS = []
SEARCH_CACHE = {}
FAVORITES_CACHE = None
CUSTOM_MONSTERS_MTIME = 0
OFFICIAL_MONSTERS_MTIME = 0

def clear_cache():
    global SEARCH_CACHE
    SEARCH_CACHE.clear()

def check_and_reload_if_modified():
    global CUSTOM_MONSTERS_MTIME, OFFICIAL_MONSTERS_MTIME, GLOBAL_MONSTERS
    need_reload = False
    
    if not GLOBAL_MONSTERS:
        need_reload = True
    else:
        if os.path.exists(CUSTOM_MONSTERS_FILE):
            try:
                mtime = os.path.getmtime(CUSTOM_MONSTERS_FILE)
                if mtime != CUSTOM_MONSTERS_MTIME:
                    need_reload = True
            except OSError:
                pass
        if os.path.exists(MONSTERS_FILE):
            try:
                mtime = os.path.getmtime(MONSTERS_FILE)
                if mtime != OFFICIAL_MONSTERS_MTIME:
                    need_reload = True
            except OSError:
                pass
                
    if need_reload:
        load_monsters()

def _ensure_favorites_file():
    global FAVORITES_CACHE
    if not os.path.exists(FAVORITES_FILE):
        initial_favs = {}
        if os.path.exists(CUSTOM_MONSTERS_FILE):
            try:
                with open(CUSTOM_MONSTERS_FILE, 'r', encoding='utf-8') as f:
                    c_list = json.load(f)
                for cm in c_list:
                    if cm.get('IsFavorite'):
                        auth_id = str(cm.get('AuthorId', ''))
                        auth_name = str(cm.get('AuthorName', '')).lower()
                        user_key = auth_id if auth_id else (auth_name if auth_name else 'anon')
                        m_key = get_monster_key(cm)
                        if user_key not in initial_favs:
                            initial_favs[user_key] = []
                        if m_key not in initial_favs[user_key]:
                            initial_favs[user_key].append(m_key)
            except Exception:
                pass
        try:
            with open(FAVORITES_FILE, 'w', encoding='utf-8') as f:
                json.dump(initial_favs, f, ensure_ascii=False, indent=2)
            FAVORITES_CACHE = initial_favs
        except Exception as e:
            print(f"Error initializing favorites.json: {e}")

def _load_favorites():
    global FAVORITES_CACHE
    if FAVORITES_CACHE is not None:
        return FAVORITES_CACHE
    _ensure_favorites_file()
    try:
        if os.path.exists(FAVORITES_FILE):
            with open(FAVORITES_FILE, 'r', encoding='utf-8') as f:
                FAVORITES_CACHE = json.load(f)
                if not isinstance(FAVORITES_CACHE, dict):
                    FAVORITES_CACHE = {}
        else:
            FAVORITES_CACHE = {}
    except Exception as e:
        print(f"Error loading favorites.json: {e}")
        FAVORITES_CACHE = {}
    return FAVORITES_CACHE

def _save_favorites():
    global FAVORITES_CACHE
    if FAVORITES_CACHE is None:
        return
    try:
        temp_file = FAVORITES_FILE + '.tmp'
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(FAVORITES_CACHE, f, ensure_ascii=False, indent=2)
        if os.path.exists(FAVORITES_FILE):
            os.replace(temp_file, FAVORITES_FILE)
        else:
            os.rename(temp_file, FAVORITES_FILE)
    except Exception as e:
        print(f"Error saving favorites.json: {e}")

def get_monster_key(m):
    if not isinstance(m, dict):
        return ""
    if m.get('IsUserCustom', False):
        m_id = m.get('id') or m.get('Id')
        if m_id:
            return f"custom:{m_id}"
        auth_id = m.get('AuthorId', '')
        auth_name = m.get('AuthorName', '').lower()
        name_lower = str(m.get('_m_name') or m.get('Name', '')).lower()
        return f"custom:{auth_id or auth_name}:{name_lower}"
    else:
        name = str(m.get('_m_name') or m.get('Name', '')).lower()
        source = str(m.get('_m_source') or m.get('Source', '')).lower()
        if source:
            return f"official:{name}:{source}"
        return f"official:{name}"

def get_user_favorites(user_id_or_username):
    favs = _load_favorites()
    if not user_id_or_username:
        user_id_or_username = 'anon'
    key = str(user_id_or_username)
    return set(favs.get(key, []))

def is_monster_favorited(m, user_fav_set):
    if not user_fav_set or not isinstance(m, dict):
        return False
    key = get_monster_key(m)
    if key in user_fav_set:
        return True
    if m.get('id'):
        if f"custom:{m['id']}" in user_fav_set or str(m['id']) in user_fav_set:
            return True
    name = str(m.get('_m_name') or m.get('Name', '')).lower()
    if not m.get('IsUserCustom', False):
        if f"official:{name}" in user_fav_set:
            return True
    else:
        auth_id = str(m.get('AuthorId', ''))
        auth_name = str(m.get('AuthorName', '')).lower()
        if auth_id and f"custom:{auth_id}:{name}" in user_fav_set:
            return True
        if auth_name and f"custom:{auth_name}:{name}" in user_fav_set:
            return True
    return False

def toggle_user_favorite(user_id_or_username, mon_key, monster=None):
    favs = _load_favorites()
    user_key = str(user_id_or_username) if user_id_or_username else 'anon'
    if user_key not in favs:
        favs[user_key] = []
    
    current_list = favs[user_key]
    user_set = set(current_list)

    is_fav = False
    if monster:
        is_fav = is_monster_favorited(monster, user_set)
    else:
        is_fav = mon_key in user_set

    if is_fav:
        # Remove
        keys_to_remove = {mon_key}
        if monster:
            keys_to_remove.add(get_monster_key(monster))
            if monster.get('id'):
                keys_to_remove.add(f"custom:{monster['id']}")
                keys_to_remove.add(str(monster['id']))
            name = str(monster.get('_m_name') or monster.get('Name', '')).lower()
            if not monster.get('IsUserCustom', False):
                keys_to_remove.add(f"official:{name}")
            else:
                auth_id = str(monster.get('AuthorId', ''))
                auth_name = str(monster.get('AuthorName', '')).lower()
                if auth_id: keys_to_remove.add(f"custom:{auth_id}:{name}")
                if auth_name: keys_to_remove.add(f"custom:{auth_name}:{name}")
        favs[user_key] = [k for k in current_list if k not in keys_to_remove]
        _save_favorites()
        return False
    else:
        # Add
        if mon_key not in current_list:
            favs[user_key].append(mon_key)
        _save_favorites()
        return True

def load_monsters():
    global GLOBAL_MONSTERS, CUSTOM_MONSTERS_MTIME, OFFICIAL_MONSTERS_MTIME
    clear_cache()
    official_list = []
    custom_list = []

    if os.path.exists(MONSTERS_FILE):
        try:
            OFFICIAL_MONSTERS_MTIME = os.path.getmtime(MONSTERS_FILE)
            with open(MONSTERS_FILE, 'r', encoding='utf-8') as f:
                official_list = json.load(f)
        except Exception as e:
            print(f"Error loading monsters.json: {e}")
            official_list = []

    custom_updated = False
    if os.path.exists(CUSTOM_MONSTERS_FILE):
        try:
            CUSTOM_MONSTERS_MTIME = os.path.getmtime(CUSTOM_MONSTERS_FILE)
            with open(CUSTOM_MONSTERS_FILE, 'r', encoding='utf-8') as f:
                custom_list = json.load(f)
            for cm in custom_list:
                if not cm.get('id'):
                    cm['id'] = str(uuid.uuid4())
                    custom_updated = True
                if 'OriginalState' in cm and isinstance(cm['OriginalState'], dict):
                    cm['OriginalState']['id'] = cm['id']
        except Exception as e:
            print(f"Error loading custom_monsters.json: {e}")
            custom_list = []
    else:
        try:
            with open(CUSTOM_MONSTERS_FILE, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False)
            CUSTOM_MONSTERS_MTIME = os.path.getmtime(CUSTOM_MONSTERS_FILE)
        except Exception:
            pass

    GLOBAL_MONSTERS = official_list + custom_list
    for idx, m in enumerate(GLOBAL_MONSTERS):
        if m.get('IsUserCustom', False) and not m.get('id'):
            m['id'] = str(uuid.uuid4())
            custom_updated = True
        m['_m_name'] = str(m.get('Name', '')).lower()
        m['_m_cr'] = str(m.get('CR', '')).lower()
        m['_m_type'] = str(m.get('Type', '')).lower()
        m['_m_align'] = str(m.get('Alignment', '')).lower()
        m['_m_env'] = str(m.get('Environment', '')).lower()
        m['_m_source'] = str(m.get('Source') or ('custom' if m.get('IsUserCustom') else '')).lower()
        m['_global_index'] = idx
        if 'OriginalState' in m and isinstance(m['OriginalState'], dict):
            m['OriginalState']['_global_index'] = idx
            if m.get('id'):
                m['OriginalState']['id'] = m['id']

    if custom_updated:
        save_custom_monsters()

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

def save_custom_monsters():
    global CUSTOM_MONSTERS_MTIME
    try:
        custom_list = [m for m in GLOBAL_MONSTERS if m.get('IsUserCustom', False)]
        with open(CUSTOM_MONSTERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(custom_list, f, ensure_ascii=False, indent=2)
        if os.path.exists(CUSTOM_MONSTERS_FILE):
            CUSTOM_MONSTERS_MTIME = os.path.getmtime(CUSTOM_MONSTERS_FILE)
    except Exception as e:
        print(f"Error saving custom_monsters.json: {e}")

def save_official_monsters():
    global OFFICIAL_MONSTERS_MTIME
    try:
        official_list = [m for m in GLOBAL_MONSTERS if not m.get('IsUserCustom', False)]
        with open(MONSTERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(official_list, f, ensure_ascii=False)
        if os.path.exists(MONSTERS_FILE):
            OFFICIAL_MONSTERS_MTIME = os.path.getmtime(MONSTERS_FILE)
    except Exception as e:
        print(f"Error saving monsters.json: {e}")

def save_monsters():
    save_custom_monsters()
    save_official_monsters()

def search_monsters(query_string, user=None):
    global GLOBAL_MONSTERS, SEARCH_CACHE

    check_and_reload_if_modified()

    params = parse_qs(query_string)
    # Strip timestamp / cache-busting parameters for reliable search caching
    cache_params = {k: v for k, v in sorted(params.items()) if k not in ('_t', 'timestamp', '_')}
    user_id = str(user.get('id', '')) if user else ''
    user_name = str(user.get('username', '')).lower() if user else ''
    user_fav_key = user_id if user_id else (user_name if user_name else 'anon')
    cache_key = f"{user_fav_key}:{urlencode(cache_params, doseq=True)}"

    if cache_key in SEARCH_CACHE:
        return SEARCH_CACHE[cache_key]
    
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
    
    user_favs = get_user_favorites(user_fav_key)

    filtered = []
    for i, m in enumerate(GLOBAL_MONSTERS):
        is_custom = m.get('IsUserCustom', False)
        is_npc = str(m.get('CharacterFlag', '0')) == '1'
        m_vis = str(m.get('Visibility', 'public')).lower()
        m_auth_id = str(m.get('AuthorId', ''))
        m_auth_name = str(m.get('AuthorName', '')).lower()

        is_own = bool(user_id and (m_auth_id == user_id or (not m_auth_id and m_auth_name == user_name)))

        # Privacy rule: Private custom monsters are ONLY visible to their author!
        if is_custom and m_vis == 'private' and not is_own:
            continue
        
        is_fav = is_monster_favorited(m, user_favs)
        if category == 'favorites' and not is_fav:
            continue
        if category == 'official_monster' and (is_custom or is_npc):
            continue
        if category == 'official_npc' and (is_custom or not is_npc):
            continue
        if category == 'custom' and not is_custom:
            continue
        if category in ('my_monsters', 'my_custom') and (not is_custom or not is_own):
            continue
        if category in ('my_private', 'private') and (not is_custom or not is_own or m_vis != 'private'):
            continue
        if category == 'public_custom' and (not is_custom or m_vis != 'public'):
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
            
        m_copy = dict(m)
        m_copy['IsFavorite'] = is_fav
        m_copy['_global_index'] = i
        filtered.append(m_copy)
        
    sort_by = params.get('sort', ['default'])[0].lower()
    if sort_by == 'default' or sort_by == 'name_asc':
        filtered.sort(key=lambda x: str(x.get('Name') or '').lower())
    elif sort_by == 'newest':
        filtered.reverse()
    elif sort_by == 'cr_desc':
        filtered.sort(key=lambda x: parse_cr(x.get('CR', '')), reverse=True)
    elif sort_by == 'cr_asc':
        filtered.sort(key=lambda x: (parse_cr(x.get('CR', '')) if parse_cr(x.get('CR', '')) >= 0 else 9999))
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
    SEARCH_CACHE[cache_key] = body
    return body

def save_monster_from_json(raw_json_str, user=None):
    global GLOBAL_MONSTERS
    check_and_reload_if_modified()
    if isinstance(raw_json_str, bytes):
        raw_json_str = raw_json_str.decode('utf-8')
    data = json.loads(raw_json_str)
    
    if 'basic' in data:
        state = data
    elif 'OriginalState' in data:
        state = data['OriginalState']
    else:
        state = {'basic': data, 'dynamic': {}}

    save_as_new = bool(data.get('save_as_new') or state.get('save_as_new'))
    target_id = None if save_as_new else (state.get('id') or data.get('id') or (data.get('OriginalState', {}).get('id') if isinstance(data.get('OriginalState'), dict) else None))
        
    monster_rec = format_monster_from_state(state)

    if user:
        monster_rec['AuthorId'] = user.get('id')
        monster_rec['AuthorName'] = user.get('username') or user.get('name', '')
        if 'OriginalState' in monster_rec and isinstance(monster_rec['OriginalState'], dict):
            monster_rec['OriginalState']['AuthorId'] = user.get('id')
            monster_rec['OriginalState']['AuthorName'] = user.get('username') or user.get('name', '')
    elif monster_rec.get('Visibility') == 'private':
        # Unauthenticated users saving private -> default to public
        monster_rec['Visibility'] = 'public'
        if 'OriginalState' in monster_rec and isinstance(monster_rec['OriginalState'], dict):
            monster_rec['OriginalState']['Visibility'] = 'public'
    
    updated_idx = None
    existing_monster = None

    if not save_as_new:
        # 1. Match by persistent unique ID
        if target_id:
            for idx, m in enumerate(GLOBAL_MONSTERS):
                if m.get('IsUserCustom', False) and str(m.get('id', '')) == str(target_id):
                    existing_monster = m
                    updated_idx = idx
                    break

        # 2. Match by exact Name + Author only if no ID was provided
        if updated_idx is None and not target_id:
            name_lower = monster_rec['_m_name']
            user_id = str(user.get('id', '')) if user else ''
            user_name = str(user.get('username', '')).lower() if user else ''
            for idx, m in enumerate(GLOBAL_MONSTERS):
                if m.get('IsUserCustom', False) and m.get('_m_name') == name_lower:
                    m_auth_id = str(m.get('AuthorId', ''))
                    m_auth_name = str(m.get('AuthorName', '')).lower()
                    if (user_id and m_auth_id == user_id) or (user_name and m_auth_name == user_name) or (not m_auth_id and not user_id):
                        existing_monster = m
                        updated_idx = idx
                        break

    # Determine persistent ID and ownership
    if existing_monster and not save_as_new:
        m_auth_id = str(existing_monster.get('AuthorId', '')).lower()
        m_auth_name = str(existing_monster.get('AuthorName', '')).lower()
        if m_auth_id or m_auth_name:
            user_id = str(user.get('id', '')).lower() if user else ''
            user_name = str(user.get('username', '')).lower() if user else ''
            is_own = bool(user and (
                (user_id and user_id == m_auth_id) or
                (user_name and user_name == m_auth_name) or
                (user_id and user_id == m_auth_name) or
                (user_name and user_name == m_auth_id)
            ))
            if not is_own:
                # User is modifying another user's monster -> Fork as new monster for current user
                save_as_new = True
                existing_monster = None
                updated_idx = None
                target_id = None

    if existing_monster and not save_as_new:
        final_id = existing_monster.get('id') or target_id or str(uuid.uuid4())
    else:
        final_id = str(uuid.uuid4())

    monster_rec['id'] = final_id
    if 'OriginalState' in monster_rec and isinstance(monster_rec['OriginalState'], dict):
        monster_rec['OriginalState']['id'] = final_id

    if updated_idx is not None:
        monster_rec['_global_index'] = updated_idx
        if 'OriginalState' in monster_rec and isinstance(monster_rec['OriginalState'], dict):
            monster_rec['OriginalState']['_global_index'] = updated_idx
        GLOBAL_MONSTERS[updated_idx] = monster_rec
    else:
        new_idx = len(GLOBAL_MONSTERS)
        monster_rec['_global_index'] = new_idx
        if 'OriginalState' in monster_rec and isinstance(monster_rec['OriginalState'], dict):
            monster_rec['OriginalState']['_global_index'] = new_idx
        GLOBAL_MONSTERS.append(monster_rec)
        updated_idx = new_idx
        
    save_custom_monsters()
    clear_cache()
    
    total_custom = len([m for m in GLOBAL_MONSTERS if m.get('IsUserCustom', False)])
    return json.dumps({
        "status": "ok",
        "global_index": updated_idx,
        "id": final_id,
        "is_new": (existing_monster is None or save_as_new),
        "total_custom": total_custom,
        "visibility": monster_rec.get('Visibility', 'public'),
        "author": monster_rec.get('AuthorName', '')
    }).encode('utf-8')

def delete_monster(idx_or_id, user=None):
    global GLOBAL_MONSTERS
    check_and_reload_if_modified()
    
    target_idx = None
    target_mon = None
    
    # 1. Try finding by UUID / ID string
    if isinstance(idx_or_id, str):
        for i, mon in enumerate(GLOBAL_MONSTERS):
            if str(mon.get('id', '')) == str(idx_or_id) or str(mon.get('Id', '')) == str(idx_or_id):
                target_idx = i
                target_mon = mon
                break
                
    # 2. Try finding by integer index
    if target_idx is None:
        try:
            num_idx = int(idx_or_id)
            if 0 <= num_idx < len(GLOBAL_MONSTERS):
                target_idx = num_idx
                target_mon = GLOBAL_MONSTERS[num_idx]
        except (ValueError, TypeError):
            pass

    if target_idx is None or target_mon is None:
        return json.dumps({"status": "error", "error": "Monster not found"}).encode('utf-8'), 404

    if not target_mon.get('IsUserCustom', False):
        return json.dumps({"status": "error", "error": "Cannot delete official monsters"}).encode('utf-8'), 400

    m_auth_id = str(target_mon.get('AuthorId', '')).lower()
    m_auth_name = str(target_mon.get('AuthorName', '')).lower()
    
    if m_auth_id or m_auth_name:
        user_id = str(user.get('id', '')).lower() if user else ''
        user_name = str(user.get('username', '')).lower() if user else ''
        is_author = bool(user and (
            (user_id and user_id == m_auth_id) or
            (user_name and user_name == m_auth_name) or
            (user_id and user_id == m_auth_name) or
            (user_name and user_name == m_auth_id)
        ))
        if not is_author:
            return json.dumps({
                "status": "error",
                "error": "You do not have permission to delete this custom monster (Unauthorized)."
            }).encode('utf-8'), 403

    GLOBAL_MONSTERS.pop(target_idx)
    for i, mon in enumerate(GLOBAL_MONSTERS):
        mon['_global_index'] = i
        if 'OriginalState' in mon and isinstance(mon['OriginalState'], dict):
            mon['OriginalState']['_global_index'] = i
            
    save_custom_monsters()
    clear_cache()
    return json.dumps({"status": "ok"}).encode('utf-8'), 200

def toggle_favorite(idx, user=None):
    global GLOBAL_MONSTERS
    check_and_reload_if_modified()
    
    target_mon = None
    if isinstance(idx, int):
        if 0 <= idx < len(GLOBAL_MONSTERS):
            target_mon = GLOBAL_MONSTERS[idx]
    elif isinstance(idx, str):
        try:
            num_idx = int(idx)
            if 0 <= num_idx < len(GLOBAL_MONSTERS):
                target_mon = GLOBAL_MONSTERS[num_idx]
        except ValueError:
            pass
        if target_mon is None:
            for mon in GLOBAL_MONSTERS:
                if mon.get('id') == idx or get_monster_key(mon) == idx:
                    target_mon = mon
                    break

    if not target_mon:
        return json.dumps({"error": "Monster not found"}).encode('utf-8'), 404

    user_id = str(user.get('id', '')) if user else ''
    user_name = str(user.get('username', '')).lower() if user else ''
    user_fav_key = user_id if user_id else (user_name if user_name else 'anon')

    mon_key = get_monster_key(target_mon)
    new_fav_state = toggle_user_favorite(user_fav_key, mon_key, monster=target_mon)
    clear_cache()
    response = {
        "status": "success",
        "is_favorite": new_fav_state,
        "monster_key": mon_key
    }
    return json.dumps(response).encode('utf-8'), 200

def search_spells(query_string):
    global GLOBAL_SPELLS
    if not GLOBAL_SPELLS:
        load_spells()
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

def export_monsters_dataset(scope='all', user=None, query_string=''):
    global GLOBAL_MONSTERS
    check_and_reload_if_modified()
    user_id = str(user.get('id', '')) if user else ''
    user_name = str(user.get('username', '')).lower() if user else ''

    result_list = []

    if scope == 'filtered' and query_string:
        try:
            res_body = search_monsters(query_string + '&per_page=200&page=1', user=user)
            res_json = json.loads(res_body.decode('utf-8'))
            raw_data = res_json.get('data', [])
            for m in raw_data:
                clean_m = {k: v for k, v in m.items() if not k.startswith('_m_')}
                result_list.append(clean_m)
        except Exception as e:
            print(f"Error in export_monsters_dataset filtered search: {e}")
            result_list = []
    else:
        for idx, m in enumerate(GLOBAL_MONSTERS):
            is_custom = m.get('IsUserCustom', False)
            m_vis = str(m.get('Visibility', 'public')).lower()
            m_auth_id = str(m.get('AuthorId', ''))
            m_auth_name = str(m.get('AuthorName', '')).lower()
            is_own = bool(user_id and (m_auth_id == user_id or (not m_auth_id and m_auth_name == user_name)))

            # Privacy rule: exclude private custom monsters unless author
            if is_custom and m_vis == 'private' and not is_own:
                continue

            if scope == 'custom' and not is_custom:
                continue

            clean_m = {k: v for k, v in m.items() if not k.startswith('_m_')}
            result_list.append(clean_m)

    export_payload = {
        "version": "1.0",
        "app": "PathMonsterDB",
        "scope": scope,
        "total_count": len(result_list),
        "exported_at": time.strftime('%Y-%m-%d %H:%M:%S'),
        "data": result_list
    }
    return json.dumps(export_payload, ensure_ascii=False, indent=2).encode('utf-8')

def import_monsters_from_json(raw_json_str, user=None):
    global GLOBAL_MONSTERS
    check_and_reload_if_modified()

    if isinstance(raw_json_str, bytes):
        raw_json_str = raw_json_str.decode('utf-8', errors='ignore')

    try:
        parsed = json.loads(raw_json_str)
    except Exception as e:
        return json.dumps({"status": "error", "error": f"Invalid JSON format: {str(e)}"}).encode('utf-8'), 400

    items_to_import = []
    if isinstance(parsed, list):
        items_to_import = parsed
    elif isinstance(parsed, dict):
        if 'data' in parsed and isinstance(parsed['data'], list):
            items_to_import = parsed['data']
        elif 'monsters' in parsed and isinstance(parsed['monsters'], list):
            items_to_import = parsed['monsters']
        else:
            items_to_import = [parsed]

    if not items_to_import:
        return json.dumps({"status": "error", "error": "No monster records found in JSON."}).encode('utf-8'), 400

    imported_count = 0
    errors = []

    user_id = user.get('id') if user else None
    user_name = (user.get('username') or user.get('name')) if user else None

    for item_idx, raw_item in enumerate(items_to_import):
        try:
            if not isinstance(raw_item, dict):
                continue

            if 'basic' in raw_item:
                state = raw_item
            elif 'OriginalState' in raw_item and isinstance(raw_item['OriginalState'], dict):
                state = raw_item['OriginalState']
            else:
                state = {'basic': raw_item, 'dynamic': {}}

            monster_rec = format_monster_from_state(state)
            monster_rec['IsUserCustom'] = True

            if user:
                monster_rec['AuthorId'] = user_id
                monster_rec['AuthorName'] = user_name
                if 'OriginalState' in monster_rec and isinstance(monster_rec['OriginalState'], dict):
                    monster_rec['OriginalState']['AuthorId'] = user_id
                    monster_rec['OriginalState']['AuthorName'] = user_name
            else:
                if monster_rec.get('Visibility') == 'private':
                    monster_rec['Visibility'] = 'public'
                    if 'OriginalState' in monster_rec and isinstance(monster_rec['OriginalState'], dict):
                        monster_rec['OriginalState']['Visibility'] = 'public'

            # Assign fresh UUID for imported record
            m_id = str(uuid.uuid4())
            monster_rec['id'] = m_id
            if 'OriginalState' in monster_rec and isinstance(monster_rec['OriginalState'], dict):
                monster_rec['OriginalState']['id'] = m_id

            new_idx = len(GLOBAL_MONSTERS)
            monster_rec['_global_index'] = new_idx
            if 'OriginalState' in monster_rec and isinstance(monster_rec['OriginalState'], dict):
                monster_rec['OriginalState']['_global_index'] = new_idx

            GLOBAL_MONSTERS.append(monster_rec)
            imported_count += 1
        except Exception as item_err:
            errors.append(f"Item #{item_idx + 1}: {str(item_err)}")

    if imported_count > 0:
        save_custom_monsters()
        clear_cache()

    response = {
        "status": "ok" if imported_count > 0 else "error",
        "imported_count": imported_count,
        "total_monsters": len(GLOBAL_MONSTERS),
        "errors": errors if errors else None
    }
    return json.dumps(response, ensure_ascii=False).encode('utf-8'), (200 if imported_count > 0 else 400)

