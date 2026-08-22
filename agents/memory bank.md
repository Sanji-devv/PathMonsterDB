# 🐉 PathMonsterDB Memory Bank

Comprehensive system architecture, database schema, operational workflows, and codebase documentation for **PathMonsterDB (Pathfinder 1e Master Sheet & Monster Creator)**.

---

## 🏛️ 1. System Architecture Overview

PathMonsterDB is an offline-first, high-performance web application designed for Game Masters and players of the Pathfinder 1st Edition Roleplaying Game. It couples a lightweight Python HTTP backend with a modular vanilla JavaScript frontend and pre-indexed JSON databases.

```mermaid
graph TD
    Client["Browser UI (index.html / database.html)"] --> |HTTP API & Static Files| Server["Python Server (main.py / http_handler.py)"]
    Server --> DataMgr["Data Manager (data_manager.py)"]
    DataMgr --> Cache["Normalized In-Memory Cache (SEARCH_CACHE)"]
    DataMgr --> Formatter["Monster Formatter (monster_formatter.py)"]
    DataMgr --> DBs[("JSON Databases in /data/")]
    Client --> JSModules["Modular JS Architecture (js/state, js/ui, js/mechanics, js/spells, js/inventory)"]
```

---

## 📂 2. Database Structure & Content (`/data`)

The application is backed by indexed and enriched JSON datasets:

| Dataset | Entries | Description |
|---|---|---|
| **`monsters.json`** | 6,516 | Official Paizo Bestiaries 1–6, NPC Codex, Unique Monsters, and Tome of Horrors (3PP). |
| **`custom_monsters.json`** | 29+ | User-created and customized monsters with state persistence. |
| **`spells.json`** | 2,909 | Complete Pathfinder 1e spell database with school, class spell lists, CL, and descriptions. |
| **`feats.json`** | 3,188 | Feat library with enriched RAW descriptions, prerequisites, and automatic stat modifiers. |
| **`special_abilities.json`** | 321 | Universal Monster Rules (UMR), special attacks, defenses, qualities, and traits with DC formulas. |
| **`auras.json`** | 75 | Monster and spell auras with radius and saving throw mechanics. |
| **`class_features.json`** | 141 | Core, Base, Hybrid, and Occult class features. |
| **`rules.json`** | 4 sets | 32 Combat Conditions, 11 Combat Maneuvers, Combat Modifiers, and Environmental Hazards. |
| **`armor.json`** | 21 | Armor & Shield stats (AC bonus, Max Dex, ACP, Spell Failure). |
| **`weapons.json`** | 41 | Weapons with damage dice, crit ranges, damage types, and categories. |
| **`magic_items.json`** | 58 | Big Six and wondrous items with slot mapping and attribute modifiers. |
| **`immunities.json`** | 43 | Condition and damage type immunities. |
| **`resistances.json`** | 37 | Energy and special resistances. |
| **`weaknesses.json`** | 24 | Vulnerabilities and mechanical weaknesses. |

---

## ⚙️ 3. Backend Architecture (`/server`)

### `server/data_manager.py`
- **In-Memory Loading & Global Indexing:** Loads official and custom monsters at startup into `GLOBAL_MONSTERS` with pre-computed lowercase query keys (`_m_name`, `_m_cr`, `_m_type`, `_m_align`, `_m_env`, `_m_source`).
- **Normalized Query Caching:** `SEARCH_CACHE` uses normalized query parameter strings (stripping timestamp cache-busters like `_t`) to prevent memory leaks and ensure high cache-hit rates.
- **Search Filtering & Sorting:** Multi-parameter search by Name, CR, Type, Alignment, Environment, Category (Official, NPC, Custom, Favorites, 3PP), and sorting (Alphabetical, CR Asc/Desc, Newest).
- **CRUD Operations:** Full lifecycle for custom monsters (`save_monster_from_json`, `delete_monster`, `toggle_favorite`) with atomic disk writes to `data/custom_monsters.json`.

### `server/http_handler.py`
- **Lightweight Multi-threaded HTTP Server:** Custom `SimpleHTTPRequestHandler` subclass with support for UTF-8 static file streaming (`.html`, `.js`, `.css`, `.json`, `.png`, `.jpg`).
- **REST Endpoints:**
  - `GET /api/search` - Paginated monster search with instant query results.
  - `GET /api/spells` - Fast autocomplete and search across all 2,909 spells.
  - `POST /api/save` - Save/update custom monster state.
  - `POST /api/delete/<idx>` - Delete custom monster.
  - `POST /api/favorite/<idx>` - Toggle monster favorite status.
  - `GET /api/scrape_status` - Health check.

