# 🧠 Pathfinder 1e Monster Creator - Memory Bank

> [!NOTE]
> This document serves as the living "Memory Bank" for the project. It tracks the current state, system architecture, active features, and the future roadmap of the application. It is designed to be easily readable for human developers.

---

## 🎯 Project Overview
**Pathfinder 1e Master Sheet** (formerly Monster Creator) is evolving into the ultimate, offline-first web application for Game Masters and Players of Pathfinder 1st Edition. 

While it originated as a rapid statblock generator, the new overarching vision for the project is to transform it into a **Comprehensive Pathfinder 1E Master Sheet**. This means building a sheet that contains *literally everything* from the game from scratch: every monster, NPC, spell, feat, weapon, armor, and special ability. 

Users will be able to add any element to their sheet and instantly see its full mechanical features, rules text, and effects applied directly to the character. The goal is to eliminate the need for external wikis entirely—everything you need is embedded, interactive, and beautifully formatted right inside the application.

Additionally, the application already comes with a massive, built-in archive (~280,000 lines of JSON) that contains almost every single monster, NPC, and 3rd-Party creature from the Pathfinder universe (sourced from d20pfsrd).

---

## ⚙️ Technology Stack
The application is designed to work entirely **offline** with minimal external dependencies. It relies on a local, lightweight server to manage database queries.

| Category | Technology / Method |
| :--- | :--- |
| **Structure** | Pure HTML5 (`index.html`, `library.html`, `database.html`) |
| **Styling** | Vanilla CSS3 (`style.css`, `themes.css`), CSS Variables, Multi-Theme Support |
| **Logic** | Vanilla JavaScript (`script.js`, `database.js`) |
| **Database** | Massive JSON-based static files (`data/monsters.json`, `data/armor.json`, `data/feats.json`, `data/spells.json`) |
| **Server** | Python (`main.py`) running a local HTTP server and REST API |
| **Repository Hygiene** | Git configuration (`.gitignore`) ignoring local scratch space, cache, and Memory Bank |

---

## 📂 What's Inside the Project (Architecture)

- **`data/` Directory**: The core hub for all reference databases. `monsters.json` currently holds the entire d20pfsrd bestiary (NPCs, 3PP, CR 1-30). `armor.json` holds verified AC/Max-Dex/ACP data. `feats.json` holds 1400+ feats. `spells.json` holds Pathfinder spells.
- **`index.html`**: The main creator interface. The left side is the input form, and the right side is the live A4 preview (optimized in a 40/60 split).
- **`library.html`**: A searchable library interface containing original Pathfinder monsters and custom user creations. It includes category filters.
- **`database.html`**: Interactive database browser interface.
- **`main.py`**: A lightweight Python server that serves the web app and handles REST API requests (`/api/search`, `/api/spells`, `/api/proxy`, saving/deleting JSON).
- **`script.js`**: The brains of the operation. Handles iterative attack math, damage calculations, Two-Weapon Fighting logic, and real-time DOM updates.
- **`.gitignore`**: Configured repository ignore rules covering `MEMORY BANK.md`, `scratch/`, `__pycache__`, environment files, and IDE configs.

---

## ✅ Completed Features & Current Capabilities

### 1. Smart Feat System
- An autocomplete search box powered by a database of over 1400 feats (`data/feats.json`).
- Clicking on a feat navigates to the official Archives of Nethys page. Hovering over it instantly displays the rule description.
- **Auto-Math**: Basic feats like *Toughness*, *Dodge*, *Improved Initiative*, and *Iron Will* automatically add their respective bonuses to the monster's core stats.
- **Combat Feat Automation**: Active combat feats (e.g., *Power Attack*, *Weapon Finesse*, *Multiattack*) automatically modify attack rolls and damage penalties/bonuses dynamically.

### 2. Advanced Combat Math Engine
- Fully automated Attack (Melee/Ranged), Iterative Attacks, Damage, Armor Class (AC), Max Dex, and Armor Check Penalty calculations.
- Automatic Two-Weapon Fighting logic based on "Primary/Secondary" attack toggles and Natural Attack rules.
- Strength modifier multipliers (1x, 1.5x, 0.5x) apply automatically depending on the weapon category and secondary flags.

