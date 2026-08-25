document.addEventListener('DOMContentLoaded', () => {
    let allArmor = [];
    let allWeapons = [];
    let allMagicItems = [];
    
    // Inject datalists into the DOM if they don't exist
    if (!document.getElementById('armor-list')) {
        document.body.insertAdjacentHTML('beforeend', `
            <datalist id="armor-list"></datalist>
            <datalist id="shield-list"></datalist>
            <datalist id="weapon-list"></datalist>
            <datalist id="melee-weapons-list"></datalist>
            <datalist id="ranged-weapons-list"></datalist>
            <datalist id="magic-items-list"></datalist>
        `);
    }

    const armorList = document.getElementById('armor-list');
    const shieldList = document.getElementById('shield-list');
    const weaponList = document.getElementById('weapon-list');
    const meleeList = document.getElementById('melee-weapons-list');
    const rangedList = document.getElementById('ranged-weapons-list');
    const magicItemsList = document.getElementById('magic-items-list');

    // 1. Fetch Armor
    fetch('/data/armor.json')
        .then(res => res.json())
        .then(data => {
            allArmor = data;
            window.allArmorsDB = data;
            if (armorList) armorList.innerHTML = '';
            if (shieldList) shieldList.innerHTML = '';
            data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.name;
                
                if (item.type === 'Shield') {
                    if (shieldList) shieldList.appendChild(opt);
                } else {
                    if (armorList) armorList.appendChild(opt);
                }
            });
        })
        .catch(err => console.error("Error loading armor.json", err));

    // 2. Fetch Weapons
    fetch('/data/weapons.json')
        .then(res => res.json())
        .then(data => {
            allWeapons = data;
            window.allWeaponsDB = data;
            if (weaponList) weaponList.innerHTML = '';
            if (meleeList) meleeList.innerHTML = '';
            if (rangedList) rangedList.innerHTML = '';
            data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.name;
                if (weaponList) weaponList.appendChild(opt.cloneNode(true));
                
                if (item.type === 'Ranged') {
                    if (rangedList) rangedList.appendChild(opt.cloneNode(true));
                } else {
                    if (meleeList) meleeList.appendChild(opt.cloneNode(true));
                }
            });
        })
        .catch(err => console.error("Error loading weapons.json", err));

    // 3. Fetch Magic Items
    fetch('/data/magic_items.json')
        .then(res => res.json())
        .then(data => {
            allMagicItems = data;
            window.allMagicItemsDB = data;
            if (magicItemsList) magicItemsList.innerHTML = '';
            data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.name;
                if (item.slot) {
                    opt.label = `[${item.slot}] ${item.description ? item.description.substring(0, 50) + '...' : ''}`;
                }
                if (magicItemsList) magicItemsList.appendChild(opt);
            });
        })
        .catch(err => console.error("Error loading magic_items.json", err));

    // Handle Armor Auto-fill
    const inArmorName = document.getElementById('in-armor-name');
    const inAcArmor = document.getElementById('in-ac-armor');
    if (inArmorName && inAcArmor) {
        inArmorName.addEventListener('change', (e) => {
            const val = (e.target.value || '').trim().toLowerCase();
            const match = allArmor.find(a => a.name.toLowerCase() === val && a.type !== 'Shield');
            if (match) {
                const bonus = match.ac_bonus !== undefined ? match.ac_bonus : (match.bonus || 0);
                inAcArmor.value = bonus;
                inAcArmor.setAttribute('data-max-dex', match.max_dex !== undefined ? match.max_dex : 99);
                inAcArmor.setAttribute('data-acp', match.acp !== undefined ? match.acp : 0);
                if (window.CharacterState) {
                    window.CharacterState.inventory.armor = [match];
                    window.CharacterState.notifyUpdate();
                }
            }
        });
    }

    const inShieldName = document.getElementById('in-shield-name');
    const inAcShield = document.getElementById('in-ac-shield');
    if (inShieldName && inAcShield) {
        inShieldName.addEventListener('change', (e) => {
            const val = (e.target.value || '').trim().toLowerCase();
            const match = allArmor.find(a => a.name.toLowerCase() === val && a.type === 'Shield');
            if (match) {
                const bonus = match.ac_bonus !== undefined ? match.ac_bonus : (match.bonus || 0);
                inAcShield.value = bonus;
                inAcShield.setAttribute('data-acp', match.acp !== undefined ? match.acp : 0);
                if (window.CharacterState && typeof window.CharacterState.addGear === 'function') {
                    window.CharacterState.addGear(match, 'armor');
                }
            }
        });
    }

    // ----------------------------------------------------
    // MAGIC ITEMS & EQUIPMENT MANAGEMENT
    // ----------------------------------------------------
    const inMagicSearch = document.getElementById('in-magic-item-search');
    const btnAddMagic = document.getElementById('btn-add-magic-item');
    const equippedContainer = document.getElementById('equipped-magic-items-container');

    function equipItemByName(itemName) {
        if (!itemName) return;
        const cleanName = itemName.trim();
        if (!cleanName) return;

        let itemObj = (window.allMagicItemsDB || []).find(i => i.name.toLowerCase() === cleanName.toLowerCase());
        
        if (!itemObj) {
            // Dynamic/Custom item parser if not in DB
            let slot = 'Wondrous';
            let modifiers = {};
            const lower = cleanName.toLowerCase();
            
            if (lower.includes('amulet of natural armor')) {
                slot = 'Neck';
                const m = lower.match(/\+(\d+)/);
                if (m) modifiers.ac_natural = parseInt(m[1]);
            } else if (lower.includes('ring of protection')) {
                slot = 'Ring';
                const m = lower.match(/\+(\d+)/);
                if (m) modifiers.ac_deflection = parseInt(m[1]);
            } else if (lower.includes('cloak of resistance')) {
                slot = 'Shoulders';
                const m = lower.match(/\+(\d+)/);
                if (m) modifiers.saves_resistance = parseInt(m[1]);
            } else if (lower.includes('belt of giant strength')) {
                slot = 'Belt';
                const m = lower.match(/\+(\d+)/);
                if (m) modifiers.str = parseInt(m[1]);
            } else if (lower.includes('belt of incredible dexterity')) {
                slot = 'Belt';
                const m = lower.match(/\+(\d+)/);
                if (m) modifiers.dex = parseInt(m[1]);
            } else if (lower.includes('belt of mighty constitution')) {
                slot = 'Belt';
                const m = lower.match(/\+(\d+)/);
                if (m) modifiers.con = parseInt(m[1]);
            } else if (lower.includes('headband of vast intelligence')) {
                slot = 'Headband';
                const m = lower.match(/\+(\d+)/);
                if (m) modifiers.int = parseInt(m[1]);
            } else if (lower.includes('headband of inspired wisdom')) {
                slot = 'Headband';
                const m = lower.match(/\+(\d+)/);
                if (m) modifiers.wis = parseInt(m[1]);
            } else if (lower.includes('headband of alluring charisma')) {
                slot = 'Headband';
                const m = lower.match(/\+(\d+)/);
                if (m) modifiers.cha = parseInt(m[1]);
            } else if (lower.includes('belt of physical perfection')) {
                slot = 'Belt';
                const m = lower.match(/\+(\d+)/);
                if (m) {
                    const val = parseInt(m[1]);
                    modifiers.str = val;
                    modifiers.dex = val;
                    modifiers.con = val;
                }
            } else if (lower.includes('belt of physical might')) {
                slot = 'Belt';
                const m = lower.match(/\+(\d+)/);
                if (m) {
                    const val = parseInt(m[1]);
                    modifiers.str = val;
                    modifiers.con = val;
                }
            } else if (lower.includes('headband of mental superiority')) {
                slot = 'Headband';
                const m = lower.match(/\+(\d+)/);
                if (m) {
                    const val = parseInt(m[1]);
                    modifiers.int = val;
                    modifiers.wis = val;
                    modifiers.cha = val;
                }
            } else if (lower.includes('headband of mental prowess')) {
                slot = 'Headband';
                const m = lower.match(/\+(\d+)/);
                if (m) {
                    const val = parseInt(m[1]);
                    modifiers.int = val;
                    modifiers.wis = val;
                }
            } else if (lower.includes('bracers of armor')) {
                slot = 'Wrists';
                const m = lower.match(/\+(\d+)/);
                if (m) modifiers.ac_armor = parseInt(m[1]);
            }

            itemObj = {
                name: cleanName,
                slot: slot,
                modifiers: modifiers,
                description: `Magic item: ${cleanName}`
            };
        }

        if (window.CharacterState && typeof window.CharacterState.equipMagicItem === 'function') {
            window.CharacterState.equipMagicItem(itemObj);
        }

        // Sync quick dropdowns if applicable
        syncQuickSelects();
    }

    function renderEquippedMagicItems() {
        if (!equippedContainer) return;
        equippedContainer.innerHTML = '';

        const magicItems = (window.CharacterState && Array.isArray(window.CharacterState.inventory.magicItems))
            ? window.CharacterState.inventory.magicItems
            : [];

        if (magicItems.length === 0) {
            equippedContainer.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; padding: 4px;">No magic items currently equipped.</div>`;
            return;
        }

        magicItems.forEach(item => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.gap = '8px';
            row.style.padding = '6px 10px';
            row.style.background = 'rgba(30, 41, 59, 0.7)';
            row.style.border = '1px solid rgba(99, 102, 241, 0.3)';
            row.style.borderRadius = '6px';

            // Left side info
            const leftDiv = document.createElement('div');
            leftDiv.style.display = 'flex';
            leftDiv.style.alignItems = 'center';
            leftDiv.style.gap = '8px';
            leftDiv.style.flex = '1';

            const slotBadge = document.createElement('span');
            slotBadge.style.fontSize = '0.75rem';
            slotBadge.style.padding = '2px 6px';
            slotBadge.style.borderRadius = '4px';
            slotBadge.style.background = '#312e81';
            slotBadge.style.color = '#c7d2fe';
            slotBadge.style.fontWeight = 'bold';
            slotBadge.textContent = item.slot || 'Wondrous';

            const nameSpan = document.createElement('span');
            nameSpan.style.fontWeight = '600';
            nameSpan.style.fontSize = '0.9rem';
            nameSpan.style.color = '#f8fafc';
            nameSpan.textContent = item.name;

            // Modifiers badge
            let modDetails = [];
            if (item.modifiers) {
                if (item.modifiers.ac_natural) modDetails.push(`+${item.modifiers.ac_natural} Nat AC`);
                if (item.modifiers.ac_deflection) modDetails.push(`+${item.modifiers.ac_deflection} Deflection`);
                if (item.modifiers.saves_resistance) modDetails.push(`+${item.modifiers.saves_resistance} Saves`);
                if (item.modifiers.str) modDetails.push(`+${item.modifiers.str} Str`);
                if (item.modifiers.dex) modDetails.push(`+${item.modifiers.dex} Dex`);
                if (item.modifiers.con) modDetails.push(`+${item.modifiers.con} Con`);
                if (item.modifiers.int) modDetails.push(`+${item.modifiers.int} Int`);
                if (item.modifiers.wis) modDetails.push(`+${item.modifiers.wis} Wis`);
                if (item.modifiers.cha) modDetails.push(`+${item.modifiers.cha} Cha`);
                if (item.modifiers.ac_armor) modDetails.push(`+${item.modifiers.ac_armor} Armor AC`);
            }

            leftDiv.appendChild(slotBadge);
            leftDiv.appendChild(nameSpan);

            if (modDetails.length > 0) {
                const modSpan = document.createElement('span');
                modSpan.style.fontSize = '0.75rem';
                modSpan.style.color = '#86efac';
                modSpan.style.background = 'rgba(22, 101, 52, 0.4)';
                modSpan.style.padding = '2px 6px';
                modSpan.style.borderRadius = '4px';
                modSpan.textContent = modDetails.join(', ');
                leftDiv.appendChild(modSpan);
            }

            // Right side buttons
            const rightDiv = document.createElement('div');
            rightDiv.style.display = 'flex';
            rightDiv.style.alignItems = 'center';
            rightDiv.style.gap = '6px';

            const infoBtn = document.createElement('button');
            infoBtn.type = 'button';
            infoBtn.title = 'View Item Details';
            infoBtn.style.background = 'transparent';
            infoBtn.style.border = 'none';
            infoBtn.style.color = '#38bdf8';
            infoBtn.style.cursor = 'pointer';
            infoBtn.style.fontSize = '0.95rem';
            infoBtn.innerHTML = 'ℹ️';
            infoBtn.addEventListener('click', () => {
                if (window.showInfoModal) {
                    window.showInfoModal(item.name, item.description || 'Magic item description not available.', item.slot || 'Magic Item');
                }
            });

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.title = 'Unequip Item';
            removeBtn.style.background = '#ef4444';
            removeBtn.style.color = 'white';
            removeBtn.style.border = 'none';
            removeBtn.style.borderRadius = '4px';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.padding = '2px 7px';
            removeBtn.style.fontWeight = 'bold';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', () => {
                if (window.CharacterState && typeof window.CharacterState.unequipMagicItem === 'function') {
                    window.CharacterState.unequipMagicItem(item.name);
                    syncQuickSelects();
                }
            });

            rightDiv.appendChild(infoBtn);
            rightDiv.appendChild(removeBtn);

            row.appendChild(leftDiv);
            row.appendChild(rightDiv);
            equippedContainer.appendChild(row);
        });
    }

    window.renderEquippedMagicItems = renderEquippedMagicItems;

    function syncQuickSelects() {
        const magicItems = (window.CharacterState && Array.isArray(window.CharacterState.inventory.magicItems))
            ? window.CharacterState.inventory.magicItems
            : [];

        const neckItem = magicItems.find(i => i.slot === 'Neck' || i.name.toLowerCase().includes('amulet of natural armor'));
        const ringItem = magicItems.find(i => i.slot === 'Ring' || i.name.toLowerCase().includes('ring of protection'));
        const cloakItem = magicItems.find(i => i.slot === 'Shoulders' || i.name.toLowerCase().includes('cloak of resistance'));
        const beltItem = magicItems.find(i => i.slot === 'Belt' || i.name.toLowerCase().includes('belt of '));
        const headbandItem = magicItems.find(i => i.slot === 'Headband' || i.name.toLowerCase().includes('headband of '));
        const wristsItem = magicItems.find(i => i.slot === 'Wrists' || i.name.toLowerCase().includes('bracers of armor'));

        const setVal = (id, item) => {
            const el = document.getElementById(id);
            if (el) el.value = item ? item.name : '';
        };

        setVal('select-quick-amulet', neckItem);
        setVal('select-quick-ring1', ringItem);
        setVal('select-quick-cloak', cloakItem);
        setVal('select-quick-belt', beltItem);
        setVal('select-quick-headband', headbandItem);
        setVal('select-quick-wrists', wristsItem);
    }

    // Attach Event Listeners to Quick Select Dropdowns
    const quickSelectIds = [
        'select-quick-amulet',
        'select-quick-ring1',
        'select-quick-cloak',
        'select-quick-belt',
        'select-quick-headband',
        'select-quick-wrists'
    ];

    quickSelectIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', (e) => {
                const val = e.target.value;
                if (val) {
                    equipItemByName(val);
                } else {
                    // Unequip items matching this dropdown category
                    if (window.CharacterState && Array.isArray(window.CharacterState.inventory.magicItems)) {
                        let slotToRemove = '';
                        if (id === 'select-quick-amulet') slotToRemove = 'Neck';
                        else if (id === 'select-quick-ring1') slotToRemove = 'Ring';
                        else if (id === 'select-quick-cloak') slotToRemove = 'Shoulders';
                        else if (id === 'select-quick-belt') slotToRemove = 'Belt';
                        else if (id === 'select-quick-headband') slotToRemove = 'Headband';
                        else if (id === 'select-quick-wrists') slotToRemove = 'Wrists';

                        if (slotToRemove) {
                            window.CharacterState.inventory.magicItems = window.CharacterState.inventory.magicItems.filter(i => (i.slot || '') !== slotToRemove);
                            window.CharacterState.notifyUpdate();
                            syncQuickSelects();
                        }
                    }
                }
            });
        }
    });

    if (btnAddMagic && inMagicSearch) {
        btnAddMagic.addEventListener('click', () => {
            const val = inMagicSearch.value;
            if (val) {
                equipItemByName(val);
                inMagicSearch.value = '';
            }
        });

        inMagicSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                btnAddMagic.click();
            }
        });
    }

    // Initial render & global exports
    window.renderEquippedMagicItems = renderEquippedMagicItems;
    window.equipMagicItemByName = equipItemByName;
    renderEquippedMagicItems();
});
