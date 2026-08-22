# Active Context

## 🎯 Current Focus
- Establishing and maintaining the complete **Memory Bank architecture** under `agents/` to ensure persistent context, zero hallucination, and seamless development across AI sessions.
- Maintaining system stability, fast query caching, and 100% test coverage across the 12 JSON databases.
- Preparing for upcoming Phase 1 features (Interactive Dice Roller & Combat Condition Status Toggles).

---

## 🕒 Recent Completed Changes

1. **Memory Bank Implementation (`agents/`):**
   - Created comprehensive English documentation: `productContext.md`, `systemPatterns.md`, `techContext.md`, `activeContext.md`, `progress.md`, and `AGENTS.md`.
2. **100% English UI Localization:**
   - Standardized all UI inputs, labels, tooltips, modal headers, font dropdowns, and button captions across `index.html` and `database.html`.
3. **Interactive Stepper Suite & Free-Form Combat Modifiers:**
   - **Extra HP Stepper Suite (`in-hp-extra`):** Real-time HP integration with `[-10]`, `[-5]`, `[-1]`, `[+1]`, `[+5]`, `[+10]`, and `[↺ 0]` quick adjusters.
   - **Editable CMB & CMD Controls (`in-cmb`, `in-cmd`, `in-cmb-extra`, `in-cmd-extra`):** Unlocked inputs for custom notation (e.g., `+12 (+16 grapple)`) with stepper buttons `[-2]`, `[-1]`, `[+1]`, `[+2]`, `[↺ Reset]`.
4. **Modular JavaScript Refactoring:**
   - Split complex logic from monolithic scripts into dedicated modules (`js/state.js`, `js/ui.js`, `js/mechanics.js`, `js/spells.js`, `js/inventory.js`).
5. **Automated Verification Test Suite (`test_all.py`):**
   - Comprehensive test harness covering static assets, JSON integrity, search caching, CRUD operations, and HTTP endpoints.
6. **Complete Username & Password Authentication System:**
   - Pure username + password registration (with password confirmation) and login.
   - PBKDF2-HMAC-SHA256 salted password hashing & session management in `server/auth.py`.
   - REST endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`).
   - Fantasy RPG-themed Authentication Modal with login/register tabs, eye show/hide password, and user profile widget in `js/auth.js`.
   - User metadata attribution for saved monsters (`/api/save`).
   - 100% automated test coverage in `test_all.py`.

---

## 🔮 Next Immediate Steps

1. **Interactive Dice Roller (Phase 1.1):**
   - Enable clicking on attack bonuses (e.g. `+14`), damage expressions (e.g. `1d8+6`), saving throws (`Fort +9`), and skill modifiers to roll simulated dice with critical confirmation popups.
2. **Quick Combat Condition Toggles (Phase 1.2):**
   - Add status buttons (*Grappled*, *Prone*, *Sickened*, *Entangled*, *Blinded*) that dynamically adjust AC, attack penalties, and speeds in real-time.
3. **1-Click Monster Template Engine (Phase 1.3):**
   - Enable instant application of standard templates (*Fiendish*, *Celestial*, *Advanced*, *Skeleton*, *Zombie*).

---

## ⚠️ Active Risks & Technical Considerations

- **Preserve Zero-Dependency Policy:** Ensure no npm or pip packages are introduced during feature additions.
- **Cache Invalidation on Custom Monster Changes:** Whenever a custom monster is added, edited, or deleted, `SEARCH_CACHE` in `server/data_manager.py` must be cleared to prevent stale search results.
- **LocalStorage Quota Limits:** Custom themes and local drafts should stay lightweight to avoid exceeding browser `localStorage` capacity.
- **Responsive 35% Sidebar Transitions:** When adding new form inputs to `index.html`, maintain proper flex/grid constraints so the sidebar collapses smoothly without horizontal overflow.
