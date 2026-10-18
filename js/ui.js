document.addEventListener('DOMContentLoaded', () => {
    // 1. Tab switching logic with auto-scroll & step navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const tabsNav = document.querySelector('.tabs-nav');
    const formContent = document.querySelector('.form-content');

    function switchTab(targetId, shouldScrollToTop = true) {
        if (!targetId) return;

        tabBtns.forEach(b => {
            const isTarget = b.getAttribute('data-tab') === targetId;
            b.classList.toggle('active', isTarget);
            if (isTarget && tabsNav) {
                // Ensure active tab button is smoothly visible in horizontal scroller
                try {
                    b.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                } catch (e) {
                    b.scrollIntoView(false);
                }
            }
        });

        tabPanes.forEach(p => {
            if (p.id === targetId) {
                p.style.display = 'block';
            } else {
                p.style.display = 'none';
            }
        });

        if (shouldScrollToTop && formContent) {
            formContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            switchTab(targetId, false);
        });
    });

    // Handle bottom step buttons (Next / Prev tab)
    document.addEventListener('click', (e) => {
        const stepBtn = e.target.closest('.btn-tab-step');
        if (stepBtn && stepBtn.id !== 'btn-footer-view-preview') {
            const targetId = stepBtn.getAttribute('data-target');
            if (targetId) {
                switchTab(targetId, true);
            }
        }
    });

    // 2. Interactive Modal System
    const modalHTML = `
    <div id="global-info-modal" class="info-modal-overlay">
        <div class="info-modal-content">
            <div class="info-modal-header">
                <h2 id="modal-title">Title</h2>
                <button id="modal-close" class="info-modal-close" aria-label="Close modal">&times;</button>
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

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modalOverlay.classList.remove('active');
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
            modalOverlay.classList.remove('active');
        }
    });

    // 3. Mobile View Switcher (Editor vs Statblock Preview)
    const btnViewEditor = document.getElementById('btn-view-editor');
    const btnViewPreview = document.getElementById('btn-view-preview');
    const btnFooterViewPreview = document.getElementById('btn-footer-view-preview');
    const btnPreviewBackEdit = document.getElementById('btn-preview-back-edit');
    const appWorkspace = document.getElementById('app-workspace');

    function setMobileView(viewMode) {
        if (!appWorkspace) return;

        if (viewMode === 'preview') {
            appWorkspace.classList.add('view-preview');
            if (btnViewEditor) btnViewEditor.classList.remove('active');
            if (btnViewPreview) btnViewPreview.classList.add('active');
            
            // Scroll preview to top immediately
            const previewPanel = document.getElementById('preview-panel');
            if (previewPanel) {
                previewPanel.scrollTop = 0;
                previewPanel.scrollLeft = 0;
            }
            window.scrollTo(0, 0);
            if (typeof window.paginateStatblock === 'function') {
                window.paginateStatblock();
            }
        } else {
            appWorkspace.classList.remove('view-preview');
            if (btnViewEditor) btnViewEditor.classList.add('active');
            if (btnViewPreview) btnViewPreview.classList.remove('active');
            if (formContent) {
                formContent.scrollTop = 0;
            }
            window.scrollTo(0, 0);
        }
    }

    if (btnViewEditor) {
        btnViewEditor.addEventListener('click', () => setMobileView('editor'));
    }
    if (btnViewPreview) {
        btnViewPreview.addEventListener('click', () => setMobileView('preview'));
    }
    if (btnFooterViewPreview) {
        btnFooterViewPreview.addEventListener('click', () => setMobileView('preview'));
    }
    if (btnPreviewBackEdit) {
        btnPreviewBackEdit.addEventListener('click', () => setMobileView('editor'));
    }

    window.setMobileView = setMobileView;

    // 4. Copy Statblock Text Action
    function copyStatblockText() {
        const paper = document.getElementById('statblock-paper');
        if (!paper) return;

        const getText = (id) => {
            const el = document.getElementById(id);
            return el ? el.textContent.trim() : '';
        };

        const isVisible = (id) => {
            const el = document.getElementById(id);
            if (!el) return false;
            return el.style.display !== 'none' && !el.classList.contains('hidden');
        };

        const name = getText('out-name') || 'Unnamed Creature';
        const cr = getText('out-cr') || '1';
        const xp = getText('out-xp');
        const alignment = getText('out-alignment') || 'N';
        const size = getText('out-size') || 'Medium';
        const type = getText('out-type') || 'humanoid';
        const typeFull = getText('out-type-full');
        const init = getText('out-init') || '+0';
        const senses = getText('out-senses') || 'Perception +0';
        const aura = isVisible('wrap-aura') ? getText('out-aura') : '';

        const ac = getText('out-ac');
        const hp = getText('out-hp');
        const fort = getText('out-fort') || '+0';
        const ref = getText('out-ref') || '+0';
        const will = getText('out-will') || '+0';
        const defExtras = isVisible('wrap-def-extras') ? getText('out-def-extras') : '';

        const speed = getText('out-speed') || '30 ft.';
        const melee = isVisible('wrap-melee') ? getText('out-melee') : '';
        const ranged = isVisible('wrap-ranged') ? getText('out-ranged') : '';
        const spaceReach = isVisible('wrap-space-reach') ? getText('out-space-reach') : '';
        const specialAttacks = isVisible('wrap-special-attacks') ? getText('out-special-attacks') : '';
        const slaCl = isVisible('wrap-slas') ? getText('out-sla-cl') : '';
        const slasList = isVisible('wrap-slas') ? Array.from(document.querySelectorAll('#out-slas-list > div')).map(d => d.textContent.trim()).filter(Boolean).join('\n') : '';

        const str = getText('out-str') || '10';
        const strMod = getText('out-str-mod') || '(+0)';
        const dex = getText('out-dex') || '10';
        const dexMod = getText('out-dex-mod') || '(+0)';
        const con = getText('out-con') || '10';
        const conMod = getText('out-con-mod') || '(+0)';
        const intVal = getText('out-int') || '10';
        const intMod = getText('out-int-mod') || '(+0)';
        const wis = getText('out-wis') || '10';
        const wisMod = getText('out-wis-mod') || '(+0)';
        const cha = getText('out-cha') || '10';
        const chaMod = getText('out-cha-mod') || '(+0)';

        const bab = getText('out-bab') || '+1';
        const cmb = getText('out-cmb') || '+0';
        const cmd = getText('out-cmd') || '10';
        const feats = isVisible('wrap-feats') ? getText('out-feats') : '';
        const skills = isVisible('wrap-skills') ? getText('out-skills') : '';
        const languages = isVisible('wrap-languages') ? getText('out-languages') : '';
        const sq = isVisible('wrap-sq') ? getText('out-sq') : '';
        const gear = isVisible('wrap-gear') ? getText('out-gear') : '';

        const specialAbilities = isVisible('wrap-special-abilities') ? Array.from(document.querySelectorAll('#out-special-abilities-list > div')).map(d => d.textContent.trim()).filter(Boolean).join('\n\n') : '';

        const env = isVisible('wrap-ecology') && isVisible('wrap-environment') ? getText('out-environment') : '';
        const org = isVisible('wrap-ecology') && isVisible('wrap-organization') ? getText('out-organization') : '';
        const treasure = isVisible('wrap-ecology') && isVisible('wrap-treasure') ? getText('out-treasure') : '';

        let text = `${name.toUpperCase()} CR ${cr}\n`;
        if (xp) text += `XP ${xp}\n`;
        text += typeFull ? `${typeFull}\n` : `${alignment} ${size} ${type}\n`;
        text += `Init ${init}; Senses ${senses}\n`;
        if (aura) text += `Aura ${aura}\n`;

        text += `\nDEFENSE\n`;
        text += `AC ${ac}\n`;
        text += `hp ${hp}\n`;
        text += `Fort ${fort}, Ref ${ref}, Will ${will}\n`;
        if (defExtras) text += `${defExtras}\n`;

        text += `\nOFFENSE\n`;
        text += `Speed ${speed}\n`;
        if (melee) text += `Melee ${melee}\n`;
        if (ranged) text += `Ranged ${ranged}\n`;
        if (spaceReach) text += `${spaceReach}\n`;
        if (specialAttacks) text += `Special Attacks ${specialAttacks}\n`;
        if (slaCl) text += `Spell-Like Abilities ${slaCl}\n`;
        if (slasList) text += `${slasList}\n`;

        text += `\nSTATISTICS\n`;
        text += `Str ${str} ${strMod}, Dex ${dex} ${dexMod}, Con ${con} ${conMod}, Int ${intVal} ${intMod}, Wis ${wis} ${wisMod}, Cha ${cha} ${chaMod}\n`;
        text += `Base Atk ${bab}; CMB ${cmb}; CMD ${cmd}\n`;
        if (feats) text += `Feats ${feats}\n`;
        if (skills) text += `Skills ${skills}\n`;
        if (languages) text += `Languages ${languages}\n`;
        if (sq) text += `SQ ${sq}\n`;
        if (gear) text += `Gear ${gear}\n`;

        if (specialAbilities) {
            text += `\nSPECIAL ABILITIES\n${specialAbilities}\n`;
        }

        if (env || org || treasure) {
            text += `\nECOLOGY\n`;
            if (env) text += `Environment ${env}\n`;
            if (org) text += `Organization ${org}\n`;
            if (treasure) text += `Treasure ${treasure}\n`;
        }

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(text).then(() => {
                if (window.PathMonsterDBAuth && typeof window.PathMonsterDBAuth.showToast === 'function') {
                    window.PathMonsterDBAuth.showToast(`📋 Statblock for "${name}" copied to clipboard!`, 'success');
                } else {
                    alert('Statblock copied to clipboard!');
                }
            }).catch(err => {
                console.error('Clipboard copy failed:', err);
            });
        } else {
            // Fallback for older browsers
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.top = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            if (window.PathMonsterDBAuth && typeof window.PathMonsterDBAuth.showToast === 'function') {
                window.PathMonsterDBAuth.showToast(`📋 Statblock for "${name}" copied to clipboard!`, 'success');
            }
        }
    }

    const btnPreviewCopyText = document.getElementById('btn-preview-copy-text');
    if (btnPreviewCopyText) {
        btnPreviewCopyText.addEventListener('click', copyStatblockText);
    }
    window.copyStatblockText = copyStatblockText;

    // 5. Mobile Actions Slide-out Drawer
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileDrawerOverlay = document.getElementById('mobile-drawer-overlay');
    const btnCloseMobileDrawer = document.getElementById('btn-close-mobile-drawer');

    function openMobileDrawer() {
        if (mobileDrawer) mobileDrawer.classList.add('active');
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.add('active');
        if (btnMobileMenu) btnMobileMenu.classList.add('is-active');
        document.body.classList.add('mobile-drawer-open');
    }

    function closeMobileDrawer() {
        if (mobileDrawer) mobileDrawer.classList.remove('active');
        if (mobileDrawerOverlay) mobileDrawerOverlay.classList.remove('active');
        if (btnMobileMenu) btnMobileMenu.classList.remove('is-active');
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

    // 6. Drawer Quick Actions Event Delegation
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

    // 7. Mobile Theme Selector Synchronization
    const mobThemeSelect = document.getElementById('mobile-theme-selector');
    if (mobThemeSelect) {
        const savedTheme = localStorage.getItem('pf_creator_theme') || 'theme-parchment';
        mobThemeSelect.value = savedTheme;
        mobThemeSelect.addEventListener('change', (e) => {
            if (typeof window.applyStatblockTheme === 'function') {
                window.applyStatblockTheme(e.target.value);
            } else {
                localStorage.setItem('pf_creator_theme', e.target.value);
                const paper = document.getElementById('statblock-paper');
                if (paper) paper.className = `statblock-paper ${e.target.value}`;
                document.documentElement.className = e.target.value;
            }
        });
    }

    // 8. Global Interactive Info Modal Method
    window.showInfoModal = function(title, bodyHTML, itemType = '') {
        modalTitle.textContent = title + (itemType ? ` (${itemType})` : '');
        let resolvedHTML = bodyHTML;
        const cleanTitle = (title || '').toLowerCase().trim();

        // Check if description is missing or a placeholder
        const isPlaceholder = !resolvedHTML || 
                              resolvedHTML.trim() === '' || 
                              resolvedHTML.includes('Description not available') || 
                              resolvedHTML.includes('No description provided');

        if (isPlaceholder) {
            // Priority 1: Parameterized / Focus Feats Generic Resolution
            // Weapon Focus grants a +1 attack bonus with the selected weapon, regardless of its type.
            if (/^weapon\s+focus(\s*\(|\s*-|\s*$)/i.test(cleanTitle)) {
                resolvedHTML = `<strong>Benefit:</strong> +1 attack roll to weapon.<br>You gain a +1 bonus on all attack rolls you make using the selected weapon.`;
            } else if (/^greater\s+weapon\s+focus(\s*\(|\s*-|\s*$)/i.test(cleanTitle)) {
                resolvedHTML = `<strong>Benefit:</strong> +1 attack roll to weapon (+2 total with Weapon Focus).<br>You gain an additional +1 bonus on all attack rolls made with the selected weapon.`;
            } else if (/^weapon\s+specialization(\s*\(|\s*-|\s*$)/i.test(cleanTitle)) {
                resolvedHTML = `<strong>Benefit:</strong> +2 damage to weapon.<br>You gain a +2 bonus on all damage rolls made with the selected weapon.`;
            } else if (/^greater\s+weapon\s+specialization(\s*\(|\s*-|\s*$)/i.test(cleanTitle)) {
                resolvedHTML = `<strong>Benefit:</strong> +2 damage to weapon (+4 total with Weapon Specialization).<br>You gain an additional +2 bonus on all damage rolls made with the selected weapon.`;
            } else if (/^improved\s+critical(\s*\(|\s*-|\s*$)/i.test(cleanTitle)) {
                resolvedHTML = `<strong>Benefit:</strong> Doubles the threat range of the selected weapon.`;
            } else if (/^ability\s+focus(\s*\(|\s*-|\s*$)/i.test(cleanTitle)) {
                resolvedHTML = `<strong>Benefit:</strong> Add +2 to the DC for all saving throws against the special attack on which the creature focuses.`;
            } else if (/^skill\s+focus(\s*\(|\s*-|\s*$)/i.test(cleanTitle)) {
                resolvedHTML = `<strong>Benefit:</strong> You get a +3 bonus on all skill checks involving the chosen skill (+6 with 10 or more ranks in that skill).`;
            } else if (/^spell\s+focus(\s*\(|\s*-|\s*$)/i.test(cleanTitle)) {
                resolvedHTML = `<strong>Benefit:</strong> Add +1 to the DC for all saving throws against spells from the school of magic you select.`;
            } else if (/^greater\s+spell\s+focus(\s*\(|\s*-|\s*$)/i.test(cleanTitle)) {
                resolvedHTML = `<strong>Benefit:</strong> Add +1 to the DC for all saving throws against spells from the school of magic you select (+2 total with Spell Focus).`;
            } else {
                const strippedTitle = cleanTitle.replace(/\s*\([^)]*\)\s*/g, '').replace(/\s*-[^-]*$/g, '').trim();
                const findIn = (arr) => {
                    if (!arr || !arr.length) return null;
                    // 1. Exact match
                    let res = arr.find(item => {
                        const itemName = (typeof item === 'object' && item !== null ? (item.name || item.spell || '') : item) || '';
                        return itemName.toLowerCase().trim() === cleanTitle;
                    });
                    if (res) return res;

                    // 2. Base title match without parentheses (e.g. "Dodge (Mythic)" -> "Dodge")
                    if (strippedTitle && strippedTitle !== cleanTitle) {
                        res = arr.find(item => {
                            const itemName = (typeof item === 'object' && item !== null ? (item.name || item.spell || '') : item) || '';
                            return itemName.toLowerCase().trim() === strippedTitle;
                        });
                        if (res) return res;
                    }

                    // 3. Substring match
                    return arr.find(item => {
                        const itemName = (typeof item === 'object' && item !== null ? (item.name || item.spell || '') : item) || '';
                        const cleanItem = itemName.toLowerCase().trim();
                        return cleanItem === cleanTitle || cleanTitle.includes(cleanItem) || cleanItem.includes(cleanTitle);
                    });
                };

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
        }
        modalBody.innerHTML = resolvedHTML;
        modalOverlay.classList.add('active');
    };
});
