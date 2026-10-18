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

    // Folder System State & Elements
    window.allUserFolders = [];
    let activeFolderId = '';

    const selectActiveFolder = document.getElementById('select-active-folder');
    const btnCreateFolder = document.getElementById('btn-create-folder');
    const folderActiveActions = document.getElementById('folder-active-actions');
    const activeFolderNameText = document.getElementById('active-folder-name-text');
    const activeFolderCountText = document.getElementById('active-folder-count-text');
    const btnFolderExportPdf = document.getElementById('btn-folder-export-pdf');
    const btnFolderExportPng = document.getElementById('btn-folder-export-png');
    const btnFolderExportJson = document.getElementById('btn-folder-export-json');
    const btnFolderRename = document.getElementById('btn-folder-rename');
    const btnFolderDelete = document.getElementById('btn-folder-delete');
    const btnFolderClear = document.getElementById('btn-folder-clear');

    const modalFolderEditor = document.getElementById('modal-folder-editor');
    const modalFolderTitle = document.getElementById('modal-folder-title');
    const folderEditId = document.getElementById('folder-edit-id');
    const folderNameInput = document.getElementById('folder-name-input');
    const folderDescInput = document.getElementById('folder-desc-input');
    const btnCloseFolderModal = document.getElementById('btn-close-folder-modal');
    const btnCancelFolder = document.getElementById('btn-cancel-folder');
    const btnSaveFolder = document.getElementById('btn-save-folder');

    const modalAssignFolder = document.getElementById('modal-assign-folder');
    const assignMonsterName = document.getElementById('assign-monster-name');
    const assignMonsterCrBadge = document.getElementById('assign-monster-cr-badge');
    const assignMonsterTypeBadge = document.getElementById('assign-monster-type-badge');
    const assignMonsterFoldersBadge = document.getElementById('assign-monster-folders-badge');
    const assignFoldersList = document.getElementById('assign-folders-list');
    const btnCloseAssignModal = document.getElementById('btn-close-assign-modal');
    const btnAssignDone = document.getElementById('btn-assign-done');
    const btnAssignNewFolder = document.getElementById('btn-assign-new-folder');
    const assignQuickCreateForm = document.getElementById('assign-quick-create-form');
    const inputAssignNewFolder = document.getElementById('input-assign-new-folder');
    const btnAssignQuickAdd = document.getElementById('btn-assign-quick-add');
    const btnAssignQuickClear = document.getElementById('btn-assign-quick-clear');
    const assignFolderSearchInput = document.getElementById('assign-folder-search-input');
    const btnAssignClearSearch = document.getElementById('btn-assign-clear-search');
    const assignSelectedCountBadge = document.getElementById('assign-selected-count-badge');
    const btnAssignSelectAll = document.getElementById('btn-assign-select-all');
    const btnAssignClearAll = document.getElementById('btn-assign-clear-all');

    const modalPdfProgress = document.getElementById('modal-pdf-progress');
    const pdfProgressFolderTitle = document.getElementById('pdf-progress-folder-title');
    const pdfProgressDirBadge = document.getElementById('pdf-progress-dir-badge');
    const pdfProgressDirName = document.getElementById('pdf-progress-dir-name');
    const pdfProgressStatus = document.getElementById('pdf-progress-status');
    const pdfProgressBar = document.getElementById('pdf-progress-bar');
    const folderPdfStage = document.getElementById('folder-pdf-stage');

    let currentAssignMonster = null;

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
        const folderVal = activeFolderId ? encodeURIComponent(activeFolderId) : '';

        mainList.innerHTML = `<div style="text-align: center; color: #aaa; padding: 20px;">Loading database...</div>`;

        const auth = window.PathMonsterDBAuth || window.PathGMAuth;
        const headers = (auth && typeof auth.getAuthHeaders === 'function')
            ? auth.getAuthHeaders()
            : {};

        fetch(`/api/search?name=${nameVal}&cr=${crVal}&type=${typeVal}&size=${sizeVal}&alignment=${alignVal}&environment=${envVal}&category=${catVal}&sort=${sortVal}&folder=${folderVal}&page=${currentPage}&per_page=${itemsPerPage}&_t=${Date.now()}`, {
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

    function resetAllFilters() {
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
    }

    const resetButtons = [
        document.getElementById('btn-reset-filters'),
        document.getElementById('btn-reset-filters-bar'),
        document.getElementById('mob-btn-reset-filters')
    ].filter(Boolean);

    resetButtons.forEach(btn => {
        btn.addEventListener('click', resetAllFilters);
    });


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
            const starSvg = `<svg class="action-icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="${m.IsFavorite ? '#fbbf24' : 'none'}" stroke="${m.IsFavorite ? '#fbbf24' : 'currentColor'}" stroke-width="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
            const starBtnHtml = `<button type="button" class="card-rail-btn star-btn ${m.IsFavorite ? 'active' : ''}" title="${m.IsFavorite ? 'Remove from Favorites' : 'Add to Favorites'}">${starSvg}</button>`;

            const mKey = getMonsterKey(m);
            card.setAttribute('data-monster-key', mKey);
            const inFolders = (window.allUserFolders || []).filter(f => isMonsterInFolder(f, m));
            const inAnyFolder = inFolders.length > 0;
            const folderTooltip = inAnyFolder ? `In folders: ${inFolders.map(f => f.name).join(', ')}` : 'Add to Folder';
            const folderSvg = `<svg class="action-icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="${inAnyFolder ? '#fbbf24' : 'none'}" stroke="${inAnyFolder ? '#fbbf24' : 'currentColor'}" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
            const folderCountBadge = inFolders.length > 0 ? `<span class="card-folder-badge">${inFolders.length}</span>` : '';
            const folderBtnHtml = `<button type="button" class="card-rail-btn folder-card-btn ${inAnyFolder ? 'in-folder' : ''}" title="${folderTooltip}">${folderSvg}${folderCountBadge}</button>`;

            const leftIconsHtml = `
                <div class="card-action-rail">
                    ${starBtnHtml}
                    ${folderBtnHtml}
                </div>
            `;

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
                    ${leftIconsHtml}
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
                    ${leftIconsHtml}
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
                                        loadFolders().then(() => {
                                            updateActiveFolderUI();
                                            loadData();
                                        });
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

            const folderCardBtn = card.querySelector('.folder-card-btn');
            if (folderCardBtn) {
                folderCardBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openAssignFolderModal(m);
                });
            }



            mainList.appendChild(card);
        });
    }

    restoreFiltersFromStorage();
    loadFolders().then(() => {
        loadData();
    });
    window.addEventListener('pathgm:auth', () => {
        loadFolders().then(() => {
            loadData();
        });
    });

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
                loadFolders();
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
        { id: 'theme-astral-silver', name: 'Astral Silver', type: 'light', bg: '#f0f4f9', fg: '#0f172a', accent: '#1d4ed8' },
        { id: 'theme-elven-grove', name: 'Elven Grove', type: 'light', bg: '#f4f8f3', fg: '#142918', accent: '#15803d' },
        { id: 'theme-sunken-pearl', name: 'Sunken Pearl', type: 'light', bg: '#f0fdfa', fg: '#042f2e', accent: '#0f766e' },
        { id: 'theme-mythic-rose', name: 'Mythic Rose', type: 'light', bg: '#fff1f2', fg: '#4c0519', accent: '#be123c' },
        { id: 'theme-modern-dark', name: 'Modern Dark', type: 'dark', bg: '#0f172a', fg: '#f8fafc', accent: '#38bdf8' },
        { id: 'theme-obsidian', name: 'Obsidian Amber', type: 'dark', bg: '#18181b', fg: '#fafafa', accent: '#eab308' },
        { id: 'theme-golden-hour', name: 'Golden Hour', type: 'dark', bg: '#161922', fg: '#fef08a', accent: '#f59e0b' },
        { id: 'theme-midnight', name: 'Midnight Arcana', type: 'dark', bg: '#020617', fg: '#e2e8f0', accent: '#818cf8' },
        { id: 'theme-crimson', name: 'Crimson Blood', type: 'dark', bg: '#1c0707', fg: '#fecaca', accent: '#ef4444' },
        { id: 'theme-infernal', name: 'Infernal Abyss', type: 'dark', bg: '#180a0a', fg: '#fed7aa', accent: '#f97316' },
        { id: 'theme-emerald', name: 'Emerald Forest', type: 'dark', bg: '#051a0f', fg: '#d1fae5', accent: '#10b981' },
        { id: 'theme-cyberpunk', name: 'Cyber Neon', type: 'dark', bg: '#060813', fg: '#00f0ff', accent: '#ff007f' },
        { id: 'theme-royal', name: 'Royal Purple', type: 'dark', bg: '#150a21', fg: '#fae8ff', accent: '#d946ef' },
        { id: 'theme-abyssal', name: 'Abyssal Void', type: 'dark', bg: '#080808', fg: '#f5d0d0', accent: '#dc2626' },
        { id: 'theme-celestial', name: 'Celestial Gold', type: 'dark', bg: '#17120a', fg: '#fef08a', accent: '#eab308' },
        { id: 'theme-draconic', name: 'Draconic Scale', type: 'dark', bg: '#140c0c', fg: '#fed7aa', accent: '#dc2626' },
        { id: 'theme-underdark', name: 'Underdark Cavern', type: 'dark', bg: '#0f0f12', fg: '#e2e8f0', accent: '#a855f7' },
        { id: 'theme-frostburn', name: 'Frostburn Glacier', type: 'dark', bg: '#06151f', fg: '#e0f2fe', accent: '#38bdf8' },
        { id: 'theme-shadowfell', name: 'Shadowfell Mist', type: 'dark', bg: '#121316', fg: '#cbd5e1', accent: '#64748b' },
        { id: 'theme-solar', name: 'Solar Radiance', type: 'dark', bg: '#1c1507', fg: '#fef9c3', accent: '#f59e0b' },
        { id: 'theme-runic', name: 'Runic Stone', type: 'dark', bg: '#1c1917', fg: '#e7e5e4', accent: '#06b6d4' },
        { id: 'theme-leviathan', name: 'Leviathan Trench', type: 'dark', bg: '#03111b', fg: '#ecfeff', accent: '#06b6d4' },
        { id: 'theme-blood-moon', name: 'Blood Moon', type: 'dark', bg: '#140206', fg: '#ffe4e6', accent: '#e11d48' },
        { id: 'theme-spectral', name: 'Spectral Necropolis', type: 'dark', bg: '#04120e', fg: '#d1fae5', accent: '#10b981' },
        { id: 'theme-molten-forge', name: 'Molten Forge', type: 'dark', bg: '#160803', fg: '#ffedd5', accent: '#f97316' },
        { id: 'theme-tempest', name: 'Tempest Storm', type: 'dark', bg: '#080d1a', fg: '#e0e7ff', accent: '#6366f1' },
        { id: 'theme-eldritch-void', name: 'Eldritch Void', type: 'dark', bg: '#0d0417', fg: '#f5d0fe', accent: '#c026d3' },
        { id: 'theme-toxic-hive', name: 'Toxic Hive', type: 'dark', bg: '#0e1404', fg: '#ecfccb', accent: '#84cc16' }
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

    // =========================================================================
    // FOLDER / COLLECTION MANAGEMENT & MULTI-PAGE PDF GENERATION ENGINE
    // =========================================================================

    function loadFolders() {
        const auth = window.PathMonsterDBAuth || window.PathGMAuth;
        const headers = (auth && typeof auth.getAuthHeaders === 'function') ? auth.getAuthHeaders() : {};

        return fetch('/api/folders?_t=' + Date.now(), { headers: headers, cache: 'no-store' })
            .then(r => r.json())
            .then(res => {
                if (res.status === 'ok') {
                    window.allUserFolders = res.folders || [];
                    if (res.total_custom !== undefined) {
                        window.totalCustomMonstersCount = res.total_custom;
                    }
                    renderFolderSelectOptions();
                    renderFolderPills();
                    updateActiveFolderUI();
                }
            })
            .catch(err => console.warn('Could not load folders:', err));
    }

    function renderFolderSelectOptions() {
        if (!selectActiveFolder) return;
        const prevVal = selectActiveFolder.value || activeFolderId;
        const countCustom = (window.totalCustomMonstersCount !== undefined) ? ` (${window.totalCustomMonstersCount})` : '';
        selectActiveFolder.innerHTML = `<option value="">🌐 All Monsters (Custom Collection)${countCustom}</option>`;
        (window.allUserFolders || []).forEach(f => {
            const count = Array.isArray(f.monster_keys) ? f.monster_keys.length : 0;
            const opt = document.createElement('option');
            opt.value = f.id;
            opt.textContent = `📁 ${f.name} (${count})`;
            if (f.id === prevVal) opt.selected = true;
            selectActiveFolder.appendChild(opt);
        });
        if (prevVal && selectActiveFolder.value !== prevVal) {
            selectActiveFolder.value = prevVal;
        }
    }

    function renderFolderPills() {
        const carousel = document.getElementById('folder-pills-carousel');
        if (!carousel) return;
        carousel.innerHTML = '';

        // 1. "All Monsters" Pill
        const allPill = document.createElement('button');
        allPill.type = 'button';
        allPill.className = `folder-pill ${!activeFolderId ? 'active' : ''}`;
        const customDisplay = (window.totalCustomMonstersCount !== undefined) ? window.totalCustomMonstersCount : '...';
        allPill.innerHTML = `
            <span class="pill-icon">🌐</span>
            <span class="pill-name">All Monsters</span>
            <span class="pill-count" title="${customDisplay} custom monsters">${customDisplay} Custom</span>
        `;
        allPill.addEventListener('click', () => {
            if (activeFolderId) {
                activeFolderId = '';
                if (selectActiveFolder) selectActiveFolder.value = '';
                updateActiveFolderUI();
                currentPage = 1;
                loadData();
            }
        });
        carousel.appendChild(allPill);

        // 2. Folder Pills
        (window.allUserFolders || []).forEach(f => {
            const count = Array.isArray(f.monster_keys) ? f.monster_keys.length : 0;
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = `folder-pill ${f.id === activeFolderId ? 'active' : ''}`;
            pill.dataset.folderId = f.id;
            pill.innerHTML = `
                <span class="pill-icon">📁</span>
                <span class="pill-name">${f.name}</span>
                <span class="pill-count">${count}</span>
            `;
            pill.addEventListener('click', () => {
                activeFolderId = f.id;
                if (selectActiveFolder) selectActiveFolder.value = f.id;
                updateActiveFolderUI();
                currentPage = 1;
                loadData();
            });
            carousel.appendChild(pill);
        });
    }

    function updateActiveFolderUI() {
        const currentFolder = (window.allUserFolders || []).find(f => f.id === activeFolderId);
        const folderMgmtSuite = document.getElementById('folder-mgmt-suite');
        const activeFolderBadgeIcon = document.getElementById('active-folder-badge-icon');
        const activeFolderStatusTag = document.getElementById('active-folder-status-tag');

        if (currentFolder) {
            if (folderActiveActions) folderActiveActions.style.display = 'flex';
            if (activeFolderBadgeIcon) activeFolderBadgeIcon.textContent = '📁';
            if (activeFolderNameText) activeFolderNameText.textContent = currentFolder.name;
            const count = Array.isArray(currentFolder.monster_keys) ? currentFolder.monster_keys.length : 0;
            if (activeFolderCountText) activeFolderCountText.textContent = `(${count} monsters)`;
            if (activeFolderStatusTag) activeFolderStatusTag.textContent = 'ACTIVE COLLECTION VIEW';
            if (folderMgmtSuite) folderMgmtSuite.style.display = 'flex';
            if (selectActiveFolder) selectActiveFolder.value = currentFolder.id;
        } else {
            // "All Monsters" Collection View -> Treat like a virtual folder for all custom monsters!
            if (folderActiveActions) folderActiveActions.style.display = 'flex';
            if (activeFolderBadgeIcon) activeFolderBadgeIcon.textContent = '🌐';
            if (activeFolderNameText) activeFolderNameText.textContent = 'All Monsters (Custom)';
            const count = window.totalCustomMonstersCount !== undefined ? window.totalCustomMonstersCount : 0;
            if (activeFolderCountText) activeFolderCountText.textContent = `(${count} custom monsters)`;
            if (activeFolderStatusTag) activeFolderStatusTag.textContent = 'ALL CUSTOM MONSTERS';
            if (folderMgmtSuite) folderMgmtSuite.style.display = 'none';
            activeFolderId = '';
            if (selectActiveFolder) selectActiveFolder.value = '';
        }

        // Sync pill buttons active highlight
        const pills = document.querySelectorAll('.folder-pill');
        pills.forEach(pill => {
            if (!activeFolderId) {
                pill.classList.toggle('active', !pill.dataset.folderId);
            } else {
                pill.classList.toggle('active', pill.dataset.folderId === activeFolderId);
            }
        });
    }

    if (selectActiveFolder) {
        selectActiveFolder.addEventListener('change', (e) => {
            activeFolderId = e.target.value;
            updateActiveFolderUI();
            currentPage = 1;
            loadData();
        });
    }

    if (btnFolderClear) {
        btnFolderClear.addEventListener('click', () => {
            activeFolderId = '';
            if (selectActiveFolder) selectActiveFolder.value = '';
            updateActiveFolderUI();
            currentPage = 1;
            loadData();
        });
    }

    if (btnCreateFolder) {
        btnCreateFolder.addEventListener('click', () => {
            openFolderEditor();
        });
    }

    if (btnFolderRename) {
        btnFolderRename.addEventListener('click', () => {
            const currentFolder = (window.allUserFolders || []).find(f => f.id === activeFolderId);
            if (currentFolder) {
                openFolderEditor(currentFolder);
            }
        });
    }

    if (btnFolderDelete) {
        btnFolderDelete.addEventListener('click', () => {
            const currentFolder = (window.allUserFolders || []).find(f => f.id === activeFolderId);
            if (!currentFolder) return;
            if (confirm(`Are you sure you want to delete folder "${currentFolder.name}"? (Monsters will remain in the database).`)) {
                const auth = window.PathMonsterDBAuth || window.PathGMAuth;
                const headers = (auth && typeof auth.getAuthHeaders === 'function') ? auth.getAuthHeaders() : {};
                fetch(`/api/folders/${currentFolder.id}`, { method: 'DELETE', headers: headers })
                    .then(r => r.json())
                    .then(res => {
                        if (res.status === 'ok') {
                            if (auth && typeof auth.showToast === 'function') {
                                auth.showToast(`🗑️ Folder "${currentFolder.name}" deleted.`, 'info');
                            }
                            activeFolderId = '';
                            loadFolders().then(() => {
                                currentPage = 1;
                                loadData();
                            });
                        } else {
                            alert('Failed to delete folder: ' + (res.message || 'Error'));
                        }
                    })
                    .catch(err => alert('Delete error: ' + err.message));
            }
        });
    }

    function openFolderEditor(folder = null) {
        if (!modalFolderEditor) return;
        if (folder) {
            modalFolderTitle.textContent = '✏️ Rename Folder';
            folderEditId.value = folder.id;
            folderNameInput.value = folder.name || '';
            folderDescInput.value = folder.description || '';
        } else {
            modalFolderTitle.textContent = '📁 New Folder';
            folderEditId.value = '';
            folderNameInput.value = '';
            folderDescInput.value = '';
        }
        modalFolderEditor.classList.add('active');
        setTimeout(() => folderNameInput.focus(), 50);
    }

    function closeFolderEditor() {
        if (modalFolderEditor) modalFolderEditor.classList.remove('active');
    }

    if (btnCloseFolderModal) btnCloseFolderModal.addEventListener('click', closeFolderEditor);
    if (btnCancelFolder) btnCancelFolder.addEventListener('click', closeFolderEditor);

    if (btnSaveFolder) {
        btnSaveFolder.addEventListener('click', () => {
            const name = folderNameInput.value.trim();
            if (!name) {
                alert('Please enter a folder name.');
                return;
            }
            const auth = window.PathMonsterDBAuth || window.PathGMAuth;
            const headers = (auth && typeof auth.getAuthHeaders === 'function') ? auth.getAuthHeaders() : {};
            headers['Content-Type'] = 'application/json';

            const payload = {
                name: name,
                description: folderDescInput.value.trim()
            };
            if (folderEditId.value) {
                payload.id = folderEditId.value;
            }

            fetch('/api/folders', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            })
                .then(r => r.json())
                .then(res => {
                    if (res.status === 'ok' && res.folder) {
                        closeFolderEditor();
                        if (auth && typeof auth.showToast === 'function') {
                            auth.showToast(`📁 Folder "${res.folder.name}" saved!`, 'success');
                        }
                        activeFolderId = res.folder.id;
                        loadFolders().then(() => {
                            currentPage = 1;
                            loadData();
                        });
                    } else {
                        alert('Could not save folder: ' + (res.message || 'Error'));
                    }
                })
                .catch(err => alert('Save folder error: ' + err.message));
        });
    }

    // ==========================================================================
    // REVAMPED MODAL ASSIGN MONSTER TO FOLDER SYSTEM
    // ==========================================================================

    let assignFolderSearchQuery = '';

    function getMonsterKey(m) {
        if (!m) return '';
        return m.monster_key || (m.IsUserCustom ? ('custom:' + (m.id || '')) : ('official:' + (m.Name || '').toLowerCase()));
    }

    function isMonsterInFolder(folder, m) {
        if (!folder || !m) return false;
        const keys = folder.monster_keys || [];
        const mKey = getMonsterKey(m);
        const mId = m.id ? String(m.id) : '';
        const mName = (m.Name || '').toLowerCase();
        return keys.some(k => {
            if (!k) return false;
            if (k === mKey) return true;
            if (mId && (k === mId || k === `custom:${mId}`)) return true;
            if (k === `official:${mName}` || k.startsWith(`official:${mName}:`)) return true;
            if (m.AuthorId && k === `custom:${m.AuthorId}:${mName}`) return true;
            if (m.AuthorName && k === `custom:${String(m.AuthorName).toLowerCase()}:${mName}`) return true;
            return false;
        });
    }

    function updateMainCardFolderStatus(monster) {
        if (!monster) return;
        const mKey = getMonsterKey(monster);
        const inFolders = (window.allUserFolders || []).filter(f => isMonsterInFolder(f, monster));
        const inAnyFolder = inFolders.length > 0;
        const folderTooltip = inAnyFolder ? `In folders: ${inFolders.map(f => f.name).join(', ')}` : 'Add to Folder';

        const cards = document.querySelectorAll(`.monster-card[data-monster-key="${CSS.escape(mKey)}"]`);
        cards.forEach(card => {
            const btn = card.querySelector('.folder-card-btn');
            if (btn) {
                btn.classList.toggle('in-folder', inAnyFolder);
                btn.title = folderTooltip;
                const folderSvg = `<svg class="action-icon-svg" viewBox="0 0 24 24" width="14" height="14" fill="${inAnyFolder ? '#fbbf24' : 'none'}" stroke="${inAnyFolder ? '#fbbf24' : 'currentColor'}" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
                const folderCountBadge = inFolders.length > 0 ? `<span class="card-folder-badge">${inFolders.length}</span>` : '';
                btn.innerHTML = `${folderSvg}${folderCountBadge}`;
            }
        });
    }

    function openAssignFolderModal(monster) {
        currentAssignMonster = monster;
        if (!modalAssignFolder) return;

        // Reset search filter & quick input
        assignFolderSearchQuery = '';
        if (assignFolderSearchInput) assignFolderSearchInput.value = '';
        if (btnAssignClearSearch) btnAssignClearSearch.style.display = 'none';
        if (inputAssignNewFolder) inputAssignNewFolder.value = '';
        if (btnAssignQuickClear) btnAssignQuickClear.style.display = 'none';

        // Backdrop click to close
        if (!modalAssignFolder._hasBackdropListener) {
            modalAssignFolder.addEventListener('click', (e) => {
                if (e.target === modalAssignFolder) closeAssignFolderModal();
            });
            modalAssignFolder._hasBackdropListener = true;
        }

        // Populate Monster Hero Banner
        const mName = monster.Name || 'Creature';
        const crVal = (monster.CR !== undefined && monster.CR !== null && monster.CR !== '') ? monster.CR : '-';
        if (assignMonsterName) assignMonsterName.textContent = mName;
        if (assignMonsterCrBadge) assignMonsterCrBadge.textContent = `CR ${crVal}`;

        // Submeta / Creature Type & Alignment
        if (assignMonsterTypeBadge) {
            const metaTokens = [];
            if (monster.Alignment) metaTokens.push(monster.Alignment);
            if (monster.Size) metaTokens.push(monster.Size);
            if (monster.Type) metaTokens.push(monster.Type);
            assignMonsterTypeBadge.textContent = metaTokens.length > 0 
                ? metaTokens.join(' ') 
                : (monster.IsUserCustom ? 'Custom Monster' : 'Pathfinder Monster');
        }

        renderAssignFolderList();
        modalAssignFolder.classList.add('active');

        // Smooth focus on quick create input
        setTimeout(() => {
            if (inputAssignNewFolder) inputAssignNewFolder.focus();
        }, 120);
    }

    function closeAssignFolderModal() {
        if (modalAssignFolder) modalAssignFolder.classList.remove('active');
        currentAssignMonster = null;
    }

    if (btnCloseAssignModal) btnCloseAssignModal.addEventListener('click', closeAssignFolderModal);
    if (btnAssignDone) btnAssignDone.addEventListener('click', closeAssignFolderModal);

    // Escape key closes modal
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalAssignFolder && modalAssignFolder.classList.contains('active')) {
            closeAssignFolderModal();
        }
    });

    // Quick clear for new folder input
    if (inputAssignNewFolder) {
        inputAssignNewFolder.addEventListener('input', () => {
            if (btnAssignQuickClear) {
                btnAssignQuickClear.style.display = inputAssignNewFolder.value ? 'block' : 'none';
            }
        });
    }

    if (btnAssignQuickClear) {
        btnAssignQuickClear.addEventListener('click', () => {
            if (inputAssignNewFolder) {
                inputAssignNewFolder.value = '';
                inputAssignNewFolder.focus();
            }
            btnAssignQuickClear.style.display = 'none';
        });
    }

    // Inline Quick Create Folder Action with Smart Duplicate Detection
    function handleQuickCreateFolder() {
        const m = currentAssignMonster;
        if (!m || !inputAssignNewFolder) return;
        const name = (inputAssignNewFolder.value || '').trim();
        if (!name) {
            inputAssignNewFolder.focus();
            return;
        }

        const auth = window.PathMonsterDBAuth || window.PathGMAuth;
        const headers = (auth && typeof auth.getAuthHeaders === 'function') ? auth.getAuthHeaders() : {};
        headers['Content-Type'] = 'application/json';
        const mKey = getMonsterKey(m);

        // Check if folder already exists (smart handling)
        const existing = (window.allUserFolders || []).find(f => (f.name || '').trim().toLowerCase() === name.toLowerCase());
        if (existing) {
            inputAssignNewFolder.value = '';
            if (btnAssignQuickClear) btnAssignQuickClear.style.display = 'none';
            const isAlreadyIn = isMonsterInFolder(existing, m);
            if (!isAlreadyIn) {
                const itemEl = assignFoldersList.querySelector(`[data-folder-id="${existing.id}"]`);
                if (itemEl) toggleFolderAssignment(existing, itemEl, true);
                if (auth && typeof auth.showToast === 'function') {
                    auth.showToast(`📁 The folder "${existing.name}" already exists; "${m.Name}" was added.`, 'info');
                }
            } else {
                if (auth && typeof auth.showToast === 'function') {
                    auth.showToast(`ℹ️ "${m.Name}" is already in "${existing.name}".`, 'info');
                }
            }
            // Scroll to existing card & give it a subtle pulse
            const targetCard = assignFoldersList.querySelector(`[data-folder-id="${existing.id}"]`);
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                targetCard.classList.add('highlight-pulse');
                setTimeout(() => targetCard.classList.remove('highlight-pulse'), 1300);
            }
            return;
        }

        if (btnAssignQuickAdd) {
            btnAssignQuickAdd.disabled = true;
            btnAssignQuickAdd.innerHTML = '<span>⏳ Adding...</span>';
        }

        fetch('/api/folders', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ name: name, monster_keys: [mKey] })
        })
            .then(r => r.json())
            .then(res => {
                if (res.status === 'ok') {
                    inputAssignNewFolder.value = '';
                    if (btnAssignQuickClear) btnAssignQuickClear.style.display = 'none';
                    if (auth && typeof auth.showToast === 'function') {
                        auth.showToast(`📁 Created "${res.folder.name}" and added "${m.Name}"!`, 'success');
                    }
                    return loadFolders().then(() => {
                        renderAssignFolderList();
                        renderFolderSelectOptions();
                        renderFolderPills();
                        updateMainCardFolderStatus(m);
                        if (activeFolderId) loadData();

                        // Highlight newly created card
                        const newCard = assignFoldersList.querySelector(`[data-folder-id="${res.folder.id}"]`);
                        if (newCard) {
                            newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            newCard.classList.add('highlight-pulse');
                            setTimeout(() => newCard.classList.remove('highlight-pulse'), 1300);
                        }
                    });
                } else {
                    alert('Could not create folder: ' + (res.message || 'Unknown error'));
                }
            })
            .catch(err => alert('Error: ' + err.message))
            .finally(() => {
                if (btnAssignQuickAdd) {
                    btnAssignQuickAdd.disabled = false;
                    btnAssignQuickAdd.innerHTML = '<span>➕ Create &amp; Assign</span>';
                }
            });
    }

    if (assignQuickCreateForm) {
        assignQuickCreateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleQuickCreateFolder();
        });
    }

    if (btnAssignQuickAdd) {
        btnAssignQuickAdd.addEventListener('click', (e) => {
            e.preventDefault();
            handleQuickCreateFolder();
        });
    }

    // Backward compatibility for legacy button
    if (btnAssignNewFolder) {
        btnAssignNewFolder.addEventListener('click', () => {
            if (inputAssignNewFolder) {
                inputAssignNewFolder.focus();
                inputAssignNewFolder.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    // Live Search Event Listeners
    if (assignFolderSearchInput) {
        assignFolderSearchInput.addEventListener('input', (e) => {
            assignFolderSearchQuery = e.target.value || '';
            if (btnAssignClearSearch) {
                btnAssignClearSearch.style.display = assignFolderSearchQuery ? 'block' : 'none';
            }
            renderAssignFolderList();
        });

        // Pressing Enter in search toggles if single result
        assignFolderSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const items = assignFoldersList.querySelectorAll('.assign-folder-item');
                if (items.length === 1) {
                    items[0].click();
                }
            }
        });
    }

    if (btnAssignClearSearch) {
        btnAssignClearSearch.addEventListener('click', () => {
            assignFolderSearchQuery = '';
            if (assignFolderSearchInput) {
                assignFolderSearchInput.value = '';
                assignFolderSearchInput.focus();
            }
            btnAssignClearSearch.style.display = 'none';
            renderAssignFolderList();
        });
    }

    // Batch Actions: Select All & Clear All
    if (btnAssignSelectAll) {
        btnAssignSelectAll.addEventListener('click', () => {
            if (!currentAssignMonster || !assignFoldersList) return;
            const items = assignFoldersList.querySelectorAll('.assign-folder-item:not(.selected)');
            items.forEach(item => {
                const fId = item.getAttribute('data-folder-id');
                const folder = (window.allUserFolders || []).find(f => f.id === fId);
                if (folder) toggleFolderAssignment(folder, item, true);
            });
        });
    }

    if (btnAssignClearAll) {
        btnAssignClearAll.addEventListener('click', () => {
            if (!currentAssignMonster || !assignFoldersList) return;
            const items = assignFoldersList.querySelectorAll('.assign-folder-item.selected');
            items.forEach(item => {
                const fId = item.getAttribute('data-folder-id');
                const folder = (window.allUserFolders || []).find(f => f.id === fId);
                if (folder) toggleFolderAssignment(folder, item, false);
            });
        });
    }

    function toggleFolderAssignment(folder, itemEl, forceState) {
        if (!currentAssignMonster || !folder) return;
        const m = currentAssignMonster;
        const mKey = getMonsterKey(m);
        const cb = itemEl ? itemEl.querySelector('input[type="checkbox"]') : null;
        const currentlyChecked = cb ? cb.checked : isMonsterInFolder(folder, m);
        const nextState = forceState !== undefined ? forceState : !currentlyChecked;

        if (currentlyChecked === nextState) return;

        // Optimistic UI updates
        if (cb) cb.checked = nextState;
        if (itemEl) {
            itemEl.classList.toggle('selected', nextState);
            itemEl.setAttribute('aria-checked', nextState ? 'true' : 'false');
            const checkBadge = itemEl.querySelector('.assign-custom-check');
            if (checkBadge) checkBadge.textContent = nextState ? '✓' : '';
            const statusTag = itemEl.querySelector('.assign-folder-status');
            if (statusTag) statusTag.textContent = nextState ? '✓ Added' : '+ Add';
        }

        if (!Array.isArray(folder.monster_keys)) folder.monster_keys = [];
        if (nextState) {
            if (!folder.monster_keys.includes(mKey)) folder.monster_keys.push(mKey);
        } else {
            const mId = m.id ? String(m.id) : '';
            const mName = (m.Name || '').toLowerCase();
            folder.monster_keys = folder.monster_keys.filter(k => {
                if (k === mKey) return false;
                if (mId && (k === mId || k === `custom:${mId}`)) return false;
                if (k === `official:${mName}` || k.startsWith(`official:${mName}:`)) return false;
                if (m.AuthorId && k === `custom:${m.AuthorId}:${mName}`) return false;
                if (m.AuthorName && k === `custom:${String(m.AuthorName).toLowerCase()}:${mName}`) return false;
                return true;
            });
        }

        if (itemEl) {
            const countSpan = itemEl.querySelector('.assign-folder-count');
            if (countSpan) countSpan.textContent = `${folder.monster_keys.length} monsters`;
        }

        // Update hero badge count & selection counter
        const folders = window.allUserFolders || [];
        const totalAssigned = folders.filter(f => isMonsterInFolder(f, m)).length;
        if (assignMonsterFoldersBadge) {
            assignMonsterFoldersBadge.textContent = totalAssigned === 0 
                ? 'Not in a folder yet' 
                : `In ${totalAssigned} folders`;
            assignMonsterFoldersBadge.style.color = totalAssigned > 0 ? '#6ee7b7' : '#94a3b8';
            assignMonsterFoldersBadge.style.borderColor = totalAssigned > 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)';
        }
        if (assignSelectedCountBadge) {
            assignSelectedCountBadge.textContent = `${totalAssigned} / ${folders.length} folders selected`;
        }

        // Live update on the main page card
        updateMainCardFolderStatus(m);

        // Send API request in background
        const auth = window.PathMonsterDBAuth || window.PathGMAuth;
        const headers = (auth && typeof auth.getAuthHeaders === 'function') ? auth.getAuthHeaders() : {};
        headers['Content-Type'] = 'application/json';
        const endpoint = nextState ? '/api/folders/add' : '/api/folders/remove';

        fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ folder_id: folder.id, monster_key: mKey })
        })
            .then(r => r.json())
            .then(res => {
                if (res.status === 'ok') {
                    if (auth && typeof auth.showToast === 'function') {
                        auth.showToast(nextState ? `➕ Added "${m.Name}" to "${folder.name}".` : `➖ Removed "${m.Name}" from "${folder.name}".`, 'info');
                    }
                    if (res.folder) {
                        const targetFolder = (window.allUserFolders || []).find(f => f.id === res.folder.id);
                        if (targetFolder) {
                            targetFolder.monster_keys = res.folder.monster_keys || [];
                            targetFolder.name = res.folder.name;
                        }
                    }
                    renderFolderSelectOptions();
                    renderFolderPills();
                    updateActiveFolderUI();
                    updateMainCardFolderStatus(m);
                    if (itemEl && res.folder) {
                        const countSpan = itemEl.querySelector('.assign-folder-count');
                        if (countSpan) countSpan.textContent = `${(res.folder.monster_keys || []).length} monsters`;
                    }
                    if (activeFolderId) {
                        loadData();
                    }
                } else {
                    throw new Error(res.message || 'Folder update failed');
                }
            })
            .catch(err => {
                console.error('Folder toggle error:', err);
                if (auth && typeof auth.showToast === 'function') {
                    auth.showToast('Operation failed: ' + err.message, 'error');
                }
                loadFolders().then(() => renderAssignFolderList());
            });
    }

    function renderAssignFolderList() {
        if (!assignFoldersList || !currentAssignMonster) return;
        const m = currentAssignMonster;
        const mKey = getMonsterKey(m);
        assignFoldersList.innerHTML = '';

        const folders = window.allUserFolders || [];
        const assignedCount = folders.filter(f => isMonsterInFolder(f, m)).length;

        // Update Hero status pill
        if (assignMonsterFoldersBadge) {
            assignMonsterFoldersBadge.textContent = assignedCount === 0 
                ? 'Not in a folder yet' 
                : `In ${assignedCount} folders`;
            assignMonsterFoldersBadge.style.color = assignedCount > 0 ? '#6ee7b7' : '#94a3b8';
            assignMonsterFoldersBadge.style.borderColor = assignedCount > 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(255, 255, 255, 0.1)';
        }

        // Update Selected count badge
        if (assignSelectedCountBadge) {
            assignSelectedCountBadge.textContent = `${assignedCount} / ${folders.length} folders selected`;
        }

        // Sort folders: folders containing the monster come first, then alphabetical
        const sortedFolders = [...folders].sort((a, b) => {
            const aIn = isMonsterInFolder(a, m) ? 0 : 1;
            const bIn = isMonsterInFolder(b, m) ? 0 : 1;
            if (aIn !== bIn) return aIn - bIn;
            return (a.name || '').localeCompare(b.name || '');
        });

        // Filter folders by search query
        const query = (assignFolderSearchQuery || '').trim().toLowerCase();
        const filteredFolders = query 
            ? sortedFolders.filter(f => (f.name || '').toLowerCase().includes(query))
            : sortedFolders;

        // Empty state when no folders exist at all
        if (folders.length === 0) {
            assignFoldersList.innerHTML = `
                <div class="assign-empty-state">
                    <div class="assign-empty-icon">📂</div>
                    <div class="assign-empty-text">You haven't created any folders yet</div>
                    <div class="assign-empty-subtext">Enter a name above and press <strong>Enter</strong> to create your first folder.</div>
                </div>
            `;
            return;
        }

        // Empty state when search query matches nothing
        if (filteredFolders.length === 0) {
            assignFoldersList.innerHTML = `
                <div class="assign-empty-state">
                    <div class="assign-empty-icon">🔍</div>
                    <div class="assign-empty-text">No folders match "${assignFolderSearchQuery}"</div>
                    <div class="assign-empty-subtext">Create a new folder with this name using the field above.</div>
                </div>
            `;
            return;
        }

        // Render tactile interactive folder cards
        filteredFolders.forEach(folder => {
            const item = document.createElement('div');
            const keys = folder.monster_keys || [];
            const isChecked = isMonsterInFolder(folder, m);

            item.className = `assign-folder-item ${isChecked ? 'selected' : ''}`;
            item.setAttribute('data-folder-id', folder.id);
            item.tabIndex = 0;
            item.setAttribute('role', 'checkbox');
            item.setAttribute('aria-checked', isChecked ? 'true' : 'false');

            // Highlight matched search letters if any
            let displayTitle = folder.name || 'Folder';
            if (query) {
                const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const qRegex = new RegExp(`(${escapedQuery})`, 'gi');
                displayTitle = displayTitle.replace(qRegex, '<mark class="search-highlight">$1</mark>');
            }

            item.innerHTML = `
                <div class="assign-folder-left">
                    <div class="assign-custom-check">${isChecked ? '✓' : ''}</div>
                    <input type="checkbox" ${isChecked ? 'checked' : ''} tabindex="-1">
                    <div class="assign-folder-info">
                        <span class="assign-folder-icon">📁</span>
                        <span class="assign-folder-title" title="${folder.name}">${displayTitle}</span>
                        <span class="assign-folder-count">${keys.length} monsters</span>
                    </div>
                </div>
                <div class="assign-folder-status">${isChecked ? '✓ Added' : '+ Add'}</div>
            `;

            item.addEventListener('click', (e) => {
                e.preventDefault();
                toggleFolderAssignment(folder, item);
            });

            // Keyboard navigation: Space/Enter toggles, ArrowUp/ArrowDown navigates
            item.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggleFolderAssignment(folder, item);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const next = item.nextElementSibling;
                    if (next && next.classList.contains('assign-folder-item')) next.focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prev = item.previousElementSibling;
                    if (prev && prev.classList.contains('assign-folder-item')) prev.focus();
                }
            });

            assignFoldersList.appendChild(item);
        });
    }

    function sanitizeFileName(name, fallback = 'Monster') {
        if (!name || typeof name !== 'string') return fallback;
        const s = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
        return s || fallback;
    }

    async function getExportDirectoryHandle(folderName) {
        if (!('showDirectoryPicker' in window)) {
            return null;
        }
        try {
            const dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'downloads'
            });
            return dirHandle;
        } catch (err) {
            if (err.name === 'AbortError') {
                const useDefault = confirm(
                    `Folder selection was canceled.\n\nWould you like to download the files individually to your browser's default Downloads folder?\n(Cancel will stop the export.)`
                );
                return useDefault ? null : 'CANCELLED';
            }
            console.warn('showDirectoryPicker error or not allowed:', err);
            return null;
        }
    }

    async function writeBlobToDirectory(dirHandle, filename, blob) {
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
    }

    function triggerBlobDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            if (a.parentNode) a.parentNode.removeChild(a);
            URL.revokeObjectURL(url);
        }, 4000);
    }

    // Export Folder Monsters as Individual JSON Files
    if (btnFolderExportJson) {
        btnFolderExportJson.addEventListener('click', async () => {
            const isAll = !activeFolderId || activeFolderId === 'all';
            const currentFolder = isAll ? null : (window.allUserFolders || []).find(f => f.id === activeFolderId);
            const folderName = currentFolder ? currentFolder.name : 'All Custom Monsters';

            if (!isAll && currentFolder && (!currentFolder.monster_keys || currentFolder.monster_keys.length === 0)) {
                alert(`There are no monsters in "${folderName}" yet.`);
                return;
            }

            // Prompt target folder location once
            let dirHandle = null;
            if ('showDirectoryPicker' in window) {
                dirHandle = await getExportDirectoryHandle(folderName);
                if (dirHandle === 'CANCELLED') {
                    return;
                }
            }

            const auth = window.PathMonsterDBAuth || window.PathGMAuth;
            const headers = (auth && typeof auth.getAuthHeaders === 'function') ? auth.getAuthHeaders() : {};

            let monsters = [];
            try {
                const endpoint = isAll ? `/api/folders/all/monsters?_t=${Date.now()}` : `/api/folders/${activeFolderId}/monsters?_t=${Date.now()}`;
                const r = await fetch(endpoint, { headers: headers });
                const res = await r.json();
                if (res.status === 'ok') {
                    monsters = res.monsters || [];
                }
            } catch (err) {
                alert('JSON Export error: ' + err.message);
                return;
            }

            if (monsters.length === 0) {
                if (isAll) {
                    alert('There are no saved custom monsters yet. Create and save a monster to get started.');
                } else {
                    alert(`There are no monsters in "${folderName}" yet.`);
                }
                return;
            }

            // Open Progress Modal
            const modalTitle = document.getElementById('pdf-progress-modal-title');
            if (modalTitle) modalTitle.innerHTML = '📥 Exporting Monster JSONs';
            if (pdfProgressFolderTitle) {
                const destText = dirHandle ? ` ➔ 📂 ${dirHandle.name}` : '';
                pdfProgressFolderTitle.textContent = `📁 ${folderName} (${monsters.length} monsters)${destText}`;
            }
            if (pdfProgressDirBadge && pdfProgressDirName) {
                if (dirHandle) {
                    pdfProgressDirName.textContent = dirHandle.name;
                    pdfProgressDirBadge.style.display = 'block';
                } else {
                    pdfProgressDirBadge.style.display = 'none';
                }
            }
            if (pdfProgressStatus) pdfProgressStatus.textContent = dirHandle ? `Saving to "${dirHandle.name}"...` : 'Preparing JSON files...';
            if (pdfProgressBar) pdfProgressBar.style.width = '0%';
            if (modalPdfProgress) modalPdfProgress.classList.add('active');

            try {
                const seenNames = {};
                for (let i = 0; i < monsters.length; i++) {
                    const m = monsters[i];
                    let baseName = sanitizeFileName(m.Name || `Monster_${i + 1}`);
                    if (seenNames[baseName]) {
                        seenNames[baseName]++;
                        baseName = `${baseName}_${seenNames[baseName]}`;
                    } else {
                        seenNames[baseName] = 1;
                    }
                    const filename = `${baseName}.json`;

                    const pct = Math.round(((i + 1) / monsters.length) * 100);
                    if (pdfProgressStatus) pdfProgressStatus.textContent = dirHandle
                        ? `[${dirHandle.name}] Saving (${i + 1} / ${monsters.length}): ${filename}...`
                        : `Downloading (${i + 1} / ${monsters.length}): ${filename}...`;
                    if (pdfProgressBar) pdfProgressBar.style.width = pct + '%';

                    const prettyJson = JSON.stringify(m, null, 2);
                    const blob = new Blob([prettyJson], { type: 'application/json;charset=utf-8' });

                    if (dirHandle) {
                        await writeBlobToDirectory(dirHandle, filename, blob);
                    } else {
                        triggerBlobDownload(blob, filename);
                        if (i < monsters.length - 1) {
                            await new Promise(r => setTimeout(r, 250));
                        }
                    }
                }

                if (pdfProgressBar) pdfProgressBar.style.width = '100%';
                if (pdfProgressStatus) pdfProgressStatus.textContent = dirHandle
                    ? `All JSON files were saved to "${dirHandle.name}"! (${monsters.length} files)`
                    : `All JSON files were downloaded! (${monsters.length} files)`;
                if (auth && typeof auth.showToast === 'function') {
                    auth.showToast(dirHandle
                        ? `📥 Saved ${monsters.length} monsters from "${folderName}" to "${dirHandle.name}"!`
                        : `📥 Downloaded ${monsters.length} monsters from "${folderName}" as separate JSON files.`, 'success');
                }
            } catch (err) {
                console.error('JSON Export Error:', err);
                alert('JSON export failed: ' + (err.message || err));
            } finally {
                if (pdfProgressDirBadge) pdfProgressDirBadge.style.display = 'none';
                setTimeout(() => {
                    if (modalPdfProgress) modalPdfProgress.classList.remove('active');
                }, 1200);
            }
        });
    }

    // =========================================================================
    // MULTI-PAGE PDF GENERATION ENGINE
    // =========================================================================

    function getJsPdfConstructor() {
        if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
            return window.jspdf.jsPDF;
        }
        if (typeof window.jsPDF === 'function') {
            return window.jsPDF;
        }
        if (window.jspdf && typeof window.jspdf.default === 'function') {
            return window.jspdf.default;
        }
        return null;
    }

    async function ensureLibrariesLoaded() {
        if (typeof html2canvas !== 'function') {
            await new Promise((resolve) => {
                const s = document.createElement('script');
                s.src = '../js/vendor/html2canvas.min.js';
                s.onload = () => resolve(true);
                s.onerror = () => {
                    const cdn = document.createElement('script');
                    cdn.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                    cdn.onload = () => resolve(true);
                    cdn.onerror = () => resolve(false);
                    document.head.appendChild(cdn);
                };
                document.head.appendChild(s);
            });
        }
        if (!getJsPdfConstructor()) {
            await new Promise((resolve) => {
                const s = document.createElement('script');
                s.src = '../js/vendor/jspdf.umd.min.js';
                s.onload = () => resolve(true);
                s.onerror = () => {
                    const cdn = document.createElement('script');
                    cdn.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    cdn.onload = () => resolve(true);
                    cdn.onerror = () => resolve(false);
                    document.head.appendChild(cdn);
                };
                document.head.appendChild(s);
            });
        }
    }

    function formatStatMod(val) {
        if (val === undefined || val === null || val === '' || val === '-' || val === '—') return '(-)';
        const n = parseInt(val);
        if (isNaN(n)) return '(-)';
        const mod = Math.floor((n - 10) / 2);
        return mod >= 0 ? `(+${mod})` : `(${mod})`;
    }

    function renderMonsterStatblockHTML(m, theme) {
        if (!theme) theme = localStorage.getItem('pf_creator_theme') || 'theme-parchment';
        const s = m.OriginalState || (typeof buildEditorStateFromMonster === 'function' ? buildEditorStateFromMonster(m) : { basic: {}, dynamic: {} });
        const b = s.basic || {};
        const d = s.dynamic || {};

        const name = m.Name || b['in-name'] || 'Unnamed Creature';
        const cr = m.CR || b['in-cr'] || '1';
        const xp = m.XP || b['in-xp'] || '';
        const align = b['in-alignment'] || m.Alignment || 'N';
        const size = b['in-size'] || m.Size || 'Medium';
        const type = b['in-type'] || m.Type || 'Humanoid';
        const typeFull = b['in-type-full'] || '';

        const initVal = m.Init ? String(m.Init) : '+0';
        const init = (initVal.startsWith('+') || initVal.startsWith('-')) ? initVal : `+${initVal}`;
        const senses = m.Senses || 'Perception +0';
        const aura = m.Aura || b['in-aura'] || '';

        // Defense
        const acTotal = m.AC || b['in-ac-natural'] || '10';
        const acMods = m.AC_Mods ? ` (${m.AC_Mods})` : '';
        const hp = m.HP || '10';
        const hd = m.HD ? ` (${m.HD})` : '';

        const formatS = (val) => {
            if (val === undefined || val === null || val === '') return '+0';
            const strVal = String(val).trim();
            if (strVal.startsWith('+') || strVal.startsWith('-')) return strVal;
            return (parseFloat(strVal) >= 0 ? "+" : "") + strVal;
        };

        const fort = formatS(m.Fort || b['in-fort']);
        const ref = formatS(m.Ref || b['in-ref']);
        const will = formatS(m.Will || b['in-will']);

        const defExtrasParts = [];
        if (m.DefensiveAbilities || b['in-def-abilities']) defExtrasParts.push(`<strong>Defensive Abilities</strong> ${m.DefensiveAbilities || b['in-def-abilities']}`);
        if (m.DR || b['in-dr']) defExtrasParts.push(`<strong>DR</strong> ${m.DR || b['in-dr']}`);
        if (m.Immune || b['in-immune']) defExtrasParts.push(`<strong>Immune</strong> ${m.Immune || b['in-immune']}`);
        if (m.Resist || b['in-resist']) defExtrasParts.push(`<strong>Resist</strong> ${m.Resist || b['in-resist']}`);
        if (m.SR || b['in-sr']) defExtrasParts.push(`<strong>SR</strong> ${m.SR || b['in-sr']}`);
        if (m.Weaknesses || b['in-weaknesses']) defExtrasParts.push(`<strong>Weaknesses</strong> ${m.Weaknesses || b['in-weaknesses']}`);
        const defExtras = defExtrasParts.join('; ');

        // Offense
        const speed = m.Speed || b['in-speed'] || '30 ft.';
        const melee = m.Melee || (Array.isArray(d.melee) ? d.melee.map(a => a.rawText || '').filter(Boolean).join(', ') : '');
        const ranged = m.Ranged || (Array.isArray(d.ranged) ? d.ranged.map(a => a.rawText || '').filter(Boolean).join(', ') : '');
        const space = b['in-space'] || m.Space || '5 ft.';
        const reach = b['in-reach'] || m.Reach || '5 ft.';
        const specialAttacks = m.SpecialAttacks || b['in-special-attacks'] || '';

        // Spell-Like Abilities & Spells
        const slas = m.SpellLikeAbilities || '';
        let spells = m.SpellsPrepared || m.SpellsKnown || m.Spells || '';
        if (!spells && b['in-spells-data']) {
            try {
                const sObj = typeof b['in-spells-data'] === 'string' ? JSON.parse(b['in-spells-data']) : b['in-spells-data'];
                if (typeof sObj === 'object' && sObj !== null) {
                    const lines = [];
                    Object.keys(sObj).map(Number).sort((x, y) => y - x).forEach(lvl => {
                        const lData = sObj[lvl];
                        if (lData && Array.isArray(lData.spells) && lData.spells.length > 0) {
                            const lName = lvl === 0 ? '0 (at will)' : `${lvl}th`;
                            const names = lData.spells.map(s => typeof s === 'object' && s !== null ? (s.name || s.spell || '') : String(s)).filter(Boolean);
                            if (names.length > 0) lines.push(`${lName}—${names.join(', ')}`);
                        }
                    });
                    if (lines.length > 0) spells = lines.join('\n');
                }
            } catch (e) { }
        }

        // Stats
        const str = m.Str || b['in-str'] || '10';
        const dex = m.Dex || b['in-dex'] || '10';
        const con = m.Con || b['in-con'] || '10';
        const intVal = m.Int || b['in-int'] || '10';
        const wis = m.Wis || b['in-wis'] || '10';
        const cha = m.Cha || b['in-cha'] || '10';

        const bab = m.BaseAtk ? (String(m.BaseAtk).startsWith('+') ? m.BaseAtk : `+${m.BaseAtk}`) : '+1';
        const cmb = m.CMB ? (String(m.CMB).startsWith('+') || String(m.CMB).startsWith('-') ? m.CMB : `+${m.CMB}`) : '+0';
        const cmd = m.CMD || '10';
        const feats = m.Feats || b['in-feats'] || '';
        const skills = m.Skills || b['in-skills'] || '';
        const languages = m.Languages || b['in-languages'] || '';
        const sq = m.SQ || b['in-sq'] || '';
        const gear = m.Gear || m.OtherGear || b['in-gear'] || '';

        // Special Abilities
        const specialAbilities = [];
        if (Array.isArray(d.abilities) && d.abilities.length > 0) {
            d.abilities.forEach(ab => {
                if (ab.name || ab.desc) specialAbilities.push({ name: ab.name || 'Special Ability', desc: ab.desc || '' });
            });
        } else if (m.SpecialAbilities || m['Special Abilities']) {
            const lines = String(m.SpecialAbilities || m['Special Abilities']).split('\n');
            let currentName = '';
            let currentDesc = [];
            lines.forEach(line => {
                line = line.trim();
                if (!line) return;
                const match = line.match(/^([A-Za-z0-9\s\-\'\’]+?\s*\((?:Su|Ex|Sp)\))\s*(.*)/i);
                if (match) {
                    if (currentName) specialAbilities.push({ name: currentName, desc: currentDesc.join(' ') });
                    currentName = match[1].trim();
                    currentDesc = match[2] ? [match[2].trim()] : [];
                } else {
                    if (!currentName) currentName = 'Special Ability';
                    currentDesc.push(line);
                }
            });
            if (currentName) specialAbilities.push({ name: currentName, desc: currentDesc.join(' ') });
        }

        // Ecology
        const env = m.Environment || b['in-environment'] || '';
        const org = m.Organization || b['in-organization'] || '';
        const treasure = m.Treasure || b['in-treasure'] || '';

        return `
        <div class="statblock-paper ${theme}" style="max-width: 794px; width: 794px; margin: 0 auto; box-shadow: none; box-sizing: border-box;">
            <div class="sb-block sb-block-header">
                <div class="pf-header-row">
                    <h1>${name}</h1>
                    <div class="pf-cr-box">
                        <div class="pf-cr-label">CR</div>
                        <div class="pf-cr-value">${cr}</div>
                    </div>
                </div>
                ${xp ? `<div class="pf-property-line pf-xp-row"><span class="pf-label">XP</span> <span>${xp}</span></div>` : ''}
                <div class="pf-property-line pf-type-row">
                    ${typeFull ? `<i>${typeFull}</i>` : `<span>${align}</span> <span>${size}</span> <span>${type}</span>`}
                </div>
                <div class="pf-property-line">
                    <span class="pf-label">Init</span> <span>${init}</span>;
                    <span class="pf-label">Senses</span> <span>${senses}</span>
                </div>
                ${aura ? `<div class="pf-property-line"><span class="pf-label">Aura</span> <span>${aura}</span></div>` : ''}
            </div>

            <div class="sb-block sb-block-defense">
                <h2 class="pf-section-title">DEFENSE</h2>
                <div class="pf-property-line"><span class="pf-label">AC</span> <span>${acTotal}${acMods}</span></div>
                <div class="pf-property-line"><span class="pf-label">hp</span> <span>${hp}${hd}</span></div>
                <div class="pf-property-line"><span class="pf-label">Fort</span> <span>${fort}</span>, <span class="pf-label">Ref</span> <span>${ref}</span>, <span class="pf-label">Will</span> <span>${will}</span></div>
                ${defExtras ? `<div class="pf-property-line">${defExtras}</div>` : ''}
            </div>

            <div class="sb-block sb-block-offense">
                <h2 class="pf-section-title">OFFENSE</h2>
                <div class="pf-property-line"><span class="pf-label">Speed</span> <span>${speed}</span></div>
                ${melee ? `<div class="pf-property-line"><span class="pf-label">Melee</span> <span>${melee}</span></div>` : ''}
                ${ranged ? `<div class="pf-property-line"><span class="pf-label">Ranged</span> <span>${ranged}</span></div>` : ''}
                <div class="pf-property-line"><span class="pf-label">Space</span> <span>${space}</span>; <span class="pf-label">Reach</span> <span>${reach}</span></div>
                ${specialAttacks ? `<div class="pf-property-line"><span class="pf-label">Special Attacks</span> <span>${specialAttacks}</span></div>` : ''}
                ${slas ? `<div class="pf-property-line" style="margin-top: 4px;"><span class="pf-label">Spell-Like Abilities</span><div style="white-space: pre-wrap; font-size: 0.95em; margin-top: 2px;">${slas}</div></div>` : ''}
                ${spells ? `<div class="pf-property-line" style="margin-top: 4px;"><span class="pf-label">Spells</span><div style="white-space: pre-wrap; font-size: 0.95em; margin-top: 2px;">${spells}</div></div>` : ''}
            </div>

            <div class="sb-block sb-block-statistics">
                <h2 class="pf-section-title">STATISTICS</h2>
                <div class="pf-stats-table">
                    <div class="pf-stat-col"><div class="pf-label">STR</div><div class="pf-stat-val">${str}</div><div class="pf-stat-mod">${formatStatMod(str)}</div></div>
                    <div class="pf-stat-col"><div class="pf-label">DEX</div><div class="pf-stat-val">${dex}</div><div class="pf-stat-mod">${formatStatMod(dex)}</div></div>
                    <div class="pf-stat-col"><div class="pf-label">CON</div><div class="pf-stat-val">${con}</div><div class="pf-stat-mod">${formatStatMod(con)}</div></div>
                    <div class="pf-stat-col"><div class="pf-label">INT</div><div class="pf-stat-val">${intVal}</div><div class="pf-stat-mod">${formatStatMod(intVal)}</div></div>
                    <div class="pf-stat-col"><div class="pf-label">WIS</div><div class="pf-stat-val">${wis}</div><div class="pf-stat-mod">${formatStatMod(wis)}</div></div>
                    <div class="pf-stat-col"><div class="pf-label">CHA</div><div class="pf-stat-val">${cha}</div><div class="pf-stat-mod">${formatStatMod(cha)}</div></div>
                </div>
                <div class="pf-property-line"><span class="pf-label">Base Atk</span> <span>${bab}</span>; <span class="pf-label">CMB</span> <span>${cmb}</span>; <span class="pf-label">CMD</span> <span>${cmd}</span></div>
                ${feats ? `<div class="pf-property-line"><span class="pf-label">Feats</span> <span>${feats}</span></div>` : ''}
                ${skills ? `<div class="pf-property-line"><span class="pf-label">Skills</span> <span>${skills}</span></div>` : ''}
                ${languages ? `<div class="pf-property-line"><span class="pf-label">Languages</span> <span>${languages}</span></div>` : ''}
                ${sq ? `<div class="pf-property-line"><span class="pf-label">SQ</span> <span>${sq}</span></div>` : ''}
                ${gear ? `<div class="pf-property-line"><span class="pf-label">Gear</span> <span>${gear}</span></div>` : ''}
            </div>

            ${specialAbilities.length > 0 ? `
            <div class="sb-block sb-block-special-abilities">
                <h2 class="pf-section-title">SPECIAL ABILITIES</h2>
                <div>
                    ${specialAbilities.map(sa => `
                        <div style="margin-bottom: 5px;">
                            ${sa.name ? `<strong>${sa.name}</strong>: ` : ''}
                            <span>${sa.desc}</span>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}

            ${(env || org || treasure) ? `
            <div class="sb-block sb-block-ecology">
                <h2 class="pf-section-title">ECOLOGY</h2>
                ${env ? `<div class="pf-property-line"><span class="pf-label">Environment</span> <span>${env}</span></div>` : ''}
                ${org ? `<div class="pf-property-line"><span class="pf-label">Organization</span> <span>${org}</span></div>` : ''}
                ${treasure ? `<div class="pf-property-line"><span class="pf-label">Treasure</span> <span>${treasure}</span></div>` : ''}
            </div>` : ''}
        </div>
        `;
    }

    async function exportFolderToPdf(folderId) {
        const isAll = !folderId || folderId === 'all';
        const currentFolder = isAll ? null : (window.allUserFolders || []).find(f => f.id === folderId);
        const folderName = currentFolder ? currentFolder.name : 'All Custom Monsters';

        if (!isAll && currentFolder && (!currentFolder.monster_keys || currentFolder.monster_keys.length === 0)) {
            alert(`There are no monsters in "${folderName}" yet.`);
            return;
        }

        // Ask for target directory if supported
        let dirHandle = null;
        if ('showDirectoryPicker' in window) {
            dirHandle = await getExportDirectoryHandle(folderName);
            if (dirHandle === 'CANCELLED') {
                return;
            }
        }

        const auth = window.PathMonsterDBAuth || window.PathGMAuth;
        const headers = (auth && typeof auth.getAuthHeaders === 'function') ? auth.getAuthHeaders() : {};

        let monsters = [];
        try {
            const endpoint = isAll ? `/api/folders/all/monsters?_t=${Date.now()}` : `/api/folders/${folderId}/monsters?_t=${Date.now()}`;
            const res = await fetch(endpoint, { headers: headers });
            const data = await res.json();
            monsters = data.monsters || [];
        } catch (e) {
            alert('Could not load monsters: ' + e.message);
            return;
        }

        if (monsters.length === 0) {
            if (isAll) {
                alert('There are no saved custom monsters yet. Create and save a monster to get started.');
            } else {
                alert(`There are no monsters in "${folderName}" yet. Add monsters to this folder using the 📁 button on their cards.`);
            }
            return;
        }

        await ensureLibrariesLoaded();
        const jsPdfConstructor = getJsPdfConstructor();
        const html2c = window.html2canvas || (typeof html2canvas === 'function' ? html2canvas : null);
        if (!jsPdfConstructor || !html2c) {
            alert('PDF export libraries (jsPDF / html2canvas) could not be loaded. Please refresh the page.');
            return;
        }

        // Open Progress Modal
        const modalTitle = document.getElementById('pdf-progress-modal-title');
        if (modalTitle) modalTitle.innerHTML = '📄 Exporting Monster PDFs';
        if (pdfProgressFolderTitle) {
            const destText = dirHandle ? ` ➔ 📂 ${dirHandle.name}` : '';
            pdfProgressFolderTitle.textContent = `📁 ${folderName} (${monsters.length} monsters)${destText}`;
        }
        if (pdfProgressDirBadge && pdfProgressDirName) {
            if (dirHandle) {
                pdfProgressDirName.textContent = dirHandle.name;
                pdfProgressDirBadge.style.display = 'block';
            } else {
                pdfProgressDirBadge.style.display = 'none';
            }
        }
        if (pdfProgressStatus) pdfProgressStatus.textContent = dirHandle ? `Preparing PDFs in "${dirHandle.name}"...` : 'Preparing PDF export...';
        if (pdfProgressBar) pdfProgressBar.style.width = '0%';
        if (modalPdfProgress) modalPdfProgress.classList.add('active');

        const activeTheme = localStorage.getItem('pf_creator_theme') || 'theme-parchment';
        const pdfWidth = 210;
        const pdfPageHeight = 297;

        try {
            const seenNames = {};
            for (let i = 0; i < monsters.length; i++) {
                const m = monsters[i];
                let baseName = sanitizeFileName(m.Name || `Monster_${i + 1}`);
                if (seenNames[baseName]) {
                    seenNames[baseName]++;
                    baseName = `${baseName}_${seenNames[baseName]}`;
                } else {
                    seenNames[baseName] = 1;
                }
                const filename = `${baseName}.pdf`;

                const pct = Math.round(((i + 1) / monsters.length) * 100);
                if (pdfProgressStatus) pdfProgressStatus.textContent = dirHandle
                    ? `[${dirHandle.name}] Creating PDF (${i + 1} / ${monsters.length}): ${filename}...`
                    : `Preparing and downloading PDF (${i + 1} / ${monsters.length}): ${filename}...`;
                if (pdfProgressBar) pdfProgressBar.style.width = pct + '%';

                if (folderPdfStage) {
                    folderPdfStage.innerHTML = renderMonsterStatblockHTML(m, activeTheme);
                    await new Promise(r => setTimeout(r, 60));

                    const canvas = await html2c(folderPdfStage.firstElementChild, {
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        logging: false,
                        scrollX: 0,
                        scrollY: 0,
                        backgroundColor: null
                    });

                    const imgData = canvas.toDataURL('image/png');
                    const renderedHeight = (canvas.height * pdfWidth) / canvas.width;

                    const pdf = new jsPdfConstructor({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4',
                        compress: true
                    });

                    if (renderedHeight <= pdfPageHeight) {
                        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, renderedHeight, undefined, 'FAST');
                    } else {
                        // Overflow: slice across multiple pages
                        let heightLeft = renderedHeight;
                        let position = 0;
                        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, renderedHeight, undefined, 'FAST');
                        heightLeft -= pdfPageHeight;

                        while (heightLeft > 0) {
                            position = heightLeft - renderedHeight;
                            pdf.addPage('a4', 'portrait');
                            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, renderedHeight, undefined, 'FAST');
                            heightLeft -= pdfPageHeight;
                        }
                    }

                    if (dirHandle) {
                        const pdfBlob = pdf.output('blob');
                        await writeBlobToDirectory(dirHandle, filename, pdfBlob);
                    } else {
                        pdf.save(filename);
                        if (i < monsters.length - 1) {
                            await new Promise(r => setTimeout(r, 350));
                        }
                    }
                }
            }

            if (pdfProgressBar) pdfProgressBar.style.width = '100%';
            if (pdfProgressStatus) pdfProgressStatus.textContent = dirHandle
                ? `All PDFs were saved to "${dirHandle.name}"! (${monsters.length} files)`
                : `All PDFs were downloaded! (${monsters.length} files)`;

            if (auth && typeof auth.showToast === 'function') {
                auth.showToast(dirHandle
                    ? `🎉 Saved ${monsters.length} monsters from "${folderName}" to "${dirHandle.name}"!`
                    : `🎉 Downloaded ${monsters.length} monsters from "${folderName}" as separate PDFs!`, 'success');
            }
        } catch (err) {
            console.error('PDF Export Error:', err);
            alert('PDF export failed: ' + (err.message || err));
        } finally {
            if (folderPdfStage) folderPdfStage.innerHTML = '';
            if (pdfProgressDirBadge) pdfProgressDirBadge.style.display = 'none';
            setTimeout(() => {
                if (modalPdfProgress) modalPdfProgress.classList.remove('active');
            }, 1200);
        }
    }

    async function exportFolderToPng(folderId) {
        const isAll = !folderId || folderId === 'all';
        const currentFolder = isAll ? null : (window.allUserFolders || []).find(f => f.id === folderId);
        const folderName = currentFolder ? currentFolder.name : 'All Custom Monsters';

        if (!isAll && currentFolder && (!currentFolder.monster_keys || currentFolder.monster_keys.length === 0)) {
            alert(`There are no monsters in "${folderName}" yet.`);
            return;
        }

        // Ask for target directory if supported
        let dirHandle = null;
        if ('showDirectoryPicker' in window) {
            dirHandle = await getExportDirectoryHandle(folderName);
            if (dirHandle === 'CANCELLED') {
                return;
            }
        }

        const auth = window.PathMonsterDBAuth || window.PathGMAuth;
        const headers = (auth && typeof auth.getAuthHeaders === 'function') ? auth.getAuthHeaders() : {};

        let monsters = [];
        try {
            const endpoint = isAll ? `/api/folders/all/monsters?_t=${Date.now()}` : `/api/folders/${folderId}/monsters?_t=${Date.now()}`;
            const res = await fetch(endpoint, { headers: headers });
            const data = await res.json();
            monsters = data.monsters || [];
        } catch (e) {
            alert('Could not load monsters: ' + e.message);
            return;
        }

        if (monsters.length === 0) {
            if (isAll) {
                alert('There are no saved custom monsters yet. Create and save a monster to get started.');
            } else {
                alert(`There are no monsters in "${folderName}" yet. Add monsters to this folder using the 📁 button on their cards.`);
            }
            return;
        }

        await ensureLibrariesLoaded();
        const html2c = window.html2canvas || (typeof html2canvas === 'function' ? html2canvas : null);
        if (!html2c) {
            alert('Image export library (html2canvas) could not be loaded. Please refresh the page.');
            return;
        }

        // Open Progress Modal
        const modalTitle = document.getElementById('pdf-progress-modal-title');
        if (modalTitle) modalTitle.innerHTML = '🖼️ Exporting Monster PNGs';
        if (pdfProgressFolderTitle) {
            const destText = dirHandle ? ` ➔ 📂 ${dirHandle.name}` : '';
            pdfProgressFolderTitle.textContent = `📁 ${folderName} (${monsters.length} monsters)${destText}`;
        }
        if (pdfProgressDirBadge && pdfProgressDirName) {
            if (dirHandle) {
                pdfProgressDirName.textContent = dirHandle.name;
                pdfProgressDirBadge.style.display = 'block';
            } else {
                pdfProgressDirBadge.style.display = 'none';
            }
        }
        if (pdfProgressStatus) pdfProgressStatus.textContent = dirHandle ? `Preparing PNGs in "${dirHandle.name}"...` : 'Preparing image export...';
        if (pdfProgressBar) pdfProgressBar.style.width = '0%';
        if (modalPdfProgress) modalPdfProgress.classList.add('active');

        const activeTheme = localStorage.getItem('pf_creator_theme') || 'theme-parchment';

        try {
            const seenNames = {};
            for (let i = 0; i < monsters.length; i++) {
                const m = monsters[i];
                let baseName = sanitizeFileName(m.Name || `Monster_${i + 1}`);
                if (seenNames[baseName]) {
                    seenNames[baseName]++;
                    baseName = `${baseName}_${seenNames[baseName]}`;
                } else {
                    seenNames[baseName] = 1;
                }
                const filename = `${baseName}.png`;

                const pct = Math.round(((i + 1) / monsters.length) * 100);
                if (pdfProgressStatus) pdfProgressStatus.textContent = dirHandle
                    ? `[${dirHandle.name}] Creating image (${i + 1} / ${monsters.length}): ${filename}...`
                    : `Creating and downloading image (${i + 1} / ${monsters.length}): ${filename}...`;
                if (pdfProgressBar) pdfProgressBar.style.width = pct + '%';

                if (folderPdfStage) {
                    folderPdfStage.innerHTML = renderMonsterStatblockHTML(m, activeTheme);
                    await new Promise(r => setTimeout(r, 60));

                    const monCanvas = await html2c(folderPdfStage.firstElementChild, {
                        scale: 2,
                        useCORS: true,
                        allowTaint: true,
                        logging: false,
                        scrollX: 0,
                        scrollY: 0,
                        backgroundColor: null
                    });

                    await new Promise((resolve) => {
                        monCanvas.toBlob(async (blob) => {
                            if (blob) {
                                if (dirHandle) {
                                    await writeBlobToDirectory(dirHandle, filename, blob);
                                    resolve();
                                } else {
                                    triggerBlobDownload(blob, filename);
                                    setTimeout(resolve, 350);
                                }
                            } else {
                                const link = document.createElement('a');
                                link.download = filename;
                                link.href = monCanvas.toDataURL('image/png');
                                document.body.appendChild(link);
                                link.click();
                                setTimeout(() => {
                                    if (link.parentNode) link.parentNode.removeChild(link);
                                    resolve();
                                }, 350);
                            }
                        }, 'image/png');
                    });
                }
            }

            if (pdfProgressBar) pdfProgressBar.style.width = '100%';
            if (pdfProgressStatus) pdfProgressStatus.textContent = dirHandle
                ? `All PNG images were saved to "${dirHandle.name}"! (${monsters.length} files)`
                : `All PNG images were downloaded! (${monsters.length} files)`;

            if (auth && typeof auth.showToast === 'function') {
                auth.showToast(dirHandle
                    ? `🖼️ Saved ${monsters.length} monsters from "${folderName}" to "${dirHandle.name}"!`
                    : `🖼️ Downloaded ${monsters.length} monsters from "${folderName}" as separate PNG images!`, 'success');
            }
        } catch (err) {
            console.error('PNG Export Error:', err);
            alert('PNG export failed: ' + (err.message || err));
        } finally {
            if (folderPdfStage) folderPdfStage.innerHTML = '';
            if (pdfProgressDirBadge) pdfProgressDirBadge.style.display = 'none';
            setTimeout(() => {
                if (modalPdfProgress) modalPdfProgress.classList.remove('active');
            }, 1200);
        }
    }

    if (btnFolderExportPdf) {
        btnFolderExportPdf.addEventListener('click', () => {
            exportFolderToPdf(activeFolderId || 'all');
        });
    }

    if (btnFolderExportPng) {
        btnFolderExportPng.addEventListener('click', () => {
            exportFolderToPng(activeFolderId || 'all');
        });
    }
});
