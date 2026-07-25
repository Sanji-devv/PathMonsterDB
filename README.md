# 🐉 Pathfinder 1e Monster Creator

Welcome to the **Pathfinder 1e Monster Creator**! This is a powerful, offline-first, browser-based tool designed specifically for Game Masters of the Pathfinder 1st Edition Roleplaying Game. 

It allows you to instantly search a massive database of nearly every monster in the game, customize their stats with built-in math automation, and export gorgeous, print-ready A4 statblocks that look identical to the official rulebooks.

---

## ✨ Features

- **Massive Built-in Library:** Includes over 280,000 lines of data containing standard Bestiary monsters, NPCs, Unique Monsters, and 3rd Party (3PP) creatures.
- **Smart Feat System:** Autocomplete search for over 1400 feats. Automatically calculates and applies math bonuses (like *Toughness* or *Improved Initiative*) directly to your monster's stats.
- **Spells Integration:** Build caster statblocks with smart autocomplete linked to `spells.json`, featuring an automated DC calculator based on caster stats.
- **Ultra-Fast Performance:** Features an optimized in-memory database engine for both spells and monsters, and a debounced frontend editor ensuring zero lag while creating complex monsters.
- **Live Preview:** See your monster statblock update in real-time as you type, designed with a beautiful dual-pane layout.
- **Print & Export:** Easily save your custom monsters as high-quality PNGs or PDFs, perfectly sized for A4 paper.
- **Smart Attack Calculation:** Swap between "Raw Text" and "Calc Mode" for weapons. In Calc Mode, the app automatically scales damage, calculates *Power Attack/Deadly Aim/Furious Focus*, and applies strength modifiers.
- **Custom Library:** Save your homebrew monsters to your local database and access them anytime. They are stored securely alongside the official data.
- **Extensive Theme Support:** Switch between 20+ aesthetic themes (Abyssal, Necro, Celestial, etc.) to suit your campaign's mood, while always enforcing a clean "Classic" look by default upon load.

---

## 🚀 Getting Started

This application is designed to be run locally on your machine. You do not need an active internet connection to use the core features or the monster library.

### Prerequisites
- You need to have **Python 3.x** installed on your computer.

### Installation & Running

1. **Download the project** and extract it to a folder on your computer.
2. **Open your terminal** (or Command Prompt / PowerShell).
3. **Navigate to the project folder:**
   ```bash
   cd path/to/your/folder
   ```
4. **Start the local server:**
   ```bash
   python main.py
   ```
5. **Open your web browser!**
   The application will automatically open in your default browser. If it doesn't, manually go to:
   [http://localhost:8000](http://localhost:8000)

---

## 🛠️ How to Use

- **Creating a Monster:** Go to the home page (`index.html`) and start filling out the form on the left. The live preview on the right will update instantly.
- **Adding Feats:** Type in the feats box to see autocomplete suggestions. Hover over a selected feat to read its rules, or click it to visit the Archives of Nethys page for full details.
- **Searching the Database:** Click the "Monster Library" button to access the massive database. You can filter by name, Challenge Rating (CR), or Category (NPCs, 3PP, Unique, etc.). Click the ✏️ Edit icon next to any monster to load it into the creator and modify it!
- **Saving:** Click the **Save Monster** button in the creator. Your monster will be permanently saved to the database and will appear in your Custom Monsters library.

---



---

## 📜 License & Credits

This project was built for the Pathfinder community to make GM prep faster and more enjoyable. 
Pathfinder is a registered trademark of Paizo Inc., and the Pathfinder Roleplaying Game and Pathfinder Roleplaying Game Compatibility Logo are trademarks of Paizo Inc. 

Data is sourced from the Open Gaming Network (d20pfsrd) and Archives of Nethys under the Open Game License (OGL).
