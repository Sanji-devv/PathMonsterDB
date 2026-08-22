# Technical Context & Dependencies

## 💻 Tech Stack Summary

| Layer | Technology | Description |
|---|---|---|
| **Backend Runtime** | **Python 3.8+ (Standard Library Only)** | Multi-threaded HTTP daemon, normalized caching, JSON serializer. |
| **Frontend Core** | **Vanilla HTML5 & CSS3** | Clean semantic markup, CSS Variables, Responsive Grid/Flexbox. |
| **Frontend Scripting**| **Vanilla JavaScript (ES6+)** | Modular architecture (`js/*.js`), event-driven calculation engine. |
| **Client-Side Export**| **html2canvas (v1.4.1)** | Client-side rasterization of DOM statblock into high-resolution PNGs. |
| **Typography** | **Google Fonts (Cinzel, Roboto, MedievalSharp)** | Aesthetic fantasy and technical tabular typography. |
| **Data Storage** | **12 Indexed JSON Datasets (`/data/`)** | Fast in-memory indexed relational-style JSON stores. |

---

## 📦 Zero-Dependency Philosophy

PathMonsterDB is engineered with a **zero-dependency philosophy**:
- **No Pip Packages Required:** Runs on any standard Python 3 installation without `pip install` commands.
- **No Node.js / NPM Build Step:** No Webpack, Vite, Babel, or compilation pipeline needed. Edit HTML/JS/CSS directly and refresh the browser.
- **Offline Capable:** All primary calculations, database lookups, and formatting run locally.

---

## 🗄️ Database Datasets (`/data/`)

| File | Records | Content & Mechanics |
|---|---|---|
| `data/monsters.json` | 6,516 | Official Paizo Bestiaries 1–6, NPC Codex, Unique & 3PP monsters. |
| `data/custom_monsters.json` | 29+ | User-created and modified monsters with persistent storage. |
| `data/spells.json` | 2,909 | Complete Pathfinder 1e spellbook with level, school, class lists, and RAW text. |
| `data/feats.json` | 3,188 | Feats with prerequisite trees, RAW descriptions, and stat-modifier hooks. |
| `data/special_abilities.json`| 321 | Universal Monster Rules (UMR), special attacks, defenses, traits, and DC formulas. |
| `data/auras.json` | 75 | Monster and spell aura ranges, saving throw DCs, and mechanical effects. |
| `data/class_features.json` | 141 | Core, Base, Hybrid, and Occult class features. |
| `data/rules.json` | 4 Sets | 32 Combat Conditions, 11 Combat Maneuvers, Modifiers, and Environmental Hazards. |
| `data/armor.json` | 21 | Armor & Shield stats (AC bonus, Max Dex, ACP, Spell Failure). |
| `data/weapons.json` | 41 | Weapons with damage dice, crit ranges, damage types, and categories. |
| `data/magic_items.json` | 58 | Big Six and wondrous items with slot mapping and attribute modifiers. |
| `data/immunities.json` | 43 | Condition and damage type immunities. |
| `data/resistances.json` | 37 | Energy and special resistances. |
| `data/weaknesses.json` | 24 | Damage vulnerabilities and mechanical weaknesses. |

---

## 📁 Repository Directory Structure

```plaintext
PathMonsterDB/
├── agents/                       # AI Memory Bank & Context Docs
│   ├── productContext.md         # PRD, product vision, scope & user flows
│   ├── systemPatterns.md         # Architecture, design patterns & coding standards
│   ├── techContext.md           # Tech stack, datasets & environment setup
│   ├── activeContext.md         # Active development state, recent tasks & risks
│   ├── progress.md              # Completed milestones & upcoming roadmap
│   └── AGENTS.md                # Operating instructions for AI assistants
├── html/                         # HTML UI Pages
│   ├── index.html               # Monster Creator & Editor UI
│   └── database.html            # Database Search & Filtering UI
├── css/                          # Stylesheets & Visual Themes
│   ├── style.css                # Main styling, responsive layout & auth modal
│   └── themes.css               # 20+ CSS theme definitions
├── js/                           # Modular Frontend JavaScript
│   ├── state.js                 # Global CharacterState & item bonus stacking
│   ├── ui.js                    # Modal dialogs & panel collapse logic
│   ├── mechanics.js             # Spell level grouping & rules parsing
│   ├── spells.js                # Spell search & tag autocomplete
│   ├── inventory.js             # Weapons, armor & Big Six equipment slots
│   ├── auth.js                  # Authentication manager & user profile widget
│   ├── script.js                # Monster Creator calculation & event engine
│   └── database.js              # Database page filtering & pagination logic
├── data/                         # 12 JSON databases (Monsters, Spells, Feats, Rules)
│   ├── monsters.json
│   ├── custom_monsters.json
│   ├── users.json
│   ├── sessions.json
│   ├── spells.json
│   └── ...
├── server/                       # Backend Python services
│   ├── auth.py                  # PBKDF2 hashing, user & session persistence
│   ├── data_manager.py          # In-memory indexing & query caching
│   ├── http_handler.py          # REST API router & static file streamer
│   └── monster_formatter.py     # Statblock serializer & number sanitizer
├── main.py                       # Application bootstrapper & browser launcher
├── test_all.py                   # Automated verification test suite
└── README.md                     # Project overview & documentation
```

---

## ⚙️ Runtime Requirements & Environment

- **Python Version:** `>= 3.8` (Tested on Windows, Linux, and macOS).
- **Default Port:** `8000` (e.g. `http://localhost:8000` or `http://127.0.0.1:8000`).
- **Browser Compatibility:** Chrome, Firefox, Microsoft Edge, Safari (Modern ES6+ & CSS Custom Properties support required).
- **Network Access:** None required (fully offline).
