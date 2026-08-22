# Active Context

## 🎯 Current Focus
- Establishing and maintaining the complete **Memory Bank architecture** under `agents/` to ensure persistent context, zero hallucination, and seamless development across AI sessions.
- Maintaining system stability, fast query caching, and 100% test coverage across the 12 JSON databases.
- Preparing for high-complexity feature: **Dynamic Spellcasting Resolution & Automatic Spell Save DC Engine** (resolving SLA/Class key casting modifiers, spell schools, levels, and Spell Focus feat synergies).

---

## 🕒 Recent Completed Changes

1. **Memory Bank Architecture Updates (`agents/`):**
   - Updated `memory bank.md`, `productContext.md`, `progress.md`, and `activeContext.md` with explicit feature prohibitions and detailed architectural design for the Dynamic Spell Save DC Engine.
2. **Explicit Feature Prohibitions Enforced:**
   - Permanently banned and marked as Out-of-Scope: *Interactive Dice Roller*, *Live Initiative/Health Tracker*, and *Custom Magic Weapon/Armor Forge*.
3. **100% English UI Localization:**
   - Standardized all UI inputs, labels, tooltips, modal headers, font dropdowns, and button captions across `index.html` and `database.html`.
4. **Interactive Stepper Suite & Free-Form Combat Modifiers:**
   - **Extra HP Stepper Suite (`in-hp-extra`):** Real-time HP integration with `[-10]`, `[-5]`, `[-1]`, `[+1]`, `[+5]`, `[+10]`, and `[↺ 0]` quick adjusters.
   - **Editable CMB & CMD Controls (`in-cmb`, `in-cmd`, `in-cmb-extra`, `in-cmd-extra`):** Unlocked inputs for custom notation (e.g., `+12 (+16 grapple)`) with stepper buttons `[-2]`, `[-1]`, `[+1]`, `[+2]`, `[↺ Reset]`.
5. **Modular JavaScript Refactoring:**
   - Split complex logic from monolithic scripts into dedicated modules (`js/state.js`, `js/ui.js`, `js/mechanics.js`, `js/spells.js`, `js/inventory.js`).
6. **Automated Verification Test Suite (`test_all.py`):**
   - Comprehensive test harness covering static assets, JSON integrity, search caching, CRUD operations, and HTTP endpoints.
7. **Complete Username & Password Authentication System:**
   - Pure username + password registration (with password confirmation) and login with PBKDF2 hashing in `server/auth.py` and `js/auth.js`.
---

## 🔮 Next Immediate Steps

1. **[ZORLU GELİŞTİRME] Dynamic Spellcasting Resolution & Automatic Spell Save DC Engine:**
   - **Key Casting Modifier Resolution:** Implement SLA key attribute selection (Cha default, Wis, Int) and primary caster class attribute bindings (Wizard: Int, Cleric/Druid: Wis, Sorcerer/Bard: Cha).
   - **School & Level Lookup:** Interface with `data/spells.json` to resolve spell school and class spell level.
   - **Feat Synergy Parsing:** Automatically parse `Spell Focus (School)`, `Greater Spell Focus`, and `Elemental Focus` from creature feats.
   - **Statblock Rendering:** Output formatted inline save DCs e.g. `*fireball* (DC 18, 10d6 fire)` with live recalculation on stat/feat change.
2. **Quick Combat Condition Toggles:**
   - Add status buttons (*Grappled*, *Prone*, *Sickened*, *Entangled*, *Blinded*) that dynamically adjust AC, attack penalties, and speeds in real-time.
3. **1-Click Monster Template Engine:**
   - Enable instant application of standard templates (*Fiendish*, *Celestial*, *Advanced*, *Skeleton*, *Zombie*).

---

## ⚠️ Active Risks & Technical Considerations

- **Strictly Prohibited Features (Do NOT Propose/Build):** Dice Rollers, Live Initiative/HP Trackers, Weapon/Armor Forge.
- **Spell Save DC Complexity:** Many spells in Pathfinder 1e do not allow saving throws (e.g., *Haste*, *Mage Armor*, *Dimension Door*). The engine must inspect the spell's `saving_throw` property from `data/spells.json` before appending `(DC XX)`.
- **Preserve Zero-Dependency Policy:** Ensure no npm or pip packages are introduced during feature additions.
- **Cache Invalidation on Custom Monster Changes:** Whenever a custom monster is added, edited, or deleted, `SEARCH_CACHE` in `server/data_manager.py` must be cleared to prevent stale search results.

