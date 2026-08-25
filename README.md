# 🐉 PathMonsterDB - Pathfinder 1e Monster Creator & Bestiary Database

Welcome to **PathMonsterDB** — a fast, offline-first, browser-based statblock generator, interactive bestiary, and monster management suite created specifically for Game Masters and players of the **Pathfinder 1st Edition Roleplaying Game**.

---

## 📖 What is PathMonsterDB?

**PathMonsterDB** is a standalone, full-featured application designed to create, customize, browse, and export Pathfinder 1e monsters and NPCs in real time. It faithfully replicates the classic Paizo gold-bordered statblock format with live math automation, built-in database lookups, and instant desktop export capabilities.

---

## 🎯 Key Features & Capabilities

### ⚔️ 1. Monster Creator & Real-Time Math Engine
- **Universal Monster Loader:** Load any of the 6,500+ official bestiary creatures or user-created custom monsters into the editor with all stats, attacks, defenses, feats, and spells populated instantly.
- **Automated Math Engine:** Ability score adjustments instantly recalculate HP (Con/Cha + Toughness scaling), AC (Touch & Flat-Footed), Fort/Ref/Will Saves, BAB, CMB, and CMD without manual math errors.
- **Dual-Mode Attack Builder:**
  - **RAW Mode:** Edit melee and ranged attacks freely using standard Paizo notation (e.g., `+13 mwk rapier (1d6+11/18-20)`).
  - **CALC Mode:** Select weapons from the embedded gear catalog to auto-compute attack rolls, damage dice, critical threats, and strength multipliers.
- **Fast Feat Prefix & Acronym Engine:** Direct shorthand matching (`wf` -> Weapon Focus, `gwf` -> Greater Weapon Focus, `pa` -> Power Attack, `twf` -> Two-Weapon Fighting, `pbs` -> Point-Blank Shot) and creature attack mapping (`Weapon Focus (Bite)`).
- **Interactive Tooltip Modals (`window.showInfoModal`):** Instant rule lookups for spells, feats, special abilities, auras, immunities, resistances, and equipment.
- **Stepper Controls:** Touch-friendly `[-10]...[+10]` HP adjustments and custom CMB/CMD notation modifiers.

### 📚 2. Monster Database & Search Engine
- **Spacious 3-Column Grid:** Fixed 3-column layout on desktop (`repeat(3, minmax(0, 1fr))`), 2 columns on tablet, and 1 column on mobile with zero text clipping.
- **Multi-Faceted Search & Filtering:** Filter by Name, CR (Challenge Rating), Creature Type, Alignment, Environment, and Category (Official Monsters, NPCs, Custom Community, My Monsters, Private, Favorites, 3PP).
- **Optimized Layout Spacing:** Row separation between search bar and filter selects with generous spacing to monster cards.
- **One-Click Loading & Forking:** Load any monster into the editor or modify public community creations safely with automatic ownership forking.

### ⚙️ 3. Appearance & Display Customizer
- **Application UI Mode:** Toggle between **🌙 Dark UI** and **☀️ Light UI** for the entire workspace.
- **21 Statblock Paper Themes:** Classic Parchment, Obsidian Glass, Ancient Scroll, Midnight Arcana, Crimson Blood, Emerald Forest, Cyber Neon, Wizard's Tome, and more.
- **Typography & Font Options:** Choose from 9 premium fonts (*Inter, EB Garamond, Cinzel, Roboto, Montserrat, Poppins, Fira Sans, Lora, JetBrains Mono*).
- **Font Size & Scale Controls:** 11–20px slider with one-click presets (`12px`, `14px`, `16px`, `18px`) and 80–150% statblock zoom scaling.
- **Zero-Flash Theme Persistence:** Saved themes, fonts, and modes apply instantly upon page load.

### 🔒 4. Authentication, Privacy & Ownership
- **Pure Username & Password Auth:** Secure PBKDF2 SHA-256 password hashing with bearer tokens.
- **Public & Private Visibility:** Choose whether your custom creations are public for the community or strictly private to your account.
- **Case-Insensitive Ownership Protection:** Authors maintain full edit and delete control over their monsters across sessions.
- **Per-Account Favorites:** Persist favorite monsters independently across accounts and privacy updates.
- **Bulk Database Export & Import:** Export filtered or full monster datasets as JSON and import batch custom monster arrays in one click.

---

## 📚 Embedded Pathfinder 1e Datasets (`/data`)

The application includes an extensive, offline-first database:

| Dataset | Entries | Description |
|---|---|---|
| **Monsters & NPCs** | 6,516+ | Official Bestiaries 1–6, NPC Codex, Unique Paizo Creatures, 3PP, and custom creations. |
| **Spells** | 2,909 | Full Pathfinder 1e spell database with schools, class spell lists, CL, and descriptions. |
| **Feats** | 3,188 | Feats with prerequisite trees, RAW descriptions, and automatic stat modifiers. |
| **Special Abilities & UMR** | 325 | Universal Monster Rules (UMR), special attacks, defenses, and DC formulas. |
| **Auras** | 75 | Monster and spell auras with radius and saving throw mechanics. |
| **Class Features** | 141 | Core, Base, Hybrid, and Occult class mechanics. |
| **Rules & Conditions** | 4 sets | 32 Combat Conditions, 11 Combat Maneuvers, Modifiers, and Hazards. |
| **Armors & Shields** | 21 | Armor stats with AC bonuses, Max DEX, ACP, and Spell Failure. |
| **Weapons** | 41 | Weapons with damage dice, crit ranges, damage types, and categories. |
| **Magic Items** | 58 | Big Six and wondrous items with slot mapping and attribute modifiers. |
| **Immunities / Resistances / Weaknesses** | 104 | Complete defensive profiles and vulnerability tags. |

---

Access the hosted application directly in your browser:
👉 **[https://158.51.78.172](https://158.51.78.172)**

---

## 📜 License & Credits

Built with for the Pathfinder 1E tabletop roleplaying community. Pathfinder is a registered trademark of Paizo Inc. Game rules, mechanics, and data are sourced under the Open Game License (OGL).