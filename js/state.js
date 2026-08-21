// Centralized state management for Pathfinder Master Sheet

window.CharacterState = {
    spells: [],
    inventory: {
        weapons: [],
        armor: [],
        wondrous: [],
        magicItems: []
    },
    activeFeats: [],
    activeBuffs: [],

    // Helper methods for Spells
    addSpell(spellName) {
        if (!this.spells.includes(spellName)) {
            this.spells.push(spellName);
            this.notifyUpdate();
        }
    },
    removeSpell(spellName) {
        this.spells = this.spells.filter(s => s !== spellName);
        this.notifyUpdate();
    },
    
    // Helper methods for Gear & Magic Items
    addGear(item, type) {
        if (this.inventory[type]) {
            this.inventory[type].push(item);
            this.notifyUpdate();
        }
    },

    equipMagicItem(item) {
        if (!item || !item.name) return;
        if (!Array.isArray(this.inventory.magicItems)) {
            this.inventory.magicItems = [];
        }
        // If same slot (except rings which allow 2, or slotless), replace or add
        const slot = item.slot || 'Wondrous';
        if (slot !== 'Ring' && slot !== 'Slotless') {
            this.inventory.magicItems = this.inventory.magicItems.filter(i => (i.slot || '') !== slot);
        } else if (slot === 'Ring') {
            const existingRings = this.inventory.magicItems.filter(i => i.slot === 'Ring');
            if (existingRings.length >= 2) {
                // remove the first ring
                const firstIdx = this.inventory.magicItems.findIndex(i => i.slot === 'Ring');
                if (firstIdx !== -1) this.inventory.magicItems.splice(firstIdx, 1);
            }
        }
        // Avoid exact duplicates
        this.inventory.magicItems = this.inventory.magicItems.filter(i => i.name.toLowerCase() !== item.name.toLowerCase());
        this.inventory.magicItems.push(item);
        this.notifyUpdate();
    },

    unequipMagicItem(itemName) {
        if (!Array.isArray(this.inventory.magicItems)) return;
        this.inventory.magicItems = this.inventory.magicItems.filter(i => i.name.toLowerCase() !== itemName.toLowerCase());
        this.notifyUpdate();
    },

    getMagicItemModifiers() {
        const mods = {
            ac_natural: 0,
            ac_deflection: 0,
            ac_armor: 0,
            saves_resistance: 0,
            fort_resistance: 0,
            ref_resistance: 0,
            will_resistance: 0,
            str: 0,
            dex: 0,
            con: 0,
            int: 0,
            wis: 0,
            cha: 0
        };

        if (!Array.isArray(this.inventory.magicItems)) return mods;

        this.inventory.magicItems.forEach(item => {
            if (!item || !item.modifiers) return;
            const m = item.modifiers;
            // Pathfinder 1e stacking rules: enhancement/deflection/resistance bonuses don't stack with bonuses of same type, take highest
            if (m.ac_natural) mods.ac_natural = Math.max(mods.ac_natural, m.ac_natural);
            if (m.ac_deflection) mods.ac_deflection = Math.max(mods.ac_deflection, m.ac_deflection);
            if (m.ac_armor) mods.ac_armor = Math.max(mods.ac_armor, m.ac_armor);
            if (m.saves_resistance) mods.saves_resistance = Math.max(mods.saves_resistance, m.saves_resistance);
            if (m.fort_resistance) mods.fort_resistance = Math.max(mods.fort_resistance, m.fort_resistance);
            if (m.ref_resistance) mods.ref_resistance = Math.max(mods.ref_resistance, m.ref_resistance);
            if (m.will_resistance) mods.will_resistance = Math.max(mods.will_resistance, m.will_resistance);
            if (m.str) mods.str = Math.max(mods.str, m.str);
            if (m.dex) mods.dex = Math.max(mods.dex, m.dex);
            if (m.con) mods.con = Math.max(mods.con, m.con);
            if (m.int) mods.int = Math.max(mods.int, m.int);
            if (m.wis) mods.wis = Math.max(mods.wis, m.wis);
            if (m.cha) mods.cha = Math.max(mods.cha, m.cha);
        });

        return mods;
    },

    notifyUpdate() {
        if (typeof window.updatePreview === 'function') {
            window.updatePreview();
        }
        if (typeof window.renderEquippedMagicItems === 'function') {
            window.renderEquippedMagicItems();
        }
        if (typeof window.updateGearDisplay === 'function') {
            window.updateGearDisplay();
        }
        if (typeof window.renderActiveSpells === 'function') {
            window.renderActiveSpells();
        }
    }
};
