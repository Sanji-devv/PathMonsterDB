# Progress Tracker

## 🏁 Completed Milestones

### 1. Database & Core Content
- [x] **Indexed Bestiaries 1–6 & NPC Codex:** 6,516 official monsters loaded into `data/monsters.json`.
- [x] **Spells Database:** 2,909 Pathfinder 1e spells with school, class spell lists, and RAW descriptions (`data/spells.json`).
- [x] **Feats Database:** 3,188 feats with prerequisite trees and stat modifiers (`data/feats.json`).
- [x] **Special Abilities & UMR:** 321 Universal Monster Rules, special attacks, defenses, and DC formulas (`data/special_abilities.json`).
- [x] **Auras & Class Features:** 75 auras (`data/auras.json`) and 141 class features (`data/class_features.json`).
- [x] **Rules & Conditions:** 32 combat conditions, 11 combat maneuvers, modifiers, and hazards (`data/rules.json`).
- [x] **Equipment Catalog:** 41 weapons, 21 armors & shields, and 58 magic items with RAW bonus stacking.
- [x] **Defenses Profiles:** 43 immunities, 37 resistances, and 24 damage weaknesses.

### 2. Monster Creator & Calculation Engine (`index.html` / `script.js`)
- [x] **Real-Time Math Engine:** Automatic live calculations for Ability Modifiers, Hit Points (Con/Cha + Toughness scaling), Armor Class (Touch/Flat-Footed), Saves (Base + Modifiers + Feats + Gear), BAB, CMB, CMD, and Caster Level.
- [x] **Dual-Mode Attack System:**
  - **RAW Mode:** Free-text textarea editing with automatic critical hit and modifier parsing.
  - **CALC Mode:** Weapon catalog dropdown with masterwork toggles and automated strength scaling.
- [x] **Extra HP Stepper Suite:** `in-hp-extra` with instant `[-10]`, `[-5]`, `[-1]`, `[+1]`, `[+5]`, `[+10]`, `[↺ 0]` controls.
- [x] **Editable CMB/CMD Suite:** Free-form custom text notation with `[-2]`, `[-1]`, `[+1]`, `[+2]`, `[↺ Reset]` steppers.
- [x] **Spell-Like Abilities Parser:** Automatic formatting for `At will—...`, `3/day—...`, `1/day—...` lines.
- [x] **Big Six Equipment Engine:** Dedicated slots for Neck, Ring, Shoulders, Belt, Headband, and Wrists in `js/inventory.js`.

### 3. UI, Themes & Experience
- [x] **Collapsible 35% Sidebar:** Smooth margin animation with automatic dead-center positioning of the gold-framed statblock.
- [x] **Interactive Info Modals (`window.showInfoModal`):** Instant popups for spells, feats, special abilities, auras, immunities, resistances, and items.
- [x] **20+ Visual CSS Themes:** Synced across editor and database via `localStorage`.
- [x] **100% English Localization:** Complete interface and message localization to standard English.
- [x] **Export Capabilities:** One-click high-resolution PNG export via `html2canvas` and JSON backup/restore.

### 4. Backend & Verification
- [x] **Zero-Dependency Python Server:** Multi-threaded HTTP daemon (`main.py` / `server/http_handler.py`).
- [x] **In-Memory Global Index & Caching:** Instant filtered monster and spell queries with `SEARCH_CACHE` in `server/data_manager.py`.
- [x] **Statblock Serializer:** `server/monster_formatter.py` converts raw form states into official Paizo Bestiary format.
- [x] **Verification Test Suite:** `test_all.py` validating 100% test integrity across static assets, JSON schemas, search caching, CRUD, and API routes.

---

## 🚧 In Progress

- [/] **Memory Bank AI Maintenance Workflow:** Active continuous sync between project code and `agents/` documentation.

---

## 📋 Upcoming Roadmap

### 📍 Phase 1: In-Game Usability & Combat Enhancements
- [ ] **Interactive Dice Roller:** Clickable attack bonuses, damage dice, and save modifiers with roll result toasts.
- [ ] **Quick Combat Condition Toggles:** Instant status effect buttons (*Grappled*, *Prone*, *Sickened*, *Entangled*) that dynamically modify active stats.
- [ ] **Creature Template Engine:** 1-click application of standard templates (*Fiendish*, *Celestial*, *Advanced*, *Skeleton*, *Zombie*).

### 📍 Phase 2: GM Encounter & Combat Suite
- [ ] **Encounter Builder & XP Budgeting:** Multi-creature selection calculating Total Encounter CR, APL difficulty, and XP rewards.
- [ ] **Live Initiative & HP Tracker:** In-session GM dashboard for turn order and live HP tracking.
- [ ] **Multi-Card Printable PDF Layout:** Grid layout for printing multiple compact monster cards on A4 sheets.

### 📍 Phase 3: Automation & Ecosystem Integration
- [ ] **Plain-Text Statblock Parser:** Paste text from PDFs or Archives of Nethys to populate form inputs automatically.
- [ ] **Foundry VTT / Roll20 Export:** Export custom creatures to Foundry VTT PF1E Actor JSON.
- [ ] **Progressive Web App (PWA):** Offline service-worker support for tablets and mobile devices.

---

## 🔍 Technical Debt & Quality Checklist

- [x] No external pip dependencies in backend.
- [x] No Node.js build pipeline required.
- [x] Fast in-memory normalized search caching.
- [x] Thread-safe atomic file writing for custom monsters.
- [x] Full test pass on `python test_all.py`.
