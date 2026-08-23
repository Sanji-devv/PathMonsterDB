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
from server.http_handler import PathMonsterDBRequestHandler

def run_tests():
    print("--- Running PathMonsterDB Verification Test Suite ---")
    
    # 1. Static Assets Verification
    print("1. Testing Static Assets...")
    files_to_check = [
        "/html/index.html", "/html/database.html", "/css/style.css", "/css/themes.css",
        "/js/script.js", "/js/database.js", "/js/state.js", "/js/ui.js",
        "/js/mechanics.js", "/js/spells.js", "/js/inventory.js", "/js/auth.js",
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
    
    res_bytes = search_monsters("name=goblin")
    res = json.loads(res_bytes.decode('utf-8'))
    if res and res.get("total_count", 0) > 0:
        goblin = res["data"][0]
        print(f"  [OK] Found Goblin: CR {goblin.get('CR')}, Name: '{goblin.get('Name')}'")
    
    res_author = search_monsters("name=kaelit", user={"username": "erdem"})
    author_res = json.loads(res_author.decode('utf-8'))
    if author_res and author_res.get("total_count", 0) > 0:
        kaelit = author_res["data"][0]
        print(f"  [OK] Found Author's Private Monster Kaelit: CR {kaelit.get('CR')}, Name: '{kaelit.get('Name')}'")

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
    res1 = search_monsters("name=goblin&_t=1000")
    res2 = search_monsters("name=goblin&_t=2000")
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

    # 7. Live Server HTTP Endpoints & MIME-types & Auth Suite Verification
    print("\n7. Testing Live Server HTTP Endpoints & Auth Suite...")
    PORT = 8998
    os.chdir(BASE_DIR)
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    socketserver.ThreadingTCPServer.daemon_threads = True

    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", PORT), PathMonsterDBRequestHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    time.sleep(0.3)

    base_url = f"http://127.0.0.1:{PORT}"

    users_file = os.path.join(BASE_DIR, 'data', 'users.json')
    sessions_file = os.path.join(BASE_DIR, 'data', 'sessions.json')
    favorites_file = os.path.join(BASE_DIR, 'data', 'favorites.json')
    custom_monsters_file = os.path.join(BASE_DIR, 'data', 'custom_monsters.json')
    original_users_content = None
    original_sessions_content = None
    original_favorites_content = None
    original_custom_monsters_content = None
    if os.path.exists(users_file):
        with open(users_file, 'r', encoding='utf-8') as f:
            original_users_content = f.read()
    if os.path.exists(sessions_file):
        with open(sessions_file, 'r', encoding='utf-8') as f:
            original_sessions_content = f.read()
    if os.path.exists(favorites_file):
        with open(favorites_file, 'r', encoding='utf-8') as f:
            original_favorites_content = f.read()
    if os.path.exists(custom_monsters_file):
        with open(custom_monsters_file, 'r', encoding='utf-8') as f:
            original_custom_monsters_content = f.read()

    try:
        req = urllib.request.urlopen(f"{base_url}/html/index.html")
        assert req.status == 200
        assert "text/html" in req.headers.get("Content-Type", "")

        req = urllib.request.urlopen(f"{base_url}/html/database.html")
        assert req.status == 200
        assert "text/html" in req.headers.get("Content-Type", "")

        req = urllib.request.urlopen(f"{base_url}/js/script.js")
        assert req.status == 200
        assert "javascript" in req.headers.get("Content-Type", "")

        req = urllib.request.urlopen(f"{base_url}/js/auth.js")
        assert req.status == 200
        assert "javascript" in req.headers.get("Content-Type", "")

        req = urllib.request.urlopen(f"{base_url}/css/style.css")
        assert req.status == 200
        assert "text/css" in req.headers.get("Content-Type", "")

        # Test root redirection
        req = urllib.request.urlopen(f"{base_url}/index.html")
        assert req.status == 200
        assert "text/html" in req.headers.get("Content-Type", "")

        req = urllib.request.urlopen(f"{base_url}/api/search?name=dragon&page=1&per_page=5")
        assert req.status == 200
        s_res = json.loads(req.read().decode('utf-8'))
        assert s_res["total_count"] > 0

        req = urllib.request.urlopen(f"{base_url}/api/spells?name=magic+missile")
        assert req.status == 200

        req = urllib.request.urlopen(f"{base_url}/api/scrape_status")
        assert req.status == 200

        # --- Authentication Test Suite (Username + Password + Password Confirm) ---
        print("\n  [AUTH] Testing User Registration with Username & Password Confirmation...")
        test_username = f"GM_Erdem_{int(time.time())}"
        test_password = "SecurePassword123!"

        reg_data = json.dumps({
            "username": test_username,
            "password": test_password,
            "password_confirm": test_password
        }).encode('utf-8')
        reg_req = urllib.request.Request(f"{base_url}/api/auth/register", data=reg_data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(reg_req) as response:
            assert response.status == 201
            reg_body = json.loads(response.read().decode('utf-8'))
            assert reg_body.get("status") == "ok"
            assert "token" in reg_body
            assert reg_body["user"]["username"] == test_username
            auth_token = reg_body["token"]
            print("  [OK] User registration with username succeeded (201 Created).")

        # Test duplicate username registration
        print("  [AUTH] Testing Duplicate Username Registration...")
        try:
            urllib.request.urlopen(reg_req)
            assert False, "Should fail with duplicate username"
        except urllib.error.HTTPError as e:
            assert e.code == 409
            print("  [OK] Duplicate username rejected with 409 Conflict.")

        # Test password confirmation mismatch
        print("  [AUTH] Testing Password Confirmation Mismatch...")
        mismatch_data = json.dumps({
            "username": f"New_GM_{int(time.time())}",
            "password": "Password123!",
            "password_confirm": "DifferentPassword456!"
        }).encode('utf-8')
        mismatch_req = urllib.request.Request(f"{base_url}/api/auth/register", data=mismatch_data, headers={'Content-Type': 'application/json'})
        try:
            urllib.request.urlopen(mismatch_req)
            assert False, "Should fail when passwords do not match"
        except urllib.error.HTTPError as e:
            assert e.code == 400
            print("  [OK] Password mismatch rejected with 400 Bad Request.")

        # Test short password
        print("  [AUTH] Testing Short Password Rejection...")
        short_pwd_data = json.dumps({
            "username": f"Short_GM_{int(time.time())}",
            "password": "123",
            "password_confirm": "123"
        }).encode('utf-8')
        short_req = urllib.request.Request(f"{base_url}/api/auth/register", data=short_pwd_data, headers={'Content-Type': 'application/json'})
        try:
            urllib.request.urlopen(short_req)
            assert False, "Should fail with short password"
        except urllib.error.HTTPError as e:
            assert e.code == 400
            print("  [OK] Short password rejected with 400 Bad Request.")

        # Test Login
        print("  [AUTH] Testing User Login with Username & Password...")
        login_data = json.dumps({"username": test_username, "password": test_password}).encode('utf-8')
        login_req = urllib.request.Request(f"{base_url}/api/auth/login", data=login_data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(login_req) as response:
            assert response.status == 200
            login_body = json.loads(response.read().decode('utf-8'))
            assert login_body.get("status") == "ok"
            assert "token" in login_body
            assert login_body["user"]["username"] == test_username
            login_token = login_body["token"]
            print("  [OK] User login succeeded with fresh token (200 OK).")

        # Test Login with Wrong Password
        print("  [AUTH] Testing Wrong Password Rejection...")
        wrong_pwd_data = json.dumps({"username": test_username, "password": "WrongPassword999"}).encode('utf-8')
        wrong_req = urllib.request.Request(f"{base_url}/api/auth/login", data=wrong_pwd_data, headers={'Content-Type': 'application/json'})
        try:
            urllib.request.urlopen(wrong_req)
            assert False, "Should fail with wrong password"
        except urllib.error.HTTPError as e:
            assert e.code == 401
            print("  [OK] Wrong password rejected with 401 Unauthorized.")

        # Test /api/auth/me
        print("  [AUTH] Testing /api/auth/me Profile Verification...")
        me_req = urllib.request.Request(f"{base_url}/api/auth/me", headers={'Authorization': f"Bearer {login_token}"})
        with urllib.request.urlopen(me_req) as response:
            assert response.status == 200
            me_body = json.loads(response.read().decode('utf-8'))
            assert me_body["user"]["username"] == test_username
            print("  [OK] /api/auth/me validated session bearer token.")

        # Test Save Monster with Auth Token & Public/Private Visibility Suite
        print("\n  [PRIVACY] Testing Public & Private Custom Monsters & Author Access Control...")
        
        # User A saves a Private Monster
        private_mon_state = {
            "basic": {
                "in-name": "Secret Shadow Dragon",
                "in-cr": "20",
                "in-hp": "400",
                "in-type": "Dragon",
                "in-visibility": "private"
            }
        }
        save_priv_req = urllib.request.Request(
            f"{base_url}/api/save",
            data=json.dumps(private_mon_state).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'Authorization': f"Bearer {auth_token}"}
        )
        with urllib.request.urlopen(save_priv_req) as response:
            assert response.status == 200
            s_res = json.loads(response.read().decode('utf-8'))
            assert s_res.get("status") == "ok"
            assert s_res.get("visibility") == "private"
            priv_idx = s_res.get("global_index")
            print(f"  [OK] User A successfully saved Private monster '{private_mon_state['basic']['in-name']}' (index {priv_idx}).")

        # User A saves a Public Monster
        public_mon_state = {
            "basic": {
                "in-name": "Community Solar Griffin",
                "in-cr": "12",
                "in-hp": "180",
                "in-type": "Magical Beast",
                "in-visibility": "public"
            }
        }
        save_pub_req = urllib.request.Request(
            f"{base_url}/api/save",
            data=json.dumps(public_mon_state).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'Authorization': f"Bearer {auth_token}"}
        )
        with urllib.request.urlopen(save_pub_req) as response:
            assert response.status == 200
            s_res = json.loads(response.read().decode('utf-8'))
            assert s_res.get("status") == "ok"
            assert s_res.get("visibility") == "public"
            pub_idx = s_res.get("global_index")
            print(f"  [OK] User A successfully saved Public monster '{public_mon_state['basic']['in-name']}' (index {pub_idx}).")

        # 1. User A searches: User A should see BOTH Secret Shadow Dragon AND Community Solar Griffin
        user_a_search_req = urllib.request.Request(
            f"{base_url}/api/search?name=secret+shadow+dragon",
            headers={'Authorization': f"Bearer {auth_token}"}
        )
        with urllib.request.urlopen(user_a_search_req) as response:
            assert response.status == 200
            s_data = json.loads(response.read().decode('utf-8'))
            assert s_data["total_count"] == 1, "Author should see their own private monster"
            assert s_data["data"][0]["Name"] == "Secret Shadow Dragon"
            print("  [OK] Author (User A) can view their own Private monster.")

        # 2. Anonymous Guest searches: Guest should NOT see Secret Shadow Dragon, but CAN see Community Solar Griffin
        anon_search_priv = urllib.request.Request(f"{base_url}/api/search?name=secret+shadow+dragon")
        with urllib.request.urlopen(anon_search_priv) as response:
            assert response.status == 200
            s_data = json.loads(response.read().decode('utf-8'))
            assert s_data["total_count"] == 0, "Anonymous guest MUST NOT see private monsters"
            print("  [OK] Anonymous guest is blocked from viewing Private monster (0 results).")

        anon_search_pub = urllib.request.Request(f"{base_url}/api/search?name=community+solar+griffin")
        with urllib.request.urlopen(anon_search_pub) as response:
            assert response.status == 200
            s_data = json.loads(response.read().decode('utf-8'))
            assert s_data["total_count"] == 1, "Anonymous guest SHOULD see public monsters"
            print("  [OK] Anonymous guest can view Public custom monster.")

        # 3. Register User B and verify User B cannot see User A's private monster
        user_b_name = f"GM_UserB_{int(time.time())}"
        reg_b_data = json.dumps({"username": user_b_name, "password": "UserBPassword123!", "password_confirm": "UserBPassword123!"}).encode('utf-8')
        reg_b_req = urllib.request.Request(f"{base_url}/api/auth/register", data=reg_b_data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(reg_b_req) as response:
            user_b_token = json.loads(response.read().decode('utf-8'))["token"]

        user_b_search_priv = urllib.request.Request(
            f"{base_url}/api/search?name=secret+shadow+dragon",
            headers={'Authorization': f"Bearer {user_b_token}"}
        )
        with urllib.request.urlopen(user_b_search_priv) as response:
            assert response.status == 200
            s_data = json.loads(response.read().decode('utf-8'))
            assert s_data["total_count"] == 0, "Different user B MUST NOT see user A's private monster"
            print("  [OK] Different User (User B) is blocked from viewing User A's Private monster.")

        user_b_search_pub = urllib.request.Request(
            f"{base_url}/api/search?name=community+solar+griffin",
            headers={'Authorization': f"Bearer {user_b_token}"}
        )
        with urllib.request.urlopen(user_b_search_pub) as response:
            assert response.status == 200
            s_data = json.loads(response.read().decode('utf-8'))
            assert s_data["total_count"] == 1, "User B CAN see User A's Public custom monster"
            print("  [OK] Different User (User B) can view User A's Public custom monster.")

        # 4. User B attempts to DELETE User A's monster -> must be rejected with 403 Forbidden
        user_b_delete_req = urllib.request.Request(
            f"{base_url}/api/delete/{priv_idx}",
            headers={'Authorization': f"Bearer {user_b_token}"},
            method='DELETE'
        )
        try:
            urllib.request.urlopen(user_b_delete_req)
            assert False, "User B should not be allowed to delete User A's monster"
        except urllib.error.HTTPError as e:
            assert e.code == 403, f"Expected 403 Forbidden, got {e.code}"
            print("  [OK] User B deletion of User A's monster correctly rejected with 403 Forbidden.")

        # 5. User A deletes their own monsters
        user_a_del_priv_req = urllib.request.Request(
            f"{base_url}/api/delete/{priv_idx}",
            headers={'Authorization': f"Bearer {auth_token}"},
            method='DELETE'
        )
        with urllib.request.urlopen(user_a_del_priv_req) as response:
            assert response.status == 200
            print("  [OK] Author (User A) successfully deleted their Private monster.")

        # Delete public monster via API search
        search_pub_for_del = urllib.request.Request(
            f"{base_url}/api/search?name=community+solar+griffin",
            headers={'Authorization': f"Bearer {auth_token}"}
        )
        with urllib.request.urlopen(search_pub_for_del) as response:
            pub_search_res = json.loads(response.read().decode('utf-8'))
            if pub_search_res.get("data"):
                pub_del_idx = pub_search_res["data"][0]["_global_index"]
                user_a_del_pub_req = urllib.request.Request(
                    f"{base_url}/api/delete/{pub_del_idx}",
                    headers={'Authorization': f"Bearer {auth_token}"},
                    method='DELETE'
                )
                with urllib.request.urlopen(user_a_del_pub_req) as del_pub_resp:
                    assert del_pub_resp.status == 200
                    print("  [OK] Author (User A) successfully deleted their Public custom monster.")

        # --- Per-Account Favorites & Private->Public Favorite Retention Test Suite ---
        print("\n  [FAVORITES] Testing Per-Account Favorites & Private->Public Favorite Retention...")

        # 1. User A creates a Private monster
        fav_mon_state = {
            "basic": {
                "in-name": "Arcane Star Phoenix",
                "in-cr": "15",
                "in-hp": "220",
                "in-type": "Magical Beast",
                "in-visibility": "private"
            }
        }
        save_fav_mon_req = urllib.request.Request(
            f"{base_url}/api/save",
            data=json.dumps(fav_mon_state).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'Authorization': f"Bearer {auth_token}"}
        )
        with urllib.request.urlopen(save_fav_mon_req) as response:
            assert response.status == 200
            phoenix_res = json.loads(response.read().decode('utf-8'))
            phoenix_idx = phoenix_res["global_index"]
            phoenix_id = phoenix_res.get("id")

        # 2. User A favorites the private monster
        fav_toggle_req = urllib.request.Request(
            f"{base_url}/api/favorite/{phoenix_idx}",
            data=b'{}',
            headers={'Authorization': f"Bearer {auth_token}", 'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(fav_toggle_req) as response:
            assert response.status == 200
            fav_data = json.loads(response.read().decode('utf-8'))
            assert fav_data["is_favorite"] is True, "User A favorite toggle failed"
            print("  [OK] User A favorited their Private monster.")

        # Verify User A sees it in category=favorites
        user_a_fav_search = urllib.request.Request(
            f"{base_url}/api/search?category=favorites",
            headers={'Authorization': f"Bearer {auth_token}"}
        )
        with urllib.request.urlopen(user_a_fav_search) as response:
            assert response.status == 200
            fav_search_data = json.loads(response.read().decode('utf-8'))
            fav_names = [m["Name"] for m in fav_search_data["data"]]
            assert "Arcane Star Phoenix" in fav_names, "Monster should appear in User A's favorites"
            print("  [OK] Private monster appears in User A's favorites.")

        # 3. User A changes monster visibility from Private to Public and saves
        fav_mon_state["basic"]["in-visibility"] = "public"
        fav_mon_state["_global_index"] = phoenix_idx
        if phoenix_id:
            fav_mon_state["id"] = phoenix_id

        save_pub_phoenix_req = urllib.request.Request(
            f"{base_url}/api/save",
            data=json.dumps(fav_mon_state).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'Authorization': f"Bearer {auth_token}"}
        )
        with urllib.request.urlopen(save_pub_phoenix_req) as response:
            assert response.status == 200
            pub_phoenix_res = json.loads(response.read().decode('utf-8'))
            assert pub_phoenix_res["visibility"] == "public"
            phoenix_idx = pub_phoenix_res["global_index"]
            print("  [OK] User A updated monster visibility from Private to Public.")

        # 4. Verify User A STILL has the monster in favorites! (CRITICAL REQUIREMENT)
        with urllib.request.urlopen(user_a_fav_search) as response:
            assert response.status == 200
            fav_search_data = json.loads(response.read().decode('utf-8'))
            fav_names = [m["Name"] for m in fav_search_data["data"]]
            assert "Arcane Star Phoenix" in fav_names, "Monster MUST NOT drop from favorites when switched to public"
            # Verify IsFavorite flag is True on normal search
            user_a_search = urllib.request.Request(
                f"{base_url}/api/search?name=arcane+star+phoenix",
                headers={'Authorization': f"Bearer {auth_token}"}
            )
            with urllib.request.urlopen(user_a_search) as search_resp:
                s_data = json.loads(search_resp.read().decode('utf-8'))
                assert s_data["data"][0]["IsFavorite"] is True, "IsFavorite flag must be True for User A"
            print("  [OK] Monster retained in User A's favorites after switching from Private to Public.")

        # 5. User B searches: Can see the monster (now Public), but NOT favorited for User B (Account Isolation)
        user_b_search = urllib.request.Request(
            f"{base_url}/api/search?name=arcane+star+phoenix",
            headers={'Authorization': f"Bearer {user_b_token}"}
        )
        with urllib.request.urlopen(user_b_search) as response:
            assert response.status == 200
            s_data = json.loads(response.read().decode('utf-8'))
            assert s_data["total_count"] == 1, "User B can see the Public monster"
            assert s_data["data"][0]["IsFavorite"] is False, "Monster MUST NOT be favorited for User B (Account Isolation)"
            print("  [OK] User B sees Public monster as UNFAVORITED (account isolation verified).")

        user_b_fav_search = urllib.request.Request(
            f"{base_url}/api/search?category=favorites",
            headers={'Authorization': f"Bearer {user_b_token}"}
        )
        with urllib.request.urlopen(user_b_fav_search) as response:
            assert response.status == 200
            b_fav_data = json.loads(response.read().decode('utf-8'))
            b_fav_names = [m["Name"] for m in b_fav_data["data"]]
            assert "Arcane Star Phoenix" not in b_fav_names, "User B's favorites list must be empty of User A's favorites"
            print("  [OK] User B's favorites filter correctly excludes monsters favorited by other users.")

        # 6. User B favorites the Public monster -> now both users have it favorited
        user_b_fav_toggle = urllib.request.Request(
            f"{base_url}/api/favorite/{phoenix_idx}",
            data=b'{}',
            headers={'Authorization': f"Bearer {user_b_token}", 'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(user_b_fav_toggle) as response:
            assert response.status == 200
            fav_data = json.loads(response.read().decode('utf-8'))
            assert fav_data["is_favorite"] is True
            print("  [OK] User B favorited the Public monster.")

        with urllib.request.urlopen(user_b_fav_search) as response:
            b_fav_data = json.loads(response.read().decode('utf-8'))
            assert "Arcane Star Phoenix" in [m["Name"] for m in b_fav_data["data"]]
            print("  [OK] Public monster is now in User B's favorites.")

        # 7. User A unfavorites it -> User A no longer has it, but User B still has it
        with urllib.request.urlopen(fav_toggle_req) as response:
            fav_data = json.loads(response.read().decode('utf-8'))
            assert fav_data["is_favorite"] is False
            print("  [OK] User A unfavorited the monster.")

        with urllib.request.urlopen(user_a_fav_search) as response:
            a_fav_data = json.loads(response.read().decode('utf-8'))
            assert "Arcane Star Phoenix" not in [m["Name"] for m in a_fav_data["data"]], "User A should no longer have it in favorites"

        with urllib.request.urlopen(user_b_fav_search) as response:
            b_fav_data = json.loads(response.read().decode('utf-8'))
            assert "Arcane Star Phoenix" in [m["Name"] for m in b_fav_data["data"]], "User B MUST still have it in favorites"
            print("  [OK] Unfavoriting by User A did not affect User B's favorites (full independence).")

        # Cleanup: User A deletes the test monster
        del_phoenix_req = urllib.request.Request(
            f"{base_url}/api/delete/{phoenix_idx}",
            headers={'Authorization': f"Bearer {auth_token}"},
            method='DELETE'
        )
        with urllib.request.urlopen(del_phoenix_req) as response:
            assert response.status == 200
            print("  [OK] Cleaned up test monster.")

        # Test Logout
        print("\n  [AUTH] Testing Logout & Session Invalidation...")
        logout_req = urllib.request.Request(f"{base_url}/api/auth/logout", data=b'{}', headers={'Authorization': f"Bearer {auth_token}", 'Content-Type': 'application/json'})
        with urllib.request.urlopen(logout_req) as response:
            assert response.status == 200
            print("  [OK] Logout endpoint succeeded.")

        # Verify auth_token is now invalid
        try:
            me_auth_req = urllib.request.Request(f"{base_url}/api/auth/me", headers={'Authorization': f"Bearer {auth_token}"})
            urllib.request.urlopen(me_auth_req)
            assert False, "Should fail after logout"
        except urllib.error.HTTPError as e:
            assert e.code == 401
            print("  [OK] Revoked token correctly rejected with 401 Unauthorized.")

        print("  [OK] All HTTP endpoints & Authentication & Privacy Suite verified successfully.")
    finally:
        httpd.shutdown()
        import server.auth
        server.auth.USERS_CACHE = None
        server.auth.SESSIONS_CACHE = None
        if original_users_content is not None:
            with open(users_file, 'w', encoding='utf-8') as f:
                f.write(original_users_content)
        if original_sessions_content is not None:
            with open(sessions_file, 'w', encoding='utf-8') as f:
                f.write(original_sessions_content)
        if original_favorites_content is not None:
            with open(favorites_file, 'w', encoding='utf-8') as f:
                f.write(original_favorites_content)
        if original_custom_monsters_content is not None:
            with open(custom_monsters_file, 'w', encoding='utf-8') as f:
                f.write(original_custom_monsters_content)

    # 8. Testing Default Blank Sheet & Default Colors Configuration
    print("\n8. Testing Default Blank Sheet & Default Colors...")
    with open('html/index.html', 'r', encoding='utf-8') as f:
        index_html = f.read()

    assert 'id="in-name" value=""' in index_html, "Name input must default to empty/blank"
    assert 'id="in-cr" value="1"' in index_html, "CR input must default to 1"
    assert 'id="in-xp" value="400"' in index_html, "XP input must default to 400"
    assert 'option value="theme-parchment" selected' in index_html, "Default theme must be theme-parchment"
    assert 'statblock-paper theme-parchment' in index_html, "Statblock paper must default to theme-parchment"
    assert 'Orchid Giant Mantis' not in index_html, "Sample creature 'Orchid Giant Mantis' should not be hardcoded in default sheet"
    print("  [OK] html/index.html verified with clean default blank sheet and theme-parchment.")

    with open('js/script.js', 'r', encoding='utf-8') as f:
        script_js = f.read()

    assert 'function resetToBlankSheet()' in script_js, "resetToBlankSheet function must exist"
    assert "'in-name': ''" in script_js, "resetToBlankSheet must set empty name"
    assert "theme-parchment" in script_js, "script.js must default to theme-parchment"
    # 9. Testing users.json Schema (Strictly ONLY username and password)
    print("\n9. Testing users.json Schema...")
    with open('data/users.json', 'r', encoding='utf-8') as f:
        users_data = json.load(f)

    assert isinstance(users_data, list), "users.json must be a list of user objects"
    for user_entry in users_data:
        keys = set(user_entry.keys())
        assert keys == {"username", "password"}, f"User entry has invalid keys: {keys}. Must only contain 'username' and 'password'."
    print(f"  [OK] data/users.json verified ({len(users_data)} users). Every record strictly has only 'username' and 'password'.")

    # 10. Testing Last Visited Page & Selected Theme Persistence
    print("\n10. Testing Last Visited Page & Selected Theme Persistence...")
    with open('html/index.html', 'r', encoding='utf-8') as f:
        idx_h = f.read()
    assert "localStorage.setItem('pathgm_last_page', '/html/index.html')" in idx_h
    assert "pf_creator_theme" in idx_h

    with open('html/database.html', 'r', encoding='utf-8') as f:
        db_h = f.read()
    assert "localStorage.setItem('pathgm_last_page', '/html/database.html')" in db_h
    assert "pf_creator_theme" in db_h

    with open('js/script.js', 'r', encoding='utf-8') as f:
        sc_j = f.read()
    assert "pf_creator_theme" in sc_j
    assert "localStorage.setItem('pf_creator_theme', activeTheme)" in sc_j

    with open('js/database.js', 'r', encoding='utf-8') as f:
        db_j = f.read()
    assert "pathgm_last_page" in db_j
    assert "pf_creator_theme" in db_j

    with open('server/http_handler.py', 'r', encoding='utf-8') as f:
        handler_py = f.read()
    assert "pathgm_last_page=" in handler_py
    print("  [OK] Page navigation and theme persistence validated across server, client, and HTML.")

    print("\n========================================================")
    print("  ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (100%) ")
    print("========================================================")
    return True

if __name__ == "__main__":
    success = run_tests()
    if not success:
        sys.exit(1)
