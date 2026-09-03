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
    toggle_favorite,
    export_monsters_dataset,
    import_monsters_from_json
)
from server.monster_formatter import format_monster_from_state, parse_cr
from server.http_handler import PathMonsterDBRequestHandler

def run_tests():
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
    # Test Aura formatting in Monster Formatter
    test_state_aura = {
        "basic": {
            "in-name": "Unholy Knight of Rovesta",
            "in-cr": "11",
            "in-aura": "Aura of despair (100 ft., -2 saves)"
        }
    }
    formatted_aura = format_monster_from_state(test_state_aura)
    assert formatted_aura["Aura"] == "Aura of despair (100 ft., -2 saves)", f"Aura formatting failed: {formatted_aura['Aura']}"
    print(f"  [OK] Aura format verified: '{formatted_aura['Aura']}'")

    # Test Gear formatting in Monster Formatter
    test_state_gear = {
        "basic": {
            "in-name": "Equipped Champion",
            "in-cr": "5",
            "in-gear": "potion of cure light wounds (2), mwk longsword",
            "in-armor-name": "Full Plate",
            "in-shield-name": "Heavy Steel Shield"
        },
        "dynamic": {
            "magic_items": [{"name": "Cloak of Resistance +1", "slot": "Shoulders"}]
        }
    }
    formatted_gear = format_monster_from_state(test_state_gear)
    assert "potion of cure light wounds (2)" in formatted_gear["Gear"]
    assert "mwk longsword" in formatted_gear["Gear"]
    assert "Full Plate" in formatted_gear["Gear"]
    assert "Heavy Steel Shield" in formatted_gear["Gear"]
    assert "Cloak of Resistance +1" in formatted_gear["Gear"]
    print(f"  [OK] Gear format verified: '{formatted_gear['Gear']}'")

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

        # --- Unlimited Monsters & Ownership & UUID Deletion Suite ---
        print("\n  [UNLIMITED & OWNERSHIP] Testing Unlimited Monster Creation, Forking Protection, and UUID Deletion...")
        
        # 1. User A creates 8 custom monsters in a loop to verify unlimited creation
        created_uuids = []
        for b_i in range(1, 9):
            beast_state = {
                "basic": {
                    "in-name": f"Batch Test Beast {b_i}",
                    "in-cr": str(b_i),
                    "in-hp": str(b_i * 15),
                    "in-type": "Magical Beast",
                    "in-visibility": "public"
                }
            }
            save_beast_req = urllib.request.Request(
                f"{base_url}/api/save",
                data=json.dumps(beast_state).encode('utf-8'),
                headers={'Content-Type': 'application/json', 'Authorization': f"Bearer {auth_token}"}
            )
            with urllib.request.urlopen(save_beast_req) as b_resp:
                assert b_resp.status == 200
                b_res_data = json.loads(b_resp.read().decode('utf-8'))
                assert b_res_data["status"] == "ok"
                assert b_res_data.get("id"), "Saved monster must have a persistent UUID"
                created_uuids.append(b_res_data["id"])
        
        print(f"  [OK] User A created {len(created_uuids)} monsters in rapid succession (unlimited verified).")

        # 2. Verify User B cannot delete User A's monster using UUID
        target_uuid = created_uuids[0]
        b_del_a_uuid_req = urllib.request.Request(
            f"{base_url}/api/delete/{target_uuid}",
            headers={'Authorization': f"Bearer {user_b_token}"},
            method='DELETE'
        )
        try:
            urllib.request.urlopen(b_del_a_uuid_req)
            assert False, "User B should not be allowed to delete User A's monster by UUID"
        except urllib.error.HTTPError as e:
            assert e.code == 403, f"Expected 403 Forbidden, got {e.code}"
            print("  [OK] Cross-user deletion by UUID strictly rejected with 403 Forbidden.")

        # 3. Verify User B editing User A's monster automatically forks without modifying User A's monster
        fork_state = {
            "id": target_uuid,
            "basic": {
                "in-name": "Batch Test Beast 1 (User B Remix)",
                "in-cr": "10",
                "in-visibility": "public"
            }
        }
        b_save_fork_req = urllib.request.Request(
            f"{base_url}/api/save",
            data=json.dumps(fork_state).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'Authorization': f"Bearer {user_b_token}"}
        )
        with urllib.request.urlopen(b_save_fork_req) as fork_resp:
            assert fork_resp.status == 200
            fork_data = json.loads(fork_resp.read().decode('utf-8'))
            assert fork_data["id"] != target_uuid, "Forked monster must receive a NEW distinct UUID"
            assert fork_data["author"] == user_b_name, "Forked monster author must be User B"
            user_b_forked_uuid = fork_data["id"]
            print("  [OK] Editing another user's monster safely forks into a new independent entry.")

        # 4. User A deletes all 8 created monsters by UUID
        for u_id in created_uuids:
            del_u_req = urllib.request.Request(
                f"{base_url}/api/delete/{u_id}",
                headers={'Authorization': f"Bearer {auth_token}"},
                method='DELETE'
            )
            with urllib.request.urlopen(del_u_req) as del_resp:
                assert del_resp.status == 200
        print("  [OK] User A successfully deleted all created monsters by UUID.")

        # 5. User B deletes their forked monster by UUID
        del_fork_req = urllib.request.Request(
            f"{base_url}/api/delete/{user_b_forked_uuid}",
            headers={'Authorization': f"Bearer {user_b_token}"},
            method='DELETE'
        )
        with urllib.request.urlopen(del_fork_req) as del_f_resp:
            assert del_f_resp.status == 200
        print("  [OK] User B successfully deleted their forked monster by UUID.")

        # 6. Official monster deletion attempt rejected with 400 Bad Request
        del_official_req = urllib.request.Request(
            f"{base_url}/api/delete/0",
            headers={'Authorization': f"Bearer {auth_token}"},
            method='DELETE'
        )
        try:
            urllib.request.urlopen(del_official_req)
            assert False, "Official monster deletion must be rejected"
        except urllib.error.HTTPError as e:
            assert e.code == 400
            print("  [OK] Official monster deletion correctly rejected with 400 Bad Request.")

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

        # Test Database Export & Import Suite
        print("\n  [DATABASE JSON] Testing Database Export (All, Custom, Filtered) & Bulk Import Suite...")

        # 1. Export All
        export_all_req = urllib.request.Request(f"{base_url}/api/database/export?scope=all", headers={'Authorization': f"Bearer {auth_token}"})
        with urllib.request.urlopen(export_all_req) as response:
            assert response.status == 200
            exp_all = json.loads(response.read().decode('utf-8'))
            assert exp_all.get("scope") == "all"
            assert exp_all.get("total_count", 0) > 5000
            assert isinstance(exp_all.get("data"), list)
            print(f"  [OK] Export All monsters succeeded ({exp_all.get('total_count')} monsters in dataset).")

        # 2. Export Custom
        export_custom_req = urllib.request.Request(f"{base_url}/api/database/export?scope=custom", headers={'Authorization': f"Bearer {auth_token}"})
        with urllib.request.urlopen(export_custom_req) as response:
            assert response.status == 200
            exp_custom = json.loads(response.read().decode('utf-8'))
            assert exp_custom.get("scope") == "custom"
            assert isinstance(exp_custom.get("data"), list)
            print(f"  [OK] Export Custom monsters succeeded ({exp_custom.get('total_count')} custom monsters).")

        # 3. Export Filtered
        export_filt_req = urllib.request.Request(f"{base_url}/api/database/export?scope=filtered&name=dragon&type=dragon", headers={'Authorization': f"Bearer {auth_token}"})
        with urllib.request.urlopen(export_filt_req) as response:
            assert response.status == 200
            exp_filt = json.loads(response.read().decode('utf-8'))
            assert exp_filt.get("scope") == "filtered"
            assert exp_filt.get("total_count", 0) > 0
            print(f"  [OK] Export Filtered monsters succeeded ({exp_filt.get('total_count')} matching dragons).")

        # 4. Import Single Monster & Array of Monsters
        import_sample = [
            {
                "basic": {
                    "in-name": "Imported Test Chimera",
                    "in-cr": "9",
                    "in-type": "Magical Beast",
                    "in-alignment": "CE",
                    "in-str": "19",
                    "in-dex": "12",
                    "in-con": "17"
                },
                "dynamic": {}
            },
            {
                "basic": {
                    "in-name": "Imported Test Golem",
                    "in-cr": "11",
                    "in-type": "Construct",
                    "in-alignment": "N",
                    "in-str": "24",
                    "in-dex": "9",
                    "in-con": "10"
                },
                "dynamic": {}
            }
        ]
        import_req = urllib.request.Request(
            f"{base_url}/api/database/import",
            data=json.dumps(import_sample).encode('utf-8'),
            headers={'Authorization': f"Bearer {auth_token}", 'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(import_req) as response:
            assert response.status == 200
            imp_res = json.loads(response.read().decode('utf-8'))
            assert imp_res.get("status") == "ok"
            assert imp_res.get("imported_count") == 2
            print("  [OK] Successfully imported batch JSON array with 2 monsters.")

        # Search for imported monster
        imp_search_req = urllib.request.Request(f"{base_url}/api/search?name=Imported+Test+Chimera")
        with urllib.request.urlopen(imp_search_req) as response:
            imp_search_data = json.loads(response.read().decode('utf-8'))
            assert imp_search_data.get("total_count", 0) >= 1
            chimera_mon = imp_search_data["data"][0]
            chimera_idx = chimera_mon["_global_index"]
            print(f"  [OK] Imported monster '{chimera_mon['Name']}' is searchable in database.")

        # Cleanup imported monsters
        del_chimera = urllib.request.Request(f"{base_url}/api/delete/{chimera_idx}", headers={'Authorization': f"Bearer {auth_token}"}, method='DELETE')
        with urllib.request.urlopen(del_chimera) as response:
            assert response.status == 200

        # Find and cleanup second monster
        imp_search_req2 = urllib.request.Request(f"{base_url}/api/search?name=Imported+Test+Golem")
        with urllib.request.urlopen(imp_search_req2) as response:
            imp_search_data2 = json.loads(response.read().decode('utf-8'))
            if imp_search_data2.get("total_count", 0) >= 1:
                golem_idx = imp_search_data2["data"][0]["_global_index"]
                del_golem = urllib.request.Request(f"{base_url}/api/delete/{golem_idx}", headers={'Authorization': f"Bearer {auth_token}"}, method='DELETE')
                with urllib.request.urlopen(del_golem) as resp_del:
                    assert resp_del.status == 200
                print("  [OK] Cleaned up imported test monsters.")

        # --- Database Filter Verification Suite ---
        print("\n  [FILTERS] Testing Full Database Filter Suite (Categories, Types, Sizes, Environments, CR, Alignments)...")
        
        # 1. Category Filters
        cat_tests = [
            ("custom", lambda d: all(m.get("IsUserCustom") for m in d["data"]) and d["total_count"] > 0),
            ("official_monster", lambda d: all(not m.get("IsUserCustom") and str(m.get("CharacterFlag", "0")) == "0" for m in d["data"]) and d["total_count"] > 3000),
            ("official_npc", lambda d: all(not m.get("IsUserCustom") and str(m.get("CharacterFlag", "0")) == "1" for m in d["data"]) and d["total_count"] > 1000),
            ("unique_monster", lambda d: all(str(m.get("UniqueMonster", "0")) == "1" for m in d["data"]) and d["total_count"] > 300),
            ("mythic_monster", lambda d: d["total_count"] >= 40),
            ("3pp_monster", lambda d: d["total_count"] >= 800),
        ]
        for cat_name, validator in cat_tests:
            c_req = urllib.request.Request(f"{base_url}/api/search?category={cat_name}&per_page=20")
            with urllib.request.urlopen(c_req) as resp:
                c_data = json.loads(resp.read().decode('utf-8'))
                assert validator(c_data), f"Category filter failed for {cat_name}: {c_data['total_count']} results"
                print(f"  [OK] Category filter '{cat_name}' verified ({c_data['total_count']} monsters).")

        # 2. Type Filter Isolation (Humanoid vs Monstrous Humanoid)
        h_req = urllib.request.Request(f"{base_url}/api/search?type=humanoid&per_page=50")
        with urllib.request.urlopen(h_req) as resp:
            h_data = json.loads(resp.read().decode('utf-8'))
            for m in h_data["data"]:
                m_type = str(m.get("Type", "")).lower()
                assert "monstrous humanoid" not in m_type, f"Humanoid filter incorrectly included Monstrous Humanoid: {m['Name']}"
            print(f"  [OK] Creature Type 'humanoid' strictly isolated from monstrous humanoid ({h_data['total_count']} monsters).")

        mh_req = urllib.request.Request(f"{base_url}/api/search?type=monstrous+humanoid&per_page=50")
        with urllib.request.urlopen(mh_req) as resp:
            mh_data = json.loads(resp.read().decode('utf-8'))
            assert mh_data["total_count"] >= 39
            print(f"  [OK] Creature Type 'monstrous humanoid' verified ({mh_data['total_count']} monsters).")

        # 3. Size Filter
        sz_req = urllib.request.Request(f"{base_url}/api/search?size=colossal&per_page=20")
        with urllib.request.urlopen(sz_req) as resp:
            sz_data = json.loads(resp.read().decode('utf-8'))
            assert sz_data["total_count"] >= 80
            assert all(str(m.get("Size", "")).lower() == "colossal" for m in sz_data["data"])
            print(f"  [OK] Size filter 'colossal' verified ({sz_data['total_count']} monsters).")

        # 4. Environment Synonyms & Expanded Environments
        env_tests = [
            ("aquatic", lambda count: count >= 240),
            ("swamp", lambda count: count >= 80),
            ("cold", lambda count: count >= 100),
            ("planar", lambda count: count >= 380),
            ("underground", lambda count: count >= 170),
        ]
        for env_name, validator in env_tests:
            e_req = urllib.request.Request(f"{base_url}/api/search?environment={env_name}&per_page=10")
            with urllib.request.urlopen(e_req) as resp:
                e_data = json.loads(resp.read().decode('utf-8'))
                assert validator(e_data["total_count"]), f"Environment {env_name} count unexpected: {e_data['total_count']}"
                print(f"  [OK] Environment filter '{env_name}' with synonyms verified ({e_data['total_count']} monsters).")

        # 5. Fractional & High CR Filter
        cr_tests = [("1/2", 0.5), ("0.33", 0.33), ("35", 35.0), ("39", 39.0)]
        for cr_val, num_cr in cr_tests:
            cr_req = urllib.request.Request(f"{base_url}/api/search?cr={cr_val}")
            with urllib.request.urlopen(cr_req) as resp:
                cr_data = json.loads(resp.read().decode('utf-8'))
                assert cr_data["total_count"] >= 1, f"CR filter failed for {cr_val}"
                print(f"  [OK] CR filter '{cr_val}' verified ({cr_data['total_count']} monsters).")

        # 6. Multi-term Tokenized Name Search
        n_req = urllib.request.Request(f"{base_url}/api/search?name=dragon+red")
        with urllib.request.urlopen(n_req) as resp:
            n_data = json.loads(resp.read().decode('utf-8'))
            assert n_data["total_count"] >= 10
            print(f"  [OK] Multi-term search 'dragon red' verified ({n_data['total_count']} matching monsters).")

        # 7. Alignment Filter (with compound alignment support)
        al_req = urllib.request.Request(f"{base_url}/api/search?alignment=ng")
        with urllib.request.urlopen(al_req) as resp:
            al_data = json.loads(resp.read().decode('utf-8'))
            assert al_data["total_count"] >= 120
            print(f"  [OK] Alignment filter 'NG' verified ({al_data['total_count']} monsters).")

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
        # --- Folder System Live Endpoints Verification ---
        print("\n  [FOLDERS] Testing Live Folder Endpoints (Create, Add, List, Monsters, Filter, Remove, Delete)...")
        create_payload = json.dumps({"name": "Test Goblin Lair", "description": "Lair encounters"}).encode('utf-8')
        req = urllib.request.Request(f"{base_url}/api/folders", data=create_payload, headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            res_data = json.loads(resp.read().decode('utf-8'))
            assert res_data.get('status') == 'ok'
            folder_obj = res_data.get('folder', {})
            test_folder_id = folder_obj.get('id')
            assert test_folder_id, "Folder ID must be returned on creation"
            assert folder_obj.get('name') == "Test Goblin Lair"
        print(f"  [OK] Created folder '{folder_obj.get('name')}' (id: {test_folder_id}).")

        # Add monster to folder
        add_payload = json.dumps({"folder_id": test_folder_id, "monster_key": "official:bugbear:paizo inc. - pathfinder rpg bestiary"}).encode('utf-8')
        req = urllib.request.Request(f"{base_url}/api/folders/add", data=add_payload, headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            res_data = json.loads(resp.read().decode('utf-8'))
            assert res_data.get('status') == 'ok'
            keys = res_data.get('folder', {}).get('monster_keys', [])
            assert "official:bugbear:paizo inc. - pathfinder rpg bestiary" in keys
        print("  [OK] Added monster 'Bugbear' to folder.")

        # Query folder monsters
        with urllib.request.urlopen(f"{base_url}/api/folders/{test_folder_id}/monsters") as resp:
            assert resp.status == 200
            res_data = json.loads(resp.read().decode('utf-8'))
            monsters = res_data.get('monsters', [])
            assert len(monsters) == 1, f"Expected 1 monster in folder, got {len(monsters)}"
            assert monsters[0].get('Name') == "Bugbear"
        print("  [OK] /api/folders/<id>/monsters returned correct monster dataset.")

        # Search with folder filter
        with urllib.request.urlopen(f"{base_url}/api/search?folder={test_folder_id}") as resp:
            assert resp.status == 200
            res_data = json.loads(resp.read().decode('utf-8'))
            assert res_data.get('total_count') == 1
            assert res_data['data'][0].get('Name') == "Bugbear"
        print("  [OK] /api/search?folder=<id> successfully filtered results to folder.")

        # Remove monster from folder
        rem_payload = json.dumps({"folder_id": test_folder_id, "monster_key": "official:bugbear:paizo inc. - pathfinder rpg bestiary"}).encode('utf-8')
        req = urllib.request.Request(f"{base_url}/api/folders/remove", data=rem_payload, headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            res_data = json.loads(resp.read().decode('utf-8'))
            assert res_data.get('status') == 'ok'
            keys = res_data.get('folder', {}).get('monster_keys', [])
            assert "official:bugbear:paizo inc. - pathfinder rpg bestiary" not in keys
        print("  [OK] Removed monster from folder.")

        # Delete folder
        req = urllib.request.Request(f"{base_url}/api/folders/{test_folder_id}", method='DELETE')
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200
            res_data = json.loads(resp.read().decode('utf-8'))
            assert res_data.get('status') == 'ok'
        print("  [OK] Deleted test folder.")

        # Verify folder is deleted
        with urllib.request.urlopen(f"{base_url}/api/folders") as resp:
            assert resp.status == 200
            res_data = json.loads(resp.read().decode('utf-8'))
            ids = [f.get('id') for f in res_data.get('folders', [])]
            assert test_folder_id not in ids
        print("  [OK] Folder deletion verified across user folder list.")

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

    # Verify All 11 New Curated Themes are present in all systems
    with open('css/themes.css', 'r', encoding='utf-8') as f:
        th_css = f.read()

    new_themes = [
        'theme-astral-silver', 'theme-elven-grove', 'theme-sunken-pearl', 'theme-mythic-rose',
        'theme-leviathan', 'theme-blood-moon', 'theme-spectral', 'theme-molten-forge',
        'theme-tempest', 'theme-eldritch-void', 'theme-toxic-hive'
    ]
    for nt in new_themes:
        assert f".{nt}" in th_css, f"themes.css missing class .{nt}"
        assert f'value="{nt}"' in idx_h, f"index.html missing option {nt}"
        assert f'value="{nt}"' in db_h, f"database.html missing option {nt}"
        assert f"'{nt}'" in sc_j or f'"{nt}"' in sc_j, f"script.js missing {nt}"
        assert f"'{nt}'" in db_j or f'"{nt}"' in db_j, f"database.js missing {nt}"

    assert "All (33)" in idx_h, "index.html must have All (33) filter button"
    assert "All (33)" in db_h, "database.html must have All (33) filter button"
    assert "Obsidian Amber" in idx_h, "index.html must have Obsidian Amber"
    assert "Golden Hour" in idx_h, "index.html must have Golden Hour"
    assert "'theme-golden-hour'" in sc_j or '"theme-golden-hour"' in sc_j, "script.js must have theme-golden-hour"
    assert "'theme-golden-hour'" in db_j or '"theme-golden-hour"' in db_j, "database.js must have theme-golden-hour"
    print(f"  [OK] Master Theme System verified ({len(new_themes)} new themes, 33 total curated themes including Obsidian Amber and Golden Hour across CSS, HTML, JS).")



    # 11. Testing JSON Buttons & Modals Configuration
    print("\n11. Testing JSON Buttons & Modals Configuration...")
    with open('html/index.html', 'r', encoding='utf-8') as f:
        idx_html_content = f.read()
    assert 'id="btn-save-json"' in idx_html_content, "index.html must have btn-save-json"
    assert 'id="btn-load-json"' in idx_html_content, "index.html must have btn-load-json"
    assert 'id="btn-save-as-new"' in idx_html_content, "index.html must have btn-save-as-new"
    assert 'id="mob-btn-save-as-new"' in idx_html_content, "index.html must have mob-btn-save-as-new"
    assert 'id="mob-btn-save-json"' in idx_html_content, "index.html must have mob-btn-save-json"
    assert 'id="mob-btn-load-json"' in idx_html_content, "index.html must have mob-btn-load-json"

    with open('html/database.html', 'r', encoding='utf-8') as f:
        db_html_content = f.read()
    assert 'id="btn-export-db-json"' in db_html_content, "database.html must have btn-export-db-json"
    assert 'id="btn-import-db-json"' in db_html_content, "database.html must have btn-import-db-json"
    assert 'id="mob-btn-export-db-json"' in db_html_content, "database.html must have mob-btn-export-db-json"
    assert 'id="mob-btn-import-db-json"' in db_html_content, "database.html must have mob-btn-import-db-json"
    assert 'id="modal-export-database"' in db_html_content, "database.html must have modal-export-database"

    with open('js/ui.js', 'r', encoding='utf-8') as f:
        ui_js_content = f.read()
    assert 'mob-btn-export-db-json' in ui_js_content, "ui.js must delegate mob-btn-export-db-json"
    assert 'mob-btn-import-db-json' in ui_js_content, "ui.js must delegate mob-btn-import-db-json"
    assert 'mob-btn-save-as-new' in ui_js_content, "ui.js must delegate mob-btn-save-as-new"

    print("  [OK] JSON download and upload buttons, mobile drawer actions, and export modals verified across all pages.")

    # 12. Testing Folder Management, Filtering, and Multi-Page PDF & PNG Infrastructure
    print("\n12. Testing Folder Management, Filtering, and Multi-Page PDF & PNG Infrastructure...")
    with open('html/database.html', 'r', encoding='utf-8') as f:
        db_html_content = f.read()
    assert 'id="select-active-folder"' in db_html_content, "database.html must have select-active-folder"
    assert 'id="btn-create-folder"' in db_html_content, "database.html must have btn-create-folder"
    assert 'id="btn-folder-export-pdf"' in db_html_content, "database.html must have btn-folder-export-pdf"
    assert 'id="btn-folder-export-png"' in db_html_content, "database.html must have btn-folder-export-png"
    assert 'id="btn-folder-export-json"' in db_html_content, "database.html must have btn-folder-export-json"
    assert 'id="modal-folder-editor"' in db_html_content, "database.html must have modal-folder-editor"
    assert 'id="modal-assign-folder"' in db_html_content, "database.html must have modal-assign-folder"
    assert 'id="modal-pdf-progress"' in db_html_content, "database.html must have modal-pdf-progress"
    assert 'id="folder-pdf-stage"' in db_html_content, "database.html must have folder-pdf-stage"
    assert 'jspdf.umd.min.js' in db_html_content, "database.html must include jspdf vendor library"
    assert 'html2canvas.min.js' in db_html_content, "database.html must include html2canvas vendor library"

    with open('js/database.js', 'r', encoding='utf-8') as f:
        db_js_content = f.read()
    assert 'function loadFolders()' in db_js_content, "database.js must have loadFolders"
    assert 'function exportFolderToPdf(' in db_js_content, "database.js must have exportFolderToPdf"
    assert 'function exportFolderToPng(' in db_js_content, "database.js must have exportFolderToPng"
    assert 'function renderMonsterStatblockHTML(' in db_js_content, "database.js must have renderMonsterStatblockHTML"
    assert 'function openAssignFolderModal(' in db_js_content, "database.js must have openAssignFolderModal"
    print("  [OK] Folder dropdown, export options (PDF, PNG, JSON), modals, and JS engines verified.")

    # 13. Testing Furious Focus & Power Attack Calculations
    print("\n13. Testing Furious Focus & Power Attack Calculations...")
    with open('js/script.js', 'r', encoding='utf-8') as f:
        sc_content = f.read()

    assert "furious focus" in sc_content.lower(), "script.js must handle furious focus"
    assert "currentPenalty = 0" in sc_content, "applyPAtoRaw must set currentPenalty = 0 for Furious Focus"
    assert "paPenalty = 0;" in sc_content, "processRow must set paPenalty = 0 for Furious Focus"
    assert "paPenalty === 0) ?" not in sc_content, "Iterative attacks must not re-apply Power Attack penalty when Furious Focus is active"
    print("  [OK] Furious Focus verified: Power Attack negative attack penalties successfully removed across all melee and iterative attacks.")

    print("\n========================================================")
    print("  ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (100%) ")
    print("========================================================")
    return True

if __name__ == "__main__":
    success = run_tests()
    if not success:
        sys.exit(1)
