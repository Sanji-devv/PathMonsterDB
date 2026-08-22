import os
import json
import uuid
import secrets
import hashlib
import re
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
SESSIONS_FILE = os.path.join(DATA_DIR, 'sessions.json')

# In-memory caches for fast concurrent access
USERS_CACHE = None
SESSIONS_CACHE = None

SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60  # 30 days

def _ensure_data_files():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error initializing users.json: {e}")
    if not os.path.exists(SESSIONS_FILE):
        try:
            with open(SESSIONS_FILE, 'w', encoding='utf-8') as f:
                json.dump({}, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error initializing sessions.json: {e}")

def _load_users():
    global USERS_CACHE
    _ensure_data_files()
    try:
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            USERS_CACHE = json.load(f)
    except Exception as e:
        print(f"Error loading users.json: {e}")
        USERS_CACHE = []
    return USERS_CACHE

def _save_users():
    global USERS_CACHE
    if USERS_CACHE is None:
        return
    try:
        temp_file = USERS_FILE + '.tmp'
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(USERS_CACHE, f, ensure_ascii=False, indent=2)
        if os.path.exists(USERS_FILE):
            os.replace(temp_file, USERS_FILE)
        else:
            os.rename(temp_file, USERS_FILE)
    except Exception as e:
        print(f"Error saving users.json: {e}")

def _load_sessions():
    global SESSIONS_CACHE
    _ensure_data_files()
    try:
        with open(SESSIONS_FILE, 'r', encoding='utf-8') as f:
            SESSIONS_CACHE = json.load(f)
    except Exception as e:
        print(f"Error loading sessions.json: {e}")
        SESSIONS_CACHE = {}
    return SESSIONS_CACHE

def _save_sessions():
    global SESSIONS_CACHE
    if SESSIONS_CACHE is None:
        return
    try:
        temp_file = SESSIONS_FILE + '.tmp'
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(SESSIONS_CACHE, f, ensure_ascii=False, indent=2)
        if os.path.exists(SESSIONS_FILE):
            os.replace(temp_file, SESSIONS_FILE)
        else:
            os.rename(temp_file, SESSIONS_FILE)
    except Exception as e:
        print(f"Error saving sessions.json: {e}")

def hash_password(password: str, salt: str = None) -> tuple:
    if salt is None:
        salt = secrets.token_hex(16)
    # Standard PBKDF2 HMAC SHA-256 with 100,000 iterations
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    ).hex()
    return pwd_hash, salt

def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    pwd_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(pwd_hash, expected_hash)

def validate_username(username: str) -> bool:
    if not username or not isinstance(username, str):
        return False
    username = username.strip()
    if len(username) < 3 or len(username) > 30:
        return False
    # Allow alphanumeric characters, underscores, hyphens, and spaces
    pattern = r'^[a-zA-Z0-9_\- .]+$'
    return bool(re.match(pattern, username))

def create_session(user: dict) -> str:
    sessions = _load_sessions()
    token = secrets.token_hex(32)
    now = int(time.time())
    username = user.get("username") or user.get("name") or user.get("email", "")
    sessions[token] = {
        "user_id": user["id"],
        "username": username,
        "created_at": now,
        "expires_at": now + SESSION_DURATION_SECONDS
    }
    _save_sessions()
    return token

def get_user_by_token(token: str) -> dict:
    if not token or not isinstance(token, str):
        return None
    sessions = _load_sessions()
    session = sessions.get(token)
    if not session:
        return None
    now = int(time.time())
    if session.get("expires_at", 0) < now:
        del sessions[token]
        _save_sessions()
        return None
    
    users = _load_users()
    for u in users:
        if u["id"] == session["user_id"]:
            username = u.get("username") or u.get("name") or u.get("email", "")
            return {
                "id": u["id"],
                "username": username,
                "created_at": u.get("created_at", "")
            }
    return None

def get_authenticated_user_from_headers(headers) -> dict:
    auth_header = headers.get('Authorization', '')
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header[7:].strip()
    elif 'Cookie' in headers:
        cookies = headers.get('Cookie', '').split(';')
        for cookie in cookies:
            parts = cookie.strip().split('=')
            if len(parts) == 2 and parts[0] == 'pathgm_token':
                token = parts[1]
                break
    if token:
        return get_user_by_token(token)
    return None

def register_user(data_dict: dict) -> tuple:
    username = str(data_dict.get('username') or data_dict.get('name') or data_dict.get('email') or '').strip()
    password = str(data_dict.get('password', ''))
    password_confirm = data_dict.get('password_confirm')

    if not username:
        return {"status": "error", "message": "Username is required."}, 400
    if not validate_username(username):
        return {"status": "error", "message": "Username must be between 3 and 30 characters and contain valid characters."}, 400
    if not password or len(password) < 6:
        return {"status": "error", "message": "Password must be at least 6 characters."}, 400
    if password_confirm is not None and password != str(password_confirm):
        return {"status": "error", "message": "Passwords do not match."}, 400

    users = _load_users()
    username_lower = username.lower()
    for u in users:
        existing_name = str(u.get("username") or u.get("name") or u.get("email") or '').lower()
        if existing_name == username_lower:
            return {"status": "error", "message": "Username is already taken."}, 409

    pwd_hash, salt = hash_password(password)
    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "username": username,
        "password_hash": pwd_hash,
        "salt": salt,
        "created_at": time.strftime('%Y-%m-%d %H:%M:%S')
    }

    users.append(new_user)
    _save_users()

    token = create_session(new_user)

    user_info = {
        "id": user_id,
        "username": username,
        "created_at": new_user["created_at"]
    }

    return {
        "status": "ok",
        "message": "Registration successful!",
        "token": token,
        "user": user_info
    }, 201

def login_user(data_dict: dict) -> tuple:
    username = str(data_dict.get('username') or data_dict.get('name') or data_dict.get('email') or '').strip()
    password = str(data_dict.get('password', ''))

    if not username or not password:
        return {"status": "error", "message": "Username and password are required."}, 400

    users = _load_users()
    matched_user = None
    username_lower = username.lower()
    for u in users:
        existing_name = str(u.get("username") or u.get("name") or u.get("email") or '').lower()
        if existing_name == username_lower:
            matched_user = u
            break

    if not matched_user:
        return {"status": "error", "message": "Invalid username or password."}, 401

    if not verify_password(password, matched_user["salt"], matched_user["password_hash"]):
        return {"status": "error", "message": "Invalid username or password."}, 401

    token = create_session(matched_user)

    display_username = matched_user.get("username") or matched_user.get("name") or matched_user.get("email")

    user_info = {
        "id": matched_user["id"],
        "username": display_username,
        "created_at": matched_user.get("created_at", "")
    }

    return {
        "status": "ok",
        "message": "Login successful!",
        "token": token,
        "user": user_info
    }, 200

def logout_user(token: str) -> tuple:
    if not token:
        return {"status": "ok"}, 200
    sessions = _load_sessions()
    if token in sessions:
        del sessions[token]
        _save_sessions()
    return {"status": "ok", "message": "Logged out successfully."}, 200
