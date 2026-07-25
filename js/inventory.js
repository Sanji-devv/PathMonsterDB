document.addEventListener('DOMContentLoaded', () => {
    let allArmor = [];
    
    // Inject datalists into the DOM if they don't exist
    document.body.insertAdjacentHTML('beforeend', `
        <datalist id="armor-list"></datalist>
        <datalist id="shield-list"></datalist>
        <datalist id="weapon-list"></datalist>
    `);

    const armorList = document.getElementById('armor-list');
    const shieldList = document.getElementById('shield-list');
    const weaponList = document.getElementById('weapon-list');

    // Fetch Armor
    fetch('/data/armor.json')
        .then(res => res.json())
        .then(data => {
            allArmor = data;
            data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.name;
                
                if (item.is_shield) {
                    shieldList.appendChild(opt);
                } else {
                    armorList.appendChild(opt);
                }
            });
        })
        .catch(err => console.error("Error loading armor.json", err));

    // Fetch Weapons
    fetch('/data/weapons.json')
        .then(res => res.json())
        .then(data => {
            data.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.name;
                weaponList.appendChild(opt);
            });
        })
        .catch(err => console.error("Error loading weapons.json", err));

    // Handle Armor Auto-fill
    const inArmorName = document.getElementById('in-armor-name');
    const inAcArmor = document.getElementById('in-ac-armor');
    if (inArmorName) {
        inArmorName.addEventListener('change', (e) => {
            const val = e.target.value;
            const match = allArmor.find(a => a.name.toLowerCase() === val.toLowerCase());
            if (match) {
                inAcArmor.value = match.bonus;
                // Add to central state
                window.CharacterState.inventory.armor = [match];
                window.CharacterState.notifyUpdate();
            }
        });
    }

    const inShieldName = document.getElementById('in-shield-name');
    const inAcShield = document.getElementById('in-ac-shield');
    if (inShieldName) {
        inShieldName.addEventListener('change', (e) => {
            const val = e.target.value;
            const match = allArmor.find(a => a.name.toLowerCase() === val.toLowerCase());
            if (match) {
                inAcShield.value = match.bonus;
                window.CharacterState.inventory.armor.push(match); // Shield counts as armor entry
                window.CharacterState.notifyUpdate();
            }
        });
    }

});
