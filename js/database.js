document.addEventListener('DOMContentLoaded', () => {
    // Track Last Visited Page
    try {
        localStorage.setItem('pathgm_last_page', '/html/database.html');
        document.cookie = "pathgm_last_page=/html/database.html; path=/; max-age=31536000; SameSite=Lax";
    } catch (e) {}

    // Apply Active Theme
    const savedTheme = (localStorage.getItem('pf_creator_theme') && localStorage.getItem('pf_creator_theme') !== 'theme-default') ? localStorage.getItem('pf_creator_theme') : 'theme-parchment';
    document.body.className = savedTheme;
    document.documentElement.className = savedTheme;

    let currentPage = 1;
    let maxPage = 1;
    const itemsPerPage = 50;

    // Load Magic Items DB for gear resolution
    fetch('/data/magic_items.json')
        .then(r => r.json())
        .then(data => { window.allMagicItemsDB = data; })
        .catch(e => console.warn('Could not load magic items:', e));

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

        const auth = window.PathMonsterDBAuth || window.PathGMAuth;
        const headers = (auth && typeof auth.getAuthHeaders === 'function')
            ? auth.getAuthHeaders()
            : {};

        fetch(`/api/search?name=${nameVal}&cr=${crVal}&type=${typeVal}&alignment=${alignVal}&environment=${envVal}&category=${catVal}&sort=${sortVal}&page=${currentPage}&per_page=${itemsPerPage}&_t=${Date.now()}`, {
            headers: headers,
            cache: 'no-store'
        })
            .then(r => r.json())
            .then(res => {
                renderList(res.data, res.total_count, res.page, res.per_page);
            })
            .catch(err => {
                mainList.innerHTML = `<div style="color: red; text-align: center;">Error loading database: ${err.message}</div>`;
            });
    }

    window.addEventListener('pathgm:auth', () => {
        loadData();
    });

    // Filters
    function applyFilters() {
        saveFiltersToStorage();
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

    // Save & Restore Filters in LocalStorage
    function saveFiltersToStorage() {
        const filters = {
            name: filterName.value,
            cr: filterCr.value,
            type: filterType.value,
            alignment: filterAlignment.value,
            environment: filterEnvironment.value,
            category: filterCategory.value,
            sort: filterSort.value
        };
        localStorage.setItem('pf_db_filters', JSON.stringify(filters));
    }

    function restoreFiltersFromStorage() {
        try {
            const saved = localStorage.getItem('pf_db_filters');
            if (saved) {
                const f = JSON.parse(saved);
                if (f.name !== undefined) filterName.value = f.name;
                if (f.cr !== undefined) filterCr.value = f.cr;
                if (f.type !== undefined) filterType.value = f.type;
                if (f.alignment !== undefined) filterAlignment.value = f.alignment;
                if (f.environment !== undefined) filterEnvironment.value = f.environment;
                if (f.category !== undefined) filterCategory.value = f.category;
                if (f.sort !== undefined) filterSort.value = f.sort;
            }
        } catch (e) {
            console.error('Failed restoring filters from storage:', e);
        }
    }

    const btnResetFilters = document.getElementById('btn-reset-filters');
    if (btnResetFilters) {
        btnResetFilters.addEventListener('click', () => {
            filterName.value = '';
            filterCr.value = '';
            filterType.value = '';
            filterAlignment.value = '';
            filterEnvironment.value = '';
            filterCategory.value = '';
            filterSort.value = 'default';
            localStorage.removeItem('pf_db_filters');
            applyFilters();
        });
    }


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

        const auth = window.PathMonsterDBAuth || window.PathGMAuth;
        const currentUser = (auth && typeof auth.getUser === 'function') ? auth.getUser() : null;

        pageData.forEach(m => {
            const card = document.createElement('div');
            card.className = 'monster-card';

            const isOriginal = !m.IsUserCustom;
            if (!isOriginal) {
                card.style.background = 'rgba(234, 179, 8, 0.12)';
                card.style.borderColor = 'rgba(234, 179, 8, 0.35)';
            }

            let badges = '';
            if (!isOriginal) {
                badges += `<span class="badge-tag badge-custom">CUSTOM</span>`;
                
                // Visibility Badge (Public / Private)
                const isPrivate = (m.Visibility === 'private');
                if (isPrivate) {
                    badges += `<span class="badge-tag badge-private" title="Only visible to you">PRIVATE</span>`;
                } else {
                    badges += `<span class="badge-tag badge-public" title="Visible to all users">PUBLIC</span>`;
                }

                // Author Badge
                if (m.AuthorName) {
                    badges += `<span class="badge-tag badge-author" title="Created by ${m.AuthorName}">👤 ${m.AuthorName.toUpperCase()}</span>`;
                }
            }
            if (m.CharacterFlag === "1") {
                badges += `<span class="badge-tag badge-npc">NPC</span>`;
            }

            let actionsHtml = '';
            let starBtnHtml = `<button class="star-btn ${m.IsFavorite ? 'active' : ''}" title="Toggle Favorite">⭐</button>`;

            const isAuthor = isOriginal || !m.AuthorId || (currentUser && (String(currentUser.id) === String(m.AuthorId) || String(currentUser.username).toLowerCase() === String(m.AuthorName).toLowerCase()));

            if (isOriginal) {
                const npcBadge = (m.CharacterFlag === "1")
                    ? `<span class="badge-tag badge-npc">NPC</span>`
                    : `<span class="badge-spacer"></span>`;

                actionsHtml = `
                    ${starBtnHtml}
                    <div class="actions-grid-2x2">
                        <div class="actions-top-tier">
                            ${npcBadge}
                        </div>
                        <div class="actions-bottom-tier">
                            <button class="btn btn-load" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4); transition: transform 0.1s, box-shadow 0.1s; display: inline-flex; align-items: center; justify-content: center; gap: 4px;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 8px -1px rgba(16, 185, 129, 0.5)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 6px -1px rgba(16, 185, 129, 0.4)';">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> LOAD
                            </button>
                        </div>
                    </div>
                `;
            } else {
                const isPrivate = (m.Visibility === 'private');
                const visBadgeHtml = isPrivate
                    ? `<span class="badge-tag badge-private" title="Only visible to you">PRIVATE</span>`
                    : `<span class="badge-tag badge-public" title="Visible to all users">PUBLIC</span>`;

                const customBadgeHtml = `<span class="badge-tag badge-custom">CUSTOM</span>`;

                const deleteBtnHtml = isAuthor
                    ? `<button class="btn btn-delete-custom" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.4); cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(239, 68, 68, 0.25)';" onmouseout="this.style.background='rgba(239, 68, 68, 0.15)';">DELETE</button>`
                    : `<span class="badge-spacer"></span>`;

                actionsHtml = `
                    ${starBtnHtml}
                    <div class="actions-grid-2x2">
                        <div class="actions-top-tier">
                            ${visBadgeHtml}
                            ${customBadgeHtml}
                        </div>
                        <div class="actions-bottom-tier">
                            <button class="btn btn-load-custom" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.4); transition: transform 0.1s, box-shadow 0.1s; display: inline-flex; align-items: center; justify-content: center; gap: 4px;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 8px -1px rgba(59, 130, 246, 0.5)';" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 6px -1px rgba(59, 130, 246, 0.4)';">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> LOAD
                            </button>
                            ${deleteBtnHtml}
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="monster-info">
                    <h3>${m.Name}</h3>
                    <p>CR: ${m.CR || '-'} | HP: ${m.HP || '-'} | AC: ${m.AC || '-'} | Type: ${m.Type || '-'} | Alignment: ${m.Alignment || '-'} | Size: ${m.Size || '-'}</p>
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
                        const stateToSave = JSON.parse(JSON.stringify(m.OriginalState));
                        stateToSave._global_index = m._global_index;
                        if (m.id) stateToSave.id = m.id;
                        localStorage.setItem('pf_monster_creator_save', JSON.stringify(stateToSave));
                        window.location.href = 'index.html';
                    } else {
                        loadToEditor(m);
                    }
                });

                const delBtn = card.querySelector('.btn-delete-custom');
                if (delBtn) {
                    delBtn.addEventListener('click', () => {
                        if (confirm(`Are you sure you want to delete "${m.Name}"?`)) {
                            const headers = (auth && typeof auth.getAuthHeaders === 'function')
                                ? auth.getAuthHeaders()
                                : {};
                            fetch(`/api/delete/${m._global_index}`, {
                                method: 'DELETE',
                                headers: headers
                            })
                                .then(r => r.json())
                                .then(res => {
                                    if (res.status === 'ok') {
                                        loadData();
                                    } else {
                                        alert('Delete failed: ' + (res.error || res.message || 'Unknown error'));
                                    }
                                })
                                .catch(err => alert('Delete failed: ' + err.message));
                        }
                    });
                }
            }

            card.querySelector('.star-btn').addEventListener('click', (e) => {
                const btn = e.currentTarget;
                const auth = window.PathMonsterDBAuth || window.PathGMAuth;
                const headers = (auth && typeof auth.getAuthHeaders === 'function')
                    ? auth.getAuthHeaders()
                    : {};
                fetch(`/api/favorite/${m._global_index}`, {
                    method: 'POST',
                    headers: headers
                })
                    .then(r => r.json())
                    .then(data => {
                        if (data.status === 'success') {
                            btn.classList.toggle('active', data.is_favorite);
                            m.IsFavorite = data.is_favorite;
                        }
                    })
                    .catch(err => console.error('Failed to toggle favorite:', err));
            });

            mainList.appendChild(card);
        });
    }

    restoreFiltersFromStorage();
    loadData();

    // Mapping Function (Database Row -> Our Form State)
    // Mapping Function (Database Row -> Our Form State)
    function loadToEditor(m) {
        // Create a clean, full state object matching our structure
        const state = {
            basic: {
                'in-name': m.Name || 'Unknown Creature',
                'in-cr': m.CR || '1',
                'in-xp': m.XP || '400',
                'in-alignment': 'N',
                'in-size': 'Medium',
                'in-type': 'Humanoid',
                'in-type-full': '',
                'in-aura': m.Aura || '',
                'in-speed': m.Speed || '30 ft.',
                'in-space': '5 ft.',
                'in-reach': '5 ft.',
                'in-str': m.Str || '10',
                'in-dex': m.Dex || '10',
                'in-con': m.Con || '10',
                'in-int': m.Int || '10',
                'in-wis': m.Wis || '10',
                'in-cha': m.Cha || '10',
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
                'in-def-abilities': m.DefensiveAbilities || '',
                'in-dr': m.DR || '',
                'in-immune': m.Immune || '',
                'in-resist': m.Resist || '',
                'in-weaknesses': m.Weaknesses || '',
                'in-sr': m.SR || '',
                'in-special-attacks': m.SpecialAttacks || '',
                'in-feats': m.Feats || '',
                'in-skills': m.Skills || '',
                'in-languages': m.Languages || '',
                'in-sq': m.SQ || '',
                'in-gear': '',
                'in-environment': m.Environment || '',
                'in-organization': m.Organization || '',
                'in-treasure': m.Treasure || '',
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
        if (m.Type) {
            const rawType = String(m.Type).trim().toLowerCase();
            const matchedType = validTypes.find(t => t.toLowerCase() === rawType);
            if (matchedType) {
                state.basic['in-type'] = matchedType;
            } else {
                // Title case formatting
                state.basic['in-type'] = rawType.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
        } else {
            // Infer type from Name or Race
            const nLower = (m.Name || '').toLowerCase();
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
        if (m.Alignment && validAligns.includes(String(m.Alignment).trim().toUpperCase())) {
            state.basic['in-alignment'] = String(m.Alignment).trim().toUpperCase();
        } else {
            state.basic['in-alignment'] = 'N';
        }

        // 3. Size
        const validSizes = ["Fine", "Diminutive", "Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan", "Colossal"];
        if (m.Size) {
            const rawSize = String(m.Size).trim().toLowerCase();
            const matchedSize = validSizes.find(s => s.toLowerCase() === rawSize);
            if (matchedSize) state.basic['in-size'] = matchedSize;
        } else {
            const nLower = (m.Name || '').toLowerCase();
            if (nLower.includes('giant') || nLower.includes('large')) state.basic['in-size'] = 'Large';
            else if (nLower.includes('huge')) state.basic['in-size'] = 'Huge';
            else if (nLower.includes('gargantuan')) state.basic['in-size'] = 'Gargantuan';
            else if (nLower.includes('colossal')) state.basic['in-size'] = 'Colossal';
            else if (nLower.includes('small')) state.basic['in-size'] = 'Small';
            else if (nLower.includes('tiny')) state.basic['in-size'] = 'Tiny';
            else state.basic['in-size'] = 'Medium';
        }

        // 4. Space & Reach
        if (m.Space) state.basic['in-space'] = String(m.Space).includes('ft') ? String(m.Space) : m.Space + ' ft.';
        if (m.Reach) state.basic['in-reach'] = String(m.Reach).includes('ft') ? String(m.Reach) : m.Reach + ' ft.';

        // 5. Subtypes
        for (let i = 1; i <= 6; i++) {
            if (m[`subtype${i}`]) state.dynamic.subtypes.push(m[`subtype${i}`]);
        }

        // 6. Senses
        if (m.Senses) {
            let parts = String(m.Senses).split(/,(?![^\(]*\))/);
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

        // 8. AC & Natural Armor Back-Calculation
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

        let calculatedNatArmor = Math.max(0, acTotal - 10 - dexMod - sizeMod - acArmorBonus - acShieldBonus);
        state.basic['in-ac-natural'] = calculatedNatArmor.toString();

        // 9. HD & HP
        let hdAmount = 1;
        if (m.HD) {
            const hdStr = String(m.HD);
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
        } else if (m.HP) {
            let hpVal = parseInt(m.HP) || 20;
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
        state.basic['in-fort'] = formatS(m.Fort);
        state.basic['in-ref'] = formatS(m.Ref);
        state.basic['in-will'] = formatS(m.Will);

        // 11. Melee & Ranged
        function splitAttacks(str) {
            if (!str) return [];
            return String(str).split(/,(?![^\(\)]*\))|\s+or\s+(?![^\(\)]*\))/g).map(s => s.trim()).filter(s => s);
        }

        if (m.Melee && String(m.Melee).trim()) {
            splitAttacks(m.Melee).forEach(atk => {
                state.dynamic.melee.push({ mode: 'raw', rawText: atk });
            });
        }
        if (m.Ranged && String(m.Ranged).trim()) {
            splitAttacks(m.Ranged).forEach(atk => {
                state.dynamic.ranged.push({ mode: 'raw', rawText: atk });
            });
        }

        // 12. Special Abilities
        if (m.dynamic && m.dynamic.abilities && Array.isArray(m.dynamic.abilities) && m.dynamic.abilities.length > 0) {
            m.dynamic.abilities.forEach(ab => {
                state.dynamic.abilities.push({ name: ab.name || 'Special Ability', desc: ab.desc || ab.name || '' });
            });
        } else if (m['Special Abilities'] || m.SpecialAbilities) {
            let lines = String(m['Special Abilities'] || m.SpecialAbilities).split('\n');
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
        } else if (m.SpecialAttacks) {
            let sas = [];
            let current = '';
            let depth = 0;
            const saStr = String(m.SpecialAttacks);
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
        if (m.SpellLikeAbilities) {
            let lines = String(m.SpellLikeAbilities).split('\n');
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
        if (m.Skills) {
            let skillParts = String(m.Skills).split(/,(?![^\(]*\))/);
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
        const isNpc = m.CharacterFlag === "1" || m.CharacterFlag === 1 ||
            (m.URL && m.URL.includes('/npc-s/')) ||
            Boolean(m.Class1) || Boolean(m.Class) ||
            /cleric|wizard|fighter|rogue|paladin|ranger|bard|druid|sorcerer|monk|necromancer|alchemist|inquisitor|magus|cavalier|gunslinger|witch|oracle|summoner|aristocrat|adept|expert|warrior/i.test(m.Name || '');

        if (isNpc) {
            state.basic.stat_type = 'npc';
            const cls = m.Class1 || m.Class || '';
            const lvl = m.Class1_Lvl || '';
            state.basic['in-type-full'] = cls ? (lvl ? `${cls} ${lvl}` : cls) : m.Name;
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
        if (m.OriginalState && m.OriginalState.basic && m.OriginalState.basic['in-spells-data']) {
            state.basic['in-spells-data'] = m.OriginalState.basic['in-spells-data'];
            state.basic['in-spell-class'] = m.OriginalState.basic['in-spell-class'] || '';
            state.basic['in-spell-cl'] = m.OriginalState.basic['in-spell-cl'] || '1';
            state.basic['in-spell-stat'] = m.OriginalState.basic['in-spell-stat'] || 'int';
            state.basic['in-spell-conc'] = m.OriginalState.basic['in-spell-conc'] || '';
            try {
                state.dynamic.spells = typeof m.OriginalState.basic['in-spells-data'] === 'string'
                    ? JSON.parse(m.OriginalState.basic['in-spells-data'])
                    : m.OriginalState.basic['in-spells-data'];
            } catch(e) {
                state.dynamic.spells = m.OriginalState.dynamic?.spells || {};
            }
        } else if (m.OriginalState && m.OriginalState.dynamic && m.OriginalState.dynamic.spells) {
            state.dynamic.spells = m.OriginalState.dynamic.spells;
            state.basic['in-spells-data'] = JSON.stringify(m.OriginalState.dynamic.spells);
            state.basic['in-spell-class'] = m.OriginalState.basic?.['in-spell-class'] || '';
            state.basic['in-spell-cl'] = m.OriginalState.basic?.['in-spell-cl'] || '1';
            state.basic['in-spell-stat'] = m.OriginalState.basic?.['in-spell-stat'] || 'int';
            state.basic['in-spell-conc'] = m.OriginalState.basic?.['in-spell-conc'] || '';
        }

        // 19. Save to LocalStorage and redirect directly to editor
        state._global_index = m._global_index;
        if (m.id) state.id = m.id;
        localStorage.setItem('pf_monster_creator_save', JSON.stringify(state));
        window.location.href = 'index.html';
    }
});