### `server/monster_formatter.py`
- **Bidirectional State Formatting:** Transforms raw form data (`in-name`, `in-cr`, `in-str`, `in-hd-amount`, dynamic attacks, etc.) into standard Paizo Bestiary format.
- **Numeric Sanitization:** Extracts clean HP integers (e.g., `"49"` from `"49 (7d12+21)"`), parses fractional CRs (`"1/2"` -> `0.5`), and auto-generates AC touch/flat-footed calculations.

---

## 🎨 4. Frontend Architecture

### Modular Script Hierarchy
```
index.html / database.html
 ├── js/state.js       (CharacterState, inventory, magic item modifier stacking rules)
 ├── js/ui.js          (Tab switching, responsive layouts, window.showInfoModal lookup)
 ├── js/mechanics.js   (Spell level grouping, descending sorting, class-aware level resolution)
 ├── js/spells.js      (Spell search, autocomplete tags, interactive popups)
 ├── js/inventory.js   (Armor auto-fill, weapons catalog, Big Six magic item equipment)
 ├── script.js         (Main creature builder, live calculation engine, RAW/CALC attacks, auto-save)
 └── database.js       (Database browser, filters, pagination, theme synchronization)
```

### Key UI Features
1. **Interactive Info Modals (`window.showInfoModal`):**
   - Clickable badges and links for Feats, Spells, Auras, Special Abilities, Immunities, Resistances, and Weaknesses.
   - Searches `window.allSpecialAbilitiesDB`, `window.allAurasDB`, `window.allImmunitiesDB`, `window.allResistancesDB`, `window.allWeaknessesDB`, `window.allFeatsDB`, `window.allSpellsDB`, `window.allMagicItemsDB`.
   - Scrollable dialog with responsive max-height constraints.

2. **Dual-Mode Attack System (RAW vs. CALC):**
   - **RAW Mode:** Free-text editing with automatic Power Attack, Furious Focus, and Improved Critical parsing.
   - **CALC Mode:** Structured item selection from `data/weapons.json` with auto-computed attack bonuses and Strength scaling.

3. **Live Auto-Calculation Engine:**
   - Real-time computation of Ability Modifiers, Hit Points (with Con/Cha and Toughness), Armor Class breakdown, Saving Throws (with Great Fortitude, Iron Will, Lightning Reflexes), Base Attack Bonus (BAB), Combat Maneuvers (CMB/CMD), and Caster Level (CL).

4. **Big Six Magic Item Equipment Engine (`js/inventory.js`):**
   - Dedicated slots for Neck (Amulet of Natural Armor), Ring (Ring of Protection), Shoulders (Cloak of Resistance), Belt (Physical stats), Headband (Mental stats), and Wrists (Bracers of Armor).
   - Enforces bonus stacking rules according to Pathfinder 1e RAW.

5. **Theme Engine & LocalStorage Persistence:**
   - Over 20 custom CSS themes (Default, Classic, Dark, Parchment, Arcane, Emerald, Cyberpunk, etc.).
   - Seamlessly shared across editor and database pages via `localStorage.getItem('pf_creator_theme')`.

### 4.6 Interactive Steppers & Free-Form Combat Modifiers
- **Extra HP Stepper Suite (`in-hp-extra`):**
  - Integrated with live average HP calculation: `avgHp = Math.floor(hdAmt * ((hdSize / 2) + 0.5)) + hpBonus + hpExtra`.
  - Tactile quick-step adjustment buttons: `[-10]`, `[-5]`, `[-1]`, `[+1]`, `[+5]`, `[+10]`, and `[↺ 0]`.
- **Editable CMB & CMD Controls (`in-cmb`, `in-cmd`, `in-cmb-extra`, `in-cmd-extra`):**
  - No longer locked/disabled: supports both auto-calculated rules math and free-text custom notation (e.g. `+12 (+16 grapple)` or `24 (28 vs trip)`).
  - Modifier steppers: `[-2]`, `[-1]`, `[+1]`, `[+2]`, and `[↺ Reset]`.
- **100% English Localization:**
  - All UI elements, modal dialogs, font settings, button tooltips, and JS messages fully localized to standard idiomatic English.

---

## 🧪 5. Verification & Testing

The verification test suite (`python test_all.py`) ensures 100% system integrity across:
1. Static Asset Delivery & HTTP MIME Types.
2. JSON Schema & Parsing Integrity for all 12 datasets.
3. Monster Search, Filtering, and Indexing.
4. Spell Search & Cache Key Normalization.
5. Statblock Formatting & CR/HP Formula Extraction.
6. Full CRUD Lifecycle (Create, Read, Update, Favorite, Delete).
7. Live HTTP Server Response verification.

