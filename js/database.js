document.addEventListener('DOMContentLoaded', () => {
    // Track Last Visited Page
    try {
        localStorage.setItem('pathgm_last_page', '/html/database.html');
        document.cookie = "pathgm_last_page=/html/database.html; path=/; max-age=31536000; SameSite=Lax";
    } catch (e) { }

    // Apply Active Theme
    const savedTheme = (localStorage.getItem('pf_creator_theme') && localStorage.getItem('pf_creator_theme') !== 'theme-default') ? localStorage.getItem('pf_creator_theme') : 'theme-parchment';
    document.body.className = savedTheme;
    document.documentElement.className = savedTheme;

    let currentPage = 1;
    let maxPage = 1;
    let lastTotalCount = 0;
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
    const filterSize = document.getElementById('filter-size');
    const filterAlignment = document.getElementById('filter-alignment');
    const filterEnvironment = document.getElementById('filter-environment');
    const filterCategory = document.getElementById('filter-category');
    const filterSort = document.getElementById('filter-sort');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const pageInfo = document.getElementById('page-info');

    // Populate CR Filter Options
    const crs = ["1/8", "1/6", "1/4", "1/3", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "35", "37", "39"];
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
        const sizeVal = filterSize ? encodeURIComponent(filterSize.value) : '';
        const alignVal = encodeURIComponent(filterAlignment.value);
        const envVal = encodeURIComponent(filterEnvironment.value);
        const catVal = encodeURIComponent(filterCategory.value);
        const sortVal = encodeURIComponent(filterSort.value);

        mainList.innerHTML = `<div style="text-align: center; color: #aaa; padding: 20px;">Loading database...</div>`;

        const auth = window.PathMonsterDBAuth || window.PathGMAuth;
        const headers = (auth && typeof auth.getAuthHeaders === 'function')
            ? auth.getAuthHeaders()
            : {};

        fetch(`/api/search?name=${nameVal}&cr=${crVal}&type=${typeVal}&size=${sizeVal}&alignment=${alignVal}&environment=${envVal}&category=${catVal}&sort=${sortVal}&page=${currentPage}&per_page=${itemsPerPage}&_t=${Date.now()}`, {
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
    if (filterSize) filterSize.addEventListener('change', applyFilters);
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
            size: filterSize ? filterSize.value : '',
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
                if (f.size !== undefined && filterSize) filterSize.value = f.size;
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
            if (filterSize) filterSize.value = '';
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
        lastTotalCount = totalCount;
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
                card.classList.add('custom-card');
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

            const uId = currentUser?.id ? String(currentUser.id).toLowerCase() : '';
            const uName = currentUser?.username ? String(currentUser.username).toLowerCase() : '';
            const mAuthId = m.AuthorId ? String(m.AuthorId).toLowerCase() : '';
            const mAuthName = m.AuthorName ? String(m.AuthorName).toLowerCase() : '';

            const isAuthor = isOriginal || !m.AuthorId || (currentUser && (
                (uId && mAuthId && uId === mAuthId) ||
                (uName && mAuthName && uName === mAuthName) ||
                (uId && mAuthName && uId === mAuthName) ||
                (uName && mAuthId && uName === mAuthId)
            ));

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
                            <button class="btn btn-load">LOAD</button>
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
                    ? `<button class="btn btn-delete-custom">DELETE</button>`
                    : `<span class="badge-spacer"></span>`;

                actionsHtml = `
                    ${starBtnHtml}
                    <div class="actions-grid-2x2">
                        <div class="actions-top-tier">
                            ${visBadgeHtml}
                            ${customBadgeHtml}
                        </div>
                        <div class="actions-bottom-tier">
                            <button class="btn btn-load-custom">LOAD</button>
                            ${deleteBtnHtml}
                        </div>
                    </div>
                `;
            }

            const typeTokens = [];
            if (m.Alignment) typeTokens.push(m.Alignment);
            if (m.Size) typeTokens.push(m.Size);
            if (m.Type) typeTokens.push(m.Type);

            // If Type/Size were empty (common for official Bestiary NPCs), infer from name parentheses or CharacterFlag
            if (typeTokens.length === (m.Alignment ? 1 : 0)) {
                const match = (m.Name || '').match(/\(([^)]+)\)/);
                if (match) {
                    typeTokens.push(match[1]);
                } else if (m.CharacterFlag === "1" || m.CharacterFlag === 1) {
                    typeTokens.push('Humanoid');
                }
            }

            const metaParts = [`CR: ${m.CR || '-'}`];
            if (typeTokens.length > 0) {
                metaParts.push(typeTokens.join(' '));
            }
            const subtitleText = metaParts.join(' | ');

            card.innerHTML = `
                <div class="monster-info">
                    <h3>${m.Name}</h3>
                    <p>${subtitleText}</p>
                </div>
                <div class="monster-actions">
                    ${actionsHtml}
                </div>
            `;

            const infoEl = card.querySelector('.monster-info');
            if (infoEl) {
                infoEl.style.cursor = 'pointer';
                infoEl.title = `Click to load ${m.Name} into Monster Creator`;
                infoEl.addEventListener('click', () => loadToEditor(m));
            }

            if (isOriginal) {
                const btnLoad = card.querySelector('.btn-load');
                if (btnLoad) {
                    btnLoad.addEventListener('click', (e) => {
                        e.stopPropagation();
                        loadToEditor(m);
                    });
                }
            } else {
                const btnLoadCustom = card.querySelector('.btn-load-custom');
                if (btnLoadCustom) {
                    btnLoadCustom.addEventListener('click', (e) => {
                        e.stopPropagation();
                        loadToEditor(m);
                    });
                }

                const delBtn = card.querySelector('.btn-delete-custom');
                if (delBtn) {
                    delBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete "${m.Name}"?`)) {
                            const headers = (auth && typeof auth.getAuthHeaders === 'function')
                                ? auth.getAuthHeaders()
                                : {};
                            const deleteTarget = m.id || m._global_index;
                            fetch(`/api/delete/${deleteTarget}`, {
                                method: 'DELETE',
                                headers: headers
                            })
                                .then(r => r.json())
                                .then(res => {
                                    if (res.status === 'ok') {
                                        if (auth && typeof auth.showToast === 'function') {
                                            auth.showToast(`🗑️ "${m.Name}" deleted successfully.`, 'info');
                                        }
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
                const favTarget = m.id || m._global_index;
                fetch(`/api/favorite/${favTarget}`, {
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
    window.addEventListener('pathgm:auth', () => loadData());

    // Mapping Function (Database Row -> Our Form State)
    function buildEditorStateFromMonster(m) {
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
        const nameMatch = (m.Name || '').match(/^(.*?)\s*\(([^)]+)\)$/);
        const parsedCleanName = nameMatch ? nameMatch[1].trim() : (m.Name || 'Unknown Creature');
        const parsedRaceClass = nameMatch ? nameMatch[2].trim() : '';

        const isNpc = m.CharacterFlag === "1" || m.CharacterFlag === 1 ||
            (m.URL && m.URL.includes('/npc-s/')) ||
            Boolean(m.Class1) || Boolean(m.Class) || Boolean(parsedRaceClass) ||
            /cleric|wizard|fighter|rogue|paladin|ranger|bard|druid|sorcerer|monk|necromancer|alchemist|inquisitor|magus|cavalier|gunslinger|witch|oracle|summoner|aristocrat|adept|expert|warrior/i.test(m.Name || '');

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
            } catch (e) {
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

        return state;
    }

    function loadToEditor(m) {
        if (!m) return;
        let stateToSave = null;
        if (m.OriginalState) {
            stateToSave = JSON.parse(JSON.stringify(m.OriginalState));
        } else {
            const converter = window.buildEditorStateFromMonster || buildEditorStateFromMonster;
            stateToSave = converter(m);
        }
        if (!stateToSave) return;
        if (m._global_index !== undefined) stateToSave._global_index = m._global_index;
        if (m.id) stateToSave.id = m.id;
        const str = JSON.stringify(stateToSave);
        localStorage.setItem('pf_monster_creator_save', str);
        sessionStorage.setItem('pf_monster_creator_save', str);
        localStorage.setItem('pf_monster_creator_current_draft', str);
        window.location.href = 'index.html';
    }

    function downloadSingleMonsterJson(m) {
        try {
            let exportData = null;
            if (m.OriginalState) {
                exportData = JSON.parse(JSON.stringify(m.OriginalState));
            } else {
                exportData = buildEditorStateFromMonster(m);
            }
            if (m.id) exportData.id = m.id;
            if (m._global_index !== undefined) exportData._global_index = m._global_index;

            const rawName = m.Name || exportData.basic?.['in-name'] || 'Monster';
            const safeName = rawName.trim().replace(/[/\\?%*:|"<>]/g, '_') || 'Monster';
            const prettyJson = JSON.stringify(exportData, null, 2);
            const blob = new Blob([prettyJson], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${safeName}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            const auth = window.PathMonsterDBAuth || window.PathGMAuth;
            if (auth && typeof auth.showToast === 'function') {
                auth.showToast(`📥 Monster "${rawName}" downloaded as JSON!`, 'success');
            }
        } catch (err) {
            console.error('Error downloading single monster JSON:', err);
            alert('Download error: ' + err.message);
        }
    }

    // Database Export Modal Controls
    const btnExportDbJson = document.getElementById('btn-export-db-json');
    const modalExportDb = document.getElementById('modal-export-database');
    const btnCloseExportModal = document.getElementById('btn-close-export-modal');
    const btnExportScopeAll = document.getElementById('btn-export-scope-all');
    const btnExportScopeCustom = document.getElementById('btn-export-scope-custom');
    const btnExportScopeFiltered = document.getElementById('btn-export-scope-filtered');
    const exportFilteredTitle = document.getElementById('export-filtered-title');

    function openExportModal() {
        if (!modalExportDb) return;
        if (exportFilteredTitle) {
            exportFilteredTitle.textContent = `Current Filter Results (${lastTotalCount || 0} monsters)`;
        }
        modalExportDb.classList.add('active');
    }

    function closeExportModal() {
        if (modalExportDb) modalExportDb.classList.remove('active');
    }

    if (btnExportDbJson) {
        btnExportDbJson.addEventListener('click', openExportModal);
    }
    if (btnCloseExportModal) {
        btnCloseExportModal.addEventListener('click', closeExportModal);
    }
    if (modalExportDb) {
        modalExportDb.addEventListener('click', (e) => {
            if (e.target === modalExportDb) closeExportModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalExportDb && modalExportDb.classList.contains('active')) {
            closeExportModal();
        }
    });

    async function triggerDatabaseExport(scope) {
        closeExportModal();
        const auth = window.PathMonsterDBAuth || window.PathGMAuth;
        const headers = (auth && typeof auth.getAuthHeaders === 'function') ? auth.getAuthHeaders() : {};

        let url = `/api/database/export?scope=${scope}`;
        if (scope === 'filtered') {
            const nameVal = encodeURIComponent(filterName.value);
            const crVal = encodeURIComponent(filterCr.value);
            const typeVal = encodeURIComponent(filterType.value);
            const sizeVal = filterSize ? encodeURIComponent(filterSize.value) : '';
            const alignVal = encodeURIComponent(filterAlignment.value);
            const envVal = encodeURIComponent(filterEnvironment.value);
            const catVal = encodeURIComponent(filterCategory.value);
            const sortVal = encodeURIComponent(filterSort.value);
            url += `&name=${nameVal}&cr=${crVal}&type=${typeVal}&size=${sizeVal}&alignment=${alignVal}&environment=${envVal}&category=${catVal}&sort=${sortVal}`;
        }

        try {
            if (auth && typeof auth.showToast === 'function') {
                auth.showToast(`⏳ Generating ${scope} database export...`, 'info');
            }
            const res = await fetch(url, { headers });
            if (!res.ok) {
                throw new Error(`Export failed with status ${res.status}`);
            }
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            let filename = `PathMonsterDB_${scope.charAt(0).toUpperCase() + scope.slice(1)}_Monsters.json`;
            if (scope === 'all') filename = 'PathMonsterDB_All_Monsters.json';
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);

            if (auth && typeof auth.showToast === 'function') {
                auth.showToast(`📥 Successfully exported ${filename}!`, 'success');
            }
        } catch (err) {
            console.error('Export failed:', err);
            alert('Database Export Error: ' + err.message);
        }
    }

    if (btnExportScopeAll) btnExportScopeAll.addEventListener('click', () => triggerDatabaseExport('all'));
    if (btnExportScopeCustom) btnExportScopeCustom.addEventListener('click', () => triggerDatabaseExport('custom'));
    if (btnExportScopeFiltered) btnExportScopeFiltered.addEventListener('click', () => triggerDatabaseExport('filtered'));

    // Database Import (Bulk or Single JSON)
    const btnImportDbJson = document.getElementById('btn-import-db-json');
    const fileImportDbJson = document.getElementById('file-import-db-json');

    if (btnImportDbJson && fileImportDbJson) {
        btnImportDbJson.addEventListener('click', () => fileImportDbJson.click());
        fileImportDbJson.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            for (const file of files) {
                await processJsonImportFile(file);
            }
            fileImportDbJson.value = '';
        });
    }

    async function processJsonImportFile(file) {
        const auth = window.PathMonsterDBAuth || window.PathGMAuth;
        try {
            const text = await file.text();
            const headers = (auth && typeof auth.getAuthHeaders === 'function') ? auth.getAuthHeaders() : {};
            headers['Content-Type'] = 'application/json';

            const res = await fetch('/api/database/import', {
                method: 'POST',
                headers,
                body: text
            });
            const data = await res.json();
            if (res.ok && data.status === 'ok') {
                if (auth && typeof auth.showToast === 'function') {
                    auth.showToast(`✅ Successfully imported ${data.imported_count} monster(s) from "${file.name}"!`, 'success');
                }
                loadData();
            } else {
                alert(`Import failed: ${data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Import error:', err);
            alert(`Error reading import file: ${err.message}`);
        }
    }

    // Drag & Drop JSON Import on Database Page
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        document.body.style.opacity = '0.75';
    });
    document.body.addEventListener('dragleave', (e) => {
        e.preventDefault();
        document.body.style.opacity = '1';
    });
    document.body.addEventListener('drop', async (e) => {
        e.preventDefault();
        document.body.style.opacity = '1';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const jsonFiles = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.json'));
            if (jsonFiles.length > 0) {
                for (const file of jsonFiles) {
                    await processJsonImportFile(file);
                }
            } else {
                alert('Please drop a valid .json file.');
            }
        }
    });

    // -------------------------------------------------------------------
    // Database Page Appearance & Display Settings Modal Controller
    // -------------------------------------------------------------------
    const settingsModal = document.getElementById('panel-settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnApplySettings = document.getElementById('btn-apply-panel-settings');
    const btnResetSettings = document.getElementById('btn-reset-panel-settings');

    const settingThemeSelect = document.getElementById('setting-panel-theme');
    const settingFontSelect = document.getElementById('setting-panel-font');
    const settingSizeInput = document.getElementById('setting-panel-size');
    const settingSizeBadge = document.getElementById('setting-font-size-badge');
    const settingScaleInput = document.getElementById('setting-panel-scale');
    const settingScaleBadge = document.getElementById('setting-scale-badge');
    const settingPreviewSample = document.getElementById('setting-preview-sample');
    const swatchContainer = document.getElementById('theme-swatch-container');

    const btnUiModeDark = document.getElementById('btn-ui-mode-dark');
    const btnUiModeLight = document.getElementById('btn-ui-mode-light');

    function applyAppUiTheme(theme) {
        const isLight = (theme === 'ui-light');
        document.body.classList.toggle('ui-light', isLight);
        localStorage.setItem('pf_app_ui_theme', isLight ? 'ui-light' : 'ui-dark');
        if (btnUiModeDark) btnUiModeDark.classList.toggle('active', !isLight);
        if (btnUiModeLight) btnUiModeLight.classList.toggle('active', isLight);
    }

    const savedUiTheme = localStorage.getItem('pf_app_ui_theme') || 'ui-dark';
    applyAppUiTheme(savedUiTheme);

    if (btnUiModeDark) btnUiModeDark.addEventListener('click', () => applyAppUiTheme('ui-dark'));
    if (btnUiModeLight) btnUiModeLight.addEventListener('click', () => applyAppUiTheme('ui-light'));

    const THEMES_METADATA = [
        { id: 'theme-parchment', name: 'Classic Parchment', type: 'light', bg: '#f4ebd9', fg: '#2b1d0c', accent: '#8b0000' },
        { id: 'theme-classic', name: 'Classic Vellum', type: 'light', bg: '#faf6eb', fg: '#1c1917', accent: '#78350f' },
        { id: 'theme-scroll', name: 'Ancient Scroll', type: 'light', bg: '#ede0c8', fg: '#38220f', accent: '#9a3412' },
        { id: 'theme-clean-slate', name: 'Clean Slate', type: 'light', bg: '#ffffff', fg: '#0f172a', accent: '#2563eb' },
        { id: 'theme-tome', name: "Wizard's Tome", type: 'light', bg: '#f5efe6', fg: '#292524', accent: '#d97706' },
        { id: 'theme-modern-dark', name: 'Modern Dark', type: 'dark', bg: '#0f172a', fg: '#f8fafc', accent: '#38bdf8' },
        { id: 'theme-obsidian', name: 'Obsidian Glass', type: 'dark', bg: '#030712', fg: '#f3f4f6', accent: '#9ca3af' },
        { id: 'theme-midnight', name: 'Midnight Arcana', type: 'dark', bg: '#020617', fg: '#e2e8f0', accent: '#818cf8' },
        { id: 'theme-crimson', name: 'Crimson Blood', type: 'dark', bg: '#1c0707', fg: '#fecaca', accent: '#ef4444' },
        { id: 'theme-infernal', name: 'Infernal Abyss', type: 'dark', bg: '#180a0a', fg: '#fed7aa', accent: '#f97316' },
        { id: 'theme-emerald', name: 'Emerald Forest', type: 'dark', bg: '#051a0f', fg: '#d1fae5', accent: '#10b981' },
        { id: 'theme-cyberpunk', name: 'Cyber Neon', type: 'dark', bg: '#09090b', fg: '#00ffff', accent: '#ff007f' },
        { id: 'theme-royal', name: 'Royal Purple', type: 'dark', bg: '#150a21', fg: '#fae8ff', accent: '#d946ef' },
        { id: 'theme-abyssal', name: 'Abyssal Void', type: 'dark', bg: '#0a0a14', fg: '#c7d2fe', accent: '#6366f1' },
        { id: 'theme-celestial', name: 'Celestial Gold', type: 'dark', bg: '#17120a', fg: '#fef08a', accent: '#eab308' },
        { id: 'theme-draconic', name: 'Draconic Scale', type: 'dark', bg: '#140c0c', fg: '#fed7aa', accent: '#dc2626' },
        { id: 'theme-underdark', name: 'Underdark Cavern', type: 'dark', bg: '#0f0f12', fg: '#e2e8f0', accent: '#a855f7' },
        { id: 'theme-frostburn', name: 'Frostburn Glacier', type: 'dark', bg: '#06151f', fg: '#e0f2fe', accent: '#38bdf8' },
        { id: 'theme-shadowfell', name: 'Shadowfell Mist', type: 'dark', bg: '#121316', fg: '#cbd5e1', accent: '#64748b' },
        { id: 'theme-solar', name: 'Solar Radiance', type: 'dark', bg: '#1c1507', fg: '#fef9c3', accent: '#f59e0b' },
        { id: 'theme-runic', name: 'Runic Stone', type: 'dark', bg: '#18181b', fg: '#e4e4e7', accent: '#a1a1aa' }
    ];

    function renderThemeSwatches(filter = 'all') {
        if (!swatchContainer) return;
        swatchContainer.innerHTML = '';
        const currentTheme = settingThemeSelect ? settingThemeSelect.value : (localStorage.getItem('pf_creator_theme') || 'theme-parchment');

        const filtered = THEMES_METADATA.filter(t => filter === 'all' || t.type === filter);
        filtered.forEach(t => {
            const item = document.createElement('div');
            item.className = 'theme-swatch-item' + (t.id === currentTheme ? ' active' : '');
            item.dataset.theme = t.id;
            item.innerHTML = `
                <div class="theme-swatch-dots">
                    <span class="theme-dot" style="background: ${t.bg};" title="Background"></span>
                    <span class="theme-dot" style="background: ${t.accent};" title="Accent"></span>
                </div>
                <span>${t.name}</span>
            `;
            item.addEventListener('click', () => {
                if (settingThemeSelect) {
                    settingThemeSelect.value = t.id;
                    settingThemeSelect.dispatchEvent(new Event('change'));
                }
            });
            swatchContainer.appendChild(item);
        });
    }

    document.querySelectorAll('.btn-theme-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-theme-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderThemeSwatches(btn.dataset.filter);
        });
    });

    function updateSamplePreview() {
        if (!settingPreviewSample) return;
        const font = settingFontSelect ? settingFontSelect.value : "'Inter', sans-serif";
        const size = settingSizeInput ? settingSizeInput.value : "14";
        const themeId = settingThemeSelect ? settingThemeSelect.value : (localStorage.getItem('pf_creator_theme') || 'theme-parchment');

        settingPreviewSample.style.fontFamily = font;
        settingPreviewSample.style.fontSize = `${size}px`;

        const tMeta = THEMES_METADATA.find(t => t.id === themeId);
        if (tMeta) {
            settingPreviewSample.style.background = tMeta.bg;
            settingPreviewSample.style.color = tMeta.fg;
            settingPreviewSample.style.borderColor = tMeta.accent;
        }

        if (settingSizeBadge) settingSizeBadge.textContent = `${size} px`;
        if (settingScaleBadge && settingScaleInput) settingScaleBadge.textContent = `${settingScaleInput.value}%`;

        document.querySelectorAll('.theme-swatch-item').forEach(el => {
            el.classList.toggle('active', el.dataset.theme === themeId);
        });
    }

    if (settingThemeSelect) {
        settingThemeSelect.addEventListener('change', () => {
            updateSamplePreview();
            const chosenTheme = settingThemeSelect.value;
            localStorage.setItem('pf_creator_theme', chosenTheme);
            document.documentElement.className = chosenTheme;
        });
    }

    if (settingFontSelect) {
        settingFontSelect.addEventListener('change', () => {
            updateSamplePreview();
            localStorage.setItem('pf_creator_font', settingFontSelect.value);
        });
    }

    if (settingSizeInput) {
        settingSizeInput.addEventListener('input', () => {
            updateSamplePreview();
            const size = settingSizeInput.value;
            localStorage.setItem('pf_creator_font_size', size);
            document.querySelectorAll('.btn-size-preset').forEach(b => {
                b.classList.toggle('active', parseFloat(b.dataset.size) === parseFloat(size));
            });
        });
    }

    document.querySelectorAll('.btn-size-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-size-preset').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const size = btn.dataset.size;
            if (settingSizeInput) {
                settingSizeInput.value = size;
                settingSizeInput.dispatchEvent(new Event('input'));
            }
        });
    });

    if (settingScaleInput) {
        settingScaleInput.addEventListener('input', () => {
            updateSamplePreview();
            localStorage.setItem('pf_creator_scale', settingScaleInput.value);
        });
    }

    function openSettingsModal() {
        const modal = settingsModal || document.getElementById('panel-settings-modal');
        if (!modal) return;
        const currentTheme = localStorage.getItem('pf_creator_theme') || 'theme-parchment';
        const currentFont = localStorage.getItem('pf_creator_font') || "'Inter', sans-serif";
        const currentSize = localStorage.getItem('pf_creator_font_size') || "14";
        const currentScale = localStorage.getItem('pf_creator_scale') || "100";

        const sTheme = settingThemeSelect || document.getElementById('setting-panel-theme');
        const sFont = settingFontSelect || document.getElementById('setting-panel-font');
        const sSize = settingSizeInput || document.getElementById('setting-panel-size');
        const sScale = settingScaleInput || document.getElementById('setting-panel-scale');

        if (sTheme) sTheme.value = currentTheme;
        if (sFont) sFont.value = currentFont;
        if (sSize) sSize.value = currentSize;
        if (sScale) sScale.value = currentScale;

        renderThemeSwatches('all');
        updateSamplePreview();
        modal.classList.add('active');
    }
    window.openSettingsModal = openSettingsModal;

    function closeSettingsModal() {
        const modal = settingsModal || document.getElementById('panel-settings-modal');
        if (modal) modal.classList.remove('active');
    }
    window.closeSettingsModal = closeSettingsModal;

    const allSettingsBtns = [
        document.getElementById('btn-settings-panel'),
        document.getElementById('mob-btn-settings')
    ].filter(Boolean);

    allSettingsBtns.forEach(btn => {
        btn.addEventListener('click', openSettingsModal);
    });

    if (btnCloseSettings) btnCloseSettings.addEventListener('click', closeSettingsModal);
    if (settingsModal) {
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) closeSettingsModal();
        });
    }

    if (btnApplySettings) {
        btnApplySettings.addEventListener('click', () => {
            closeSettingsModal();
            const auth = window.PathMonsterDBAuth || window.PathGMAuth;
            if (auth && typeof auth.showToast === 'function') {
                auth.showToast('Display settings applied!', 'success');
            }
        });
    }

    if (btnResetSettings) {
        btnResetSettings.addEventListener('click', () => {
            if (confirm('Reset all appearance and font settings to default?')) {
                applyAppUiTheme('ui-dark');
                if (settingThemeSelect) settingThemeSelect.value = 'theme-parchment';
                if (settingFontSelect) settingFontSelect.value = "'Inter', sans-serif";
                if (settingSizeInput) settingSizeInput.value = '14';
                if (settingScaleInput) settingScaleInput.value = '100';

                localStorage.removeItem('pf_app_ui_theme');
                localStorage.removeItem('pf_creator_theme');
                localStorage.removeItem('pf_creator_font');
                localStorage.removeItem('pf_creator_font_size');
                localStorage.removeItem('pf_creator_scale');
                document.documentElement.className = 'theme-parchment';

                updateSamplePreview();
                renderThemeSwatches('all');
            }
        });
    }
});
