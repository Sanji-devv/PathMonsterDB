window.applyMechanics = function() {
    // 1. Spells Integration (from CharacterState if any)
    const wrapSpells = document.getElementById('wrap-spells');
    const outSpellsList = document.getElementById('out-spells-list');

    if (window.CharacterState && Array.isArray(window.CharacterState.spells) && window.CharacterState.spells.length > 0) {
        if (wrapSpells) wrapSpells.style.display = 'block';
        
        const spellClassEl = document.getElementById('in-spell-class');
        const currentClass = spellClassEl ? spellClassEl.value.toLowerCase().trim() : '';

        const spellsByLevel = {};
        window.CharacterState.spells.forEach(spell => {
            if (!spell) return;
            let spellObj = spell;
            if (typeof spell === 'string') {
                spellObj = { name: spell, spell_level: '0', description: '' };
            }
            const spellLevelStr = String(spellObj.spell_level || '0');
            
            let levelNum = null;
            if (currentClass) {
                const classRegex = new RegExp(`(?:${currentClass}|sorcerer/wizard|cleric/oracle)[^\\d]*(\\d+)`, 'i');
                const classMatch = spellLevelStr.match(classRegex);
                if (classMatch) {
                    levelNum = parseInt(classMatch[1]);
                }
            }
            if (levelNum === null) {
                const match = spellLevelStr.match(/\d+/);
                levelNum = match ? parseInt(match[0]) : 0;
            }
            
            if (!spellsByLevel[levelNum]) spellsByLevel[levelNum] = [];
            spellsByLevel[levelNum].push(spellObj);
        });

        if (outSpellsList) {
            let html = '';
            // Pathfinder standard: descending order by spell level (highest first)
            Object.keys(spellsByLevel).map(Number).sort((a, b) => b - a).forEach(lvl => {
                const spells = spellsByLevel[lvl].map(s => {
                    const safeName = String(s.name || '').replace(/'/g, "\\'");
                    const safeDesc = String(s.description || s.short_description || 'Description not available.').replace(/"/g, '&quot;').replace(/'/g, "\\'").replace(/\n/g, '<br>');
                    const titleStr = [s.school, s.spell_level].filter(Boolean).join(', ');
                    return `<i><a href="#" onclick="if(window.showInfoModal) window.showInfoModal('${safeName}', '${safeDesc}', 'Spell'); return false;" style="color: inherit; text-decoration: underline dotted;" title="${titleStr}">${s.name || ''}</a></i>`;
                }).join(', ');
                
                let label = '0 (at will)';
                if (lvl === 1) label = '1st';
                else if (lvl === 2) label = '2nd';
                else if (lvl === 3) label = '3rd';
                else if (lvl > 3) label = `${lvl}th`;
                
                html += `<div class="pf-property-line special-ability">
                            <span class="pf-label">${label}</span>—${spells}
                         </div>`;
            });
            outSpellsList.innerHTML = html;
        }
    }
};

