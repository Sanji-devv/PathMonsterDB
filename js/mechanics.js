window.applyMechanics = function() {
    // 1. Spells Integration
    const wrapSpells = document.getElementById('wrap-spells');
    const outSpellsList = document.getElementById('out-spells-list');

    if (window.CharacterState && window.CharacterState.spells.length > 0) {
        wrapSpells.style.display = 'block';
        
        const spellsByLevel = {};
        window.CharacterState.spells.forEach(spell => {
            const match = spell.spell_level.match(/\d+/);
            const levelNum = match ? parseInt(match[0]) : 0;
            
            if (!spellsByLevel[levelNum]) spellsByLevel[levelNum] = [];
            spellsByLevel[levelNum].push(spell);
        });

        let html = '';
        Object.keys(spellsByLevel).sort((a,b) => a-b).forEach(lvl => {
            const spells = spellsByLevel[lvl].map(s => {
                const safeName = (s.name || '').replace(/'/g, "\\'");
                const safeDesc = (s.description || 'Description not available.').replace(/"/g, '&quot;').replace(/'/g, "\\'").replace(/\n/g, '<br>');
                const titleStr = [s.school, s.casting_time].filter(Boolean).join(', ');
                return `<a href="#" onclick="if(window.showInfoModal) window.showInfoModal('${safeName}', '${safeDesc}', 'Spell'); return false;" style="color: inherit; text-decoration: underline dotted;" title="${titleStr}">${s.name}</a>`;
            }).join(', ');
            const label = lvl === '0' ? '0 (at will)' : `${lvl}th`;
            html += `<div class="pf-property-line" style="padding-left: 10px; text-indent: -10px;">
                        <span class="pf-label">${label}</span> - ${spells}
                     </div>`;
        });
        outSpellsList.innerHTML = html;
    } else if (wrapSpells) {
        wrapSpells.style.display = 'none';
    }

    // 2. Class Modifiers (BAB, Saves, HP)
    let classBab = 0, classFort = 0, classRef = 0, classWill = 0, classHp = 0;
    if (window.activeClasses) {
        window.activeClasses.forEach(c => {
            classBab += parseInt(c.bab) || 0;
            classFort += parseInt(c.fort) || 0;
            classRef += parseInt(c.ref) || 0;
            classWill += parseInt(c.will) || 0;
            classHp += (parseInt(c.hd) || 0) * parseInt(c.level);
        });
    }

    // 3. Ability Scores & Modifiers
    const getMod = val => Math.floor((val - 10) / 2);
    let str = parseInt(document.getElementById('in-str')?.value) || 10;
    let dex = parseInt(document.getElementById('in-dex')?.value) || 10;
    let con = parseInt(document.getElementById('in-con')?.value) || 10;
    let wis = parseInt(document.getElementById('in-wis')?.value) || 10;

    // Apply Wondrous Items / Gear bonuses (e.g., Belt of Giant Strength)
    if (window.CharacterState && window.CharacterState.inventory && window.CharacterState.inventory.wondrous) {
        window.CharacterState.inventory.wondrous.forEach(item => {
            const itemName = typeof item === 'object' && item !== null ? (item.name || '') : String(item || '');
            if (itemName.includes("Belt of Giant Strength +2")) str += 2;
            if (itemName.includes("Belt of Giant Strength +4")) str += 4;
            if (itemName.includes("Belt of Giant Strength +6")) str += 6;
            if (itemName.includes("Belt of Incredible Dexterity +2")) dex += 2;
            // Add more as needed
        });
    }

    // Helper to format signed numbers
    const fmt = n => (n >= 0 ? '+' : '') + n;

    // 4. Update Saves
    const baseFortIn = document.getElementById('in-fort')?.value || "0";
    const baseRefIn = document.getElementById('in-ref')?.value || "0";
    const baseWillIn = document.getElementById('in-will')?.value || "0";
    
    // Attempt to extract the leading number from user input
    const parseSave = str => {
        const m = String(str).match(/^([+-]?\d+)/);
        return m ? parseInt(m[1]) : 0;
    };

    const outFort = document.getElementById('out-fort');
    const outRef = document.getElementById('out-ref');
    const outWill = document.getElementById('out-will');
    const outHp = document.getElementById('out-hp');

    if (outFort) outFort.textContent = fmt(parseSave(baseFortIn) + classFort);
    if (outRef) outRef.textContent = fmt(parseSave(baseRefIn) + classRef);
    if (outWill) outWill.textContent = fmt(parseSave(baseWillIn) + classWill);

    // HP Calculation (Base + Class HP)
    if (outHp && classHp > 0) {
        if (!outHp.dataset.baseHp) {
            const rawText = outHp.textContent || "0";
            const match = rawText.match(/^(\d+)/);
            outHp.dataset.baseHp = match ? match[1] : "0";
        }
        const bHp = parseInt(outHp.dataset.baseHp) || 0;
        outHp.innerHTML = `${bHp + classHp} <span class="pf-small-text">(${bHp} + ${classHp} class HP)</span>`;
    }

    // 5. Update BAB, CMB, CMD
    const baseCmbIn = document.getElementById('in-cmb')?.value || "0";
    const baseCmdIn = document.getElementById('in-cmd')?.value || "10";
    
    const outCmb = document.getElementById('out-cmb');
    const outCmd = document.getElementById('out-cmd');
    
    if (outCmb && baseCmbIn) outCmb.textContent = fmt(parseSave(baseCmbIn));
    if (outCmd && baseCmdIn) outCmd.textContent = parseSave(baseCmdIn).toString();

};
