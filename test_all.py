import http.client
import json
import sys
import os
import time
import socketserver
import threading
import urllib.request
import urllib.parse
from server.data_manager import (
    BASE_DIR,
    load_monsters,
    load_spells,
    search_monsters,
    search_spells,
    save_monster_from_json,
    delete_monster,
    toggle_favorite
)
from server.monster_formatter import format_monster_from_state, parse_cr
from server.http_handler import PATHGMRequestHandler

def run_tests():
    print("--- Running PATHGM Verification Test Suite ---")
    
    # 1. Static Assets Verification
    print("1. Testing Static Assets...")
    files_to_check = [
        "/index.html", "/database.html", "/style.css", "/themes.css",
        "/script.js", "/database.js", "/js/state.js", "/js/ui.js",
        "/js/mechanics.js", "/js/spells.js", "/js/inventory.js",
        "/data/armor.json", "/data/weapons.json", "/data/spells.json",
        "/data/feats.json", "/data/monsters.json", "/data/custom_monsters.json",
        "/data/auras.json", "/data/magic_items.json", "/data/immunities.json",
        "/data/resistances.json", "/data/weaknesses.json", "/data/special_abilities.json",
        "/data/class_features.json", "/data/rules.json"
    ]
    
    for f in files_to_check:
        full_path = os.path.normpath(os.path.join(BASE_DIR, f.lstrip('/')))
        if not os.path.exists(full_path):
            print(f"  [FAIL] Missing file: {f}")
            return False
        sz = os.path.getsize(full_path)
        print(f"  [OK] {f} (200, {sz:,} bytes)")

    # 2. JSON Validation
    print("\n2. Testing JSON Database Integrity...")
    json_files = [
        "armor.json", "weapons.json", "feats.json", "auras.json",
        "magic_items.json", "custom_monsters.json", "immunities.json",
        "resistances.json", "weaknesses.json", "special_abilities.json",
        "class_features.json", "rules.json"
    ]
    for json_file in json_files:
        path = os.path.join(BASE_DIR, "data", json_file)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as jf:
                data = json.load(jf)
            print(f"  [OK] data/{json_file} is valid JSON ({len(data)} entries).")

    # 3. Load & Search Verification
    print("\n3. Testing Monsters & Search...")
    monsters = load_monsters()
    spells = load_spells()
    print(f"  [OK] Loaded {len(monsters)} total monsters and {len(spells)} spells.")
    
    res_bytes = search_monsters("name=kaelit")
    res = json.loads(res_bytes.decode('utf-8'))
    if res and res.get("total_count", 0) > 0:
        kaelit = res["data"][0]
        print(f"  [OK] Found Kaelit: CR {kaelit.get('CR')}, Name: '{kaelit.get('Name')}'")
    else:
        print("  [WARN] Kaelit search query returned no results.")

    # 4. Spells Search Verification
    print("\n4. Testing Spell Search...")
    spell_res_bytes, status = search_spells("name=fireball")
    if status == 200:
        spells_found = json.loads(spell_res_bytes.decode('utf-8'))
        print(f"  [OK] Spell search 'fireball' returned {len(spells_found)} results.")
    else:
        print(f"  [FAIL] Spell search failed with status {status}")
        return False

    # Test cache key normalization with _t
    res1 = search_monsters("name=kaelit&_t=1000")
    res2 = search_monsters("name=kaelit&_t=2000")
    assert res1 == res2, "Cache key normalization failed"
    print("  [OK] Cache key normalization verified.")

    # 5. Formatter & CR Parsing Verification
    print("\n5. Testing Monster Formatter & CR Parsing...")
    assert parse_cr("1/2") == 0.5, "parse_cr 1/2 failed"
    assert parse_cr("14") == 14.0, "parse_cr 14 failed"
    assert parse_cr("any") == -1.0, "parse_cr any failed"
    
    test_state = {
        "basic": {
            "in-name": "Test Wyrm",
            "in-cr": "5",
            "in-hp": "49 (7d12+21)",
            "in-alignment": "CE",
            "in-size": "Large",
            "in-type": "Dragon",
            "in-hd-amount": "7",
            "in-hd-size": "12",
            "in-str": "20",
            "in-dex": "10",
            "in-con": "16"
        },
        "dynamic": {
            "senses": [{"name": "Darkvision", "dist": "60 ft."}],
            "melee": [{"mode": "raw", "rawText": "bite +11 (2d6+7)"}]
        }
    }
    formatted = format_monster_from_state(test_state)
    assert formatted["Name"] == "Test Wyrm", "Name format failed"
    assert formatted["CR"] == "5", "CR format failed"
    assert formatted["Size"] == "Large", "Size format failed"
    assert formatted["HP"] == "49", f"HP format expected '49', got '{formatted['HP']}'"
    print(f"  [OK] Formatter test passed: '{formatted['Name']}' (CR {formatted['CR']}), AC: {formatted['AC']}, HP: {formatted['HP']}")

    # 6. Save, Favorite & Delete Lifecycle Verification
    print("\n6. Testing Monster Save / Favorite / Delete Lifecycle...")
    save_res_raw = save_monster_from_json(json.dumps(test_state))
    save_res = json.loads(save_res_raw.decode('utf-8'))
    assert save_res.get("status") == "ok", "Save monster failed"
    global_idx = save_res.get("global_index")
    assert global_idx is not None, "Missing global_index after save"
    print(f"  [OK] Successfully saved custom monster at index {global_idx}.")

    fav_res_raw, fav_status = toggle_favorite(global_idx)
    assert fav_status == 200, "Favorite toggle failed"
    print(f"  [OK] Favorite toggle returned status {fav_status}.")

    del_res_raw, del_status = delete_monster(global_idx)
    assert del_status == 200, "Delete monster failed"
    print(f"  [OK] Successfully deleted test custom monster at index {global_idx}.")

    # 7. Live Server HTTP Endpoints & MIME-types Verification
    print("\n7. Testing Live Server HTTP Endpoints & MIME-types...")
    PORT = 8998
    os.chdir(BASE_DIR)
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer.daemon_threads = True

    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", PORT), PATHGMRequestHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    time.sleep(0.3)

    base_url = f"http://127.0.0.1:{PORT}"

    try:
        req = urllib.request.urlopen(f"{base_url}/index.html")
        assert req.status == 200
        assert "text/html" in req.headers.get("Content-Type", "")

        req = urllib.request.urlopen(f"{base_url}/script.js")
        assert req.status == 200
        assert "javascript" in req.headers.get("Content-Type", "")

        req = urllib.request.urlopen(f"{base_url}/style.css")
        assert req.status == 200
        assert "text/css" in req.headers.get("Content-Type", "")

        req = urllib.request.urlopen(f"{base_url}/api/search?name=dragon&page=1&per_page=5")
        assert req.status == 200
        s_res = json.loads(req.read().decode('utf-8'))
        assert s_res["total_count"] > 0

        req = urllib.request.urlopen(f"{base_url}/api/spells?name=magic+missile")
        assert req.status == 200

        req = urllib.request.urlopen(f"{base_url}/api/scrape_status")
        assert req.status == 200

        print("  [OK] All HTTP endpoints responded with 200 and verified MIME types.")
    finally:
        httpd.shutdown()

    print("\n========================================================")
    print("  ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (100%) ")
    print("========================================================")
    return True

if __name__ == "__main__":
    success = run_tests()
    if not success:
        sys.exit(1)
