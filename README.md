# 🐉 Pathfinder 1e Master Sheet & Monster Creator

Welcome to the **Pathfinder 1e Master Sheet & Monster Creator**! This is a powerful, offline-first, browser-based application designed specifically for Game Masters and Players of the Pathfinder 1st Edition Roleplaying Game.

It allows you to search a massive database of monsters, NPCs, spells, feats, weapons, and armors, customize their stats with built-in math automation, edit attacks in free-text (RAW) or calculation (CALC) modes, and export print-ready A4 statblocks and high-quality PNGs directly to your desktop.

---

## ✨ Key Features

- **Massive Built-in Library:**
  - **6,549+ Monsters & NPCs** (`data/monsters.json`) covering Bestiary 1–6, NPC Codex, Unique Monsters, 3rd Party (3PP) creatures, and Custom Homebrew.
  - **2,905 Spells** (`data/spells.json`) with search, caster level filtering, and Archives of Nethys modal integration.
  - **3,188 Feats** (`data/feats.json`) with search, tag autocompletion, tooltip previews, and rule descriptions.
  - **21 Armors & Shields** (`data/armor.json`) with automatic AC, Max DEX, and Armor Check Penalty (ACP) calculation.
  - **41 Weapons** (`data/weapons.json`) with autocomplete and range/damage stats.

- **Dual-Mode Attack System (RAW & CALC):**
  - **RAW Mode (Free Text):** Edit melee and ranged attacks freely in gold-framed textareas (e.g., `mwk rapier +13 (1d6+11/18-20)`).
  - **CALC Mode:** Select weapons from the dropdown library, apply Masterwork toggles, and let the app auto-calculate attack bonuses, strength multipliers, and precision damage.
  - **Seamless Switching:** Toggle between RAW and CALC modes at any time without losing text.

- **Collapsible 35% Editor Sidebar & Full-Page Statblock Centering:**
  - The left editor panel occupies **35% of the screen** (`.controls-panel`).
  - Closing the sidebar slides the panel smoothly off-screen (`margin-left: -35%`), expanding the preview panel to 100% width and automatically centering the monster sheet (`#statblock-paper`) dead-center in the full browser page.
  - Floating glassmorphic toggle button (`#btn-toggle-panel`) with glowing state indicators.

- **Default Alphabetical Sorting (A-Z):**
  - The Monster Database sorts entries alphabetically A-Z by default across all filters (Favorites ⭐, Custom Homebrew, Official Monsters, etc.).
  - Variant creatures (such as `Roc Storm`, `Roc Frostfeather`, `Roc Pyre`, `Roc Terra`, `Roc Voidstorm`) cluster neatly together.

- **Custom NPC & Creature Suite:**
  - Includes custom pre-built monsters like the **Sand Worm** (CR 10 - Large Magical Beast [Desert Death-Worm Variant], HP 126, AC 25, *Bite +19*, *Acid Spit +13*, *Electrical Discharge 30-ft line 6d6*, *Chitinous Carapace DR 10/adamantine*, *Corrosive Blood*, *Swallow Whole*, *Sandglide*, *Tremorsense 60 ft.*), **Undead Elder Minotaur** (CR 11), the **Rovesta NPC Fleet**, **Elemental Roc Variants**, **Elemental & Alchemic Owlbears**, and **Negative Energy Corrupted Beasts**.

- **Robust SLA & Special Ability System:**
  - Automatic string formatting for Spell-Like Abilities (`At will—...`, `3/day—...`, `1/day—...`) supporting all dash formats, en-dashes, and separator characters.

- **Real-Time Stat Calculation:**
  - Real-time calculation for HP, Inits, Saves (Fort/Ref/Will), AC, Touch AC, Flat-Footed AC, BAB, CMB, and CMD based on stats and class levels.

- **Print & PNG Exporting:**
  - One-click native PNG export (`#btn-export-png`) renders high-resolution gold-framed statblocks directly to your Desktop.

---

## 🚀 Getting Started

This application is designed to be run locally on your machine with zero external internet dependencies required for core features.

### Prerequisites
- **Python 3.x** installed on your computer.

### Installation & Running

1. **Navigate to the project folder:**
   ```bash
   cd path/to/PATHGM
   ```
2. **Start the local server:**
   ```bash
   python main.py
   ```
3. **Open your web browser:**
   The application will automatically open in your default browser at:
   [http://localhost:8000](http://localhost:8000)

---

## 🛠️ How to Use

- **Creator / Editor (`index.html`):** Fill out stats on the left pane and watch the real-time A4 gold-bordered statblock update on the right. Click the top-left toggle button to collapse the sidebar and view the statblock centered in full-screen.
- **Database Browser (`database.html`):** Search by name, CR, alignment, environment, or category (Favorites, Customs, NPCs). Click **Load Custom (📝)** to import any monster directly into the editor.
- **Magic & Feat Tabs:** Add spells and feats via tag search. Click any spell or feat tag to open detailed rule popups.
- **Exporting:** Click **Export PNG** in the top bar to save a PNG image of your statblock.

---

## 📜 License & Credits

Built for the Pathfinder 1E community. Pathfinder is a registered trademark of Paizo Inc. Data sourced under the Open Game License (OGL).
