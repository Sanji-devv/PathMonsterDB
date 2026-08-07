document.addEventListener('DOMContentLoaded', () => {
    // -------------------------
    // 1. DATA & CONSTANTS
    // -------------------------
    const basicFields = [
        'name', 'xp', 'type-full', 'alignment',
        'aura', 'fort', 'ref', 'will', 'def-abilities',
        'speed', 'melee', 'ranged',
        'feats', 'languages', 'sq',
        'environment', 'organization', 'treasure',
        'dr', 'immune', 'resist', 'weaknesses', 'sr'
    ];

    const creatureTypes = {
        "Aberration": { "hit_die": 8, "bab": "Medium", "good_saves": ["Will"] },
        "Animal": { "hit_die": 8, "bab": "Medium", "good_saves": ["Fortitude", "Reflex"] },
        "Construct": { "hit_die": 10, "bab": "Fast", "good_saves": [] },
        "Dragon": { "hit_die": 12, "bab": "Fast", "good_saves": ["Fortitude", "Reflex", "Will"] },
        "Fey": { "hit_die": 6, "bab": "Slow", "good_saves": ["Reflex", "Will"] },
        "Humanoid": { "hit_die": 8, "bab": "Medium", "good_saves": ["Varies"] },
        "Magical Beast": { "hit_die": 10, "bab": "Fast", "good_saves": ["Fortitude", "Reflex"] },
        "Monstrous Humanoid": { "hit_die": 10, "bab": "Fast", "good_saves": ["Reflex", "Will"] },
        "Ooze": { "hit_die": 8, "bab": "Medium", "good_saves": [] },
        "Outsider": { "hit_die": 10, "bab": "Fast", "good_saves": ["Varies"] },
        "Plant": { "hit_die": 8, "bab": "Medium", "good_saves": ["Fortitude"] },
        "Undead": { "hit_die": 8, "bab": "Medium", "good_saves": ["Will"] },
    };
    window.creatureTypes = creatureTypes;

    const pfClasses = {
        "Alchemist": { hd: 8, bab: "Medium", fort: "Good", ref: "Good", will: "Poor" },
        "Antipaladin": { hd: 10, bab: "Fast", fort: "Good", ref: "Poor", will: "Good" },
        "Arcanist": { hd: 6, bab: "Slow", fort: "Poor", ref: "Poor", will: "Good" },
        "Barbarian": { hd: 12, bab: "Fast", fort: "Good", ref: "Poor", will: "Poor" },
        "Bard": { hd: 8, bab: "Medium", fort: "Poor", ref: "Good", will: "Good" },
        "Bloodrager": { hd: 10, bab: "Fast", fort: "Good", ref: "Poor", will: "Poor" },
        "Brawler": { hd: 10, bab: "Fast", fort: "Good", ref: "Good", will: "Poor" },
        "Cavalier": { hd: 10, bab: "Fast", fort: "Good", ref: "Poor", will: "Poor" },
        "Cleric": { hd: 8, bab: "Medium", fort: "Good", ref: "Poor", will: "Good" },
        "Druid": { hd: 8, bab: "Medium", fort: "Good", ref: "Poor", will: "Good" },
        "Fighter": { hd: 10, bab: "Fast", fort: "Good", ref: "Poor", will: "Poor" },
        "Gunslinger": { hd: 10, bab: "Fast", fort: "Good", ref: "Good", will: "Poor" },
        "Hunter": { hd: 8, bab: "Medium", fort: "Good", ref: "Good", will: "Poor" },
        "Inquisitor": { hd: 8, bab: "Medium", fort: "Good", ref: "Poor", will: "Good" },
        "Investigator": { hd: 8, bab: "Medium", fort: "Poor", ref: "Good", will: "Good" },
        "Magus": { hd: 8, bab: "Medium", fort: "Good", ref: "Poor", will: "Good" },
        "Monk": { hd: 8, bab: "Medium", fort: "Good", ref: "Good", will: "Good" },
        "Oracle": { hd: 8, bab: "Medium", fort: "Poor", ref: "Poor", will: "Good" },
        "Paladin": { hd: 10, bab: "Fast", fort: "Good", ref: "Poor", will: "Good" },
        "Ranger": { hd: 10, bab: "Fast", fort: "Good", ref: "Good", will: "Poor" },
        "Rogue": { hd: 8, bab: "Medium", fort: "Poor", ref: "Good", will: "Poor" },
        "Shaman": { hd: 8, bab: "Medium", fort: "Poor", ref: "Poor", will: "Good" },
        "Skald": { hd: 8, bab: "Medium", fort: "Good", ref: "Poor", will: "Good" },
        "Slayer": { hd: 10, bab: "Fast", fort: "Good", ref: "Good", will: "Poor" },
        "Sorcerer": { hd: 6, bab: "Slow", fort: "Poor", ref: "Poor", will: "Good" },
        "Summoner": { hd: 8, bab: "Medium", fort: "Poor", ref: "Poor", will: "Good" },
        "Swashbuckler": { hd: 10, bab: "Fast", fort: "Poor", ref: "Good", will: "Poor" },
        "Warpriest": { hd: 8, bab: "Medium", fort: "Good", ref: "Poor", will: "Good" },
        "Witch": { hd: 6, bab: "Slow", fort: "Poor", ref: "Poor", will: "Good" },
        "Wizard": { hd: 6, bab: "Slow", fort: "Poor", ref: "Poor", will: "Good" }
    };
    window.pfClasses = pfClasses;
    window.activeClasses = [];

    const crToXp = {
        "1/8": "50", "1/6": "65", "1/4": "100", "1/3": "135", "1/2": "200",
        "1": "400", "2": "600", "3": "800", "4": "1,200", "5": "1,600",
        "6": "2,400", "7": "3,200", "8": "4,800", "9": "6,400", "10": "9,600",
        "11": "12,800", "12": "19,200", "13": "25,600", "14": "38,400", "15": "51,200",
        "16": "76,800", "17": "102,400", "18": "153,600", "19": "204,800", "20": "307,200",
        "21": "409,600", "22": "614,400", "23": "819,200", "24": "1,228,800", "25": "1,638,400",
        "26": "2,457,600", "27": "3,276,800", "28": "4,915,200", "29": "6,553,600", "30": "9,830,400"
    };

    const sizeMods = {
        'Fine': { ac_atk: 8, cmb_cmd: -8 },
        'Diminutive': { ac_atk: 4, cmb_cmd: -4 },
        'Tiny': { ac_atk: 2, cmb_cmd: -2 },
        'Small': { ac_atk: 1, cmb_cmd: -1 },
        'Medium': { ac_atk: 0, cmb_cmd: 0 },
        'Large': { ac_atk: -1, cmb_cmd: 1 },
        'Huge': { ac_atk: -2, cmb_cmd: 2 },
        'Gargantuan': { ac_atk: -4, cmb_cmd: 4 },
        'Colossal': { ac_atk: -8, cmb_cmd: 8 }
    };

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    function sanitizeText(text) {
        if (typeof text !== 'string') return text;
        return text
            // Fix UTF-8 misread as Latin-1 (Mojibake)
            .replace(/â\x80\x99/g, "'") // Right single quote (â€™)
            .replace(/â\x80\x98/g, "'") // Left single quote (â€˜)
            .replace(/â\x80\x9C/g, '"') // Left double quote (â€œ)
            .replace(/â\x80\x9D/g, '"') // Right double quote (â€?)
            .replace(/â\x80\x93/g, '–') // En dash (â€“)
            .replace(/â\x80\x94/g, '—') // Em dash (â€”)

            // Literal fallback (in case the editor saved them as actual Euro characters)
            .replace(/â€™/g, "'")
            .replace(/â€œ/g, '"')
            .replace(/â€\?/g, '"')
            .replace(/â€“/g, '–')
            .replace(/â€”/g, '—')
            .replace(/â€˜/g, "'")

            // Clean up any remaining â followed by unprintable characters
            .replace(/â[\x80-\x9F]+/g, '-')

            // Specific string replacements
            .replace(/(\w)âs/g, "$1's")
            .replace(/sâ /g, "s' ")
            .replace(/(\w)â(\w)/g, "$1'$2")
            .replace(/â(\d)/g, '-$1')
            .replace(/(\d)â(\d)/g, '$1–$2')

            // Final fallback
            .replace(/â/g, "-");
    }

    function calculateModifier(score) {
        if (!score || isNaN(score)) return 0;
        return Math.floor((parseInt(score) - 10) / 2);
    }

    function formatMod(mod) {
        return mod >= 0 ? `+${mod}` : `${mod}`;
    }

    function checkVisibility(field, isWrap = false) {
        const val = document.getElementById(`out-${field}`) ? document.getElementById(`out-${field}`).textContent.trim() : '';
        const wrap = document.getElementById(`wrap-${field}`);
        if (wrap) {
            wrap.style.display = val === '' ? 'none' : (isWrap ? 'block' : 'block'); // Default block but pf-property-line handles it
        }
    }

    // -------------------------
    // 2. MAIN UPDATE FUNCTION
    // -------------------------
    function renderClasses() {
        const container = document.getElementById('classes-container');
        if (!container) return;
        container.innerHTML = '';
        window.activeClasses.forEach((cls, idx) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.background = '#444';
            div.style.padding = '4px 8px';
            div.style.borderRadius = '4px';
            div.style.marginTop = '4px';
            div.innerHTML = `<span>${cls.name} ${cls.level}</span><button class="btn-remove-class" data-idx="${idx}" style="background:transparent; border:none; color:#f55; cursor:pointer;" title="Remove Class">✖</button>`;
            container.appendChild(div);
        });

        document.querySelectorAll('.btn-remove-class').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'));
                window.activeClasses.splice(idx, 1);
                renderClasses();
                if(typeof debouncedUpdatePreview === 'function') debouncedUpdatePreview();
                else updatePreview();
            });
        });
    }

    // Call once to attach Add button if available
    setTimeout(() => {
        const btnAddClass = document.getElementById('btn-add-class');
        if (btnAddClass) {
            btnAddClass.addEventListener('click', (e) => {
                e.preventDefault();
                const clsName = document.getElementById('sel-add-class').value;
                const clsLevel = parseInt(document.getElementById('in-add-class-level').value) || 1;
                window.activeClasses.push({ name: clsName, level: clsLevel });
                renderClasses();
                if(typeof debouncedUpdatePreview === 'function') debouncedUpdatePreview();
                else updatePreview();
            });
        }
    }, 100);


    function updatePreview() {
        // CLASS LEVELS LOGIC
        let classBAB = 0;
        let classFort = 0;
        let classRef = 0;
        let classWill = 0;
        let classHPBonus = 0;
        let classHDString = '';
        let classTotalHD = 0;
        let classCRBonus = 0;

        (window.activeClasses || []).forEach(cls => {
            const cData = pfClasses[cls.name];
            if (!cData) return;
            const lvl = cls.level;
            
            if (cData.bab === 'Fast') classBAB += lvl;
            else if (cData.bab === 'Medium') classBAB += Math.floor(lvl * 0.75);
            else if (cData.bab === 'Slow') classBAB += Math.floor(lvl * 0.5);

            classFort += cData.fort === 'Good' ? Math.floor(lvl / 2) + 2 : Math.floor(lvl / 3);
            classRef += cData.ref === 'Good' ? Math.floor(lvl / 2) + 2 : Math.floor(lvl / 3);
            classWill += cData.will === 'Good' ? Math.floor(lvl / 2) + 2 : Math.floor(lvl / 3);

            classHDString += ` + ${lvl}d${cData.hd}`;
            classTotalHD += lvl;
            classHPBonus += Math.floor(lvl * ((cData.hd / 2) + 0.5));
            classCRBonus += lvl; // Approximation
        });
        // FEAT SYSTEM RE-DESIGN: STATE MANAGEMENT
        let featsRaw = document.getElementById('in-feats') ? document.getElementById('in-feats').value : '';

        // If the hidden input differs from our tracked state, it means it was loaded externally (e.g. database.js)
        if (featsRaw !== window.lastFeatsRaw) {
            let currentFeats = [];
            try {
                currentFeats = JSON.parse(featsRaw);
            } catch (e) {
                if (featsRaw) {
                    currentFeats = featsRaw.split(',').map(s => ({ name: s.trim() }));
                }
            }
            window.activeFeats = currentFeats.map(f => (f.name ? f.name : f));
            window.lastFeatsRaw = featsRaw;
            if (typeof window.renderFeatTags === 'function') window.renderFeatTags();
        }

        // Process feats from the Source of Truth (window.activeFeats)
        let currentFeats = (window.activeFeats || []).map(f => ({ name: f }));
        const featNames = currentFeats.map(f => f.name.toLowerCase());

        // Basic Text Fields
        basicFields.forEach(field => {
            const input = document.getElementById(`in-${field}`);
            const output = document.getElementById(`out-${field}`);
            if (input && output) {
                if (field === 'feats') {
                    // Custom rendering for feats
                    output.innerHTML = currentFeats.map(f => {
                        const safeName = f.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                        const desc = f.description ? f.description.replace(/'/g, "\\'").replace(/"/g, '&quot;') : "Description not available.";
                        return `<a href="#" onclick="if(window.showInfoModal) window.showInfoModal('${safeName}', '${desc}', 'Feat'); return false;" class="pf-feat" style="color: inherit; text-decoration: underline dotted;" title="${sanitizeText(f.name)}">${sanitizeText(f.name)}</a>`;
                    }).join(', ');
                } else {
                    let text = sanitizeText(input.value);
                    if (field === 'fort') {
                        let baseVal = parseInt(text) || 0;
                        baseVal += classFort;
                        if (featNames.includes('great fortitude')) baseVal += 2;
                        text = formatMod(baseVal);
                    } else if (field === 'ref') {
                        let baseVal = parseInt(text) || 0;
                        baseVal += classRef;
                        if (featNames.includes('lightning reflexes')) baseVal += 2;
                        text = formatMod(baseVal);
                    } else if (field === 'will') {
                        let baseVal = parseInt(text) || 0;
                        baseVal += classWill;
                        if (featNames.includes('iron will')) baseVal += 2;
                        text = formatMod(baseVal);
                    }
                    output.textContent = text;
                }
            }
        });

        // Template Aggregation
        let tempMods = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0, natAc: 0, cr: 0, size: 0 };
        (window.activeTemplates || []).forEach(t => {
            const td = templatesData[t];
            if (td) {
                tempMods.str += td.str; tempMods.dex += td.dex; tempMods.con += td.con;
                tempMods.int += td.int; tempMods.wis += td.wis; tempMods.cha += td.cha;
                tempMods.natAc += td.natAc; tempMods.cr += td.cr; tempMods.size += td.size;
            }
        });

        // CR update
        const crInput = document.getElementById('in-cr');
        const outCr = document.getElementById('out-cr');
        let finalCr = 1;
        if (crInput && outCr) {
            let baseCrStr = crInput.value.trim() || '1';
            let crVal = parseFloat(baseCrStr);
            if (baseCrStr === '1/2') crVal = 0.5;
            if (baseCrStr === '1/3') crVal = 0.33;
            if (baseCrStr === '1/4') crVal = 0.25;
            if (baseCrStr === '1/6') crVal = 0.16;
            if (baseCrStr === '1/8') crVal = 0.125;
            if (!isNaN(crVal)) {
                finalCr = Math.max(0.125, crVal + tempMods.cr + classCRBonus);
                if (finalCr < 1) {
                    if (finalCr <= 0.125) outCr.textContent = '1/8';
                    else if (finalCr <= 0.16) outCr.textContent = '1/6';
                    else if (finalCr <= 0.25) outCr.textContent = '1/4';
                    else if (finalCr <= 0.33) outCr.textContent = '1/3';
                    else outCr.textContent = '1/2';
                } else {
                    outCr.textContent = Math.floor(finalCr);
                }
            } else {
                outCr.textContent = baseCrStr;
            }
        }

        // Stats & Modifiers
        let mods = {};
        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
            const input = document.getElementById(`in-${stat}`);
            const outScore = document.getElementById(`out-${stat}`);
            const outMod = document.getElementById(`out-${stat}-mod`);
            if (input && outScore && outMod) {
                let score = parseInt(input.value);
                if (!isNaN(score)) {
                    score += tempMods[stat];
                    const mod = calculateModifier(score);
                    mods[stat] = mod;
                    outScore.textContent = score;
                    outMod.textContent = `(${formatMod(mod)})`;
                } else {
                    outScore.textContent = "-";
                    outMod.textContent = "";
                    mods[stat] = 0;
                }
            }
        });

        const sizeOpts = ['Fine', 'Diminutive', 'Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan', 'Colossal'];
        let baseSizeVal = document.getElementById('in-size').value;
        let sizeIdx = sizeOpts.indexOf(baseSizeVal);
        if (sizeIdx !== -1) {
            sizeIdx = Math.max(0, Math.min(sizeOpts.length - 1, sizeIdx + tempMods.size));
        }
        const size = sizeIdx !== -1 ? sizeOpts[sizeIdx] : baseSizeVal;
        const sizeData = sizeMods[size] || { ac_atk: 0, cmb_cmd: 0 };
        const outSize = document.getElementById('out-size');
        if (outSize) {
            outSize.textContent = size;
        }

        // Subtypes
        const typeVal = document.getElementById('in-type') ? document.getElementById('in-type').value : '';
        const subtypeSelects = document.querySelectorAll('.subtype-select');
        let subtypes = [];
        subtypeSelects.forEach(s => {
            if (s.value && s.value !== '-') subtypes.push(s.value);
        });
        const outType = document.getElementById('out-type');
        if (outType) {
            if (subtypes.length > 0) {
                outType.textContent = `${typeVal.toLowerCase()} (${subtypes.join(', ')})`;
            } else {
                outType.textContent = typeVal.toLowerCase();
            }
        }

        // Initiative
        const extraInit = parseInt(document.getElementById('in-init-extra').value) || 0;
        let totalInit = mods['dex'] + extraInit;

        if (featNames.some(f => f.includes('improved init') || f.includes('improved initiative'))) {
            totalInit += 4;
        }

        const outInit = document.getElementById('out-init');
        if (outInit) outInit.textContent = formatMod(totalInit);

        // Senses
        const senseItems = document.querySelectorAll('.sense-item');
        let sensesArr = [];
        senseItems.forEach(item => {
            const senseName = item.querySelector('.sense-name').value.trim();
            const senseDist = item.querySelector('.sense-dist').value.trim();
            if (senseName && senseName !== '-') {
                sensesArr.push(senseName + (senseDist ? ` ${senseDist}` : ''));
            }
        });
        const outSenses = document.getElementById('out-senses');
        if (outSenses) outSenses.textContent = sensesArr.length > 0 ? sensesArr.join(', ') : '';

        // Hit Points (Auto Calc)
        const hdAmt = parseInt(document.getElementById('in-hd-amount').value) || 1;
        const hdSize = parseInt(document.getElementById('in-hd-size').value) || 8;

        const creatureType = document.getElementById('in-type') ? document.getElementById('in-type').value.toLowerCase() : '';
        const hpModStat = (creatureType.includes('undead')) ? mods['cha'] : mods['con'];

        let hpBonus = (hdAmt + classTotalHD) * hpModStat;
        if (featNames.includes('toughness')) {
            hpBonus += Math.max(3, hdAmt + classTotalHD);
        }

        if (creatureType === 'construct') {
            const constructHpBonus = {
                'Fine': 0, 'Diminutive': 0, 'Tiny': 0, 'Small': 10,
                'Medium': 20, 'Large': 30, 'Huge': 40, 'Gargantuan': 60, 'Colossal': 80
            };
            hpBonus += constructHpBonus[size] || 0;
        }

        // Average HP per die = (size / 2) + 0.5
        const avgHp = Math.floor(hdAmt * ((hdSize / 2) + 0.5)) + classHPBonus + hpBonus;
        const outHp = document.getElementById('out-hp');
        if (outHp) {
            outHp.textContent = `${avgHp} (${hdAmt}d${hdSize}${classHDString}${hpBonus >= 0 ? '+' : ''}${hpBonus})`;
        }

        // Armor Class (Auto Calc)
        let acArmor = parseInt(document.getElementById('in-ac-armor').value) || 0;
        let acShield = parseInt(document.getElementById('in-ac-shield').value) || 0;
        let acNat = (parseInt(document.getElementById('in-ac-natural').value) || 0) + tempMods.natAc;
        let acDef = parseInt(document.getElementById('in-ac-deflection').value) || 0;
        let acDodge = parseInt(document.getElementById('in-ac-dodge').value) || 0;

        if (featNames.includes('dodge')) {
            acDodge += 1;
        }

        const defAbsText = document.getElementById('in-def-abilities') ? document.getElementById('in-def-abilities').value.toLowerCase() : '';
        const isIncorporeal = subtypes.map(s => s.toLowerCase()).includes('incorporeal') || defAbsText.includes('incorporeal');

        if (isIncorporeal) {
            acArmor = 0;
            acShield = 0;
            acNat = 0;
            const chaBonus = Math.max(1, mods['cha'] || 0);
            if (acDef < chaBonus) acDef = chaBonus;
        }

        let maxDex = 99;
        const maxDexAttr = document.getElementById('in-ac-armor').getAttribute('data-max-dex');
        if (maxDexAttr !== null && maxDexAttr !== '') {
            maxDex = parseInt(maxDexAttr);
        }
        let effectiveDexMod = mods['dex'];
        if (effectiveDexMod > maxDex) effectiveDexMod = maxDex;

        const totalAc = 10 + acArmor + acShield + effectiveDexMod + sizeData.ac_atk + acNat + acDef + acDodge;
        const touchAc = 10 + effectiveDexMod + sizeData.ac_atk + acDef + acDodge;
        const flatAc = 10 + acArmor + acShield + sizeData.ac_atk + acNat + acDef + (mods['dex'] < 0 ? mods['dex'] : 0);

        const outAc = document.getElementById('out-ac');
        if (outAc) {
            let details = [];
            if (acArmor) details.push(`${formatMod(acArmor)} armor`);
            if (acShield) details.push(`${formatMod(acShield)} shield`);
            if (mods['dex']) details.push(`${formatMod(mods['dex'])} Dex`);
            if (sizeData.ac_atk) details.push(`${formatMod(sizeData.ac_atk)} size`);
            if (acNat) details.push(`${formatMod(acNat)} natural`);
            if (acDef) details.push(`${formatMod(acDef)} deflection`);
            if (acDodge) details.push(`${formatMod(acDodge)} dodge`);

            outAc.innerHTML = `${totalAc}, touch ${touchAc}, flat-footed ${flatAc}${details.length > 0 ? ` (${details.join(', ')})` : ''}`;
        }

        // CMB & CMD (Auto Calc)
        const bab = (parseInt(document.getElementById('in-bab').value) || 0) + classBAB;
        document.getElementById('out-bab').textContent = formatMod(bab);

        let cmbStrMod = mods['str'];
        if (['Fine', 'Diminutive', 'Tiny'].includes(size) || featNames.some(f => f.includes('agile maneuvers'))) {
            cmbStrMod = Math.max(mods['str'], mods['dex']);
        }

        const cmb = bab + cmbStrMod + sizeData.cmb_cmd;
        const cmd = 10 + bab + mods['str'] + mods['dex'] + sizeData.cmb_cmd + acDodge + acDef;

        document.getElementById('in-cmb').value = formatMod(cmb);
        document.getElementById('in-cmd').value = cmd;
        document.getElementById('out-cmb').textContent = formatMod(cmb);
        document.getElementById('out-cmd').textContent = cmd;

        // Rich Text Fields (Special Attacks)
        const inSA = document.getElementById('in-special-attacks');
        const outSA = document.getElementById('out-special-attacks');
        if (inSA && outSA) outSA.innerHTML = inSA.value;

        // Skills
        const skillItems = document.querySelectorAll('.skill-item');
        let skillsArr = [];
        skillItems.forEach(item => {
            const skillName = item.querySelector('.skill-name').value;
            const skillMod = parseInt(item.querySelector('.skill-mod').value);
            if (skillName && skillName !== '-' && !isNaN(skillMod)) {
                skillsArr.push(`${skillName} ${formatMod(skillMod)}`);
            }
        });
        skillsArr.sort((a, b) => a.localeCompare(b));
        const outSkills = document.getElementById('out-skills');
        const wrapSkills = document.getElementById('wrap-skills');
        if (outSkills && wrapSkills) {
            outSkills.textContent = skillsArr.length > 0 ? skillsArr.join(', ') : '';
            wrapSkills.style.display = skillsArr.length > 0 ? 'block' : 'none';
        }

        // Combined Defensive Extras
        let defAbs = document.getElementById('in-def-abilities')?.value.trim() || '';
        const dr = document.getElementById('in-dr')?.value.trim();
        let immune = document.getElementById('in-immune')?.value.trim() || '';
        let resist = document.getElementById('in-resist')?.value.trim() || '';
        const weaknesses = document.getElementById('in-weaknesses')?.value.trim();
        let sr = document.getElementById('in-sr')?.value.trim() || '';

        let immunitiesToAdd = [];
        const lowerType = creatureType;
        if (lowerType.includes('undead') && !immune.toLowerCase().includes('undead traits')) immunitiesToAdd.push('undead traits');
        if (lowerType.includes('construct') && !immune.toLowerCase().includes('construct traits')) immunitiesToAdd.push('construct traits');
        if (subtypes.map(s => s.toLowerCase()).includes('swarm') && !immune.toLowerCase().includes('swarm traits')) immunitiesToAdd.push('swarm traits');

        if (immunitiesToAdd.length > 0) {
            if (immune && !immune.endsWith(',')) immune += ', ';
            immune += immunitiesToAdd.join(', ');
        }

        let isFiendish = (window.activeTemplates || []).includes('Fiendish');
        let isCelestial = (window.activeTemplates || []).includes('Celestial');

        let templateResist = '';
        if (isFiendish || isCelestial) {
            let resVal = 5;
            if (hdAmt >= 5 && hdAmt <= 10) resVal = 10;
            if (hdAmt >= 11) resVal = 15;

            if (isFiendish) templateResist = `cold ${resVal}, fire ${resVal}`;
            if (isCelestial) templateResist = `acid ${resVal}, cold ${resVal}, electricity ${resVal}`;
        }

        if (templateResist) {
            if (resist && !resist.endsWith(',')) resist += ', ';
            resist += templateResist;
        }

        if (isFiendish || isCelestial) {
            let srVal = Math.floor(finalCr) + 5;
            if (srVal > 0) sr = (sr ? sr + ', ' : '') + srVal;
        }

        const isInc = subtypes.map(s => s.toLowerCase()).includes('incorporeal') || defAbs.toLowerCase().includes('incorporeal');
        if (isInc && !defAbs.toLowerCase().includes('incorporeal')) {
            if (defAbs && !defAbs.endsWith(',')) defAbs += ', ';
            defAbs += 'incorporeal';
        }

        let defExtras = [];
        if (defAbs) defExtras.push(`<span class="pf-label">Defensive Abilities</span> ${sanitizeText(defAbs)}`);
        if (dr) defExtras.push(`<span class="pf-label">DR</span> ${sanitizeText(dr)}`);
        if (immune) defExtras.push(`<span class="pf-label">Immune</span> ${sanitizeText(immune)}`);
        if (resist) defExtras.push(`<span class="pf-label">Resist</span> ${sanitizeText(resist)}`);
        if (weaknesses) defExtras.push(`<span class="pf-label">Weaknesses</span> ${sanitizeText(weaknesses)}`);
        if (sr) defExtras.push(`<span class="pf-label">SR</span> ${sanitizeText(sr)}`);

        const wrapDefExtras = document.getElementById('wrap-def-extras');
        const outDefExtras = document.getElementById('out-def-extras');
        if (wrapDefExtras && outDefExtras) {
            outDefExtras.innerHTML = defExtras.join('; ');
            wrapDefExtras.style.display = defExtras.length > 0 ? 'block' : 'none';
        }

        // Hide/Show Wrappers
        const hides = ['aura', 'melee', 'ranged', 'special-attacks', 'feats', 'languages', 'sq'];
        hides.forEach(h => checkVisibility(h, true));

        // SLA Hide/Show
        const wrapSlas = document.getElementById('wrap-slas');
        const outSlasList = document.getElementById('out-slas-list');
        const inSlaCl = document.getElementById('in-sla-cl');
        const outSlaCl = document.getElementById('out-sla-cl');
        if (outSlaCl && inSlaCl) {
            let clText = inSlaCl.value.trim();
            if (!clText && outSlasList && outSlasList.children.length > 0) {
                const hdAmt = parseInt(document.getElementById('in-hd-amount').value) || 1;
                let suffix = 'th';
                if (hdAmt % 10 === 1 && hdAmt % 100 !== 11) suffix = 'st';
                else if (hdAmt % 10 === 2 && hdAmt % 100 !== 12) suffix = 'nd';
                else if (hdAmt % 10 === 3 && hdAmt % 100 !== 13) suffix = 'rd';
                clText = `CL ${hdAmt}${suffix}`;
                inSlaCl.placeholder = `Auto: ${clText}`;
            } else {
                inSlaCl.placeholder = "Caster Level (e.g. CL 8th)";
            }
            outSlaCl.textContent = clText ? `(${clText})` : '';
        }
        if (wrapSlas && outSlasList) {
            wrapSlas.style.display = outSlasList.children.length === 0 ? 'none' : 'block';
        }

        // Ecology Hide/Show
        const inEnv = document.getElementById('in-environment');
        const inOrg = document.getElementById('in-organization');
        const inTrs = document.getElementById('in-treasure');

        const env = inEnv ? inEnv.value.trim() : '';
        const org = inOrg ? inOrg.value.trim() : '';
        const trs = inTrs ? inTrs.value.trim() : '';

        const ecologyTitle = document.getElementById('wrap-ecology');
        if (ecologyTitle) {
            ecologyTitle.style.display = (!env && !org && !trs) ? 'none' : 'block';
        }

        const reachEl = document.getElementById('in-reach');
        const spaceEl = document.getElementById('in-space');
        const reach = reachEl ? reachEl.value.trim() : '';
        const space = spaceEl ? spaceEl.value.trim() : '';
        const wrapSpaceReach = document.getElementById('wrap-space-reach');
        const outSpaceReach = document.getElementById('out-space-reach');

        if (wrapSpaceReach && outSpaceReach) {
            let str = [];
            if (space) str.push(`<span class="pf-label">Space</span> ${space}`);
            if (reach) str.push(`<span class="pf-label">Reach</span> ${reach}`);
            outSpaceReach.innerHTML = str.join('; ');
            wrapSpaceReach.style.display = str.length > 0 ? 'block' : 'none';
        }

        if (typeof renderSlas === 'function') renderSlas();
        if (typeof renderAttacks === 'function') renderAttacks();
        if (typeof renderAbilities === 'function') renderAbilities();
    // INTERACTIVE ABILITIES INJECTION
    const makeInteractive = (arr, outId, category) => {
        const el = document.getElementById(outId);
        if (el && window[arr] && window[arr].length > 0) {
            el.innerHTML = window[arr].filter(Boolean).map(item => {
                const name = (item && typeof item === 'object' ? item.name : item) || '';
                const desc = (item && typeof item === 'object' && item.description)
                    ? item.description.replace(/"/g, '&quot;').replace(/'/g, "\\'").replace(/\n/g, '<br>')
                    : "Description not available.";
                const safeName = String(name).replace(/'/g, "\\'");
                return `<a href="#" onclick="if(window.showInfoModal) window.showInfoModal('${safeName}', '${desc}', '${category}'); return false;" style="color: inherit; text-decoration: underline dotted;">${name}</a>`;
            }).join(', ');
        }
    };
    makeInteractive('activeImmune', 'out-immune', 'Immunity');
    makeInteractive('activeResist', 'out-resist', 'Resistance');
    makeInteractive('activeWeakness', 'out-weakness', 'Weakness');
    makeInteractive('activeDef', 'out-defensive', 'Defensive');
    makeInteractive('activeAura', 'out-aura', 'Aura');
    makeInteractive('activeSA', 'out-special-attacks', 'Special Attack');
    makeInteractive('activeSQ', 'out-sq', 'Special Quality');

    if (typeof window.applyMechanics === 'function') window.applyMechanics();

        autoSave();
    }

    // -------------------------
    // 3. EVENT LISTENERS
    // -------------------------
    const debouncedUpdatePreview = debounce(updatePreview, 300);

    function attachGlobalListeners() {
        document.querySelectorAll('input, textarea, select').forEach(el => {
            el.addEventListener('input', debouncedUpdatePreview);
            el.addEventListener('change', debouncedUpdatePreview);
        });

        document.querySelectorAll('.rich-text-editor').forEach(el => {
            el.addEventListener('input', debouncedUpdatePreview);
        });
    }

    attachGlobalListeners();

    // Type Toggle
    const radios = document.querySelectorAll('input[name="stat_type"]');
    const monsterInputs = document.getElementById('monster-inputs');
    const npcInputs = document.getElementById('npc-inputs');
    const wrapMonsterType = document.getElementById('wrap-monster-type');
    const wrapNpcType = document.getElementById('wrap-npc-type');

    function handleToggle() {
        const type = document.querySelector('input[name="stat_type"]:checked').value;
        if (type === 'monster') {
            monsterInputs.style.display = 'block';
            npcInputs.style.display = 'none';
            wrapMonsterType.style.display = 'block';
            wrapNpcType.style.display = 'none';
        } else {
            monsterInputs.style.display = 'none';
            npcInputs.style.display = 'block';
            wrapMonsterType.style.display = 'none';
            wrapNpcType.style.display = 'block';
        }
        updatePreview();
    }
    radios.forEach(r => r.addEventListener('change', handleToggle));

    // Rich Text Buttons
    document.querySelectorAll('.btn-rt').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const cmd = btn.getAttribute('data-command');
            document.execCommand(cmd, false, null);
            updatePreview();
        });
    });

    // -------------------------
    // 4. DYNAMIC LISTS
    // -------------------------
    function createDynamicItem(containerId, htmlContent, onRemove) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        const div = document.createElement('div');
        div.className = 'dynamic-item-row';
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '5px';
        div.style.alignItems = 'flex-start';
        div.innerHTML = htmlContent + `<button class="btn-remove-dynamic" style="background:linear-gradient(45deg, #ef4444, #f87171); color:white; border:none; border-radius:4px; padding:6px 12px; cursor:pointer; height:36px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:all 0.2s;">✕</button>`;

        div.querySelector('.btn-remove-dynamic').addEventListener('click', () => {
            div.remove();
            if (onRemove) onRemove();
            updatePreview();
        });

        div.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('input', updatePreview);
            el.addEventListener('change', updatePreview);
        });

        div.querySelectorAll('.rich-text-editor').forEach(el => {
            el.addEventListener('input', updatePreview);
        });

        container.appendChild(div);
        updatePreview();
        return div;
    }

    // Subtypes
    const commonSubtypes = ['-', 'air', 'aquatic', 'chaotic', 'cold', 'earth', 'evil', 'extraplanar', 'fire', 'goblinoid', 'good', 'incorporeal', 'lawful', 'native', 'shapechanger', 'water'];
    const subtypeOptions = commonSubtypes.map(s => `<option value="${s}">${s}</option>`).join('');
    document.getElementById('btn-add-subtype')?.addEventListener('click', () => {
        createDynamicItem('subtypes-container', `<select class="subtype-select" style="flex: 1; padding: 6px; border-radius: 4px; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.1); appearance: none;">${subtypeOptions}</select>`);
    });

    // Senses
    const senseOptions = ['-', 'blindsight', 'blindsense', 'darkvision', 'low-light vision', 'scent', 'tremorsense', 'truesight'];
    const senseOptionsHtml = senseOptions.map(o => `<option value="${o}">`).join('');

    document.getElementById('btn-add-sense')?.addEventListener('click', () => {
        createDynamicItem('senses-container', `
            <div class="sense-item" style="display:flex; flex:1; gap:10px;">
                <input type="text" list="senses-list" class="sense-name" placeholder="Sense" style="flex: 2; padding: 6px; border-radius: 4px; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.1);">
                <datalist id="senses-list">${senseOptionsHtml}</datalist>
                <input type="text" class="sense-dist" placeholder="Dist (e.g. 60 ft.)" style="flex: 1; padding: 6px; border-radius: 4px; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.1);">
            </div>
        `);
    });

    // Skills
    const commonSkills = ['-', 'Acrobatics', 'Appraise', 'Bluff', 'Climb', 'Craft', 'Diplomacy', 'Disable Device', 'Disguise', 'Escape Artist', 'Fly', 'Handle Animal', 'Heal', 'Intimidate', 'Knowledge (arcana)', 'Knowledge (dungeoneering)', 'Knowledge (engineering)', 'Knowledge (geography)', 'Knowledge (history)', 'Knowledge (local)', 'Knowledge (nature)', 'Knowledge (nobility)', 'Knowledge (planes)', 'Knowledge (religion)', 'Linguistics', 'Perception', 'Perform', 'Profession', 'Ride', 'Sense Motive', 'Sleight of Hand', 'Spellcraft', 'Stealth', 'Survival', 'Swim', 'Use Magic Device'];
    const skillOptionsHtml = commonSkills.map(s => `<option value="${s}">`).join('');
    document.getElementById('btn-add-skill')?.addEventListener('click', () => {
        createDynamicItem('skills-container', `
            <div class="skill-item" style="display:flex; flex:1; gap:10px;">
                <input type="text" list="skill-list" class="skill-name" placeholder="Skill" style="flex: 2; padding: 6px; border-radius: 4px; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.1);">
                <datalist id="skill-list">${skillOptionsHtml}</datalist>
                <input type="number" class="skill-mod" value="0" style="width: 60px; padding: 6px; border-radius: 4px; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.1); text-align: center;">
            </div>
        `);
    });

    // SLAs
    function renderSlas() {
        try {
            const list = document.getElementById('out-slas-list');
            if (!list) return;
            list.innerHTML = '';

            const items = document.querySelectorAll('.sla-item');
            items.forEach(item => {
                const freqInput = item.querySelector('.sla-freq');
                const spellsInput = item.querySelector('.sla-spells');

                if (!freqInput && !spellsInput) return;

                let freq = freqInput ? (freqInput.value || '').trim() : '';
                let spells = spellsInput ? (spellsInput.value || '').trim() : '';

                if (!freq && !spells) return;

                // Auto-split if freq contains a dash/colon and spells is empty
                if (!spells && freq) {
                    const dashMatch = freq.match(/[\—\–\-\ufffd]/);
                    if (dashMatch) {
                        const actualFreq = freq.substring(0, dashMatch.index).trim();
                        const actualSpells = freq.substring(dashMatch.index + 1).trim();
                        freq = actualFreq;
                        spells = actualSpells;
                    }
                }

                // Clean any replacement characters
                freq = freq.replace(/\ufffd/g, '').replace(/\[object Object\]/g, '').trim();
                spells = spells.replace(/\ufffd/g, '').replace(/\[object Object\]/g, '').replace(/^,\s*|,\s*$/g, '').trim();

                if (!freq && !spells) return;

                const div = document.createElement('div');

                // Check if this row is a Header (e.g. Kitsune Spell-Like Abilities (CL 1st; concentration +4))
                const isHeader = !freq && (/(?:Spell-Like|Spells Known|Spells Prepared|Bloodline|Domains|Prohibited)/i.test(spells) || /^\(?CL\s+/i.test(spells));

                if (isHeader) {
                    div.className = 'pf-property-line';
                    div.style.marginTop = '6px';
                    div.style.marginBottom = '2px';

                    const mCl = spells.match(/^(.*?)\s*(\(CL\s+[^)]+\))$/i);
                    if (mCl) {
                        div.innerHTML = `<span class="pf-label" style="font-size: 1.02rem;">${mCl[1]}</span> <span style="font-style: normal; font-weight: normal; color: var(--sb-text);">${mCl[2]}</span>`;
                    } else {
                        div.innerHTML = `<span class="pf-label" style="font-size: 1.02rem;">${spells}</span>`;
                    }
                } else {
                    div.className = 'pf-property-line special-ability';
                    let html = '';
                    if (freq) html += `<span class="pf-label">${freq}</span>—`;

                    if (spells) {
                        const spellTokens = spells.split(',').map(s => s.trim()).filter(Boolean);
                        const formattedSpells = spellTokens.map(tok => {
                            const mNote = tok.match(/^(.*?)\s*(\([^)]+\)|\[[^\]]+\])$/);
                            if (mNote && mNote[1]) {
                                const sName = mNote[1].trim();
                                const note = mNote[2].trim();
                                return `<i>${sName}</i> ${note}`;
                            }
                            return `<i>${tok}</i>`;
                        });
                        html += formattedSpells.join(', ');
                    }
                    div.innerHTML = html;
                }

                list.appendChild(div);
            });

            // Force wrap-slas display update immediately
            const wrapSlas = document.getElementById('wrap-slas');
            if (wrapSlas) {
                wrapSlas.style.display = list.children.length === 0 ? 'none' : 'block';
            }
        } catch (err) {
            console.error('Error in renderSlas:', err);
        }
    }
    document.getElementById('btn-add-sla')?.addEventListener('click', () => {
        createDynamicItem('slas-container', `
            <div class="sla-item" style="display: flex; flex-direction: column; gap: 5px; flex: 1;">
                <input type="text" class="sla-freq" placeholder="Freq (e.g. At will)" style="padding: 6px; border-radius: 4px; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.1);">
                <input type="text" class="sla-spells" placeholder="Spells (e.g. detect magic, invisibility)" style="padding: 6px; border-radius: 4px; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.1);">
            </div>
        `, renderSlas);
        document.querySelectorAll('.sla-item input').forEach(el => el.addEventListener('input', renderSlas));
    });

    
    setupTagSystem({
        activeArray: 'activeAura',
        dbUrl: 'data/auras.json',
        searchInputId: 'in-aura-search',
        listId: 'aura-autocomplete-list',
        containerId: 'selected-aura-container',
        hiddenInputId: 'in-aura',
        renderFunc: 'renderAuraTags',
        bgColor: '#6a1b9a'
    });

    setupTagSystem({
        activeArray: 'activeDef',
        dbUrl: 'data/special_abilities.json',
        searchInputId: 'in-def-search',
        listId: 'def-autocomplete-list',
        containerId: 'selected-def-container',
        hiddenInputId: 'in-def-abilities',
        renderFunc: 'renderDefTags',
        bgColor: '#1565c0'
    });

    setupTagSystem({
        activeArray: 'activeImmune',
        dbUrl: 'data/immunities.json',
        searchInputId: 'in-immune-search',
        listId: 'immune-autocomplete-list',
        containerId: 'selected-immune-container',
        hiddenInputId: 'in-immune',
        renderFunc: 'renderImmuneTags',
        bgColor: '#b71c1c'
    });

    setupTagSystem({
        activeArray: 'activeResist',
        dbUrl: 'data/resistances.json',
        searchInputId: 'in-resist-search',
        listId: 'resist-autocomplete-list',
        containerId: 'selected-resist-container',
        hiddenInputId: 'in-resist',
        renderFunc: 'renderResistTags',
        bgColor: '#e65100'
    });

    setupTagSystem({
        activeArray: 'activeWeakness',
        dbUrl: 'data/weaknesses.json',
        searchInputId: 'in-weakness-search',
        listId: 'weakness-autocomplete-list',
        containerId: 'selected-weakness-container',
        hiddenInputId: 'in-weaknesses',
        renderFunc: 'renderWeaknessTags',
        bgColor: '#37474f'
    });

    // =========================================================
    // ATTACK SYSTEM — Clean rebuild
    // Two modes per attack row:
    //   RAW MODE  : one text field, rendered verbatim (for DB imports)
    //   CALC MODE : count/type/dice/mult/extra → formula calculation
    // =========================================================

    function buildMeleeRowHtml(mode) {
        if (mode === 'raw') {
            return `
                <input type="hidden" class="atk-mode" value="raw">
                <textarea class="atk-raw" rows="1"
                    placeholder="e.g. mwk rapier +12 (1d6+5/18-20 plus 5 precision) or 2 claws +9 (1d4+4), bite +9 (1d6+4)"
                    style="flex:1; padding:8px 10px; border-radius:6px; background:rgba(0,0,0,0.35);
                           color:#f0e6d0; border:1px solid rgba(255,200,100,0.25); resize:none; overflow:hidden;
                           font-family:inherit; font-size:0.9rem; min-height:38px; line-height:1.4;
                           box-shadow:inset 0 2px 6px rgba(0,0,0,0.3); transition:border-color 0.2s;"
                    onfocus="this.style.borderColor='rgba(255,200,100,0.6)'"
                    onblur="this.style.borderColor='rgba(255,200,100,0.25)'"></textarea>
                <button class="btn-mode-toggle" title="Switch to Formula Mode"
                    style="padding:6px 10px; font-size:0.75rem; background:linear-gradient(135deg,#4f46e5,#3b82f6);
                           color:white; border:none; border-radius:6px; cursor:pointer;
                           height:38px; white-space:nowrap; font-weight:600;
                           box-shadow:0 2px 8px rgba(79,70,229,0.4); transition:all 0.2s;">⚙ Calc</button>
            `;
        } else {
            return `
                <input type="hidden" class="atk-mode" value="calc">
                <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                    <div style="display:flex; gap:4px; align-items:center; flex-wrap:wrap;">
                        <input type="number" class="atk-count" placeholder="Qty" min="1" value="1"
                            style="width:55px; padding:6px; border-radius:6px; background:rgba(0,0,0,0.3);
                                   color:white; border:1px solid rgba(255,255,255,0.15); text-align:center;">
                        <input type="text" list="melee-weapons-list" class="atk-type" placeholder="Weapon (e.g. Rapier, Longsword)"
                            style="flex:1; min-width:120px; padding:6px; border-radius:6px; background:rgba(0,0,0,0.3);
                                   color:white; border:1px solid rgba(255,255,255,0.15);">
                        <label style="display:flex; align-items:center; gap:4px; font-size:0.8rem; cursor:pointer;
                               padding:6px 8px; background:rgba(0,0,0,0.3); border-radius:6px; border:1px solid rgba(255,255,255,0.15); white-space:nowrap;">
                            <input type="checkbox" class="atk-mw"> MW
                        </label>
                        <input type="text" class="atk-extra-dmg" placeholder="+bonus dmg (e.g. 2)"
                            style="width:90px; padding:6px; border-radius:6px; background:rgba(0,0,0,0.3);
                                   color:white; border:1px solid rgba(255,255,255,0.15);">
                    </div>
                </div>
                <button class="btn-mode-toggle" title="Switch to Text Mode"
                    style="padding:6px 10px; font-size:0.75rem; background:rgba(255,200,0,0.1);
                           color:#ffd700; border:1px solid rgba(255,200,0,0.4); border-radius:6px; cursor:pointer;
                           height:38px; white-space:nowrap; transition:all 0.2s;">✏ Raw</button>
            `;
        }
    }

    function buildRangedRowHtml(mode) {
        if (mode === 'raw') {
            return `
                <input type="hidden" class="atk-mode" value="raw">
                <textarea class="atk-raw" rows="1"
                    placeholder="e.g. mwk composite longbow +11 (1d8+3/x3) or 4 javelins +8 (1d6+2)"
                    style="flex:1; padding:8px 10px; border-radius:6px; background:rgba(0,0,0,0.35);
                           color:#f0e6d0; border:1px solid rgba(100,200,255,0.25); resize:none; overflow:hidden;
                           font-family:inherit; font-size:0.9rem; min-height:38px; line-height:1.4;
                           box-shadow:inset 0 2px 6px rgba(0,0,0,0.3); transition:border-color 0.2s;"
                    onfocus="this.style.borderColor='rgba(100,200,255,0.6)'"
                    onblur="this.style.borderColor='rgba(100,200,255,0.25)'"></textarea>
                <button class="btn-mode-toggle" title="Switch to Formula Mode"
                    style="padding:6px 10px; font-size:0.75rem; background:linear-gradient(135deg,#0891b2,#06b6d4);
                           color:white; border:none; border-radius:6px; cursor:pointer;
                           height:38px; white-space:nowrap; font-weight:600;
                           box-shadow:0 2px 8px rgba(6,182,212,0.4); transition:all 0.2s;">⚙ Calc</button>
            `;
        } else {
            return `
                <input type="hidden" class="atk-mode" value="calc">
                <div style="display:flex; flex-direction:column; gap:4px; flex:1;">
                    <div style="display:flex; gap:4px; align-items:center; flex-wrap:wrap;">
                        <input type="number" class="atk-count" placeholder="Qty" min="1" value="1"
                            style="width:55px; padding:6px; border-radius:6px; background:rgba(0,0,0,0.3);
                                   color:white; border:1px solid rgba(255,255,255,0.15); text-align:center;">
                        <input type="text" list="ranged-weapons-list" class="atk-type" placeholder="Weapon (e.g. Longbow, Crossbow)"
                            style="flex:1; min-width:120px; padding:6px; border-radius:6px; background:rgba(0,0,0,0.3);
                                   color:white; border:1px solid rgba(255,255,255,0.15);">
                        <label style="display:flex; align-items:center; gap:4px; font-size:0.8rem; cursor:pointer;
                               padding:6px 8px; background:rgba(0,0,0,0.3); border-radius:6px; border:1px solid rgba(255,255,255,0.15); white-space:nowrap;">
                            <input type="checkbox" class="atk-mw"> MW
                        </label>
                        <input type="text" class="atk-range" placeholder="Range (e.g. 60 ft.)"
                            style="width:90px; padding:6px; border-radius:6px; background:rgba(0,0,0,0.3);
                                   color:white; border:1px solid rgba(255,255,255,0.15);">
                    </div>
                </div>
                <button class="btn-mode-toggle" title="Switch to Text Mode"
                    style="padding:6px 10px; font-size:0.75rem; background:rgba(0,200,255,0.1);
                           color:#67e8f9; border:1px solid rgba(0,200,255,0.3); border-radius:6px; cursor:pointer;
                           height:38px; white-space:nowrap; transition:all 0.2s;">✏ Raw</button>
            `;
        }
    }

    function addAttackRow(containerId, mode, buildFn) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const buildFnRef = containerId === 'melee-container' ? buildMeleeRowHtml : buildRangedRowHtml;

        function attachListeners(div) {
            // Remove button
            const removeBtn = div.querySelector('.btn-remove-dynamic');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    div.remove();
                    renderAttacks();
                    updatePreview();
                });
            }

            // All inputs/selects/textareas
            div.querySelectorAll('input, select, textarea').forEach(el => {
                el.addEventListener('input', () => { renderAttacks(); updatePreview(); });
                el.addEventListener('change', () => { renderAttacks(); updatePreview(); });
            });

            // Auto-resize textarea
            div.querySelectorAll('textarea').forEach(ta => {
                ta.addEventListener('input', () => {
                    ta.style.height = 'auto';
                    ta.style.height = ta.scrollHeight + 'px';
                });
            });

            // Mode toggle button (raw ↔ calc)
            const toggleBtn = div.querySelector('.btn-mode-toggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    const modeEl = div.querySelector('.atk-mode');
                    const currentMode = modeEl ? modeEl.value : 'raw';
                    const newMode = currentMode === 'raw' ? 'calc' : 'raw';
                    const currentRaw = div.querySelector('.atk-raw') ? div.querySelector('.atk-raw').value : '';

                    div.innerHTML = buildFnRef(newMode) +
                        `<button class="btn-remove-dynamic"
                            style="background:linear-gradient(45deg,#ef4444,#f87171);color:white;border:none;
                                   border-radius:4px;padding:6px 12px;cursor:pointer;height:36px;font-weight:bold;
                                   box-shadow:0 2px 5px rgba(0,0,0,0.2);transition:all 0.2s;">✕</button>`;

                    if (newMode === 'raw' && currentRaw) {
                        const rawEl = div.querySelector('.atk-raw');
                        if (rawEl) {
                            rawEl.value = currentRaw;
                            rawEl.style.height = 'auto';
                            rawEl.style.height = rawEl.scrollHeight + 'px';
                        }
                    }
                    attachListeners(div);
                    renderAttacks();
                    updatePreview();
                });
            }
        }

        const div = document.createElement('div');
        div.className = 'dynamic-item-row';
        div.style.cssText = 'display:flex; gap:8px; margin-bottom:6px; align-items:flex-start; flex-wrap:wrap;';
        div.innerHTML = buildFn(mode) +
            `<button class="btn-remove-dynamic"
                style="background:linear-gradient(45deg,#ef4444,#f87171);color:white;border:none;
                       border-radius:4px;padding:6px 12px;cursor:pointer;height:36px;font-weight:bold;
                       box-shadow:0 2px 5px rgba(0,0,0,0.2);transition:all 0.2s;">✕</button>`;

        attachListeners(div);
        container.appendChild(div);
        return div;
    }

    // Melee & Ranged Attacks — render
    function renderAttacks() {
        const bab = parseInt(document.getElementById('in-bab').value) || 0;
        const size = document.getElementById('in-size').value;
        const sizeData = sizeMods[size] || { ac_atk: 0, cmb_cmd: 0 };
        const strScore = parseInt(document.getElementById('in-str').value);
        const dexScore = parseInt(document.getElementById('in-dex').value);
        const strMod = isNaN(strScore) ? 0 : Math.floor((strScore - 10) / 2);
        const dexMod = isNaN(dexScore) ? 0 : Math.floor((dexScore - 10) / 2);

        function applyPAtoRaw(text, rawEl, babVal, isMelee) {
            if (!text) return text;

            let baseBab = parseInt(rawEl.getAttribute('data-base-bab'));
            let babDiff = 0;
            if (!isNaN(baseBab)) {
                babDiff = babVal - baseBab;
            }

            const featList = window.activeFeats ? window.activeFeats.map(f => f.toLowerCase()) : [];
            let wfBonus = 0;
            let wsBonus = 0;
            if (featList.some(f => f.includes('weapon focus'))) wfBonus += 1;
            if (featList.some(f => f.includes('greater weapon focus'))) wfBonus += 1;
            if (featList.some(f => f.includes('weapon specialization'))) wsBonus += 2;
            if (featList.some(f => f.includes('greater weapon specialization'))) wsBonus += 2;

            const paPenalty = -1 - Math.floor(babVal / 4);

            return text.replace(/([+-]\d+(?:\/[+-]?\d+)*)\s*\(\s*(\d+d\d+)(?:\s*([+-])\s*(\d+))?([^\)]*)\)/gi, (match, atkStr, diceStr, sign, dmgVal, critStr, offset, fullStr) => {
                const textBefore = fullStr.substring(Math.max(0, offset - 30), offset).toLowerCase();
                let paBonus = 0;
                let currentPenalty = 0;

                // Only apply PA/Deadly Aim bonuses if the feat is active
                if ((isMelee && featList.some(f => f.includes('power attack'))) || (!isMelee && featList.some(f => f.includes('deadly aim')))) {
                    currentPenalty = paPenalty;
                    paBonus = (-paPenalty) * 2;
                    let isTwoHanded = textBefore.match(/great|spear|halberd|two-handed|falchion|glaive|guisarme|lance|scythe|earth breaker/);
                    if (isMelee && isTwoHanded) {
                        paBonus = (-paPenalty) * 3;
                    } else if (isMelee && textBefore.match(/off-hand|secondary/)) {
                        paBonus = (-paPenalty) * 1;
                    }

                    // Furious Focus (User requested to apply to ALL attacks, overriding RAW PF rules)
                    if (isMelee && featList.some(f => f.includes('furious focus'))) {
                        if (isTwoHanded || paBonus === (-paPenalty) * 3) {
                            currentPenalty = 0;
                        }
                    }
                }

                const newAtkStr = atkStr.split('/').map(v => {
                    const val = parseInt(v);
                    if (isNaN(val)) return v;
                    const newVal = val + currentPenalty + wfBonus + babDiff;
                    return (newVal >= 0 && !v.startsWith('-') && v !== '0' && (v.startsWith('+') || newVal > 0) ? '+' : '') + newVal;
                }).join('/');

                let newDmgVal = 0;
                if (sign && dmgVal) {
                    newDmgVal = parseInt(sign + dmgVal) + paBonus + wsBonus;
                } else {
                    newDmgVal = paBonus + wsBonus;
                }

                let newDmgStr = diceStr;
                if (newDmgVal !== 0) {
                    newDmgStr += (newDmgVal > 0 ? '+' : '') + newDmgVal;
                }

                // Apply Improved Critical
                let finalCrit = critStr || '';
                if (featList.includes('improved critical')) {
                    if (!finalCrit) finalCrit = '/19-20';
                    else if (finalCrit.includes('19-20') || finalCrit.includes('19–20')) finalCrit = finalCrit.replace(/19[-–]20/, '17-20');
                    else if (finalCrit.includes('18-20') || finalCrit.includes('18–20')) finalCrit = finalCrit.replace(/18[-–]20/, '15-20');
                    else if (finalCrit.includes('x') && !finalCrit.includes('20')) finalCrit = '/19-20' + finalCrit;
                }

                return newAtkStr + ' (' + newDmgStr + finalCrit + ')';
            });
        }

                function processRow(item, isMelee) {
            const mode = item.querySelector('.atk-mode') ? item.querySelector('.atk-mode').value : 'calc';
            const featList = window.activeFeats ? window.activeFeats.map(f => f.toLowerCase()) : [];

            if (mode === 'raw') {
                const rawEl = item.querySelector('.atk-raw');
                if (rawEl && rawEl.value.trim()) {
                    let rawText = sanitizeText(rawEl.value.trim());
                    rawText = applyPAtoRaw(rawText, rawEl, bab, isMelee);
                    return rawText;
                }
                return null;
            }
            // CALC mode
            const count = item.querySelector('.atk-count') ? item.querySelector('.atk-count').value : '';
            const type = item.querySelector('.atk-type') ? item.querySelector('.atk-type').value : '';
            if (!type || type === '-') return null;
            const isMw = item.querySelector('.atk-mw') ? item.querySelector('.atk-mw').checked : false;
            
            // Defaults (if weapon is not in DB or is Ranged)
            let isSecondary = item.querySelector('.atk-sec') ? item.querySelector('.atk-sec').checked : false;
            let dice = item.querySelector('.atk-dice') ? item.querySelector('.atk-dice').value.trim() : '1d4';
            let strMult = item.querySelector('.atk-str-mult') ? parseFloat(item.querySelector('.atk-str-mult').value) : 1;
            let extra = item.querySelector('.atk-extra') ? item.querySelector('.atk-extra').value.trim() : '';
            let isNatural = false;
            let critStr = '';

            // Identify Weapon in DB
            const weaponObj = window.allWeaponsDB ? window.allWeaponsDB.find(w => w.name.toLowerCase() === type.toLowerCase()) : null;
            if (weaponObj) {
                isNatural = weaponObj.category.toLowerCase().includes('natural');
                dice = weaponObj.dmg || dice;
                if (weaponObj.str_mult !== undefined) strMult = weaponObj.str_mult;
                critStr = weaponObj.crit && weaponObj.crit !== 'x2' ? `/${weaponObj.crit}` : '';
            }

            // Power Attack / Deadly Aim calculation
            let paPenalty = 0;
            let paBonus = 0;

            if (isMelee && featList.some(f => f.includes('power attack'))) {
                let basePenalty = -1 - Math.floor(bab / 4);
                if (strMult >= 1.5) paBonus = (-basePenalty) * 3;
                else if (strMult <= 0.5 || isSecondary) paBonus = (-basePenalty) * 1;
                else paBonus = (-basePenalty) * 2;
                paPenalty = basePenalty;
                // Furious Focus
                if (featList.some(f => f.includes('furious focus')) && (strMult >= 1.5 || paBonus === (-basePenalty) * 3)) {
                    paPenalty = 0;
                }
            } else if (!isMelee && featList.some(f => f.includes('deadly aim'))) {
                paPenalty = -1 - Math.floor(bab / 4);
                paBonus = (-paPenalty) * 2;
            }

            // Weapon Focus / Specialization / Training & Masterwork
            let featAtkBonus = isMw ? 1 : 0;
            let featDmgBonus = 0;
            
            if (featList.some(f => f.includes('weapon focus') && (f.includes(type.toLowerCase()) || !f.includes('(')))) featAtkBonus += 1;
            if (featList.some(f => f.includes('greater weapon focus') && (f.includes(type.toLowerCase()) || !f.includes('(')))) featAtkBonus += 1;
            if (featList.some(f => f.includes('weapon specialization') && (f.includes(type.toLowerCase()) || !f.includes('(')))) featDmgBonus += 2;
            if (featList.some(f => f.includes('greater weapon specialization') && (f.includes(type.toLowerCase()) || !f.includes('(')))) featDmgBonus += 2;

            // Weapon Training parser: "weapon training (blades) +2" or "weapon training +1"
            featList.forEach(f => {
                if (f.includes('weapon training')) {
                    let match = f.match(/\+(\d+)/);
                    if (match) {
                        let val = parseInt(match[1]);
                        featAtkBonus += val;
                        featDmgBonus += val;
                    }
                }
            });

            // Enhancement bonus from name (e.g. "+1 Longsword")
            let matchEnh = type.match(/\+(\d+)/);
            if (matchEnh) {
                let val = parseInt(matchEnh[1]);
                if (!isMw || val > 1) { // Enhancement overrides MW bonus, does not stack
                    featAtkBonus = featAtkBonus - (isMw ? 1 : 0) + val;
                }
                featDmgBonus += val;
            }

            let atkMod = isMelee ? strMod : dexMod;
            let dmgStatMod = strMod;
            if (isMelee) {
                if (featList.some(f => f.includes('weapon finesse')) || ['Fine', 'Diminutive', 'Tiny'].includes(size)) {
                    if (weaponObj && (weaponObj.category.includes('Light') || weaponObj.category.includes('Natural') || (weaponObj.special && weaponObj.special.toLowerCase().includes('finesse')))) {
                        atkMod = Math.max(strMod, dexMod);
                        // Automatic DEX to Damage requested by user if DEX > STR and Finesse is active
                        if (dexMod > strMod) {
                            dmgStatMod = dexMod;
                        }
                    } else if (!weaponObj) {
                        atkMod = Math.max(strMod, dexMod);
                        if (dexMod > strMod) dmgStatMod = dexMod;
                    }
                }
            } else {
                // Ranged logic
                if (weaponObj) {
                    const wName = weaponObj.name.toLowerCase();
                    if (wName.includes('crossbow') || wName.includes('firearm')) {
                        dmgStatMod = 0; // Crossbows/Firearms ignore STR bonus and penalty
                    } else if (wName.includes('bow')) {
                        if (!wName.includes('composite')) {
                            dmgStatMod = Math.min(0, strMod); // Bows take STR penalty but NO STR bonus
                        } else {
                            // Composite bows have a rating, e.g. "Composite (+2) Longbow"
                            let compMatch = wName.match(/\+\s*(\d+)/);
                            let rating = compMatch ? parseInt(compMatch[1]) : 0;
                            // Take penalty if negative, or up to rating if positive
                            dmgStatMod = Math.min(rating, strMod);
                        }
                    }
                } else {
                    // Fallback for unknown ranged weapons
                    dmgStatMod = Math.min(0, strMod);
                }
            }

            let secPenalty = 0;
            if (isSecondary) {
                if (isNatural) {
                    secPenalty = featList.some(f => f.includes('multiattack')) ? -2 : -5;
                } else {
                    let isLight = weaponObj && (weaponObj.category.includes('Light') || weaponObj.special.toLowerCase().includes('finesse'));
                    if (featList.some(f => f.includes('two-weapon fighting'))) {
                        secPenalty = isLight ? -2 : -4;
                    } else {
                        secPenalty = isLight ? -4 : -8;
                    }
                }
            }

            const total = bab + atkMod + sizeData.ac_atk + secPenalty + paPenalty + featAtkBonus;

            // Generate iterative attacks
            let iteratives = [total];
            if (!isSecondary && !isNatural && bab > 5) {
                for (let i = 1; i <= Math.floor((bab - 1) / 5); i++) {
                    let iterPenalty = (isMelee && featList.some(f => f.includes('power attack')) && paPenalty === 0) ? (-1 - Math.floor(bab / 4)) : paPenalty;
                    let iterTotal = bab - (i * 5) + atkMod + sizeData.ac_atk + secPenalty + iterPenalty + featAtkBonus;
                    iteratives.push(iterTotal);
                }
            }
            let atkStrArr = iteratives.map(v => formatMod(v));
            let finalAtkBonus = atkStrArr.join('/');

            let dmgStr = '';
            if (dice) {
                const bonus = Math.floor(dmgStatMod * strMult) + paBonus + featDmgBonus;

                if (featList.includes('improved critical')) {
                    if (!critStr) critStr = '/19-20';
                    else if (critStr.includes('19-20')) critStr = critStr.replace('19-20', '17-20');
                    else if (critStr.includes('18-20')) critStr = critStr.replace('18-20', '15-20');
                    else if (critStr.includes('x') && !critStr.includes('-20')) critStr = '/19-20' + critStr;
                }

                dmgStr = dice + (bonus !== 0 ? (bonus > 0 ? '+' : '') + bonus : '') + critStr;
                if (extra) dmgStr += ' ' + extra;
            }
            let nameStr = type;
            if (count && parseInt(count) > 1) {
                nameStr = type.endsWith('s') ? `${count} ${type}` : `${count} ${type}s`;
            }
            return `${nameStr} ${finalAtkBonus}${dmgStr ? ' (' + dmgStr + ')' : ''}`;
        }



        // Melee
        const meleeArr = [];
        document.querySelectorAll('#melee-container .dynamic-item-row').forEach(item => {
            const r = processRow(item, true);
            if (r) meleeArr.push(r);
        });
        const outMelee = document.getElementById('out-melee');
        const wrapMelee = document.getElementById('wrap-melee');
        if (outMelee && wrapMelee) {
            outMelee.innerHTML = meleeArr.join(', ');
            wrapMelee.style.display = meleeArr.length > 0 ? 'block' : 'none';
        }

        // Ranged
        const rangedArr = [];
        document.querySelectorAll('#ranged-container .dynamic-item-row').forEach(item => {
            const r = processRow(item, false);
            if (r) rangedArr.push(r);
        });
        const outRanged = document.getElementById('out-ranged');
        const wrapRanged = document.getElementById('wrap-ranged');
        if (outRanged && wrapRanged) {
            outRanged.innerHTML = rangedArr.join(', ');
            wrapRanged.style.display = rangedArr.length > 0 ? 'block' : 'none';
        }
    }

    document.getElementById('btn-add-melee')?.addEventListener('click', () => {
        addAttackRow('melee-container', 'raw', buildMeleeRowHtml);
        renderAttacks();
        updatePreview();
    });

    document.getElementById('btn-add-ranged')?.addEventListener('click', () => {
        addAttackRow('ranged-container', 'raw', buildRangedRowHtml);
        renderAttacks();
        updatePreview();
    });

    // Special Abilities (Rich Text)
    function renderAbilities() {
        const outAbilitiesList = document.getElementById('out-special-abilities-list');
        const wrapSpecialAbilities = document.getElementById('wrap-special-abilities');
        outAbilitiesList.innerHTML = '';
        let hasAbilities = false;
        document.querySelectorAll('.sa-item').forEach(card => {
            const name = sanitizeText(card.querySelector('.sa-name').value);
            const desc = sanitizeText(card.querySelector('.sa-desc').innerHTML);
            if (name || desc) {
                const div = document.createElement('div');
                div.className = 'special-ability pf-property-line';
                div.innerHTML = `<span class="pf-label">${name}</span> ${desc}`;
                outAbilitiesList.appendChild(div);
                hasAbilities = true;
            }
        });
        if (wrapSpecialAbilities) {
            wrapSpecialAbilities.style.display = hasAbilities ? 'block' : 'none';
        }
    }
    document.getElementById('btn-add-ability')?.addEventListener('click', () => {
        createDynamicItem('special-abilities-container', `
            <div class="sa-item" style="display: flex; flex-direction: column; gap: 5px; flex: 1; border: 1px solid rgba(255,255,255,0.1); padding: 10px; border-radius: 6px; background: rgba(0,0,0,0.2);">
                <input type="text" class="sa-name" placeholder="Ability Name (e.g. Breath Weapon (Su))" style="padding: 6px; border-radius: 4px; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.1); font-weight: bold;">
                <div class="sa-desc rich-text-editor" contenteditable="true" style="min-height: 40px; padding: 6px; border-radius: 4px; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.1);"></div>
            </div>
        `, renderAbilities);
        document.querySelectorAll('.sa-item input, .sa-item .rich-text-editor').forEach(el => {
            el.addEventListener('input', () => {
                renderAbilities();
                updatePreview();
            });
        });
    });


    // -------------------------
    // 5. SAVE / LOAD / EXPORT
    // -------------------------
    let currentEditingIndex = null;

    function serializeState() {
        let state = { basic: {}, html: {}, dynamic: {} };
        if (currentEditingIndex !== null && currentEditingIndex !== undefined) {
            state._global_index = currentEditingIndex;
        }
        // Basic inputs
        document.querySelectorAll('input[id^="in-"], select[id^="in-"], textarea[id^="in-"]').forEach(el => {
            if (el.type === 'radio') {
                if (el.checked) state.basic[el.name] = el.value;
            } else {
                state.basic[el.id] = el.value;
            }
        });
        // Rich text
        document.querySelectorAll('.rich-text-editor[id^="in-"]').forEach(el => {
            state.html[el.id] = el.innerHTML;
        });

        // Capture calculated values for top-level database exports
        const outHpEl = document.getElementById('out-hp');
        if (outHpEl) state.basic['in-hp'] = outHpEl.textContent.trim();
        const outInitEl = document.getElementById('out-init');
        if (outInitEl) state.basic['in-init'] = outInitEl.textContent.trim();
        // Dynamic lists
        state.dynamic.subtypes = Array.from(document.querySelectorAll('.subtype-select')).map(el => el.value);
        state.dynamic.senses = Array.from(document.querySelectorAll('.sense-item')).map(el => ({
            name: el.querySelector('.sense-name').value,
            dist: el.querySelector('.sense-dist').value
        }));
        state.dynamic.skills = Array.from(document.querySelectorAll('.skill-item')).map(el => ({
            name: el.querySelector('.skill-name').value,
            mod: el.querySelector('.skill-mod').value
        }));
        state.dynamic.slas = Array.from(document.querySelectorAll('.sla-item')).map(el => ({
            freq: el.querySelector('.sla-freq').value,
            spells: el.querySelector('.sla-spells').value
        }));
        state.dynamic.melee = Array.from(document.querySelectorAll('#melee-container .dynamic-item-row')).map(el => {
            const mode = el.querySelector('.atk-mode') ? el.querySelector('.atk-mode').value : 'calc';
            if (mode === 'raw') {
                return { mode: 'raw', rawText: el.querySelector('.atk-raw') ? el.querySelector('.atk-raw').value : '' };
            }
            return {
                mode: 'calc',
                count: el.querySelector('.atk-count') ? el.querySelector('.atk-count').value : '',
                type: el.querySelector('.atk-type') ? el.querySelector('.atk-type').value : '',
                sec: el.querySelector('.atk-sec') ? el.querySelector('.atk-sec').checked : false,
                dice: el.querySelector('.atk-dice') ? el.querySelector('.atk-dice').value : '',
                mult: el.querySelector('.atk-str-mult') ? el.querySelector('.atk-str-mult').value : '1',
                extra: el.querySelector('.atk-extra') ? el.querySelector('.atk-extra').value : ''
            };
        });
        state.dynamic.ranged = Array.from(document.querySelectorAll('#ranged-container .dynamic-item-row')).map(el => {
            const mode = el.querySelector('.atk-mode') ? el.querySelector('.atk-mode').value : 'calc';
            if (mode === 'raw') {
                return { mode: 'raw', rawText: el.querySelector('.atk-raw') ? el.querySelector('.atk-raw').value : '' };
            }
            return {
                mode: 'calc',
                count: el.querySelector('.atk-count') ? el.querySelector('.atk-count').value : '',
                type: el.querySelector('.atk-type') ? el.querySelector('.atk-type').value : '',
                sec: el.querySelector('.atk-sec') ? el.querySelector('.atk-sec').checked : false,
                dice: el.querySelector('.atk-dice') ? el.querySelector('.atk-dice').value : '',
                mult: el.querySelector('.atk-str-mult') ? el.querySelector('.atk-str-mult').value : '0',
                extra: el.querySelector('.atk-extra') ? el.querySelector('.atk-extra').value : ''
            };
        });
        state.dynamic.abilities = Array.from(document.querySelectorAll('.sa-item')).map(el => ({
            name: el.querySelector('.sa-name').value,
            desc: el.querySelector('.sa-desc').innerHTML
        }));
        return JSON.stringify(state);
    }

    function cleanStatblockSpellsText(raw) {
        if (!raw || typeof raw !== 'string' || !raw.trim()) return '';

        let text = raw.replace(/(\d+)[\u2014\ufffd—–\-](st|nd|rd|th)/gi, '$1$2');
        text = text.replace(/\ufffd/g, '—').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        let copyrightIdx = text.indexOf('Section 15: Copyright Notice');
        if (copyrightIdx !== -1) text = text.substring(0, copyrightIdx);
        let copyrightIdx2 = text.indexOf('spell-like abilities .');
        if (copyrightIdx2 !== -1) text = text.substring(0, copyrightIdx2);

        let rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);

        const NO_COMMA_WORDS = new Set(['maximized', 'quickened', 'empowered', 'extended', 'silent', 'still', 'heightened', 'enlarged', 'widened', 'grave', 'touch', 'ranged', 'bloodline', 'domains', 'prohibited', 'schools', 'domain', 'spell']);

        let resultLines = [];
        let currLine = '';
        let currType = null;

        const reHeader = /(?:Spell-Like Abilities|Spell-like Abilities|Spell-Like Ability|Spells Prepared|Spells Known|Spell-Like)/i;
        const reFreq = /^(?:\d+\/(?:day|week|month|year)|at\s*will|constant|\d+(?:st|nd|rd|th)?\s*\([^)]*\)|\d+(?:st|nd|rd|th)?$|\d+\s*\(at\s*will\))/i;
        const reFooter = /^(?:Bloodline|Domains|Prohibited Schools|Opposition Schools|\*|\D+power$)/i;

        for (let token of rawLines) {
            if ([',', '—', '-', '–', ':'].includes(token)) {
                if (currLine) {
                    if (['—', '-', '–'].includes(token) && !currLine.endsWith('—')) currLine += '—';
                    else if (token === ',' && !currLine.endsWith(',')) currLine += ',';
                }
                continue;
            }

            if (currType === 'header' || (currLine && (currLine.includes('(CL') || currLine.startsWith('CL')) && !currLine.endsWith(')'))) {
                if (token.startsWith('concentration') || /^\+?\d+\)?$/.test(token) || token.startsWith('(') || token.endsWith(';')) {
                    currLine += ' ' + token;
                    continue;
                }
            }

            if (reHeader.test(token) || /^\(?CL\s+/i.test(token)) {
                if (currLine) {
                    if ((currLine.split('(').length - 1) > (currLine.split(')').length - 1)) currLine += ')';
                    resultLines.push(currLine);
                }
                currLine = token;
                currType = 'header';
                continue;
            }

            if (reFreq.test(token)) {
                if (currLine) {
                    if ((currLine.split('(').length - 1) > (currLine.split(')').length - 1)) currLine += ')';
                    resultLines.push(currLine);
                }
                currLine = token;
                currType = 'freq';
                continue;
            }

            if (reFooter.test(token)) {
                if (currLine) {
                    if ((currLine.split('(').length - 1) > (currLine.split(')').length - 1)) currLine += ')';
                    resultLines.push(currLine);
                }
                currLine = token;
                currType = 'footer';
                continue;
            }

            if (currLine) {
                let words = currLine.split(/\s+/);
                let lastWord = (words[words.length - 1] || '').toLowerCase().replace(/[(),]/g, '');
                if (currLine.endsWith('—') || currLine.endsWith('-')) {
                    currLine += token;
                } else if (token.startsWith('—') || token.startsWith('-')) {
                    currLine += '—' + token.replace(/^[—\s\-]+/, '');
                } else if (currLine.endsWith(',') || currLine.endsWith('(')) {
                    currLine += ' ' + token;
                } else if (token.startsWith(',') || token.startsWith('(')) {
                    currLine += (token.startsWith(',') ? '' : ' ') + token;
                } else {
                    if (currType === 'freq' && !currLine.includes('—')) {
                        currLine += '—' + token;
                    } else if (NO_COMMA_WORDS.has(lastWord) || currType === 'footer' || currType === 'header') {
                        currLine += ' ' + token;
                    } else {
                        currLine += ', ' + token;
                    }
                }
            } else {
                currLine = token;
            }
        }

        if (currLine) {
            if ((currLine.split('(').length - 1) > (currLine.split(')').length - 1)) currLine += ')';
            resultLines.push(currLine);
        }

        let cleaned = [];
        for (let line of resultLines) {
            let l = line.replace(/\s+/g, ' ').trim();
            l = l.replace(/\s*,\s*/g, ', ');
            l = l.replace(/—\s*/g, '—');
            l = l.replace(/—\s*,/g, '—');
            l = l.replace(/\(\s+/g, '(');
            l = l.replace(/\s+\)/g, ')');

            let mDash = l.match(/^((?:\d+\/(?:day|week|month|year)|at\s*will|constant|\d+(?:st|nd|rd|th)\s*\([^)]*\)|\d+(?:st|nd|rd|th)|\d+\s*\(at\s*will\)))\s*—?\s*(.*)$/i);
            if (mDash) {
                let freqPart = mDash[1].trim();
                let restPart = mDash[2].trim();
                if (restPart) l = `${freqPart}—${restPart}`;
                else l = freqPart;
            }
            cleaned.push(l);
        }
        return cleaned.join('\n');
    }

    function consolidateSlaItems(rawItems) {
        if (!Array.isArray(rawItems) || rawItems.length === 0) return [];
        
        let rawTextParts = [];
        rawItems.forEach(item => {
            let f = typeof item === 'string' ? item : (item.freq || '');
            let s = typeof item === 'object' && item !== null ? (item.spells || '') : '';
            if (typeof s !== 'string') {
                if (Array.isArray(s)) s = s.map(x => typeof x === 'object' ? (x.name || x.spell || Object.values(x).join(' ')) : String(x)).join(', ');
                else s = String(s || '');
            }
            if (f && s) rawTextParts.push(`${f}—${s}`);
            else if (f) rawTextParts.push(f);
            else if (s) rawTextParts.push(s);
        });

        let rawText = rawTextParts.join('\n');
        if (!rawText.trim()) return [];

        let cleanedText = cleanStatblockSpellsText(rawText);

        let consolidated = [];
        cleanedText.split('\n').forEach(line => {
            line = line.trim();
            if (!line) return;

            let dashIdx = line.indexOf('—');
            if (dashIdx !== -1) {
                let freq = line.substring(0, dashIdx).trim();
                let spells = line.substring(dashIdx + 1).trim();
                consolidated.push({ freq: freq, spells: spells });
            } else {
                consolidated.push({ freq: '', spells: line });
            }
        });

        return consolidated;
    }

    function deserializeState(jsonStr) {
        try {
            const state = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
            if (!state) return;
            if (state._global_index !== undefined) {
                currentEditingIndex = state._global_index;
            }

            // Basic
            for (let id in state.basic) {
                const el = document.getElementById(id) || document.querySelector(`input[name="${id}"][value="${state.basic[id]}"]`);
                if (el) {
                    if (el.type === 'radio') el.checked = true;
                    else el.value = state.basic[id];
                }
            }
            // HTML
            state.html = state.html || {};
            for (let id in state.html) {
                const el = document.getElementById(id);
                if (el) el.innerHTML = state.html[id];
            }

            // Clear dynamic containers
            document.getElementById('subtypes-container').innerHTML = '';
            document.getElementById('senses-container').innerHTML = '';
            document.getElementById('skills-container').innerHTML = '';
            document.getElementById('slas-container').innerHTML = '';
            document.getElementById('melee-container').innerHTML = '';
            document.getElementById('ranged-container').innerHTML = '';
            document.getElementById('special-abilities-container').innerHTML = '';

            // Restore dynamic
            state.dynamic = state.dynamic || {};
            if (state.dynamic.subtypes) {
                state.dynamic.subtypes.forEach(val => {
                    document.getElementById('btn-add-subtype').click();
                    const selects = document.querySelectorAll('.subtype-select');
                    selects[selects.length - 1].value = val;
                });
            }
            if (state.dynamic.senses) {
                state.dynamic.senses.forEach(val => {
                    document.getElementById('btn-add-sense').click();
                    const items = document.querySelectorAll('.sense-item');
                    const last = items[items.length - 1];
                    last.querySelector('.sense-name') && (last.querySelector('.sense-name').value = val.name);
                    last.querySelector('.sense-dist') && (last.querySelector('.sense-dist').value = val.dist);
                });
            }
            if (state.dynamic.skills) {
                state.dynamic.skills.forEach(val => {
                    document.getElementById('btn-add-skill').click();
                    const items = document.querySelectorAll('.skill-item');
                    const last = items[items.length - 1];
                    last.querySelector('.skill-name') && (last.querySelector('.skill-name').value = val.name);
                    last.querySelector('.skill-mod') && (last.querySelector('.skill-mod').value = val.mod);
                });
            }
            if (state.dynamic.slas) {
                state.dynamic.slas = consolidateSlaItems(state.dynamic.slas);
                state.dynamic.slas.forEach(val => {
                    document.getElementById('btn-add-sla').click();
                    const items = document.querySelectorAll('.sla-item');
                    const last = items[items.length - 1];
                    let freqStr = typeof val === 'string' ? val : (val.freq || '');
                    let spellsStr = typeof val === 'object' && val !== null ? val.spells : '';

                    if (typeof spellsStr !== 'string') {
                        if (Array.isArray(spellsStr)) {
                            spellsStr = spellsStr.map(s => (typeof s === 'object' && s !== null ? (s.name || s.spell || s.rawText || Object.values(s).join(' ')) : String(s))).filter(Boolean).join(', ');
                        } else if (spellsStr && typeof spellsStr === 'object') {
                            spellsStr = spellsStr.name || spellsStr.spell || Object.values(spellsStr).join(' ');
                        } else {
                            spellsStr = '';
                        }
                    }

                    // If spellsStr is empty but freqStr contains a dash, split them!
                    if (!spellsStr && freqStr) {
                        const dashMatch = freqStr.match(/[\—\–\-\ufffd\:]/);
                        if (dashMatch) {
                            const actualFreq = freqStr.substring(0, dashMatch.index).trim();
                            const actualSpells = freqStr.substring(dashMatch.index + 1).trim();
                            freqStr = actualFreq;
                            spellsStr = actualSpells;
                        }
                    }

                    // Clean any replacement characters or lingering object strings
                    freqStr = freqStr.replace(/\ufffd/g, '').replace(/\[object Object\]/g, '').trim();
                    spellsStr = spellsStr.replace(/\ufffd/g, '').replace(/\[object Object\]/g, '').replace(/^,\s*|,\s*$/g, '').trim();

                    last.querySelector('.sla-freq') && (last.querySelector('.sla-freq').value = freqStr);
                    last.querySelector('.sla-spells') && (last.querySelector('.sla-spells').value = spellsStr);
                });
            }
            if (state.dynamic.melee) {
                state.dynamic.melee.forEach(val => {
                    // Determine mode: new format has val.mode, legacy formats use rawStr/dmg/dice
                    let mode = val.mode || 'raw'; // default to raw for better UX
                    let rawText = '';
                    // Legacy: rawStr field
                    if (!val.mode && val.rawStr) { mode = 'raw'; rawText = val.rawStr; }
                    // Legacy: dmg field (old format like {type:'claw', dmg:'1d4+5'})
                    else if (!val.mode && val.dmg !== undefined) { mode = 'raw'; rawText = val.type ? `${val.type} (${val.dmg})` : val.dmg; }
                    // New format raw
                    else if (val.mode === 'raw') { rawText = val.rawText || ''; }

                    const row = addAttackRow('melee-container', mode, buildMeleeRowHtml);
                    if (!row) return;
                    if (mode === 'raw') {
                        const ta = row.querySelector('.atk-raw');
                        if (ta) {
                            ta.value = rawText;
                            ta.setAttribute('data-base-bab', state.basic['in-bab'] || 0);
                            // trigger auto-resize
                            setTimeout(() => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }, 0);
                        }
                    } else {
                        if (row.querySelector('.atk-count')) row.querySelector('.atk-count').value = val.count || '';
                        if (row.querySelector('.atk-type')) row.querySelector('.atk-type').value = val.type || '';
                        if (row.querySelector('.atk-sec')) row.querySelector('.atk-sec').checked = val.sec || false;
                        if (row.querySelector('.atk-dice')) row.querySelector('.atk-dice').value = val.dice || '';
                        if (row.querySelector('.atk-str-mult')) row.querySelector('.atk-str-mult').value = val.mult || '1';
                        if (row.querySelector('.atk-extra')) row.querySelector('.atk-extra').value = val.extra || '';
                    }
                });
            }
            if (state.dynamic.ranged) {
                state.dynamic.ranged.forEach(val => {
                    let mode = val.mode || 'raw'; // default to raw for better UX
                    let rawText = '';
                    if (!val.mode && val.rawStr) { mode = 'raw'; rawText = val.rawStr; }
                    else if (!val.mode && val.dmg !== undefined) { mode = 'raw'; rawText = val.type ? `${val.type} (${val.dmg})` : val.dmg; }
                    else if (val.mode === 'raw') { rawText = val.rawText || ''; }

                    const row = addAttackRow('ranged-container', mode, buildRangedRowHtml);
                    if (!row) return;
                    if (mode === 'raw') {
                        const ta = row.querySelector('.atk-raw');
                        if (ta) {
                            ta.value = rawText;
                            ta.setAttribute('data-base-bab', state.basic['in-bab'] || 0);
                        }
                    } else {
                        if (row.querySelector('.atk-count')) row.querySelector('.atk-count').value = val.count || '';
                        if (row.querySelector('.atk-type')) row.querySelector('.atk-type').value = val.type || '';
                        if (row.querySelector('.atk-sec')) row.querySelector('.atk-sec').checked = val.sec || false;
                        if (row.querySelector('.atk-dice')) row.querySelector('.atk-dice').value = val.dice || '';
                        if (row.querySelector('.atk-str-mult')) row.querySelector('.atk-str-mult').value = val.mult || '0';
                        if (row.querySelector('.atk-extra')) row.querySelector('.atk-extra').value = val.extra || '';
                    }
                });
            }
            if (state.dynamic.abilities) {
                state.dynamic.abilities.forEach(val => {
                    document.getElementById('btn-add-ability').click();
                    const items = document.querySelectorAll('.sa-item');
                    const last = items[items.length - 1];
                    last.querySelector('.sa-name').value = val.name;
                    last.querySelector('.sa-desc').innerHTML = val.desc || '';
                });
            }

            
            handleToggle();
            
            // Trigger change events for armor/shields to calculate AC properly
            const armorEl = document.getElementById('in-armor-name');
            if(armorEl && armorEl.value && window.allArmorsDB) {
                const item = window.allArmorsDB.find(a => a.name.toLowerCase() === armorEl.value.toLowerCase());
                if (item) {
                    document.getElementById('in-ac-armor').setAttribute('data-max-dex', item.max_dex);
                    document.getElementById('in-ac-armor').setAttribute('data-acp', item.acp);
                }
            }
            const shieldEl = document.getElementById('in-shield-name');
            if(shieldEl && shieldEl.value && window.allArmorsDB) {
                const item = window.allArmorsDB.find(a => a.name.toLowerCase() === shieldEl.value.toLowerCase());
                if (item) {
                    document.getElementById('in-ac-shield').setAttribute('data-acp', item.acp);
                }
            }

            if (typeof renderSlas === 'function') renderSlas();

            // renderAttacks MUST run after all rows are populated with values
            if (typeof renderAttacks === 'function') {
                renderAttacks();
                // Second call guarantees textarea values (set after row creation) are picked up
                setTimeout(() => { renderAttacks(); updatePreview(); }, 0);
            }
            // Sync UI Tags for Feats, SA, and SQ
            const syncArray = (arrName, inputId) => {
                const el = document.getElementById(inputId);
                if (el && el.value) {
                    window[arrName] = el.value.split(',').map(s => s.trim()).filter(x => x);
                } else {
                    window[arrName] = [];
                }
            };
            syncArray('activeFeats', 'in-feats');
            syncArray('activeSA', 'in-special-attacks');
            syncArray('activeSQ', 'in-sq');
            syncArray('activeAura', 'in-aura');
            syncArray('activeDef', 'in-def-abilities');
            syncArray('activeImmune', 'in-immune');
            syncArray('activeResist', 'in-resist');
            syncArray('activeWeakness', 'in-weaknesses');

            if (typeof window.renderFeatTags === 'function') window.renderFeatTags();
            if (typeof window.renderSATags === 'function') window.renderSATags();
            if (typeof window.renderSQTags === 'function') window.renderSQTags();
            if (typeof window.renderAuraTags === 'function') window.renderAuraTags();
            if (typeof window.renderDefTags === 'function') window.renderDefTags();
            if (typeof window.renderImmuneTags === 'function') window.renderImmuneTags();
            if (typeof window.renderResistTags === 'function') window.renderResistTags();
            if (typeof window.renderWeaknessTags === 'function') window.renderWeaknessTags();
            
            if (typeof renderAbilities === 'function') renderAbilities();
            
            updatePreview();
        } catch (e) {
            console.error("Error loading state", e);
        }
    }

    let autoSaveTimeout = null;
    function autoSave() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            try {
                const dataStr = serializeState();
                localStorage.setItem('pf_monster_creator_current_draft', dataStr);
            } catch (e) {}
        }, 400);
    }

    // Attach autoSave draft to form inputs
    const editorFormContainer = document.getElementById('form-container') || document.body;
    editorFormContainer.addEventListener('input', autoSave);
    editorFormContainer.addEventListener('change', autoSave);

    // Load on start (used for receiving monsters from Database page or restoring active draft)
    const saved = localStorage.getItem('pf_monster_creator_save');
    const activeDraft = localStorage.getItem('pf_monster_creator_current_draft');
    if (saved) {
        deserializeState(saved);
        localStorage.removeItem('pf_monster_creator_save');
        localStorage.setItem('pf_monster_creator_current_draft', saved);
    } else if (activeDraft) {
        deserializeState(activeDraft);
    } else {
        handleToggle();
        updatePreview();
    }

    // New Sheet
    const btnNewSheet = document.getElementById('btn-new-sheet');
    if (btnNewSheet) {
        btnNewSheet.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear all data and start a new sheet? Unsaved changes will be lost.")) {
                currentEditingIndex = null;
                localStorage.removeItem('pf_monster_creator_save');
                localStorage.removeItem('pf_monster_creator_current_draft');
                location.reload();
            }
        });
    }

    // JSON Export
    document.getElementById('btn-save-json').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(serializeState());
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", `${document.getElementById('in-name').value || 'Monster'}.json`);
        dlAnchorElem.click();
    });

    // JSON Import
    const fileLoadBtn = document.getElementById('btn-load-json');
    const fileLoadInput = document.getElementById('file-load-json');
    if (fileLoadBtn) fileLoadBtn.addEventListener('click', () => fileLoadInput.click());
    if (fileLoadInput) fileLoadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => deserializeState(e.target.result);
        reader.readAsText(file);
    });

    // Drag & Drop JSON Import
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        document.body.style.opacity = '0.7';
    });
    document.body.addEventListener('dragleave', (e) => {
        e.preventDefault();
        document.body.style.opacity = '1';
    });
    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        document.body.style.opacity = '1';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (e) => deserializeState(e.target.result);
                reader.readAsText(file);
            } else {
                alert("Please upload a valid JSON monster file.");
            }
        }
    });

    // Save to Database (monsters.json via API)
    const btnSaveDatabase = document.getElementById('btn-save-database');
    if (btnSaveDatabase) {
        btnSaveDatabase.addEventListener('click', () => {
            const dataStr = serializeState();
            const stateObj = JSON.parse(dataStr);
            const monsterName = document.getElementById('in-name').value || 'Unnamed Monster';

            fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stateObj)
            })
                .then(r => r.json())
                .then(res => {
                    if (res.status === 'ok') {
                        if (res.global_index !== undefined) {
                            currentEditingIndex = res.global_index;
                        }
                        const freshState = serializeState();
                        localStorage.setItem('pf_monster_creator_current_draft', freshState);
                        alert(`✅ "${monsterName}" saved to Monster Database!`);
                    } else {
                        alert('Failed to save: unexpected response');
                    }
                })
                .catch(err => alert('Failed to save: ' + err.message));
        });
    }

    // Auto-Calculate Stats
    const btnAutoCalc = document.getElementById('btn-auto-calc');
    if (btnAutoCalc) {
        btnAutoCalc.addEventListener('click', () => {
            const typeSelect = document.getElementById('in-type').value;
            const hdAmount = parseInt(document.getElementById('in-hd-amount').value) || 1;
            const rules = creatureTypes[typeSelect];
            if (!rules) return;

            // 1. HD Size
            document.getElementById('in-hd-size').value = rules.hit_die;

            // 2. BAB
            let bab = 0;
            if (rules.bab === "Fast") bab = hdAmount;
            else if (rules.bab === "Medium") bab = Math.floor(hdAmount * 0.75);
            else if (rules.bab === "Slow") bab = Math.floor(hdAmount * 0.5);
            document.getElementById('in-bab').value = bab;

            // 3. Base Saves & Ability Mods
            const conMod = calculateModifier(document.getElementById('in-con').value);
            const dexMod = calculateModifier(document.getElementById('in-dex').value);
            const wisMod = calculateModifier(document.getElementById('in-wis').value);

            const goodSave = Math.floor(hdAmount / 2) + 2;
            const poorSave = Math.floor(hdAmount / 3);

            const isFortGood = rules.good_saves.includes("Fortitude");
            const isRefGood = rules.good_saves.includes("Reflex");
            const isWillGood = rules.good_saves.includes("Will");

            const baseFort = isFortGood ? goodSave : poorSave;
            const baseRef = isRefGood ? goodSave : poorSave;
            const baseWill = isWillGood ? goodSave : poorSave;

            const totalFort = baseFort + conMod;
            const totalRef = baseRef + dexMod;
            const totalWill = baseWill + wisMod;

            const formatSave = (val) => (val >= 0 ? '+' : '') + val;

            document.getElementById('in-fort').value = formatSave(totalFort);
            document.getElementById('in-ref').value = formatSave(totalRef);
            document.getElementById('in-will').value = formatSave(totalWill);

            updatePreview();
        });
    }

    // Auto-Calculate XP from CR & Validation
    const inCr = document.getElementById('in-cr');
    if (inCr) {
        inCr.addEventListener('input', (e) => {
            // Validation
            let val = parseFloat(inCr.value);
            if (val < 0) {
                inCr.value = '0';
            }
            
            const xp = crToXp[inCr.value.trim()];
            if (xp) {
                document.getElementById('in-xp').value = xp;
            } else {
                // If it's a fractional CR like 1/2, it might be in crToXp
                const floatVal = parseFloat(inCr.value);
                if (floatVal > 30) inCr.value = '30'; // soft cap
            }
            updatePreview();
        });
    }

    // PNG / PDF
    const btnExportPng = document.getElementById('btn-export-png');
    const btnExportPdf = document.getElementById('btn-export-pdf');
    const statblockPaper = document.getElementById('statblock-paper');

    // Theme Selector
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector && statblockPaper) {
        const savedTheme = localStorage.getItem('pf_creator_theme') || 'theme-default';
        themeSelector.value = savedTheme;

        const updateTheme = () => {
            const theme = themeSelector.value;
            statblockPaper.className = `statblock-paper ${theme}`;
            document.body.classList.forEach(cls => {
                if (cls.startsWith('theme-')) document.body.classList.remove(cls);
            });
            document.body.classList.add(theme);
            localStorage.setItem('pf_creator_theme', theme);
        };

        themeSelector.addEventListener('change', updateTheme);
        updateTheme();
    }

    const getThemeBgColor = () => {
        return getComputedStyle(document.body).getPropertyValue('--sb-bg').trim() || '#F4E3C5';
    };

    btnExportPng.addEventListener('click', () => {
        html2canvas(statblockPaper, { scale: 2, backgroundColor: getThemeBgColor() }).then(canvas => {
            const link = document.createElement('a');
            link.download = `${document.getElementById('in-name').value || 'Monster'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });

    btnExportPdf.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        html2canvas(statblockPaper, { scale: 2, backgroundColor: getThemeBgColor() }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${document.getElementById('in-name').value || 'Monster'}.pdf`);
        });
    });

    // -------------------------------------------------------------------
    // FEAT UI AND AUTOCOMPLETE LOGIC
    // -------------------------------------------------------------------
    // Generic Autocomplete and Editable Tags System
    function setupTagSystem(config) {
        window[config.activeArray] = [];
        let db = [];

        if (config.dbUrl) {
            fetch(config.dbUrl).then(r => r.json()).then(d => { db = d; }).catch(e => console.error(e));
        }

        const searchInput = document.getElementById(config.searchInputId);
        const listEl = document.getElementById(config.listId);
        const containerEl = document.getElementById(config.containerId);
        const hiddenInput = document.getElementById(config.hiddenInputId);

        function render() {
            if (!containerEl) return;
            containerEl.innerHTML = '';
            (window[config.activeArray] || []).filter(Boolean).forEach((item, index) => {
                const tag = document.createElement('div');
                tag.className = 'tag-item';
                tag.style.display = 'inline-flex';
                tag.style.alignItems = 'center';
                tag.style.background = config.bgColor || '#444';
                tag.style.color = '#fff';
                tag.style.padding = '2px 8px';
                tag.style.borderRadius = '12px';
                tag.style.fontSize = '0.85rem';
                tag.style.border = '1px solid #555';

                const itemName = (item && typeof item === 'object' ? item.name : item) || '';

                tag.innerHTML = `<span class="editable-tag-text" style="outline:none; min-width:20px; cursor:pointer;" title="Click to view details">${itemName}</span><span class="remove-tag" style="margin-left:6px; cursor:pointer; font-weight:bold; color:#ff6666;">&times;</span>`;

                const span = tag.querySelector('.editable-tag-text');
                span.addEventListener('click', function(e) {
                    if (e.target !== this) return;
                    let desc = "Description not available. Please edit the JSON file to add a description.";
                    if (item && typeof item === 'object' && item.description) {
                        desc = item.description;
                    } else {
                        const found = db.find(d => (d && typeof d === 'object' ? d.name === itemName : d === itemName));
                        if (found && typeof found === 'object' && found.description) desc = found.description;
                    }
                    if (window.showInfoModal) window.showInfoModal(itemName, desc);
                });

                tag.querySelector('.remove-tag').addEventListener('click', () => {
                    window[config.activeArray].splice(index, 1);
                    render();
                    sync();
                });
                containerEl.appendChild(tag);
            });
            sync();
        }

        function sync() {
            if (!hiddenInput) return;
            hiddenInput.value = (window[config.activeArray] || []).filter(Boolean).map(i => (i && typeof i === 'object' ? i.name : i) || '').join(', ');
            updatePreview();
        }

        if (searchInput) {
            let focusIdx = -1;

            function renderList(filter = '') {
                listEl.innerHTML = '';
                focusIdx = -1;
                const matches = db.filter(f => {
                    const name = (f && typeof f === 'object' ? f.name : f) || '';
                    return String(name).toLowerCase().includes(filter.toLowerCase());
                }).slice(0, 50);
                
                if (matches.length > 0) {
                    listEl.style.display = 'block';
                    matches.forEach(m => {
                        const li = document.createElement('li');
                        li.style.padding = '5px 10px';
                        li.style.cursor = 'pointer';
                        li.style.borderBottom = '1px solid #333';
                        const matchName = typeof m === 'object' ? m.name : m;
                        li.innerText = matchName;
                        li.addEventListener('mouseover', () => {
                            Array.from(listEl.children).forEach(c => c.style.background = 'transparent');
                            li.style.background = '#005fcc';
                        });
                        li.addEventListener('mousedown', (e) => {
                            e.preventDefault();
                            if (!window[config.activeArray].some(x => (typeof x === 'object' ? x.name : x) === matchName)) {
                                window[config.activeArray].push(m);
                                sync();
                                render();
                            }
                            searchInput.value = '';
                            listEl.style.display = 'none';
                        });
                        listEl.appendChild(li);
                    });
                } else {
                    listEl.style.display = 'none';
                }
            }

            searchInput.addEventListener('focus', () => renderList(searchInput.value));
            searchInput.addEventListener('input', () => renderList(searchInput.value));
            searchInput.addEventListener('blur', () => { setTimeout(() => listEl.style.display='none', 150); });

            searchInput.addEventListener('keydown', (e) => {
                const items = listEl.getElementsByTagName('li');
                if (e.key === 'ArrowDown') {
                    focusIdx++;
                    if (focusIdx >= items.length) focusIdx = 0;
                    Array.from(items).forEach(c => c.style.background = 'transparent');
                    if (items[focusIdx]) items[focusIdx].style.background = '#005fcc';
                } else if (e.key === 'ArrowUp') {
                    focusIdx--;
                    if (focusIdx < 0) focusIdx = items.length - 1;
                    Array.from(items).forEach(c => c.style.background = 'transparent');
                    if (items[focusIdx]) items[focusIdx].style.background = '#005fcc';
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (focusIdx > -1 && items[focusIdx]) {
                        items[focusIdx].dispatchEvent(new MouseEvent('mousedown'));
                    } else if (searchInput.value.trim() !== '') {
                        const raw = searchInput.value.trim();
                        if (!window[config.activeArray].some(x => (typeof x === 'object' ? x.name : x) === raw)) {
                            window[config.activeArray].push({name: raw, description: "Custom ability. No description provided."});
                            sync();
                            render();
                        }
                        searchInput.value = '';
                        listEl.style.display = 'none';
                    }
                }
            });
        }
    }

    setupTagSystem({
        activeArray: 'activeFeats',
        dbUrl: 'data/feats.json',
        searchInputId: 'in-feat-search',
        listId: 'feat-autocomplete-list',
        containerId: 'selected-feats-container',
        hiddenInputId: 'in-feats',
        renderFunc: 'renderFeatTags',
        bgColor: '#444'
    });

    setupTagSystem({
        activeArray: 'activeSA',
        dbUrl: 'data/special_abilities.json',
        searchInputId: 'in-sa-search',
        listId: 'sa-autocomplete-list',
        containerId: 'selected-sa-container',
        hiddenInputId: 'in-special-attacks',
        renderFunc: 'renderSATags',
        bgColor: '#5a2a2a'
    });

    setupTagSystem({
        activeArray: 'activeSQ',
        dbUrl: 'data/special_abilities.json',
        searchInputId: 'in-sq-search',
        listId: 'sq-autocomplete-list',
        containerId: 'selected-sq-container',
        hiddenInputId: 'in-sq',
        renderFunc: 'renderSQTags',
        bgColor: '#2a4a5a'
    });


    // ==========================================


    // ==========================================
    // SPELLS UI LOGIC
    // ==========================================
    let allSpellsDB = [];
    fetch('data/spells.json')
        .then(res => res.json())
        .then(data => { allSpellsDB = data; })
        .catch(err => console.error('Could not load spells.json:', err));

    window.activeSpells = {};
    const hiddenSpellsInput = document.getElementById('in-spells-data');
    const spellsContainer = document.getElementById('spell-levels-container');
    const btnAddSpellLevel = document.getElementById('btn-add-spell-level');

    function saveSpellsState() {
        if (hiddenSpellsInput) {
            hiddenSpellsInput.value = JSON.stringify(window.activeSpells);
        }
        renderSpellsPreview();
        if (typeof autoSave === 'function') autoSave();
    }

    function renderSpellsPreview() {
        const wrapSpells = document.getElementById('wrap-spells');
        const outList = document.getElementById('out-spells-list');
        const inClass = document.getElementById('in-spell-class') ? document.getElementById('in-spell-class').value.trim() : '';
        const inCL = document.getElementById('in-spell-cl') ? document.getElementById('in-spell-cl').value : '1';
        const inStat = document.getElementById('in-spell-stat') ? document.getElementById('in-spell-stat').value : 'cha';
        const inConc = document.getElementById('in-spell-conc') ? document.getElementById('in-spell-conc').value : '0';

        if (document.getElementById('out-spell-class')) document.getElementById('out-spell-class').textContent = inClass;
        if (document.getElementById('out-spell-cl')) document.getElementById('out-spell-cl').textContent = inCL + (inCL === '1' ? 'st' : inCL === '2' ? 'nd' : inCL === '3' ? 'rd' : 'th');

        let concMod = parseInt(inConc);
        if (isNaN(concMod) || inConc === '0') {
            const statScore = parseInt(document.getElementById(`in-${inStat}`) ? document.getElementById(`in-${inStat}`).value : 10) || 10;
            const statMod = calculateModifier(statScore);
            concMod = parseInt(inCL) + statMod;
        }
        if (document.getElementById('out-spell-conc')) document.getElementById('out-spell-conc').textContent = formatMod(concMod);

        if (!outList) return;
        outList.innerHTML = '';
        let hasSpells = false;

        const levels = Object.keys(window.activeSpells).map(Number).sort((a, b) => b - a);

        levels.forEach(lvl => {
            const data = window.activeSpells[lvl];
            if (!data || data.spells.length === 0) return;
            hasSpells = true;

            const div = document.createElement('div');
            div.className = 'pf-property-line special-ability';

            let lvlText = lvl === 0 ? '0 (at will)' : `${lvl}${lvl === 1 ? 'st' : lvl === 2 ? 'nd' : lvl === 3 ? 'rd' : 'th'}`;
            let html = `<span class="pf-label">${lvlText}</span>`;
            if (data.slots && lvl !== 0) {
                html += ` <span style="font-weight: normal;">(${data.slots})</span>`;
            }
            html += `—`;

            const statScore = parseInt(document.getElementById(`in-${inStat}`) ? document.getElementById(`in-${inStat}`).value : 10) || 10;
            const statMod = calculateModifier(statScore);
            const dc = 10 + lvl + statMod;

            const spellLinks = data.spells.map(s => {
                let sName = s;
                let sExtra = '';
                const match = s.match(/^(.*?)\s*(\(.*?\))$/);
                if (match) {
                    sName = match[1];
                    sExtra = ' ' + match[2];
                }

                const dbSpell = allSpellsDB.find(x => x.name.toLowerCase() === sName.toLowerCase());
                const isSave = dbSpell && dbSpell.short_description && dbSpell.short_description.toLowerCase().includes('save');
                let dcText = isSave ? ` (DC ${dc})` : '';

                return `<i><a href="https://aonprd.com/SpellDisplay.aspx?ItemName=${encodeURIComponent(sName)}" target="_blank" class="pf-spell" style="color: inherit; text-decoration: none;" title="${dbSpell && dbSpell.short_description ? dbSpell.short_description.replace(/"/g, '&quot;') : ''}">${sName}</a></i>${dcText}${sExtra}`;
            });

            html += spellLinks.join(', ');
            div.innerHTML = html;
            outList.appendChild(div);
        });

        if (wrapSpells) wrapSpells.style.display = (hasSpells || inClass) ? 'block' : 'none';
    }

    function buildSpellLevelUI(lvl, data) {
        if (!spellsContainer) return;
        const div = document.createElement('div');
        div.className = 'dynamic-item-row';
        div.style.background = 'rgba(0,0,0,0.2)';
        div.style.padding = '8px';
        div.style.borderRadius = '4px';
        div.style.marginBottom = '8px';

        div.innerHTML = `
            <div style="display:flex; gap:8px; align-items:center; margin-bottom: 5px;">
                <label style="font-weight:bold; min-width:60px;">Level ${lvl}</label>
                <input type="text" class="spell-slots" placeholder="Slots (e.g. 4/day)" value="${data.slots || ''}" style="width:120px; padding:4px; background:rgba(0,0,0,0.3); color:white; border:1px solid rgba(255,255,255,0.1); border-radius:4px;">
                <button class="btn-remove-level" style="margin-left:auto; background:linear-gradient(45deg, #ef4444, #f87171); color:white; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;">✕</button>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:5px;" class="spell-tags-container"></div>
            <div style="position:relative;">
                <input type="text" class="spell-search" placeholder="Add spell..." autocomplete="off" style="width:100%; padding:6px; background:rgba(0,0,0,0.3); color:white; border:1px solid rgba(255,255,255,0.1); border-radius:4px;">
                <ul class="spell-autocomplete" style="display:none; position:absolute; z-index:1000; width:100%; max-height:150px; overflow-y:auto; background:#222; border:1px solid #444; list-style:none; padding:0; margin:0;"></ul>
            </div>
        `;

        spellsContainer.appendChild(div);

        const slotsInput = div.querySelector('.spell-slots');
        slotsInput.addEventListener('input', (e) => {
            window.activeSpells[lvl].slots = e.target.value;
            saveSpellsState();
        });

        div.querySelector('.btn-remove-level').addEventListener('click', () => {
            delete window.activeSpells[lvl];
            div.remove();
            saveSpellsState();
        });

        const tagsContainer = div.querySelector('.spell-tags-container');
        const searchInput = div.querySelector('.spell-search');
        const autocomplete = div.querySelector('.spell-autocomplete');

        function renderTags() {
            tagsContainer.innerHTML = '';
            window.activeSpells[lvl].spells.forEach((spell, idx) => {
                const tag = document.createElement('div');
                tag.className = 'tag-item';
                tag.style.display = 'inline-flex';
                tag.style.alignItems = 'center';
                tag.style.background = '#8b5cf6';
                tag.style.color = '#fff';
                tag.style.padding = '2px 8px';
                tag.style.borderRadius = '12px';
                tag.style.fontSize = '0.85rem';

                tag.innerHTML = `<span>${spell}</span><span class="remove-tag" style="margin-left:6px; cursor:pointer; font-weight:bold;">&times;</span>`;
                tag.querySelector('.remove-tag').addEventListener('click', () => {
                    window.activeSpells[lvl].spells.splice(idx, 1);
                    renderTags();
                    saveSpellsState();
                });
                tagsContainer.appendChild(tag);
            });
        }

        searchInput.addEventListener('input', function () {
            const val = this.value;
            autocomplete.innerHTML = '';
            if (!val) {
                autocomplete.style.display = 'none';
                return;
            }

            let matches = allSpellsDB.filter(s => s.name.toLowerCase().includes(val.toLowerCase()));

            const customLi = document.createElement('li');
            customLi.style.padding = '6px';
            customLi.style.cursor = 'pointer';
            customLi.style.color = '#aaf';
            customLi.textContent = `+ Add "${val}" (Custom)`;
            customLi.addEventListener('click', () => {
                window.activeSpells[lvl].spells.push(val);
                searchInput.value = '';
                autocomplete.style.display = 'none';
                renderTags();
                saveSpellsState();
            });
            autocomplete.appendChild(customLi);

            matches.slice(0, 50).forEach(m => {
                const li = document.createElement('li');
                li.style.padding = '6px';
                li.style.cursor = 'pointer';
                li.style.borderBottom = '1px solid #333';
                li.textContent = m.name;
                li.addEventListener('click', () => {
                    window.activeSpells[lvl].spells.push(m.name);
                    searchInput.value = '';
                    autocomplete.style.display = 'none';
                    renderTags();
                    saveSpellsState();
                });
                autocomplete.appendChild(li);
            });
            autocomplete.style.display = 'block';
        });

        document.addEventListener('click', function (e) {
            if (e.target !== searchInput) {
                autocomplete.style.display = 'none';
            }
        });

        renderTags();
    }

    if (btnAddSpellLevel) {
        btnAddSpellLevel.addEventListener('click', () => {
            const lvl = prompt("Enter Spell Level (0-9):");
            const parsed = parseInt(lvl);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 9) {
                if (!window.activeSpells[parsed]) {
                    window.activeSpells[parsed] = { slots: '', spells: [] };
                    buildSpellLevelUI(parsed, window.activeSpells[parsed]);
                    saveSpellsState();
                } else {
                    alert("Level already exists!");
                }
            }
        });
    }

    setTimeout(() => {
        if (hiddenSpellsInput && hiddenSpellsInput.value) {
            try {
                window.activeSpells = JSON.parse(hiddenSpellsInput.value);
                Object.keys(window.activeSpells).sort((a, b) => b - a).forEach(lvl => {
                    buildSpellLevelUI(lvl, window.activeSpells[lvl]);
                });
            } catch (e) {
                console.error(e);
            }
        }
        ['in-spell-class', 'in-spell-cl', 'in-spell-stat', 'in-spell-conc'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', saveSpellsState);
        });
        renderSpellsPreview();
    }, 500);

    // Sidebar Toggle Logic
    const toggleBtn = document.getElementById('btn-toggle-panel');
    const controlsPanel = document.getElementById('controls-panel');
    if (toggleBtn && controlsPanel) {
        toggleBtn.addEventListener('click', () => {
            const isCollapsed = controlsPanel.classList.toggle('collapsed');
            toggleBtn.setAttribute('title', isCollapsed ? 'Open Sidebar (Show Editor)' : 'Close Sidebar (Hide Editor)');
        });
    }
    // -------------------------------------------------------------------
    // WEAPONS LOGIC (AUTOCOMPLETE DATALIST)
    // -------------------------------------------------------------------
    window.allWeaponsDB = [];
    fetch('data/weapons.json')
        .then(res => res.json())
        .then(data => { 
            window.allWeaponsDB = data; 
            
            // Melee Weapons Datalist
            let meleeList = document.getElementById('melee-weapons-list');
            if(!meleeList) {
                meleeList = document.createElement('datalist');
                meleeList.id = 'melee-weapons-list';
                document.body.appendChild(meleeList);
            }
            meleeList.innerHTML = data.filter(w => w.is_melee).map(w => `<option value="${w.name}">`).join('');

            // Ranged Weapons Datalist
            let rangedList = document.getElementById('ranged-weapons-list');
            if(!rangedList) {
                rangedList = document.createElement('datalist');
                rangedList.id = 'ranged-weapons-list';
                document.body.appendChild(rangedList);
            }
            rangedList.innerHTML = data.filter(w => !w.is_melee).map(w => `<option value="${w.name}">`).join('');
        })
        .catch(err => console.error('Could not load weapons.json:', err));
    // Armor and Shields Datalist
    window.allArmorDB = [];
    fetch('data/armor.json')
        .then(res => res.json())
        .then(data => {
            window.allArmorDB = data;
            
            let armorList = document.getElementById('armor-list');
            if(!armorList) {
                armorList = document.createElement('datalist');
                armorList.id = 'armor-list';
                document.body.appendChild(armorList);
            }
            armorList.innerHTML = data.filter(a => a.category !== 'Shield').map(a => `<option value="${a.name}">`).join('');

            let shieldList = document.getElementById('shield-list');
            if(!shieldList) {
                shieldList = document.createElement('datalist');
                shieldList.id = 'shield-list';
                document.body.appendChild(shieldList);
            }
            shieldList.innerHTML = data.filter(a => a.category === 'Shield').map(a => `<option value="${a.name}">`).join('');
        })
        .catch(err => console.error('Could not load armor.json:', err));


    function scaleWeaponDamage(diceStr, size) {
        if (!diceStr || size === 'Medium' || !size) return diceStr;
        const sizeSteps = { 'Fine': -4, 'Diminutive': -3, 'Tiny': -2, 'Small': -1, 'Medium': 0, 'Large': 1, 'Huge': 2, 'Gargantuan': 3, 'Colossal': 4 };
        const stepDiff = (sizeSteps[size] || 0);
        if (stepDiff === 0) return diceStr;
        const diceProgression = ["1", "1d2", "1d3", "1d4", "1d6", "1d8", "1d10", "2d6", "2d8", "3d6", "3d8", "4d6", "4d8", "6d6", "6d8", "8d6"];
        let match = diceStr.match(/^(\d+d\d+)(.*)$/i);
        if(!match) return diceStr;
        let currentDice = match[1].toLowerCase();
        let suffix = match[2];
        let idx = diceProgression.indexOf(currentDice);
        if(idx === -1) {
            if (currentDice === '2d4') { currentDice = '1d6'; idx = 4; }
            else if (currentDice === '1d12') { currentDice = '1d10'; idx = 6; }
            else return diceStr;
        }
        let newIdx = idx + stepDiff;
        newIdx = Math.max(0, Math.min(diceProgression.length - 1, newIdx));
        return diceProgression[newIdx] + suffix;
    }

    document.addEventListener('change', function(e) {
        if (e.target && e.target.classList.contains('atk-type')) {
            const row = e.target.closest('.atk-row') || e.target.parentElement.parentElement;
            if (!row) return;
            const val = e.target.value.toLowerCase();
            const weapon = window.allWeaponsDB.find(w => w.name.toLowerCase() === val);
            if (weapon) {
                let size = document.getElementById('in-size').value || 'Medium';
                let scaledDice = scaleWeaponDamage(weapon.dmg, size);
                let finalDiceStr = scaledDice;
                if (weapon.crit && weapon.crit !== '20/x2') {
                    finalDiceStr += `/${weapon.crit.split('/')[0]}`;
                }
                const diceInput = row.querySelector('.atk-dice');
                if(diceInput) { 
                    diceInput.value = finalDiceStr;
                }
                const multInput = row.querySelector('.atk-str-mult');
                if(multInput && weapon.str_mult !== undefined) {
                    multInput.value = weapon.str_mult.toString();
                }

                // Check finesse
                if (weapon.category && (weapon.category.includes('Light') || weapon.special.toLowerCase().includes('finesse'))) {
                    if (window.activeFeats && !window.activeFeats.some(f => f.toLowerCase().includes('weapon finesse'))) {
                        window.activeFeats.push('Weapon Finesse');
                        if(window.renderFeatTags) window.renderFeatTags();
                    }
                }
                renderAttacks();
                updatePreview();
            }
        }
    });

    // -------------------------------------------------------------------
    // ARMOR & SHIELD AUTOCOMPLETE
    // -------------------------------------------------------------------
    window.allArmorsDB = [];
    fetch('data/armor.json')
        .then(res => res.json())
        .then(data => { 
            window.allArmorsDB = data; 
            
            let armorList = document.getElementById('armor-list');
            if(!armorList) {
                armorList = document.createElement('datalist');
                armorList.id = 'armor-list';
                document.body.appendChild(armorList);
            }
            armorList.innerHTML = data.filter(a => a.type !== 'Shield').map(a => `<option value="${a.name}">`).join('');
            
            let shieldList = document.getElementById('shield-list');
            if(!shieldList) {
                shieldList = document.createElement('datalist');
                shieldList.id = 'shield-list';
                document.body.appendChild(shieldList);
            }
            shieldList.innerHTML = data.filter(a => a.type === 'Shield').map(a => `<option value="${a.name}">`).join('');
        })
        .catch(err => console.error('Could not load armor.json:', err));

    // Also build weapon datalist for melee/ranged attack rows
    window.allWeaponsDB = [];
    fetch('data/weapons.json')
        .then(res => res.json())
        .then(data => {
            window.allWeaponsDB = data;
            
            let meleeList = document.getElementById('melee-weapons-list');
            if (!meleeList) { meleeList = document.createElement('datalist'); meleeList.id = 'melee-weapons-list'; document.body.appendChild(meleeList); }
            meleeList.innerHTML = data.filter(w => w.type !== 'Ranged').map(w => `<option value="${w.name}">`).join('');
            
            let rangedList = document.getElementById('ranged-weapons-list');
            if (!rangedList) { rangedList = document.createElement('datalist'); rangedList.id = 'ranged-weapons-list'; document.body.appendChild(rangedList); }
            rangedList.innerHTML = data.filter(w => w.type === 'Ranged').map(w => `<option value="${w.name}">`).join('');
        })
        .catch(err => console.error('Could not load weapons.json:', err));

    function handleArmorShieldChange(e) {
        if (e.target && (e.target.id === 'in-armor-name' || e.target.id === 'in-shield-name')) {
            const val = e.target.value.toLowerCase().trim();
            const item = window.allArmorsDB.find(a => a.name.toLowerCase() === val);
            if (item) {
                // armor.json uses ac_bonus (not bonus)
                const bonus = item.ac_bonus !== undefined ? item.ac_bonus : (item.bonus || 0);
                const maxDex = item.max_dex !== undefined ? item.max_dex : 99;
                const acp = item.acp !== undefined ? item.acp : 0;
                if (e.target.id === 'in-armor-name') {
                    document.getElementById('in-ac-armor').value = bonus;
                    document.getElementById('in-ac-armor').setAttribute('data-max-dex', maxDex);
                    document.getElementById('in-ac-armor').setAttribute('data-acp', acp);
                } else {
                    document.getElementById('in-ac-shield').value = bonus;
                    document.getElementById('in-ac-shield').setAttribute('data-acp', acp);
                }
                updatePreview();
            }
        }
    }
    document.getElementById('in-armor-name')?.addEventListener('change', handleArmorShieldChange);
    document.getElementById('in-shield-name')?.addEventListener('change', handleArmorShieldChange);


    // Add Gear Event Listeners
    function updateGearDisplay() {
        const armorName = document.getElementById('in-armor-name')?.value.trim();
        const shieldName = document.getElementById('in-shield-name')?.value.trim();
        const gearArr = [];
        if (armorName) {
            gearArr.push(`<a href="#" class="interactive-gear" onclick="if(window.showInfoModal) window.showInfoModal('${armorName.replace(/'/g, "\\'")}', '', 'Armor'); return false;" style="color: inherit; text-decoration: underline dotted;">${armorName}</a>`);
        }
        if (shieldName) {
            gearArr.push(`<a href="#" class="interactive-gear" onclick="if(window.showInfoModal) window.showInfoModal('${shieldName.replace(/'/g, "\\'")}', '', 'Shield'); return false;" style="color: inherit; text-decoration: underline dotted;">${shieldName}</a>`);
        }
        
        const wrapGear = document.getElementById('wrap-gear');
        const outGear = document.getElementById('out-gear');
        if (wrapGear && outGear) {
            if (gearArr.length > 0) {
                outGear.innerHTML = gearArr.join(', ');
                wrapGear.style.display = 'block';
            } else {
                wrapGear.style.display = 'none';
            }
        }
    }

    document.getElementById('in-armor-name')?.addEventListener('input', updateGearDisplay);
    document.getElementById('in-armor-name')?.addEventListener('change', updateGearDisplay);
    document.getElementById('in-shield-name')?.addEventListener('input', updateGearDisplay);
    document.getElementById('in-shield-name')?.addEventListener('change', updateGearDisplay);
    
    // Also attach it to updatePreview so it runs on load
    const oldUpdatePreview = window.updatePreview;
    window.updatePreview = function() {
        if (oldUpdatePreview) oldUpdatePreview();
        updateGearDisplay();
    };

});