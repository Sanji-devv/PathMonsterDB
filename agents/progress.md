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

### 📍 Phase 1: Spellcasting Resolution & Combat Enhancements
- [ ] **[HIGH PRIORITY / ZORLU GELİŞTİRME] Dynamic Spellcasting Resolution & Automatic Spell Save DC Engine:**
  - Automatic key casting ability modifier calculation (SLA Cha/Wis/Int resolver, primary class Int/Wis/Cha detection).
  - Real-time `data/spells.json` lookup for spell school and class-specific level.
  - Automatic feat synergy scanning (`Spell Focus`, `Greater Spell Focus`, `Elemental Focus`).
  - Inline statblock formatting: `*fireball* (DC 18, 10d6 fire)`.
- [ ] **Quick Combat Condition Toggles:** Instant status effect toggles (*Grappled, Prone, Sickened, Entangled, Blinded, Shaken, Stunned*) and common buffs (*Haste, Bull's Strength, Rage*) with dynamic live stat recalculation.

### 📍 Phase 2: Creature Creation, Templates & Progression
- [ ] **1-Click Monster Template Engine:** Instant application/removal of official templates (*Advanced, Giant, Fiendish, Celestial, Skeleton, Zombie, Lich, Vampire, Ghost*) with automated stat, DR, immunity, and CR scaling.
- [ ] **Class Level & HD Progression Engine:** Add racial HD or class levels (Fighter, Cleric, Rogue, etc.) to monsters with automatic BAB, base save, feat, and ability score progression.
- [ ] **Skill Point & Class Skill Auto-Helper:** Calculates available skill points by HD/class and automatically marks class skills with +3 trained bonuses.

### 📍 Phase 3: Spellcasting Utilities & Metamagic Tools
- [ ] **Spell Slot & Daily Usage Tracker:** Checkboxes for prepared spells, spontaneous spell slots (0th–9th), and Spell-Like Abilities (At will, 3/day, 1/day).
- [ ] **Metamagic Quick-Applier:** Quick Empower, Maximize, Quicken, Extend, Heighten modifier integration with slot and DC recalculation.

### 📍 Phase 4: Statblock Parsing & Cross-Platform Integrations
- [ ] **Smart Raw Text / OCR Statblock Importer:** Regex-based heuristic parser converting raw Paizo/Nethys/d20pfsrd text directly into editable monster forms.
- [ ] **Foundry VTT (PF1e) & Roll20 Export:** Generate Foundry VTT `pf1` actor JSON and Roll20 token action macros.
- [ ] **Multi-Card Printable PDF & Print CSS:** High-contrast `@media print` 2-up and 4-up battle index card printing for tabletop GM screens.
- [ ] **Markdown / Reddit / BBCode Formatter:** One-click formatted export for Reddit, Paizo boards, and Obsidian vault notes.

### 📍 Phase 5: GM Encounter Builder & Campaign Management
- [ ] **Encounter Builder & XP Budgeting:** Multi-creature builder calculating Total CR, party APL difficulty, and individual/party XP awards.
- [ ] **Campaign Folders & Bestiary Bundles:** Group custom monsters into campaign tags with bulk JSON export/import.
- [ ] **Side-by-Side Creature Comparison View:** Diff tool comparing two monsters or baseline vs modified statblocks.

### 📍 Phase 6: UI/UX, Performance & Offline PWA
- [ ] **Global Command Palette (`Ctrl+K`):** Spotlight modal search across all monsters, spells, feats, and rules.
- [ ] **Undo / Redo History Stack (`Ctrl+Z` / `Ctrl+Y`):** Full state timeline for the editor.
- [ ] **Progressive Web App (PWA) & Service Worker:** Installable offline web app for laptops, iPads, and Android tablets.
- [ ] **Token Generator & Portrait Cropper:** Circular gold-bordered token generation for VTTs and printing.

---

## 🚫 Strictly Forbidden Features (ASLA ÖNERİLMEYECEKLER)

- ❌ **Interactive Dice Roller & 3D Dice Simulation** (Strictly Out of Scope)
- ❌ **Live Initiative & In-Session Health/Combat Tracker** (Strictly Out of Scope)
- ❌ **Custom Magic Weapon & Armor Forge** (Strictly Out of Scope)



---

## 🔍 Technical Debt & Quality Checklist

- [x] No external pip dependencies in backend.
- [x] No Node.js build pipeline required.
- [x] Fast in-memory normalized search caching.
- [x] Thread-safe atomic file writing for custom monsters.
- [x] Full test pass on `python test_all.py`.
