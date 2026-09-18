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

// Global Monster to Form State Converter
window.buildEditorStateFromMonster = function(m) {
    if (!m) return null;
    const state = {
        basic: {
            'in-name': m.Name || m.name || 'Unknown Creature',
            'in-cr': m.CR || m.cr || '1',
            'in-xp': m.XP || m.xp || '400',
            'in-alignment': 'N',
            'in-size': 'Medium',
            'in-type': 'Humanoid',
            'in-type-full': '',
            'in-aura': m.Aura || m.aura || '',
            'in-speed': m.Speed || m.speed || '30 ft.',
            'in-space': '5 ft.',
            'in-reach': '5 ft.',
            'in-str': m.Str !== undefined ? String(m.Str) : '10',
            'in-dex': m.Dex !== undefined ? String(m.Dex) : '10',
            'in-con': m.Con !== undefined ? String(m.Con) : '10',
            'in-int': m.Int !== undefined ? String(m.Int) : '10',
            'in-wis': m.Wis !== undefined ? String(m.Wis) : '10',
            'in-cha': m.Cha !== undefined ? String(m.Cha) : '10',
            'in-bab': '1',
            'in-cmb-extra': '0',
            'in-cmd-extra': '0',
            'in-init-extra': '0',
            'in-hd-amount': '1',
            'in-hd-size': '8',
            'in-fort': '+0',
            'in-ref': '+0',
            'in-will': '+0',
            'in-ac-armor': '0',
            'in-ac-shield': '0',
            'in-ac-natural': '0',
            'in-ac-deflection': '0',
            'in-ac-dodge': '0',
            'in-armor-name': '',
            'in-shield-name': '',
            'in-def-abilities': m.DefensiveAbilities || m.def_abilities || '',
            'in-dr': m.DR || m.dr || '',
            'in-immune': m.Immune || m.immune || '',
            'in-resist': m.Resist || m.resist || '',
            'in-weaknesses': m.Weaknesses || m.weaknesses || '',
            'in-sr': m.SR || m.sr || '',
            'in-special-attacks': m.SpecialAttacks || m.special_attacks || '',
            'in-feats': m.Feats || m.feats || '',
            'in-skills': m.Skills || m.skills || '',
            'in-languages': m.Languages || m.languages || '',
            'in-sq': m.SQ || m.sq || '',
            'in-gear': '',
            'in-environment': m.Environment || m.environment || '',
            'in-organization': m.Organization || m.organization || '',
            'in-treasure': m.Treasure || m.treasure || '',
            'in-sla-cl': '',
            'in-spell-class': '',
            'in-spell-cl': '1'
        },
        html: {},
        dynamic: {
            subtypes: [],
            senses: [],
            skills: [],
            slas: [],
            abilities: [],
            melee: [],
            ranged: [],
            magic_items: [],
            spells: []
        }
    };

    const validTypes = [
        "Aberration", "Animal", "Construct", "Dragon", "Fey", "Humanoid",
        "Magical Beast", "Monstrous Humanoid", "Ooze", "Outsider", "Plant", "Undead", "Vermin"
    ];

    // 1. Creature Type
    if (m.Type || m.type) {
        const rawType = String(m.Type || m.type).trim().toLowerCase();
        const matchedType = validTypes.find(t => t.toLowerCase() === rawType);
        if (matchedType) {
            state.basic['in-type'] = matchedType;
        } else {
            state.basic['in-type'] = rawType.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
    } else {
        const nLower = (m.Name || m.name || '').toLowerCase();
        if (/undead|lich|ghost|wight|vampire|skeleton|zombie|mummy|wraith|spectre|ghoul/i.test(nLower)) {
            state.basic['in-type'] = 'Undead';
        } else if (/dragon|wyrm|drake|wyvern/i.test(nLower)) {
            state.basic['in-type'] = 'Dragon';
        } else if (/construct|golem|clockwork|robot|automaton|animated/i.test(nLower)) {
            state.basic['in-type'] = 'Construct';
        } else if (/elemental|demon|devil|angel|archon|azata|daemon|oni|div/i.test(nLower)) {
            state.basic['in-type'] = 'Outsider';
        } else if (/plant|treant|fungus|shambler|vine/i.test(nLower)) {
            state.basic['in-type'] = 'Plant';
        } else if (/ooze|pudding|jelly|slime|cube/i.test(nLower)) {
            state.basic['in-type'] = 'Ooze';
        } else if (/beast|hydra|chimera|basilisk|manticore|griffon|pegasus/i.test(nLower)) {
            state.basic['in-type'] = 'Magical Beast';
        } else {
            state.basic['in-type'] = 'Humanoid';
        }
    }

    // 2. Alignment
    const validAligns = ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"];
    if ((m.Alignment || m.alignment) && validAligns.includes(String(m.Alignment || m.alignment).trim().toUpperCase())) {
        state.basic['in-alignment'] = String(m.Alignment || m.alignment).trim().toUpperCase();
    } else {
        state.basic['in-alignment'] = 'N';
    }

    // 3. Size
    const validSizes = ["Fine", "Diminutive", "Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan", "Colossal"];
    if (m.Size || m.size) {
        const rawSize = String(m.Size || m.size).trim().toLowerCase();
        const matchedSize = validSizes.find(s => s.toLowerCase() === rawSize);
        if (matchedSize) state.basic['in-size'] = matchedSize;
    } else {
        const nLower = (m.Name || m.name || '').toLowerCase();
        if (nLower.includes('giant') || nLower.includes('large')) state.basic['in-size'] = 'Large';
        else if (nLower.includes('huge')) state.basic['in-size'] = 'Huge';
        else if (nLower.includes('gargantuan')) state.basic['in-size'] = 'Gargantuan';
        else if (nLower.includes('colossal')) state.basic['in-size'] = 'Colossal';
        else if (nLower.includes('small')) state.basic['in-size'] = 'Small';
        else if (nLower.includes('tiny')) state.basic['in-size'] = 'Tiny';
        else state.basic['in-size'] = 'Medium';
    }

    // 4. Space & Reach
    if (m.Space || m.space) state.basic['in-space'] = String(m.Space || m.space).includes('ft') ? String(m.Space || m.space) : (m.Space || m.space) + ' ft.';
    if (m.Reach || m.reach) state.basic['in-reach'] = String(m.Reach || m.reach).includes('ft') ? String(m.Reach || m.reach) : (m.Reach || m.reach) + ' ft.';

    // 5. Subtypes
    for (let i = 1; i <= 6; i++) {
        if (m[`subtype${i}`]) state.dynamic.subtypes.push(m[`subtype${i}`]);
    }

    // 6. Senses
    if (m.Senses || m.senses) {
        let parts = String(m.Senses || m.senses).split(/,(?![^\(]*\))/);
        parts.forEach(part => {
            part = part.trim();
            if (!part) return;
            const match = part.match(/^(.*?)(\d+.*)?$/);
            if (match) {
                state.dynamic.senses.push({
                    name: match[1].trim(),
                    dist: match[2] ? match[2].trim() : ''
                });
            } else {
                state.dynamic.senses.push({ name: part, dist: '' });
            }
        });
    }

    // 7. Armor & Shield Gear Resolution
    const armorBonusMap = {
        'Padded': 1, 'Leather': 2, 'Studded Leather': 3, 'Chain Shirt': 4, 'Mithral Chain Shirt': 4,
        'Hide': 4, 'Scale Mail': 5, 'Chainmail': 6, 'Breastplate': 6, 'Mithral Breastplate': 6,
        'Splint Mail': 7, 'Banded Mail': 7, 'Half-Plate': 8, 'Full Plate': 9, 'Mithral Full Plate': 9
    };
    const shieldBonusMap = {
        'Buckler': 1, 'Light Wooden Shield': 1, 'Light Steel Shield': 1,
        'Heavy Wooden Shield': 2, 'Heavy Steel Shield': 2, 'Tower Shield': 4
    };

    const allGearStr = [m.Gear, m.Treasure, m.OtherGear].filter(Boolean).join(' ');
    state.basic['in-gear'] = allGearStr;

    if (allGearStr) {
        const gearLower = allGearStr.toLowerCase();
        if (gearLower.includes('mithral full plate')) state.basic['in-armor-name'] = 'Mithral Full Plate';
        else if (gearLower.includes('full plate')) state.basic['in-armor-name'] = 'Full Plate';
        else if (gearLower.includes('mithral breastplate')) state.basic['in-armor-name'] = 'Mithral Breastplate';
        else if (gearLower.includes('breastplate')) state.basic['in-armor-name'] = 'Breastplate';
        else if (gearLower.includes('mithral chain shirt')) state.basic['in-armor-name'] = 'Mithral Chain Shirt';
        else if (gearLower.includes('chain shirt')) state.basic['in-armor-name'] = 'Chain Shirt';
        else if (gearLower.includes('chainmail')) state.basic['in-armor-name'] = 'Chainmail';
        else if (gearLower.includes('half-plate') || gearLower.includes('half plate')) state.basic['in-armor-name'] = 'Half-Plate';
        else if (gearLower.includes('splint mail')) state.basic['in-armor-name'] = 'Splint Mail';
        else if (gearLower.includes('banded mail')) state.basic['in-armor-name'] = 'Banded Mail';
        else if (gearLower.includes('scale mail')) state.basic['in-armor-name'] = 'Scale Mail';
        else if (gearLower.includes('studded leather')) state.basic['in-armor-name'] = 'Studded Leather';
        else if (gearLower.includes('hide')) state.basic['in-armor-name'] = 'Hide';
        else if (gearLower.includes('leather')) state.basic['in-armor-name'] = 'Leather';
        else if (gearLower.includes('padded')) state.basic['in-armor-name'] = 'Padded';

        if (gearLower.includes('tower shield')) state.basic['in-shield-name'] = 'Tower Shield';
        else if (gearLower.includes('buckler')) state.basic['in-shield-name'] = 'Buckler';
        else if (gearLower.includes('heavy steel shield')) state.basic['in-shield-name'] = 'Heavy Steel Shield';
        else if (gearLower.includes('heavy wooden shield')) state.basic['in-shield-name'] = 'Heavy Wooden Shield';
        else if (gearLower.includes('heavy shield')) state.basic['in-shield-name'] = 'Heavy Steel Shield';
        else if (gearLower.includes('light steel shield')) state.basic['in-shield-name'] = 'Light Steel Shield';
        else if (gearLower.includes('light wooden shield')) state.basic['in-shield-name'] = 'Light Wooden Shield';
        else if (gearLower.includes('light shield')) state.basic['in-shield-name'] = 'Light Steel Shield';

        if (state.basic['in-armor-name'] || state.basic['in-shield-name']) {
            const parts = allGearStr.split(/[,;]\s*/).map(s => s.trim()).filter(Boolean);
            const armLow = (state.basic['in-armor-name'] || '').toLowerCase();
            const shLow = (state.basic['in-shield-name'] || '').toLowerCase();
            state.basic['in-gear'] = parts.filter(p => {
                const pLow = p.toLowerCase();
                if (armLow && (pLow === armLow || pLow.includes(armLow) || armLow.includes(pLow))) return false;
                if (shLow && (pLow === shLow || pLow.includes(shLow) || shLow.includes(pLow))) return false;
                return true;
            }).join(', ');
        }
    }

    let acArmorBonus = 0;
    let acShieldBonus = 0;
    if (state.basic['in-armor-name'] && armorBonusMap[state.basic['in-armor-name']]) {
        acArmorBonus = armorBonusMap[state.basic['in-armor-name']];
        state.basic['in-ac-armor'] = acArmorBonus.toString();
    }
    if (state.basic['in-shield-name'] && shieldBonusMap[state.basic['in-shield-name']]) {
        acShieldBonus = shieldBonusMap[state.basic['in-shield-name']];
        state.basic['in-ac-shield'] = acShieldBonus.toString();
    }

    // 8. AC Breakdown & Natural Armor Back-Calculation
    const acStr = String(m.AC || m.ac || m['in-ac'] || m.AC_Mods || '');
    const armMatch = acStr.match(/[+\-]?(\d+)\s+armor/i);
    const shMatch = acStr.match(/[+\-]?(\d+)\s+shield/i);
    const natMatch = acStr.match(/[+\-]?(\d+)\s+natural/i);
    const defMatch = acStr.match(/[+\-]?(\d+)\s+deflection/i);
    const dogMatch = acStr.match(/[+\-]?(\d+)\s+dodge/i);

    if (armMatch) {
        acArmorBonus = parseInt(armMatch[1]) || 0;
        state.basic['in-ac-armor'] = acArmorBonus.toString();
    }
    if (shMatch) {
        acShieldBonus = parseInt(shMatch[1]) || 0;
        state.basic['in-ac-shield'] = acShieldBonus.toString();
    }

    let acDefBonus = 0;
    if (defMatch) {
        acDefBonus = parseInt(defMatch[1]) || 0;
        state.basic['in-ac-deflection'] = acDefBonus.toString();
    }

    let acDodgeBonus = 0;
    if (dogMatch) {
        acDodgeBonus = parseInt(dogMatch[1]) || 0;
        state.basic['in-ac-dodge'] = acDodgeBonus.toString();
    }

    let acTotal = parseInt(m.AC || m.ac) || 10;
    let dexMod = Math.floor(((parseInt(m.Dex || m.dex) || 10) - 10) / 2);
    let sizeMod = 0;
    let sz = state.basic['in-size'].toLowerCase();
    if (sz === 'small') sizeMod = 1;
    if (sz === 'tiny') sizeMod = 2;
    if (sz === 'diminutive') sizeMod = 4;
    if (sz === 'fine') sizeMod = 8;
    if (sz === 'large') sizeMod = -1;
    if (sz === 'huge') sizeMod = -2;
    if (sz === 'gargantuan') sizeMod = -4;
    if (sz === 'colossal') sizeMod = -8;

    const defAbsLower = String(m.DefensiveAbilities || m.def_abilities || state.basic['in-def-abilities'] || '').toLowerCase();
    const typeLower = String(m.Type || m.type || state.basic['in-type'] || '').toLowerCase();
    const isCreatureIncorporeal = state.dynamic.subtypes.map(s => String(s).toLowerCase()).includes('incorporeal') ||
        /\bincorporeal\b/.test(defAbsLower) ||
        typeLower.includes('incorporeal');

    if (natMatch) {
        state.basic['in-ac-natural'] = (parseInt(natMatch[1]) || 0).toString();
    } else if (isCreatureIncorporeal) {
        state.basic['in-ac-natural'] = '0';
        if (!defMatch) {
            const chaVal = parseInt(m.Cha || m.cha || state.basic['in-cha']) || 10;
            const chaMod = Math.floor((chaVal - 10) / 2);
            const incorpDef = Math.max(1, chaMod);
            state.basic['in-ac-deflection'] = incorpDef.toString();
        }
    } else {
        let calculatedNatArmor = Math.max(0, acTotal - 10 - dexMod - sizeMod - acArmorBonus - acShieldBonus - acDefBonus - acDodgeBonus);
        state.basic['in-ac-natural'] = calculatedNatArmor.toString();
    }

    // 9. HD & HP
    let hdAmount = 1;
    if (m.HD || m.hd) {
        const hdStr = String(m.HD || m.hd);
        const allDiceMatches = [...hdStr.matchAll(/(\d+)d(\d+)/gi)];
        if (allDiceMatches.length > 0) {
            let totalDiceCount = 0;
            let primaryDieSize = allDiceMatches[0][2];
            allDiceMatches.forEach(match => {
                totalDiceCount += parseInt(match[1]) || 0;
            });
            hdAmount = totalDiceCount || 1;
            state.basic['in-hd-amount'] = hdAmount.toString();
            state.basic['in-hd-size'] = primaryDieSize || '8';
        }
    } else if (m.HP || m.hp) {
        let hpVal = parseInt(m.HP || m.hp) || 20;
        hdAmount = Math.max(1, Math.round(hpVal / 4.5));
        state.basic['in-hd-amount'] = hdAmount.toString();
        state.basic['in-hd-size'] = '8';
    }

    // 10. Saves
    const formatS = (val) => {
        if (val === undefined || val === null || val === '') return '+0';
        const s = String(val).trim();
        if (s.startsWith('+') || s.startsWith('-')) return s;
        return (parseFloat(s) >= 0 ? "+" : "") + s;
    };
    state.basic['in-fort'] = formatS(m.Fort || m.fort);
    state.basic['in-ref'] = formatS(m.Ref || m.ref);
    state.basic['in-will'] = formatS(m.Will || m.will);

    // 11. Melee & Ranged
    function splitAttacks(str) {
        if (!str) return [];
        return String(str).split(/,(?![^\(\)]*\))|\s+or\s+(?![^\(\)]*\))/g).map(s => s.trim()).filter(s => s);
    }

    if ((m.Melee || m.melee) && String(m.Melee || m.melee).trim()) {
        splitAttacks(m.Melee || m.melee).forEach(atk => {
            state.dynamic.melee.push({ mode: 'raw', rawText: atk });
        });
    }
    if ((m.Ranged || m.ranged) && String(m.Ranged || m.ranged).trim()) {
        splitAttacks(m.Ranged || m.ranged).forEach(atk => {
            state.dynamic.ranged.push({ mode: 'raw', rawText: atk });
        });
    }

    // 12. Special Abilities
    if (m.dynamic && m.dynamic.abilities && Array.isArray(m.dynamic.abilities) && m.dynamic.abilities.length > 0) {
        m.dynamic.abilities.forEach(ab => {
            state.dynamic.abilities.push({ name: ab.name || 'Special Ability', desc: ab.desc || ab.name || '' });
        });
    } else if (m['Special Abilities'] || m.SpecialAbilities || m.special_abilities) {
        let lines = String(m['Special Abilities'] || m.SpecialAbilities || m.special_abilities).split('\n');
        let currentName = '';
        let currentDesc = [];

        lines.forEach(line => {
            line = line.trim();
            if (!line) return;
            const match = line.match(/^([A-Za-z0-9\s\-\'\’]+?\s*\((?:Su|Ex|Sp)\))\s*(.*)/i);
            if (match) {
                if (currentName) {
                    state.dynamic.abilities.push({ name: currentName, desc: currentDesc.join('<br><br>') });
                }
                currentName = match[1].trim();
                currentDesc = [];
                const remainingDesc = match[2].trim();
                if (remainingDesc) currentDesc.push(remainingDesc);
            } else {
                if (!currentName) currentName = "Special Ability";
                currentDesc.push(line);
            }
        });
        if (currentName) {
            state.dynamic.abilities.push({ name: currentName, desc: currentDesc.join('<br><br>') });
        }
    } else if (m.SpecialAttacks || m.special_attacks) {
        let sas = [];
        let current = '';
        let depth = 0;
        const saStr = String(m.SpecialAttacks || m.special_attacks);
        for (let i = 0; i < saStr.length; i++) {
            let c = saStr[i];
            if (c === '(') depth++;
            if (c === ')') depth--;
            if (c === ',' && depth === 0) {
                sas.push(current.trim());
                current = '';
            } else {
                current += c;
            }
        }
        if (current) sas.push(current.trim());

        sas.forEach(sa => {
            sa = sa.trim();
            if (!sa) return;
            const saName = sa.charAt(0).toUpperCase() + sa.slice(1);
            state.dynamic.abilities.push({ name: saName, desc: saName });
        });
    }

    // 13. Spell-Like Abilities & Spells
    if (m.SpellLikeAbilities || m.spell_like_abilities) {
        let lines = String(m.SpellLikeAbilities || m.spell_like_abilities).split('\n');
        const reHeader = /^(?:Spell-Like|Spells Prepared|Spells Known|\(?CL\s+)/i;
        const reFreq = /^((?:\d+\/(?:day|week|month|year)|at\s*will|constant|\d+(?:st|nd|rd|th)\s*\([^)]*\)|\d+(?:st|nd|rd|th)|\d+\s*\(at\s*will\)))\s*[\—\–\-\ufffd\:]\s*(.*)$/i;

        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            const clMatch = line.match(/\((CL\s+[^\)]+)\)/i);
            if (clMatch && !state.basic['in-sla-cl']) {
                state.basic['in-sla-cl'] = clMatch[1];
            }

            if (reHeader.test(line)) {
                state.dynamic.slas.push({ freq: '', spells: line });
            } else {
                const freqMatch = line.match(reFreq);
                if (freqMatch) {
                    state.dynamic.slas.push({ freq: freqMatch[1].trim(), spells: freqMatch[2].trim() });
                } else {
                    const dashMatch = line.match(/[\—\–\ufffd]/);
                    if (dashMatch) {
                        state.dynamic.slas.push({
                            freq: line.substring(0, dashMatch.index).trim(),
                            spells: line.substring(dashMatch.index + 1).trim()
                        });
                    } else {
                        state.dynamic.slas.push({ freq: '', spells: line });
                    }
                }
            }
        });
    }

    // 14. Auto-Calculate BAB
    let typeValStr = state.basic['in-type'] || 'Humanoid';
    const typeBabMap = {
        "Aberration": 0.75, "Animal": 0.75, "Construct": 1.0,
        "Dragon": 1.0, "Fey": 0.5, "Humanoid": 0.75,
        "Magical Beast": 1.0, "Monstrous Humanoid": 1.0,
        "Ooze": 0.75, "Outsider": 1.0, "Plant": 0.75,
        "Undead": 0.75, "Vermin": 0.75
    };
    let babMult = typeBabMap[typeValStr] || 0.75;
    let calculatedBab = Math.max(1, Math.floor(hdAmount * babMult));
    state.basic['in-bab'] = m.BaseAtk || m.BaseAttack || calculatedBab.toString();

    // 15. Skills
    if (m.Skills || m.skills) {
        let skillParts = String(m.Skills || m.skills).split(/,(?![^\(]*\))/);
        skillParts.forEach(s => {
            let match = s.trim().match(/^(.*?)\s+([+-]\d+)$/);
            if (match) {
                state.dynamic.skills.push({ name: match[1].trim(), mod: parseInt(match[2]) });
            } else {
                state.dynamic.skills.push({ name: s.trim(), mod: 0 });
            }
        });
    }

    // 16. Monster vs NPC Flag
    const nameMatch = (m.Name || m.name || '').match(/^(.*?)\s*\(([^)]+)\)$/);
    const parsedCleanName = nameMatch ? nameMatch[1].trim() : (m.Name || m.name || 'Unknown Creature');
    const parsedRaceClass = nameMatch ? nameMatch[2].trim() : '';

    const isNpc = m.CharacterFlag === "1" || m.CharacterFlag === 1 ||
        (m.URL && m.URL.includes('/npc-s/')) ||
        Boolean(m.Class1) || Boolean(m.Class) || Boolean(parsedRaceClass) ||
        /cleric|wizard|fighter|rogue|paladin|ranger|bard|druid|sorcerer|monk|necromancer|alchemist|inquisitor|magus|cavalier|gunslinger|witch|oracle|summoner|aristocrat|adept|expert|warrior/i.test(m.Name || m.name || '');

    if (isNpc) {
        state.basic.stat_type = 'npc';
        const cls = m.Class1 || m.Class || '';
        const lvl = m.Class1_Lvl || '';
        if (cls) {
            state.basic['in-type-full'] = lvl ? `${cls} ${lvl}` : cls;
        } else if (parsedRaceClass) {
            state.basic['in-type-full'] = parsedRaceClass;
        } else {
            state.basic['in-type-full'] = m.Race || 'Humanoid';
        }
        if (nameMatch) {
            state.basic['in-name'] = parsedCleanName;
        }
    } else {
        state.basic.stat_type = 'monster';
        state.basic['in-type-full'] = '';
    }

    // 17. Magic Items
    if (m.OriginalState && m.OriginalState.dynamic && Array.isArray(m.OriginalState.dynamic.magic_items)) {
        state.dynamic.magic_items = m.OriginalState.dynamic.magic_items;
    } else if (allGearStr) {
        state.dynamic.magic_items = [];
        const gearParts = allGearStr.split(/[,;]\s*/);
        gearParts.forEach(part => {
            const pLower = part.trim().toLowerCase();
            if (pLower.includes('amulet of natural armor') || pLower.includes('ring of protection') || pLower.includes('cloak of resistance') || pLower.includes('belt of ') || pLower.includes('headband of ') || pLower.includes('bracers of armor') || pLower.includes('boots of speed') || pLower.includes('ring of invisibility') || pLower.includes('eyes of the eagle') || pLower.includes('goggles of night') || pLower.includes('gauntlets of ogre power')) {
                let matched = null;
                if (window.allMagicItemsDB) {
                    matched = window.allMagicItemsDB.find(mi => pLower.includes(mi.name.toLowerCase()));
                }
                if (matched) {
                    state.dynamic.magic_items.push(matched);
                } else {
                    state.dynamic.magic_items.push({ name: part.trim(), slot: 'Wondrous', description: part.trim() });
                }
            }
        });
    }

    // 18. Spells and Spellcasting Data
    const rawSpells = (m.OriginalState && m.OriginalState.basic && m.OriginalState.basic['in-spells-data']) ||
        (m.OriginalState && m.OriginalState.dynamic && m.OriginalState.dynamic.spells) ||
        (m.OriginalState && m.OriginalState.basic && m.OriginalState.basic['in-spells']);

    if (rawSpells) {
        state.basic['in-spell-class'] = m.OriginalState?.basic?.['in-spell-class'] || '';
        state.basic['in-spell-cl'] = m.OriginalState?.basic?.['in-spell-cl'] || '1';
        state.basic['in-spell-stat'] = m.OriginalState?.basic?.['in-spell-stat'] || 'int';
        state.basic['in-spell-conc'] = m.OriginalState?.basic?.['in-spell-conc'] || '';
        try {
            let parsed = typeof rawSpells === 'string' ? JSON.parse(rawSpells) : rawSpells;
            if (typeof parsed === 'string') {
                try { parsed = JSON.parse(parsed); } catch(e) {}
            }
            const normalized = {};
            if (Array.isArray(parsed)) {
                parsed.forEach(item => {
                    if (!item) return;
                    const lvl = item.level !== undefined ? item.level : 0;
                    let spellArr = [];
                    if (Array.isArray(item.spells)) {
                        spellArr = item.spells;
                    } else if (typeof item.list === 'string' && item.list.trim()) {
                        spellArr = item.list.split(',').map(s => s.trim()).filter(Boolean);
                    } else if (typeof item.spells === 'string' && item.spells.trim()) {
                        spellArr = item.spells.split(',').map(s => s.trim()).filter(Boolean);
                    }
                    normalized[lvl] = {
                        slots: item.slots || item.per_day || item.frequency || '',
                        spells: spellArr
                    };
                });
                state.dynamic.spells = normalized;
                state.basic['in-spells-data'] = JSON.stringify(normalized);
            } else if (typeof parsed === 'object' && parsed !== null) {
                Object.keys(parsed).forEach(lvlKey => {
                    const item = parsed[lvlKey];
                    if (!item) return;
                    let spellArr = [];
                    if (Array.isArray(item.spells)) {
                        spellArr = item.spells;
                    } else if (typeof item.list === 'string' && item.list.trim()) {
                        spellArr = item.list.split(',').map(s => s.trim()).filter(Boolean);
                    } else if (typeof item.spells === 'string' && item.spells.trim()) {
                        spellArr = item.spells.split(',').map(s => s.trim()).filter(Boolean);
                    } else if (Array.isArray(item)) {
                        spellArr = item;
                    }
                    normalized[lvlKey] = {
                        slots: item.slots || item.per_day || item.frequency || '',
                        spells: spellArr
                    };
                });
                state.dynamic.spells = normalized;
                state.basic['in-spells-data'] = JSON.stringify(normalized);
            }
        } catch (e) {
            state.dynamic.spells = m.OriginalState?.dynamic?.spells || {};
        }
    }

    return state;
};
