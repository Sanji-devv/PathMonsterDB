document.addEventListener('DOMContentLoaded', () => {
    let currentPage = 1;
    let maxPage = 1;
    const itemsPerPage = 50;

    // Elements
    const mainList = document.getElementById('main-list');
    const filterName = document.getElementById('filter-name');
    const filterCr = document.getElementById('filter-cr');
    const filterType = document.getElementById('filter-type');
    const filterAlignment = document.getElementById('filter-alignment');
    const filterEnvironment = document.getElementById('filter-environment');
    const filterCategory = document.getElementById('filter-category');
    const filterSort = document.getElementById('filter-sort');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const pageInfo = document.getElementById('page-info');

    // Populate CR Filter Options
    const crs = ["1/8", "1/6", "1/4", "1/3", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"];
    crs.forEach(cr => {
        let opt = document.createElement('option');
        opt.value = cr;
        opt.textContent = `CR ${cr}`;
        filterCr.appendChild(opt);
    });

    function loadData() {
        const nameVal = encodeURIComponent(filterName.value);
        const crVal = encodeURIComponent(filterCr.value);
        const typeVal = encodeURIComponent(filterType.value);
        const alignVal = encodeURIComponent(filterAlignment.value);
        const envVal = encodeURIComponent(filterEnvironment.value);
        const catVal = encodeURIComponent(filterCategory.value);
        const sortVal = encodeURIComponent(filterSort.value);

        mainList.innerHTML = `<div style="text-align: center; color: #aaa; padding: 20px;">Loading database...</div>`;

        fetch(`/api/search?name=${nameVal}&cr=${crVal}&type=${typeVal}&alignment=${alignVal}&environment=${envVal}&category=${catVal}&sort=${sortVal}&page=${currentPage}&per_page=${itemsPerPage}`)
            .then(r => r.json())
            .then(res => {
                renderList(res.data, res.total_count, res.page, res.per_page);
            })
            .catch(err => {
                mainList.innerHTML = `<div style="color: red; text-align: center;">Error loading database: ${err.message}</div>`;
            });
    }

    // Filters
    function applyFilters() {
        currentPage = 1;
        loadData();
    }

    let searchTimeout;
    function applyFiltersDebounced() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyFilters();
        }, 300);
    }

    filterName.addEventListener('input', applyFiltersDebounced);
    filterCr.addEventListener('change', applyFilters);
    filterType.addEventListener('change', applyFilters);
    filterAlignment.addEventListener('change', applyFilters);
    filterEnvironment.addEventListener('change', applyFilters);
    filterCategory.addEventListener('change', applyFilters);
    filterSort.addEventListener('change', applyFilters);

    // Pagination
    btnPrev.addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; loadData(); }
    });
    btnNext.addEventListener('click', () => {
        if (currentPage < maxPage) { currentPage++; loadData(); }
    });

    // Render Main List
    function renderList(pageData, totalCount, page, perPage) {
        mainList.innerHTML = '';
        maxPage = Math.ceil(totalCount / perPage) || 1;
        pageInfo.textContent = `Page ${page} of ${maxPage} (${totalCount} total)`;

        btnPrev.disabled = page === 1;
        btnNext.disabled = page === maxPage;

        if (pageData.length === 0) {
            mainList.innerHTML = `<div style="text-align: center; color: #aaa; padding: 20px;">No monsters found.</div>`;
            return;
        }

        pageData.forEach(m => {
            const card = document.createElement('div');
            card.className = 'monster-card';

            const isOriginal = !m.IsUserCustom;
            if (!isOriginal) {
                card.style.background = 'rgba(234, 179, 8, 0.15)';
                card.style.borderColor = 'rgba(234, 179, 8, 0.4)';
            }

            let badges = '';
            if (!isOriginal) {
                badges += `<span style="background: #eab308; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 5px; font-weight: bold;">CUSTOM</span>`;
            }
            if (m.CharacterFlag === "1") {
                badges += `<span style="background: var(--sb-red); color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 5px; font-weight: bold;">NPC</span>`;
            }

            let actionsHtml = '';
            let starBtnHtml = `<button class="star-btn ${m.IsFavorite ? 'active' : ''}" title="Toggle Favorite">⭐</button>`;

            if (isOriginal) {
                actionsHtml = `
                    ${starBtnHtml}
                    <button class="btn btn-load" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4); transition: transform 0.1s, box-shadow 0.1s; display: flex; align-items: center; gap: 6px;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 8px -1px rgba(16, 185, 129, 0.5)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 6px -1px rgba(16, 185, 129, 0.4)';">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Load to Editor
                </button>`;
            } else {
                actionsHtml = `
                    ${starBtnHtml}
                    <button class="btn btn-load-custom" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.4); transition: transform 0.1s, box-shadow 0.1s; display: flex; align-items: center; gap: 6px;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 8px -1px rgba(59, 130, 246, 0.5)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 6px -1px rgba(59, 130, 246, 0.4)';">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Load Custom
                    </button>
                    <button class="btn btn-delete-custom" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.25)';" onmouseout="this.style.background='rgba(239, 68, 68, 0.15)';">Delete</button>
                `;
            }

            card.innerHTML = `
                <div class="monster-info">
                    <h3>${m.Name} ${badges}</h3>
                    <p>CR: ${m.CR} | Type: ${m.Type} | Alignment: ${m.Alignment} | Size: ${m.Size}</p>
                </div>
                <div class="monster-actions">
                    ${actionsHtml}
                </div>
            `;

            if (isOriginal) {
                card.querySelector('.btn-load').addEventListener('click', () => loadToEditor(m));
            } else {
                card.querySelector('.btn-load-custom').addEventListener('click', () => {
                    if (m.OriginalState) {
                        localStorage.setItem('pf_monster_creator_save', JSON.stringify(m.OriginalState));
                        window.location.href = 'index.html';
                    } else {
                        loadToEditor(m);
                    }
                });

                card.querySelector('.btn-delete-custom').addEventListener('click', () => {
                    if (confirm(`Delete "${m.Name}"?`)) {
                        fetch(`/api/delete/${m._global_index}`, { method: 'DELETE' })
                            .then(r => r.json())
                            .then(() => loadData())
                            .catch(err => alert('Delete failed: ' + err.message));
                    }
                });
            }

            card.querySelector('.star-btn').addEventListener('click', (e) => {
                const btn = e.currentTarget;
                fetch(`/api/favorite/${m._global_index}`, { method: 'POST' })
                    .then(r => r.json())
                    .then(data => {
                        if (data.status === 'success') {
                            btn.classList.toggle('active', data.is_favorite);
                            // If we are filtering by favorites, we might want to reload to hide it, 
                            // but letting it stay unstarred until refresh is better UX.
                        }
                    })
                    .catch(err => console.error('Failed to toggle favorite:', err));
            });

            mainList.appendChild(card);
        });
    }

    loadData();

    // Mapping Function (Database Row -> Our Form State)
    function loadToEditor(m) {
        // Create an empty state object matching our structure
        const state = {
            basic: {},
            html: {},
            dynamic: {
                subtypes: [], senses: [], skills: [], slas: [], abilities: [], melee: [], ranged: []
            }
        };

        // Name, CR, XP
        state.basic['in-name'] = m.Name || '';
        state.basic['in-cr'] = m.CR || '';
        state.basic['in-xp'] = m.XP || '';

        // Alignment, Size, Type
        state.basic['in-alignment'] = m.Alignment || '';
        state.basic['in-size'] = m.Size || 'Medium';
        if (m.Type) {
            // Convert "magical beast" to "Magical Beast"
            state.basic['in-type'] = m.Type.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        } else {
            state.basic['in-type'] = '';
        }

        // Subtypes (m.subtype1 .. m.subtype6)
        for (let i = 1; i <= 6; i++) {
            if (m[`subtype${i}`]) state.dynamic.subtypes.push(m[`subtype${i}`]);
        }

        state.basic['in-aura'] = m.Aura || '';

        // Senses
        if (m.Senses) {
            let parts = m.Senses.split(/,(?![^\(]*\))/);
            parts.forEach(part => {
                part = part.trim();
                if (!part) return;

                // e.g., "darkvision 60 ft." -> name: "darkvision", dist: "60 ft."
                // simple split by first digit
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

        // AC, HP, Saves
        // CSV only provides AC final number (e.g., 25). Calculate Natural Armor backwards.
        let acTotal = parseInt(m.AC) || 10;
        let dexMod = Math.floor(((parseInt(m.Dex) || 10) - 10) / 2);
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

        let calculatedNatArmor = acTotal - 10 - dexMod - sizeMod;
        if (calculatedNatArmor > 0) {
            state.basic['in-ac-natural'] = calculatedNatArmor;
        }

        // HD
        let hdAmount = 1;
        if (m.HD) {
            const hdMatch = m.HD.match(/^([0-9]+)d([0-9]+)/i);
            if (hdMatch) {
                hdAmount = parseInt(hdMatch[1]) || 1;
                state.basic['in-hd-amount'] = hdMatch[1];
                state.basic['in-hd-size'] = hdMatch[2];
            }
        }

        const formatS = (val) => {
            if (val === undefined || val === null || val === '') return '+0';
            const s = String(val).trim();
            if (s.startsWith('+') || s.startsWith('-')) return s;
            return (parseFloat(s) >= 0 ? "+" : "") + s;
        };
        state.basic['in-fort'] = formatS(m.Fort);
        state.basic['in-ref'] = formatS(m.Ref);
        state.basic['in-will'] = formatS(m.Will);

        // Defensives
        state.basic['in-def-abilities'] = m.DefensiveAbilities || '';
        state.basic['in-dr'] = m.DR || '';
        state.basic['in-immune'] = m.Immune || '';
        state.basic['in-resist'] = m.Resist || '';
        state.basic['in-weaknesses'] = m.Weaknesses || '';
        state.basic['in-sr'] = m.SR || '';

        // Offense
        state.basic['in-speed'] = m.Speed || '30 ft.';
        state.basic['in-space'] = m.Space ? (m.Space.includes('ft') ? m.Space : m.Space + ' ft.') : '5 ft.';
        state.basic['in-reach'] = m.Reach ? (m.Reach.includes('ft') ? m.Reach : m.Reach + ' ft.') : '5 ft.';

        // Melee & Ranged Parsing
        // Split attacks by comma or " or " outside parentheses to populate separate rows
        function splitAttacks(str) {
            if (!str) return [];
            // Split by comma or " or " outside of parentheses
            return str.split(/,(?![^\(\)]*\))|\s+or\s+(?![^\(\)]*\))/g).map(s => s.trim()).filter(s => s);
        }

        if (m.Melee && m.Melee.trim()) {
            splitAttacks(m.Melee).forEach(atk => {
                state.dynamic.melee.push({ mode: 'raw', rawText: atk });
            });
        }
        if (m.Ranged && m.Ranged.trim()) {
            splitAttacks(m.Ranged).forEach(atk => {
                state.dynamic.ranged.push({ mode: 'raw', rawText: atk });
            });
        }

        state.basic['in-special-attacks'] = m.SpecialAttacks || '';


        // Stats
        // Special Attacks label (for statblock "Special Attacks" line)
        state.basic['in-special-attacks'] = m.SpecialAttacks || '';

        // Special Abilities (Perfectly scraped from txt_to_json.py)
        if (m['Special Abilities']) {
            let lines = m['Special Abilities'].split('\n');
            let currentName = '';
            let currentDesc = [];

            lines.forEach(line => {
                line = line.trim();
                if (!line) return;
                // Match title at the start of the line, e.g., "Dream Haunting (Su) Description..."
                const match = line.match(/^([A-Za-z0-9\s\-\'\’]+?\s*\((?:Su|Ex|Sp)\))\s*(.*)/i);
                if (match) {
                    if (currentName) {
                        state.dynamic.abilities.push({ name: currentName, desc: currentDesc.join('<br><br>') });
                    }
                    currentName = match[1].trim(); // "Dream Haunting (Su)"
                    currentDesc = [];
                    const remainingDesc = match[2].trim();
                    if (remainingDesc) currentDesc.push(remainingDesc);
                } else {
                    if (!currentName) currentName = "Special Ability"; // Fallback
                    currentDesc.push(line);
                }
            });
            if (currentName) {
                state.dynamic.abilities.push({ name: currentName, desc: currentDesc.join('<br><br>') });
            }
        } else if (m.SpecialAttacks) {
            // Fallback for monsters that didn't get perfectly scraped
            let sas = [];
            let current = '';
            let depth = 0;
            for (let i = 0; i < m.SpecialAttacks.length; i++) {
                let c = m.SpecialAttacks[i];
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
                state.dynamic.abilities.push({ name: saName, desc: '<em>(Click ability name to fetch rules)</em>' });
            });
        }

        // SpellLikeAbilities -> Parse into SLAs in OFFENSE section
        if (m.SpellLikeAbilities) {
            let lines = m.SpellLikeAbilities.split('\n');
            lines.forEach(line => {
                line = line.trim();
                if (!line) return;

                // Extract CL if present
                const clMatch = line.match(/\((CL\s+[^\)]+)\)/i);
                if (clMatch) {
                    state.basic['in-sla-cl'] = clMatch[1];
                    // Remove the CL part from the line
                    line = line.replace(clMatch[0], '').trim();
                }

                // If line contains an em-dash, en-dash, or hyphen
                const dashIndex = line.indexOf('—') !== -1 ? line.indexOf('—') : (line.indexOf('-') !== -1 ? line.indexOf('-') : -1);
                if (dashIndex !== -1) {
                    const freq = line.substring(0, dashIndex).trim();
                    const spells = line.substring(dashIndex + 1).trim();
                    state.dynamic.slas.push({ freq: freq, spells: spells });
                } else if (line.length > 0) {
                    // Fallback for lines without dashes
                    state.dynamic.slas.push({ freq: '', spells: line });
                }
            });
        }

        // Stats
        state.basic['in-str'] = m.Str || '10';
        state.basic['in-dex'] = m.Dex || '10';
        state.basic['in-con'] = m.Con || '10';
        state.basic['in-int'] = m.Int || '10';
        state.basic['in-wis'] = m.Wis || '10';
        state.basic['in-cha'] = m.Cha || '10';

        // Auto-calculate BAB for Bestiary imports since CSV doesn't have it
        let typeValStr = state.basic['in-type'] || 'Humanoid';
        const typeBabMap = {
            "Aberration": 0.75, "Animal": 0.75, "Construct": 1.0,
            "Dragon": 1.0, "Fey": 0.5, "Humanoid": 0.75,
            "Magical Beast": 1.0, "Monstrous Humanoid": 1.0,
            "Ooze": 0.75, "Outsider": 1.0, "Plant": 0.75,
            "Undead": 0.75, "Vermin": 0.75
        };
        let babMult = typeBabMap[typeValStr] || 0.75;
        let calculatedBab = Math.floor(hdAmount * babMult);
        state.basic['in-bab'] = m.BaseAtk || m.BaseAttack || calculatedBab.toString();

        // Feats & Skills & Languages
        state.basic['in-feats'] = m.Feats || '';

        if (m.Skills) {
            let skillParts = m.Skills.split(/,(?![^\(]*\))/);
            skillParts.forEach(s => {
                let match = s.trim().match(/^(.*?)\s+([+-]\d+)$/);
                if (match) {
                    state.dynamic.skills.push({ name: match[1].trim(), mod: parseInt(match[2]) });
                } else {
                    state.dynamic.skills.push({ name: s.trim(), mod: 0 });
                }
            });
        }

        state.basic['in-languages'] = m.Languages || '';
        state.basic['in-sq'] = m.SQ || '';

        // Ecology
        state.basic['in-environment'] = m.Environment || '';
        state.basic['in-organization'] = m.Organization || '';
        state.basic['in-treasure'] = m.Treasure || '';

        // Category Toggle
        if (m.CharacterFlag === "1" || m.CharacterFlag === 1) {
            state.basic.stat_type = 'npc';
            const cls = m.Class1 || m.Class || '';
            const lvl = m.Class1_Lvl || '';
            state.basic['in-type-full'] = cls ? (lvl ? `${cls} ${lvl}` : cls) : '';
        } else {
            state.basic.stat_type = 'monster';
        }
        
        // Armor & Shield names from Gear string (for custom NPCs and imported monsters)
        if (m.Gear && !state.basic['in-armor-name']) {
            const gearLower = m.Gear.toLowerCase();
            if (gearLower.includes('mithral chain shirt')) state.basic['in-armor-name'] = 'Mithral Chain Shirt';
            else if (gearLower.includes('chain shirt')) state.basic['in-armor-name'] = 'Chain Shirt';
            else if (gearLower.includes('chainmail')) state.basic['in-armor-name'] = 'Chainmail';
            else if (gearLower.includes('full plate')) state.basic['in-armor-name'] = 'Full Plate';
            else if (gearLower.includes('half-plate') || gearLower.includes('half plate')) state.basic['in-armor-name'] = 'Half-Plate';
            else if (gearLower.includes('breastplate')) state.basic['in-armor-name'] = 'Breastplate';
            else if (gearLower.includes('scale mail')) state.basic['in-armor-name'] = 'Scale Mail';
            else if (gearLower.includes('hide')) state.basic['in-armor-name'] = 'Hide';
            else if (gearLower.includes('leather')) state.basic['in-armor-name'] = 'Leather';
            
            if (gearLower.includes('buckler')) state.basic['in-shield-name'] = 'Buckler';
            else if (gearLower.includes('heavy steel shield')) state.basic['in-shield-name'] = 'Heavy Steel Shield';
            else if (gearLower.includes('light steel shield')) state.basic['in-shield-name'] = 'Light Steel Shield';
            else if (gearLower.includes('heavy wooden shield')) state.basic['in-shield-name'] = 'Heavy Wooden Shield';
            else if (gearLower.includes('light wooden shield')) state.basic['in-shield-name'] = 'Light Wooden Shield';
        }

        // Auto-populate AC armor/shield bonuses from armor name
        const armorBonusMap = {
            'Padded': 1, 'Leather': 2, 'Studded Leather': 3, 'Chain Shirt': 4, 'Mithral Chain Shirt': 4,
            'Hide': 4, 'Scale Mail': 5, 'Chainmail': 6, 'Breastplate': 6, 'Mithral Breastplate': 6,
            'Splint Mail': 7, 'Banded Mail': 7, 'Half-Plate': 8, 'Full Plate': 9, 'Mithral Full Plate': 9
        };
        const armorMaxDexMap = {
            'Padded': 8, 'Leather': 6, 'Studded Leather': 5, 'Chain Shirt': 4, 'Mithral Chain Shirt': 6,
            'Hide': 4, 'Scale Mail': 3, 'Chainmail': 2, 'Breastplate': 3, 'Mithral Breastplate': 5,
            'Splint Mail': 0, 'Banded Mail': 1, 'Half-Plate': 0, 'Full Plate': 1, 'Mithral Full Plate': 3
        };
        const shieldBonusMap = {
            'Buckler': 1, 'Light Wooden Shield': 1, 'Light Steel Shield': 1,
            'Heavy Wooden Shield': 2, 'Heavy Steel Shield': 2, 'Tower Shield': 4
        };
        
        if (state.basic['in-armor-name'] && !state.basic['in-ac-armor']) {
            const aName = state.basic['in-armor-name'];
            if (armorBonusMap[aName] !== undefined) {
                state.basic['in-ac-armor'] = armorBonusMap[aName].toString();
            }
        }
        if (state.basic['in-shield-name'] && !state.basic['in-ac-shield']) {
            const sName = state.basic['in-shield-name'];
            if (shieldBonusMap[sName] !== undefined) {
                state.basic['in-ac-shield'] = shieldBonusMap[sName].toString();
            }
        }

        // Save to LocalStorage and redirect
        localStorage.setItem('pf_monster_creator_save', JSON.stringify(state));
        window.location.href = 'index.html';
    }
});