---

## 🚀 6. How to Run

```bash
# Start the local server and launch the app in your default browser
python main.py

# Run all verification tests
python test_all.py
```
Default server address: `http://localhost:8000` (or `http://127.0.0.1:8000`).

---

## 🚫 Strictly Prohibited & Out-of-Scope Features (ASLA ÖNERİLMEYECEKLER)

The following features are strictly prohibited from future proposals, roadmaps, and implementations:
1. ❌ **Interactive Dice Roller & 3D Dice Simulation:** Do NOT propose virtual 3D dice rollers, dice rolling toasts, or automated combat roll simulators.
2. ❌ **Live Initiative & In-Session Health/Combat Tracker:** Do NOT propose live combat turn order managers, initiative trackers, or active HP/damage tracking drawers.
3. ❌ **Custom Magic Weapon & Armor Forge:** Do NOT propose complex custom weapon/armor crafting or enchanting forge tools beyond standard static item selection.

---

## 🔮 7. Comprehensive Improvement Proposals & Future Development Roadmap

### 🧙‍♂️ 7.1 [HIGH PRIORITY / ZORLU GELİŞTİRME] Dynamic Spellcasting Resolution & Automatic Spell Save DC Engine

An advanced, highly accurate rules-aware spellcasting engine that automatically calculates and displays exact Spell Save DCs in the statblock:

```mermaid
graph TD
    Spell["Spell Entry (e.g. Fireball)"] --> Lookup["Lookup in data/spells.json (School: Evocation, Level: 3)"]
    Source["Casting Source (Class: Wizard or SLA)"] --> Attr["Key Ability Modifier (Int / Wis / Cha)"]
    Feats["Feats List"] --> Focus["Check Spell Focus / Greater Spell Focus for School (+1 / +2)"]
    Racial["Traits / Racial Abilities"] --> TraitMod["Racial DC Modifier (e.g. Gnome Illusion +1)"]
    Lookup & Attr & Focus & TraitMod --> Math["DC = 10 + Spell Level + Key Ability Mod + Feats + Misc"]
    Math --> Output["Render in Statblock: *fireball* (DC 18)"]
```

#### Core Components & Technical Requirements:
1. **Spell-Like Abilities (SLA) Key Casting Ability Resolution:**
   - Default to Charisma (`Cha`), with dynamic options for Wisdom (`Wis`) or Intelligence (`Int`) based on creature type/subtypes (e.g., Undead, Outsiders, Aberrations).
   - Dedicated UI selector/stepper in the SLA editor section to override or select the key casting attribute.
2. **Class Spellcasting Attribute Binding:**
   - Automatic detection of primary casting ability per class:
     - Intelligence (`Int`): Wizard, Witch, Arcanist, Magus, Alchemist.
     - Wisdom (`Wis`): Cleric, Druid, Inquisitor, Shaman, Ranger, Paladin.
     - Charisma (`Cha`): Sorcerer, Bard, Oracle, Summoner, Bloodrager.
3. **Database Spell School & Level Resolution:**
   - Real-time lookup from `data/spells.json` to extract the spell's school (*Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, Transmutation*) and class-specific spell level.
4. **Feats & Trait Synergy Engine:**
   - Automatic scanning of creature feats for `Spell Focus (School)`, `Greater Spell Focus (School)`, `Elemental Focus (Element)`, and `Greater Elemental Focus`.
   - Automatic inclusion of feat bonuses (`+1` or `+2`) applied exclusively to spells matching the specific school or descriptor.
5. **Universal Formula:**
   $$\text{DC} = 10 + \text{Spell Level} + \text{Key Ability Modifier} + \text{Feat Modifiers} + \text{Racial/Special Modifiers}$$
6. **Statblock Rendering & Formatting:**
   - Clean Paizo-compliant rendering: Spells without saving throws remain plain (e.g., `*haste*`, `*mage armor*`), while spells with saves automatically append `(DC XX)` (e.g., `*fireball* (DC 18, 10d6 fire)`).
   - Live recalculation whenever ability scores (Int/Wis/Cha), feats, or class levels change.

---

