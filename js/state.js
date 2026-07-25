// Centralized state management for Pathfinder Master Sheet

window.CharacterState = {
    // Legacy integration
    get classes() { return window.activeClasses || []; },
    set classes(val) { window.activeClasses = val; },

    // New modular state
    spells: [],
    inventory: {
        weapons: [],
        armor: [],
        wondrous: []
    },
    activeFeats: [],
    activeBuffs: [],

    // Helper methods
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
    
    addGear(item, type) {
        if (this.inventory[type]) {
            this.inventory[type].push(item);
            this.notifyUpdate();
        }
    },

    notifyUpdate() {
        // Trigger a preview update in script.js
        if (typeof window.updatePreview === 'function') {
            window.updatePreview();
        }
    }
};
