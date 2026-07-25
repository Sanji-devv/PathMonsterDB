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

    // Expose globally so other modules can call it
    window.showInfoModal = function(title, bodyHTML, itemType = '') {
        modalTitle.textContent = title;
        modalBody.innerHTML = bodyHTML;
        modalOverlay.classList.add('active');

        // Dynamic Archives of Nethys Scraper
        if (!bodyHTML || bodyHTML.includes("Description not available") || bodyHTML.includes("No description")) {
            const aonMap = {
                'Feat': 'FeatDisplay.aspx?ItemName=',
                'Spell': 'SpellDisplay.aspx?ItemName=',
                'Weapon': 'EquipmentWeaponsDisplay.aspx?ItemName=',
                'Melee': 'EquipmentWeaponsDisplay.aspx?ItemName=',
                'Ranged': 'EquipmentWeaponsDisplay.aspx?ItemName=',
                'Armor': 'EquipmentArmorDisplay.aspx?ItemName=',
                'Shield': 'EquipmentArmorDisplay.aspx?ItemName=',
                'Magic Item': 'MagicEquipmentDisplay.aspx?ItemName=',
                'Trait': 'TraitDisplay.aspx?ItemName=',
                'UMR': 'UMR.aspx?ItemName=',
                'Special Attack': 'UMR.aspx?ItemName=',
                'Special Quality': 'UMR.aspx?ItemName='
            };

            // If we don't have a direct type map but it's empty, we can try to search or just Feat
            let targetPath = aonMap[itemType];
            if (!targetPath && (title.includes(' ') || title.length > 2)) {
                // Default to Feat if unknown, as most missing descriptions are feats or abilities
                targetPath = aonMap['Feat'];
            }

            if (targetPath) {
                modalBody.innerHTML = `<em>${bodyHTML}</em><br><br><div style="text-align:center; padding: 20px;"><span style="color:#aaa; font-style:italic;">Fetching official description from Archives of Nethys...</span><br><div style="margin-top:10px;" class="spinner"></div></div>`;
                
                const cleanTitle = title.replace(/\s*\((Ex|Su|Sp)\)\s*$/i, "").trim();
                const targetUrl = `https://aonprd.com/${targetPath}${encodeURIComponent(cleanTitle)}`;
                const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
                
                fetch(proxyUrl)
                    .then(response => {
                        if (response.ok) return response.text();
                        throw new Error('Network response was not ok.');
                    })
                    .then(html => {
                        // Use DOMParser to safely parse the returned HTML
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        
                        const mainContent = doc.getElementById('main');
                        if (mainContent) {
                            // Find the name label
                            let nameLabel = doc.querySelector('span[id*="LabelName"]');
                            if (nameLabel) {
                                let contentHtml = nameLabel.innerHTML
                                    .replace(/href="\//g, 'href="https://aonprd.com/')
                                    .replace(/src="\//g, 'src="https://aonprd.com/')
                                    .replace(/href="(?!\w+:\/\/)/g, 'href="https://aonprd.com/');
                                
                                if (contentHtml.trim().length > 10) {
                                    modalBody.innerHTML = `<div style="font-size: 0.9em; line-height: 1.4;">${contentHtml}</div><div style="margin-top: 15px; font-size: 0.8em; color: #888;">Source: <a href="${targetUrl}" target="_blank" style="color: #66b3ff;">Archives of Nethys</a></div>`;
                                    return;
                                }
                            }
                        }
                        modalBody.innerHTML = `<em>${bodyHTML}</em><br><br><span style="color:#ff6666;">Could not find detailed description on Archives of Nethys for "${title}".</span><br><a href="${targetUrl}" target="_blank" style="color: #66b3ff; font-size: 0.9em;">Click here to search manually</a>`;
                    })
                    .catch(error => {
                        modalBody.innerHTML = `<em>${bodyHTML}</em><br><br><span style="color:#ff6666;">Error fetching from Archives of Nethys.</span>`;
                    });
            }
        }
    };
});