### 3. Devasa (Massive) Database Integration
- Clean JSON databases for Weapons (`data/weapons.json`) and Armor (`data/armor.json`) to populate dropdowns and automate AC math.
- The `monsters.json` file has been expanded to include creatures across all Challenge Ratings (CR), Unique monsters, and NPC classes.

### 4. Dynamic Live Preview & Themes
- A clean, multi-theme engine with 20+ aesthetic themes (e.g., Abyssal, Necro), always enforcing the Default 'Classic' look on fresh load.
- Unified database management for original and user-created monsters (distinguished via the `IsUserCustom` flag).

### 5. Performance & Optimization
- **In-Memory Caching:** All heavy databases (`monsters.json`, `spells.json`) are loaded into RAM upon server startup with pre-computed search keys, allowing for instantaneous autocomplete and zero-lag searching.
- **Debounced Editor:** DOM updates are aggressively debounced (300ms) to ensure smooth typing and editing even for highly complex statblocks.

### 6. Repository Hygiene & Git Integration
- Configured `.gitignore` rules to keep the project clean. Automatically excludes `MEMORY BANK.md`, `scratch/`, Python bytecode (`__pycache__`), local environment files, and IDE workspace configs (`.vscode/`, `.idea/`, `.gemini/`).

---

## 🚀 Future Roadmap & Possible Developments

### Phase 1: Skill Automation (Short-Term)
- **Auto-Skill Calculation:** Automatically add the +3 class skill bonus based on creature type and distribute skill points based on Intelligence (Int) score.

### Phase 2: Encounter & Combat Utilities (Medium-Term)
- **Rollable Statblocks:** Make the preview interactive. Clicking on attacks, saves, or skills will trigger a built-in dice roller to output the result instantly.
- **Condition Tracker:** Add a toggle menu for combat conditions (e.g., *Sickened*, *Grappled*, *Entangled*). Applying a condition will temporarily recalculate and update the preview stats (AC, Atk, Speed) on the fly.
- **Encounter Builder:** Allow grouping multiple saved monsters together to calculate Total Encounter CR, difficulty level, and XP budgets.

### Phase 3: Advanced Automation & Generators (Long-Term)
- **Class Levels Integration:** A UI module to add class levels (e.g., "Fighter 4", "Rogue 2") that automatically adds the class's BAB, base saves, and hit dice to the base creature.
- **Automated Loot Generator:** Suggests treasure based on the creature's CR and environment according to official Pathfinder treasure generation tables.
- **NPC Name Generator:** A built-in fantasy name generator categorized by race (Elf, Dwarf, Orc) to quickly name NPCs on the fly.

### Phase 4: Exporting & VTT Integration
- **VTT Exporting:** Enable one-click exporting of custom monsters into structured `.json` files compatible with FoundryVTT or Roll20.
- **Statblock Parsing (Reverse Import):** Paste a raw text statblock from a PDF or AoN and have the tool use regex/NLP to parse it back into the UI fields for editing.
- **Multi-Monster Bestiary PDF Export:** Combine multiple saved monsters into a single, beautifully formatted "Bestiary Chapter" PDF with a table of contents and cover page.
- **Drag & Drop Reordering:** Allow users to drag and drop attacks, abilities, or spells to visually reorder them in the input form.

### Phase 5: The Ultimate Master Sheet Transformation (The Grand Vision)
- **Everything-in-One Database:** Expand the database to include 100% of all Pathfinder 1E content (Spells, Feats, Weapons, Armors, Wondrous Items, Class Features, Universal Monster Rules).
- **Interactive Feature Expansion:** Every ability, spell, or item added to the sheet will be fully clickable/expandable. Clicking on a spell like "Fireball" or an ability like "Sneak Attack" will instantly reveal an inline card showing its full rules text, casting time, range, and effects.
- **Deep Mechanical Integration:** Adding an item or ability won't just be text; it will mechanically alter the sheet. Equipping a specific magical armor will automatically apply its unique AC bonuses, ACP, and special effects.
- **Player Character (PC) Support:** Evolve the layout to support not just GM monster statblocks, but full Player Character sheets with inventory management and spellbook tracking.
