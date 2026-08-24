document.addEventListener('DOMContentLoaded', () => {
    // 1. Tab switching logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.style.display = 'none');
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            document.getElementById(targetId).style.display = 'block';
        });
    });

    // 2. Interactive Modal System
    const modalHTML = `
    <div id="global-info-modal" class="info-modal-overlay">
        <div class="info-modal-content">
            <div class="info-modal-header">
                <h2 id="modal-title">Title</h2>
                <button id="modal-close" class="info-modal-close">&times;</button>
            </div>
            <div id="modal-body" class="info-modal-body">
                Content goes here...
            </div>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modalOverlay = document.getElementById('global-info-modal');
    const modalClose = document.getElementById('modal-close');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalClose.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            modalOverlay.classList.remove('active');
        }
    });

    // 3. Mobile View Switcher (Editor vs Statblock Preview)
    const btnViewEditor = document.getElementById('btn-view-editor');
    const btnViewPreview = document.getElementById('btn-view-preview');
    const appWorkspace = document.getElementById('app-workspace');

    function setMobileView(viewMode) {
        if (!appWorkspace) return;

        if (viewMode === 'preview') {
            appWorkspace.classList.add('view-preview');
            if (btnViewEditor) btnViewEditor.classList.remove('active');
            if (btnViewPreview) btnViewPreview.classList.add('active');
            
            // Scroll preview to top smoothly
            const previewPanel = document.getElementById('preview-panel');
            if (previewPanel) previewPanel.scrollTop = 0;
        } else {
            appWorkspace.classList.remove('view-preview');
            if (btnViewEditor) btnViewEditor.classList.add('active');
            if (btnViewPreview) btnViewPreview.classList.remove('active');
        }
    }

    if (btnViewEditor) {
        btnViewEditor.addEventListener('click', () => setMobileView('editor'));
    }
    if (btnViewPreview) {
        btnViewPreview.addEventListener('click', () => setMobileView('preview'));
    }

    window.setMobileView = setMobileView;

    // 4. Mobile Actions Slide-out Drawer
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileDrawerOverlay = document.getElementById('mobile-drawer-overlay');
    const btnCloseMobileDrawer = document.getElementById('btn-close-mobile-drawer');

    function openMobileDrawer() {
        if (mobileDrawer) mobileDrawer.classList.add('active');
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.add('active');
        document.body.classList.add('mobile-drawer-open');
    }

    function closeMobileDrawer() {
        if (mobileDrawer) mobileDrawer.classList.remove('active');
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.remove('active');
        document.body.classList.remove('mobile-drawer-open');
    }

    if (btnMobileMenu) {
        btnMobileMenu.addEventListener('click', openMobileDrawer);
    }
    if (btnCloseMobileDrawer) {
        btnCloseMobileDrawer.addEventListener('click', closeMobileDrawer);
    }
    if (mobileDrawerOverlay) {
        mobileDrawerOverlay.addEventListener('click', closeMobileDrawer);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileDrawer && mobileDrawer.classList.contains('active')) {
            closeMobileDrawer();
        }
    });

    // 5. Drawer Quick Actions Event Delegation
    const delegateClick = (drawerBtnId, targetBtnId) => {
        const dBtn = document.getElementById(drawerBtnId);
        const tBtn = document.getElementById(targetBtnId);
        if (dBtn && tBtn) {
            dBtn.addEventListener('click', () => {
                closeMobileDrawer();
                tBtn.click();
            });
        }
    };

    delegateClick('mob-btn-new-sheet', 'btn-new-sheet');
    delegateClick('mob-btn-save-database', 'btn-save-database');
    delegateClick('mob-btn-save-as-new', 'btn-save-as-new');
    delegateClick('mob-btn-export-png', 'btn-export-png');
    delegateClick('mob-btn-export-pdf', 'btn-export-pdf');
    delegateClick('mob-btn-save-json', 'btn-save-json');
    delegateClick('mob-btn-load-json', 'btn-load-json');
    delegateClick('mob-btn-export-db-json', 'btn-export-db-json');
    delegateClick('mob-btn-import-db-json', 'btn-import-db-json');
    delegateClick('mob-btn-settings', 'btn-settings-panel');
    delegateClick('mob-btn-reset-filters', 'btn-reset-filters');

    // 6. Mobile Theme Selector Synchronization
    const mainThemeSelect = document.getElementById('theme-selector');
    const mobThemeSelect = document.getElementById('mobile-theme-selector');

    if (mainThemeSelect && mobThemeSelect) {
        mobThemeSelect.value = mainThemeSelect.value;

        mobThemeSelect.addEventListener('change', (e) => {
            mainThemeSelect.value = e.target.value;
            mainThemeSelect.dispatchEvent(new Event('change'));
        });

        mainThemeSelect.addEventListener('change', (e) => {
            mobThemeSelect.value = e.target.value;
        });
    }

    // 7. Global Interactive Info Modal Method
    window.showInfoModal = function(title, bodyHTML, itemType = '') {
        modalTitle.textContent = title + (itemType ? ` (${itemType})` : '');
        let resolvedHTML = bodyHTML;
        if (!resolvedHTML || resolvedHTML.trim() === '') {
            const cleanTitle = (title || '').toLowerCase().trim();
            const findIn = (arr) => (arr || []).find(item => {
                const itemName = (typeof item === 'object' && item !== null ? (item.name || item.spell || '') : item) || '';
                const cleanItem = itemName.toLowerCase().trim();
                return cleanItem === cleanTitle ||
                       cleanTitle.includes(cleanItem) ||
                       cleanItem.includes(cleanTitle);
            });
            const entry = findIn(window.allSpecialAbilitiesDB) ||
                          findIn(window.allAurasDB) ||
                          findIn(window.allImmunitiesDB) ||
                          findIn(window.allResistancesDB) ||
                          findIn(window.allWeaknessesDB) ||
                          findIn(window.allFeatsDB) ||
                          findIn(window.allSpellsDB) ||
                          findIn(window.allMagicItemsDB) ||
                          findIn(window.allArmorsDB) ||
                          findIn(window.allWeaponsDB);
            if (entry && typeof entry === 'object') {
                if (entry.dmg_m || entry.crit) {
                    resolvedHTML = `<strong>Category:</strong> ${entry.type || 'Weapon'}<br><strong>Damage (M):</strong> ${entry.dmg_m || '—'}<br><strong>Critical:</strong> ${entry.crit || '20/x2'}${entry.dmg_type ? `<br><strong>Type:</strong> ${entry.dmg_type}` : ''}`;
                } else if (entry.ac_bonus !== undefined || entry.acp !== undefined) {
                    resolvedHTML = `<strong>Type:</strong> ${entry.type || 'Armor'}<br><strong>AC Bonus:</strong> +${entry.ac_bonus || entry.bonus || 0}<br><strong>Max Dex:</strong> ${entry.max_dex !== undefined ? entry.max_dex : '—'}<br><strong>Armor Check Penalty:</strong> ${entry.acp || 0}`;
                } else {
                    const desc = entry.description || entry.short_description || entry.desc || '';
                    if (desc) {
                        resolvedHTML = desc.replace(/\n/g, '<br>');
                        if (entry.slot) {
                            resolvedHTML += `<br><br><strong>Slot:</strong> ${entry.slot}`;
                        }
                    } else {
                        resolvedHTML = `<em>Pathfinder 1e reference for <strong>${title}</strong>.</em>`;
                    }
                }
            } else {
                resolvedHTML = `<em>Pathfinder 1e reference for <strong>${title}</strong>.</em>`;
            }
        }
        modalBody.innerHTML = resolvedHTML;
        modalOverlay.classList.add('active');
    };
});
