document.addEventListener('DOMContentLoaded', () => {
    let allSpells = [];
    const searchInput = document.getElementById('in-spell-search');
    const autocompleteList = document.getElementById('spell-autocomplete');
    const activeSpellsContainer = document.getElementById('active-spells-container');

    if (!searchInput) return;

    // Fetch spells
    fetch('/data/spells.json')
        .then(res => res.json())
        .then(data => {
            allSpells = data;
            console.log(`Loaded ${allSpells.length} spells.`);
        })
        .catch(err => console.error("Error loading spells:", err));

    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        autocompleteList.innerHTML = '';
        if (!val) {
            autocompleteList.style.display = 'none';
            return;
        }

        const matches = allSpells.filter(s => s.name.toLowerCase().includes(val)).slice(0, 15);
        
        if (matches.length > 0) {
            autocompleteList.style.display = 'block';
            matches.forEach(spell => {
                const li = document.createElement('li');
                li.style.padding = '8px';
                li.style.cursor = 'pointer';
                li.style.borderBottom = '1px solid #444';
                li.innerHTML = `<strong>${spell.name}</strong> <small style="color:#aaa;">(${spell.school})</small>`;
                
                li.addEventListener('mousedown', () => {
                    addSpellToState(spell);
                    searchInput.value = '';
                    autocompleteList.style.display = 'none';
                });
                autocompleteList.appendChild(li);
            });
        } else {
            autocompleteList.style.display = 'none';
        }
    });

    searchInput.addEventListener('blur', () => {
        setTimeout(() => autocompleteList.style.display = 'none', 150);
    });

    function addSpellToState(spell) {
        if (!window.CharacterState.spells.find(s => s.name === spell.name)) {
            window.CharacterState.spells.push(spell);
            renderActiveSpells();
            window.CharacterState.notifyUpdate();
        }
    }

    function renderActiveSpells() {
        activeSpellsContainer.innerHTML = '';
        window.CharacterState.spells.forEach(spell => {
            const tag = document.createElement('div');
            tag.className = 'spell-tag';
            tag.style.background = '#2b4d6b';
            tag.style.border = '1px solid #4db8ff';
            tag.style.borderRadius = '4px';
            tag.style.padding = '4px 8px';
            tag.style.display = 'flex';
            tag.style.alignItems = 'center';
            tag.style.gap = '5px';
            tag.style.cursor = 'pointer';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = spell.name;
            nameSpan.title = "Click for details";
            
            // Pop up the Info Modal
            nameSpan.addEventListener('click', () => {
                if (window.showInfoModal) {
                    window.showInfoModal(spell.name, spell.description || "Description not available.", "Spell");
                }
            });

            const removeBtn = document.createElement('span');
            removeBtn.innerHTML = '&times;';
            removeBtn.style.color = '#ff6b6b';
            removeBtn.style.fontWeight = 'bold';
            removeBtn.style.padding = '0 2px';
            removeBtn.title = "Remove";
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.CharacterState.spells = window.CharacterState.spells.filter(s => s.name !== spell.name);
                renderActiveSpells();
                window.CharacterState.notifyUpdate();
            });

            tag.appendChild(nameSpan);
            tag.appendChild(removeBtn);
            activeSpellsContainer.appendChild(tag);
        });
    }
});
