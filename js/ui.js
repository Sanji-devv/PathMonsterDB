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

    // Expose globally so other modules can call it
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
                          findIn(window.allMagicItemsDB);
            if (entry && typeof entry === 'object') {
                const desc = entry.description || entry.short_description || entry.desc || '';
                if (desc) {
                    resolvedHTML = desc.replace(/\n/g, '<br>');
                } else {
                    resolvedHTML = `<em>Pathfinder 1e reference for <strong>${title}</strong>.</em>`;
                }
            } else {
                resolvedHTML = `<em>Pathfinder 1e reference for <strong>${title}</strong>.</em>`;
            }
        }
        modalBody.innerHTML = resolvedHTML;
        modalOverlay.classList.add('active');
    };
});