### ⚔️ 7.2 Monster Creation, Templates & Progression Engine
1. **1-Click Monster Template Engine:**
   - **Comprehensive Template Library:** Support standard PF1e templates:
     - *Acquired / Simple:* Advanced (+2 all rolls, +4 AC), Giant (+1 size, Str/Con boost, -Dex), Young (-1 size, -Con/Str, +Dex), Fiendish (Cold/Fire res, SR, Smite Good), Celestial (Acid/Cold/Elec res, SR, Smite Evil), Entropic, Resolute.
     - *Undead / Monster:* Skeleton (lose Con, Undead traits, DR 5/bludgeoning, immune to cold), Zombie (lose Con, staggered, DR 5/slashing), Vampire, Lich, Ghost, Half-Dragon, Lycanthrope.
   - **Automated Math & Statblock Transformation:** Auto-recalculates CR, HD size/type, ability scores, natural armor, immunities, resistances, damage reduction, and bonus special attacks.
2. **Class Level & HD Progression Engine:**
   - **Monster Leveling & Gestalt:** Add racial HD or class levels (e.g., Fighter 4, Cleric 6, Rogue 3) directly to any monster.
   - **Automated Progression Scaling:** Computes Base Attack Bonus (BAB progression), Base Saves (Good vs. Poor), Feat thresholds (every odd HD), and Ability Score Increases (every 4 HD).
3. **Skill Point & Class Skill Auto-Helper:**
   - Automatic calculation of available skill points based on Creature Type HD, Int modifier, and class levels.
   - Automatic +3 class skill bonus indicators and synergy tracking.

---

### ✨ 7.3 Spellcasting & Metamagic Tools
1. **Spell Slot & Daily Usage Tracker:**
   - Interactive checkboxes for prepared spells and daily spell slots (0th–9th level) or Spell-Like Abilities (At will, 3/day, 1/day, 1/week).
2. **Metamagic Quick-Applier:**
   - Empower (+2), Maximize (+3), Quicken (+4), Extend (+1), Heighten, and Enlarge modifiers with instant slot calculation and DC recalculation.

---

### 📜 7.4 Statblock Parsing & Cross-Platform Integrations
1. **Smart Raw Text / OCR Statblock Importer:**
   - Paste unformatted statblock text from Paizo PDFs, Archives of Nethys, or d20pfsrd.
   - Intelligent regex heuristics parse all attributes (Name, CR, Alignment, Size, Type, Init, Senses, AC, HP, Saves, Speed, Attacks, Spells, Stats, Feats, Skills, Languages, Gear) directly into the creator form.
2. **Foundry VTT & Roll20 Export:**
   - Direct JSON export formatted for Foundry VTT's `pf1` game system actor schema.
   - Export macro commands for Roll20 token action bars.
3. **Multi-Monster Printable Battle Cards & Print CSS:**
   - High-contrast `@media print` stylesheets for 2-up and 4-up index card layouts optimized for physical GM screens.
4. **Markdown / BBCode / Reddit Formatter:**
   - One-click copy formatted text for Reddit (`r/Pathfinder_RPG`), Paizo messageboards, Obsidian vault notes, and Discord markdown embeds.

---

### 🔍 7.5 GM Encounter Builder & Campaign Management
1. **Encounter Builder & XP Budget Calculator:**
   - Multi-monster party encounter builder with Average Party Level (APL) and party size scaling.
   - Calculates Total Encounter CR, Encounter Difficulty (Easy, Average, Challenging, Hard, Epic), and individual/total XP awards per PF1e Core Rulebook Table 12-1.
2. **Campaign Folders, Tags & Bestiary Bundles:**
   - Organize custom monsters into campaigns or tags (e.g., *"Dungeon Level 1"*, *"Boss Encounters"*, *"Bandit Ambush"*).
   - Bulk export/import of entire campaign bestiaries as single JSON bundle files.
3. **Side-by-Side Creature Comparison View:**
   - Side-by-side diffing of two monsters (e.g., base creature vs. templated creature) highlighting differences in AC, saves, attacks, and special abilities.

---

### ⚡ 7.6 UI/UX, Performance & Tabletop Usability
1. **Global Command Palette (`Ctrl+K` / Spotlight Search):**
   - Instant search modal accessible from any screen to search monsters, spells, feats, rules, auras, or items in milliseconds.
2. **Undo / Redo History Stack (`Ctrl+Z` / `Ctrl+Y`):**
   - In-memory state timeline for the editor allowing rapid rollback of accidental edits or stat overrides.
3. **Progressive Web App (PWA) & Offline Service Worker:**
   - Enable full offline installation on laptops, Android, and iOS tablets for reliable convention and table play.
4. **Token Generator & Circular Portrait Cropper:**
   - Upload creature artwork, adjust zoom/pan, and generate round gold-bordered GM tokens for VTTs or printing.


