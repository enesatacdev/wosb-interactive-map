/**
 * ports.js - Port Tıklama, Detay Paneli, Ticaret Verileri
 *
 * Ticaret verileri Google Sheets'ten 12 saatte bir çekilir.
 * localStorage'da önbelleğe alınır.
 * Çekilemezse yedek (hardcoded) veri kullanılır.
 */

const PortManager = (() => {
    const PORT_TYPES = {
        small: { label: () => i18n.t('ports.types.small'), color: '#fbbf24', icon: '🏘️' },
        neutral: { label: () => i18n.t('ports.types.neutral'), color: '#60a5fa', icon: '⚓' },
        faction: { label: () => i18n.t('ports.types.faction'), color: '#f97316', icon: '🏰' },
        pirate: { label: () => i18n.t('ports.types.pirate'), color: '#ef4444', icon: '☠️' },
        unknown: { label: () => i18n.t('ports.types.unknown'), color: '#94a3b8', icon: '📍' }
    };

    const PRODUCTS = [
        'Pineapples','Vanilla','Wine','Grog','Rugs','Leather','Cinnamon',
        'Coffee','Mango','Oil','Nuts','Paprika','Pepper','Beer','Sugar',
        'Salt','Tobacco','Dates','Saffron','Silk'
    ];

    const SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/167fXMSUOoureMP7blZZXRSqQPoXIJK3MenyGpGulP_E/gviz/tq?tqx=out:csv&gid=41018398';
    const CACHE_KEY = 'sb-trade-data';
    const CACHE_TS_KEY = 'sb-trade-ts';
    const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 saat (ms)

    // Yedek veri (Google Sheets'e ulaşılamazsa)
    const FALLBACK_DATA = {
        "Aldansk":[19,38,9,9,41,34,39,43,19,22,16,26,36,5,51,18,55,14,63,88],
        "Nordberg":[19,38,9,9,31,34,30,43,15,22,16,20,36,5,51,18,55,11,48,67],
        "Brandport":[15,29,12,12,41,26,39,33,19,17,12,26,28,7,39,23,42,14,63,88],
        "Devios":[11,22,16,16,29,20,28,25,14,13,9,18,21,9,30,31,32,10,44,62],
        "La Navidad":[15,29,14,14,41,26,39,33,19,17,12,26,28,8,39,27,42,14,63,88],
        "Los Catuano":[11,22,16,16,41,20,39,25,19,13,9,26,21,9,30,31,32,14,63,88],
        "Nisogora":[19,38,9,9,28,34,27,16,13,22,16,18,36,5,51,18,55,10,43,60],
        "Northside":[19,38,9,9,41,34,39,43,19,22,16,26,36,5,51,18,55,14,63,88],
        "Oneg":[19,38,9,9,37,34,35,43,17,22,16,23,36,5,51,18,55,13,56,79],
        "Puerto Salada":[11,22,16,16,41,20,39,25,19,13,9,26,21,9,30,31,32,14,63,88],
        "Santa Marta":[11,22,15,15,41,20,39,25,19,13,9,26,21,9,30,30,32,14,63,88],
        "Freedom Bay":[17,33,11,11,41,30,39,37,19,19,14,26,31,6,44,22,47,14,63,88],
        "St. John":[14,27,15,15,41,24,39,30,19,16,11,26,25,8,36,29,38,14,63,88],
        "Grey Island":[19,38,9,9,41,34,39,43,19,22,16,26,36,5,51,18,55,14,63,88],
        "Surako":[18,36,12,12,28,33,27,41,13,21,15,18,34,7,49,24,52,10,43,60],
        "Fiji":[15,29,12,12,41,27,39,33,19,17,12,26,28,7,40,24,42,14,63,88],
        "Charleston":[14,27,16,16,30,25,29,31,14,16,11,19,26,9,37,31,39,10,46,64],
        "Everston":[19,38,9,9,39,34,37,43,18,22,16,25,36,5,51,18,55,13,60,84],
        "El Tigre":[11,22,16,16,32,20,30,25,15,13,9,20,21,9,30,31,32,11,48,68],
        "West Bastion":[16,32,12,12,24,29,23,36,11,19,13,15,30,7,43,24,46,8,37,52],
        "Al-Khalif":[13,31,16,16,24,28,23,35,11,18,13,15,29,9,42,31,44,8,37,52],
        "Aruba":[19,38,9,9,41,34,39,43,19,22,16,26,36,5,51,18,55,14,63,88],
        "Assab":[16,31,16,16,24,28,23,35,11,18,13,15,29,9,42,31,32,8,37,52],
        "Bord Radel":[11,22,16,16,41,20,39,25,19,13,9,26,21,9,30,31,32,14,63,88],
        "Bridgetown":[15,29,14,14,28,27,27,33,13,18,12,18,28,8,40,28,43,10,43,61],
        "Gelbion":[19,38,11,11,31,34,30,43,14,22,16,20,36,6,51,22,55,11,47,66],
        "Laguna Blanco":[15,30,15,15,35,28,33,34,16,18,13,22,29,8,41,29,44,12,53,75],
        "Masadora":[15,29,14,14,24,26,23,32,11,17,12,15,15,8,39,27,41,8,37,52],
        "Nevis":[19,37,12,12,33,34,32,42,16,22,16,21,36,7,51,23,54,11,51,71],
        "San Cristobel":[11,22,16,16,36,20,34,25,17,13,9,22,21,9,30,31,32,12,55,76],
        "San Martinas":[11,22,16,16,41,20,39,25,19,13,9,26,21,9,30,31,32,14,63,88],
        "Severoangelsk":[19,38,9,9,41,34,39,43,19,22,16,26,36,5,51,18,55,14,63,88],
        "Thermopylae":[18,35,11,11,41,32,39,40,19,21,15,26,33,6,47,21,50,14,63,88],
        "Sharhat":[14,27,15,15,24,24,23,30,11,16,11,15,25,9,36,30,38,8,37,52],
        "Cursed City":[19,37,11,11,24,34,23,42,11,22,16,15,36,6,51,21,54,8,37,52],
        "North Bastion":[19,37,9,9,41,34,39,42,19,22,15,26,35,5,50,18,54,14,63,88],
        "South Bastion":[11,22,16,16,41,20,39,25,19,13,9,26,21,9,30,31,32,14,63,88]
    };

    const PORTS_COORDINATES = {
      "assab": { "name": "Assab", "type": "small", "icon": "assets/img/k.png", "x": 67, "y": 1181 },
      "cursed-city": { "name": "Cursed City", "type": "neutral", "icon": "assets/img/n.png", "x": 71, "y": 606 },
      "al-khalif": { "name": "Al-Khalif", "type": "small", "icon": "assets/img/k.png", "x": 80, "y": 1363 },
      "nisogora": { "name": "Nisogora", "type": "neutral", "icon": "assets/img/n.png", "x": 136, "y": 404 },
      "nordberg": { "name": "Nordberg", "type": "faction", "icon": "assets/img/f.png", "x": 187, "y": 271 },
      "west-bastion": { "name": "West Bastion", "type": "neutral", "icon": "assets/img/n.png", "x": 184, "y": 788 },
      "sharhat": { "name": "Sharhat", "type": "small", "icon": "assets/img/k.png", "x": 260, "y": 1075 },
      "oneg": { "name": "Oneg", "type": "neutral", "icon": "assets/img/n.png", "x": 311, "y": 91 },
      "naabad-stronghold": { "name": "Naabad Stronghold", "type": "pirate", "icon": "assets/img/p.png", "x": 373, "y": 646 },
      "gelbion": { "name": "Gelbion", "type": "neutral", "icon": "assets/img/n.png", "x": 453, "y": 312 },
      "masadora": { "name": "Masadora", "type": "neutral", "icon": "assets/img/n.png", "x": 469, "y": 799 },
      "devios": { "name": "Devios", "type": "neutral", "icon": "assets/img/n.png", "x": 510, "y": 1147 },
      "el-tigre": { "name": "El Tigre", "type": "faction", "icon": "assets/img/f.png", "x": 522, "y": 1334 },
      "surako": { "name": "Surako", "type": "faction", "icon": "assets/img/f.png", "x": 523, "y": 499 },
      "corsa-nois-bay": { "name": "Corsa-Nois Bay", "type": "pirate", "icon": "assets/img/p.png", "x": 642, "y": 72 },
      "bridgetown": { "name": "Bridgetown", "type": "neutral", "icon": "assets/img/n.png", "x": 700, "y": 806 },
      "san-cristobel": { "name": "San Cristobel", "type": "neutral", "icon": "assets/img/n.png", "x": 721, "y": 1320 },
      "charleston": { "name": "Charleston", "type": "neutral", "icon": "assets/img/n.png", "x": 733, "y": 956 },
      "nevis": { "name": "Nevis", "type": "neutral", "icon": "assets/img/n.png", "x": 796, "y": 509 },
      "pirate-city": { "name": "Pirate City", "type": "pirate", "icon": "assets/img/p.png", "x": 813, "y": 1389 },
      "everston": { "name": "Everston", "type": "neutral", "icon": "assets/img/n.png", "x": 837, "y": 202 },
      "laguna-blanco": { "name": "Laguna Blanco", "type": "neutral", "icon": "assets/img/n.png", "x": 945, "y": 939 },
      "aruba": { "name": "Aruba", "type": "neutral", "icon": "assets/img/n.png", "x": 1053, "y": 324 },
      "san-martinas": { "name": "San Martinas", "type": "neutral", "icon": "assets/img/n.png", "x": 1059, "y": 1345 },
      "tortuga": { "name": "Tortuga", "type": "pirate", "icon": "assets/img/p.png", "x": 1099, "y": 741 },
      "la-navidad": { "name": "La Navidad", "type": "neutral", "icon": "assets/img/n.png", "x": 1214, "y": 888 },
      "thermopylae": { "name": "Thermopylae", "type": "neutral", "icon": "assets/img/n.png", "x": 1230, "y": 587 },
      "aldansk": { "name": "Aldansk", "type": "faction", "icon": "assets/img/f.png", "x": 1244, "y": 103 },
      "south-bastion": { "name": "South Bastion", "type": "neutral", "icon": "assets/img/n.png", "x": 1267, "y": 1257 },
      "gray-island": { "name": "Gray Island", "type": "neutral", "icon": "assets/img/n.png", "x": 1313, "y": 373 },
      "st.-john": { "name": "St. John", "type": "faction", "icon": "assets/img/f.png", "x": 1345, "y": 986 },
      "fiji": { "name": "Fiji", "type": "neutral", "icon": "assets/img/n.png", "x": 1424, "y": 717 },
      "severoangelsk": { "name": "Severoangelsk", "type": "neutral", "icon": "assets/img/n.png", "x": 1433, "y": 110 },
      "bord-radel": { "name": "Bord Radel", "type": "neutral", "icon": "assets/img/n.png", "x": 1498, "y": 1370 },
      "north-bastion": { "name": "North Bastion", "type": "neutral", "icon": "assets/img/n.png", "x": 1523, "y": 325 },
      "los-catuano": { "name": "Los Catuano", "type": "neutral", "icon": "assets/img/n.png", "x": 1552, "y": 1132 },
      "brandport": { "name": "Brandport", "type": "faction", "icon": "assets/img/f.png", "x": 1611, "y": 634 },
      "santa-maria": { "name": "Santa Maria", "type": "faction", "icon": "assets/img/f.png", "x": 1686, "y": 991 },
      "northside": { "name": "Northside", "type": "neutral", "icon": "assets/img/n.png", "x": 1688, "y": 171 },
      "puerto-salada": { "name": "Puerto Salada", "type": "neutral", "icon": "assets/img/n.png", "x": 1709, "y": 1202 },
      "freebooter-bay": { "name": "Freebooter Bay", "type": "pirate", "icon": "assets/img/p.png", "x": 1733, "y": 805 },
      "freedom-bay": { "name": "Freedom Bay", "type": "faction", "icon": "assets/img/f.png", "x": 1739, "y": 478 }
    };

    let tradeData = {};
    let portsData = {};
    let activePort = null;
    let detailPanel = null;
    let tooltip = null;

    function init() {
        const viewport = document.getElementById('map-viewport');
        if (!viewport) return;

        // Yedek veriyi hemen yükle (sayfa anında çalışsın)
        tradeData = FALLBACK_DATA;

        createDetailPanel(viewport);
        createTooltip(viewport);
        addPortIdToLabels();

        viewport.addEventListener('mouseover', handleMouseOver);
        viewport.addEventListener('mouseout', handleMouseOut);
        
        // (Search input listener moved to PortSettingsManager)


        // Periyodik güncelleme (Savaş sayaçları için)
        setInterval(() => {
            if (activeTooltipPortId) {
                const target = document.querySelector(`img[data-port-id="${activeTooltipPortId}"]`);
                if (target) updateTooltipContent(target);
            }
            // (Sidebar list refresh moved to PortSettingsManager)
        }, 60000); // 1 dakikada bir tooltip tazeleyebilir

        // Liman koordinatlarını ve ticaret verilerini yükle
        loadPortData();
        loadTradeDataSafe();
    }

    // ---- Trade Data: 12 saatlik cache sistemi (file:// güvenli) ----

    async function loadTradeDataSafe() {
        try {
            // 1. localStorage cache kontrol
            const cached = localStorage.getItem(CACHE_KEY);
            const cachedTs = parseInt(localStorage.getItem(CACHE_TS_KEY) || '0');
            const now = Date.now();

            if (cached && (now - cachedTs) < CACHE_DURATION) {
                tradeData = JSON.parse(cached);
                console.log(`[Trade] Cache'den yüklendi (${Math.round((now - cachedTs) / 3600000)} saat önce)`);
                return;
            }

            // 2. file:// protokolünde fetch çalışmaz, sadece http/https'te dene
            if (location.protocol === 'file:') {
                console.log('[Trade] file:// modu - yedek veri kullanılıyor');
                return;
            }

            // 3. Google Sheets'ten çek (sadece http/https)
            console.log('[Trade] Google Sheets\'ten güncelleniyor...');
            const res = await fetch(SHEETS_CSV_URL);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const csv = await res.text();
            const parsed = parseCSV(csv);

            if (Object.keys(parsed).length > 0) {
                tradeData = parsed;
                localStorage.setItem(CACHE_KEY, JSON.stringify(tradeData));
                localStorage.setItem(CACHE_TS_KEY, String(now));
                console.log(`[Trade] ${Object.keys(tradeData).length} liman verisi güncellendi`);
            }
        } catch (e) {
            console.log('[Trade] Yedek veri kullanılıyor');
        }
    }

    function parseCSV(csv) {
        const result = {};
        const lines = csv.split('\n');

        for (const line of lines) {
            // CSV satırını parçala (tırnak içindeki virgülleri dikkate al)
            const cols = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') { inQuotes = !inQuotes; }
                else if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = ''; }
                else { current += ch; }
            }
            cols.push(current.trim());

            // Port adı 3. sütun (index 2), fiyatlar 4-23. sütunlar (index 3-22)
            if (cols.length < 23) continue;
            const portName = cols[2];
            if (!portName || portName === '' || portName.includes('Ports/Goods') || portName.includes('Trading')) continue;

            const prices = [];
            let hasData = false;
            for (let i = 3; i < 23; i++) {
                const val = parseInt(cols[i]);
                if (!isNaN(val) && val > 0) { prices.push(val); hasData = true; }
                else { prices.push(0); }
            }

            if (hasData) result[portName] = prices;
        }
        return result;
    }

    // ---- Port Attribute Setup ----

    function addPortIdToLabels() {
        document.querySelectorAll('img[data-port-id]').forEach(img => {
            const portId = img.dataset.portId;
            const portName = img.dataset.portName;
            let label = img.nextElementSibling;
            while (label && !label.classList.contains('label')) {
                label = label.nextElementSibling;
            }
            if (label && label.classList.contains('label') && !label.dataset.portId) {
                label.dataset.portId = portId;
                label.dataset.portName = portName;
                label.style.cursor = 'pointer';
            }
        });
    }

    // Liman koordinat verisini yükle (file:// güvenli)
    function loadPortData() {
        portsData = PORTS_COORDINATES;
    }

    // (renderSidebarList function removed as its container is gone)
    function renderSidebarList() {
        // Safe placeholder to avoid ReferenceErrors
    }

    function flyToPort(id) {
        const data = portsData[id];
        if (data && window.MapController) {
            window.MapController.centerOn(data.x, data.y, 1.5, false, 1200);
            // Tooltip'i tetikle
            const img = document.querySelector(`img[data-port-id="${id}"]`);
            if (img) {
                setTimeout(() => handleMouseOver({ target: img }), 500);
            }
        }
    }

    // ---- UI Creation ----

    function createDetailPanel(viewport) {
        detailPanel = document.createElement('div');
        detailPanel.id = 'port-detail-panel';
        detailPanel.className = 'port-panel hidden';
        detailPanel.innerHTML = `
            <div class="panel-header">
                <div class="panel-title-row">
                    <span class="panel-icon"></span>
                    <div>
                        <h3 class="panel-title"></h3>
                        <span class="panel-type"></span>
                    </div>
                </div>
                <button class="panel-close" onclick="PortManager.closeDetail()">✕</button>
            </div>
            <div class="panel-body">
                <div class="panel-section panel-trade-section">
                    <div class="panel-section-title">📦 <span class="trade-title-text"></span></div>
                    <div class="panel-trade-content"></div>
                </div>
            </div>
        `;
        viewport.appendChild(detailPanel);

        // Panel içinde scroll yaparken haritanın zoom yapmasını engelle
        detailPanel.addEventListener('wheel', (e) => {
            e.stopPropagation();
        });
    }

    function createTooltip(viewport) {
        tooltip = document.createElement('div');
        tooltip.id = 'port-tooltip';
        tooltip.className = 'port-tooltip hidden';
        viewport.appendChild(tooltip);
    }

    // ---- Event Handlers ----

    function findPortTarget(el) {
        let current = el;
        for (let i = 0; i < 5; i++) {
            if (!current) return null;
            if (current.dataset && current.dataset.portId) return current;
            current = current.parentElement;
        }
        return null;
    }

    function handleClick(e) {
        const target = findPortTarget(e.target);
        if (!target) {
            if (!e.target.closest('#port-detail-panel')) closeDetail();
            return;
        }
        e.stopPropagation();
        const portId = target.dataset.portId;
        const portName = target.dataset.portName || target.title || target.textContent.trim();

        if (activePort) activePort.classList.remove('port-active');
        target.classList.add('port-active');
        activePort = target;

        hideTooltip();
        showDetail(portId, portName);
    }

    let activeTooltipPortId = null;

    function handleMouseOver(e) {
        const target = findPortTarget(e.target);
        if (!target || target.tagName !== 'IMG') return;
        if (activePort === target) return;
        
        activeTooltipPortId = target.dataset.portId;
        updateTooltipContent(target);
    }

    function updateTooltipContent(target) {
        if (!tooltip) return;
        const portName = target.dataset.portName || target.title;
        const portId = target.dataset.portId;
        const portInfo = portsData[portId] || {};
        const typeInfo = PORT_TYPES[portInfo.type || 'unknown'];

        const rect = target.getBoundingClientRect();
        const viewportRect = document.getElementById('map-viewport').getBoundingClientRect();

        const custom = (typeof PortSettingsManager !== 'undefined') ? PortSettingsManager.getSettings(portId) : {};
        
        let warStatusHtml = '';
        if (custom.warHours) {
            const status = getWarStatusInfo(custom.warHours);
            warStatusHtml = `
                <div class="tooltip-status-badge ${status.class}">
                    ${status.text}
                </div>
            `;
        }

        let extraHtml = '';
        if (custom.owner || custom.clan || custom.warHours) {
            extraHtml = `
                <div class="tooltip-divider"></div>
                <div class="tooltip-extra">
                    ${custom.owner ? `<div class="tooltip-row"><span class="t-label">${i18n.t('ports.tooltip.owner')}</span> <span class="t-val">${custom.owner}</span></div>` : ''}
                    ${custom.clan ? `<div class="tooltip-row"><span class="t-label">${i18n.t('ports.tooltip.clan')}</span> <span class="t-val text-sky-400">[${custom.clan}]</span></div>` : ''}
                    ${custom.warHours ? `<div class="tooltip-row"><span class="t-label">${i18n.t('ports.tooltip.war')}</span> <span class="t-val text-slate-300">${custom.warHours}</span></div>` : ''}
                </div>
            `;
        }

        tooltip.innerHTML = `
            <div class="tooltip-header">
                <div class="tooltip-name">${typeInfo.icon} ${portName}</div>
                ${warStatusHtml}
            </div>
            <div class="tooltip-type" style="color:${typeInfo.color}">${typeof typeInfo.label === 'function' ? typeInfo.label() : typeInfo.label}</div>
            ${extraHtml}
        `;
        tooltip.style.left = (rect.left + rect.width / 2 - viewportRect.left) + 'px';
        tooltip.style.top = (rect.top - viewportRect.top - 8) + 'px';
        tooltip.classList.remove('hidden');
    }

    function getWarStatusInfo(hoursStr) {
        try {
            const parts = hoursStr.split('-').map(s => s.trim());
            if (parts.length !== 2) return { text: '', class: 'hidden' };

            const now = new Date();
            const currentMin = now.getHours() * 60 + now.getMinutes();

            const parseTime = (t) => {
                const [h, m] = t.split(':').map(Number);
                return h * 60 + m;
            };

            const startMin = parseTime(parts[0]);
            const endMin = parseTime(parts[1]);

            if (currentMin >= startMin && currentMin < endMin) {
                return { text: i18n.t('ports.status.active'), class: 'status-active' };
            }

            if (currentMin < startMin) {
                const diff = startMin - currentMin;
                const h = Math.floor(diff / 60);
                const m = diff % 60;
                const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
                return { text: `${i18n.t('ports.status.startsin')} ${timeStr}`, class: 'status-soon' };
            }

            return { text: i18n.t('ports.status.safe'), class: 'status-safe' };
        } catch (e) {
            return { text: '', class: 'hidden' };
        }
    }

    function handleMouseOut(e) {
        if (findPortTarget(e.target)) {
            hideTooltip();
            activeTooltipPortId = null;
        }
    }

    function hideTooltip() {
        if (tooltip) tooltip.classList.add('hidden');
    }

    // ---- Detail Panel ----

    function showDetail(portId, portName) {
        const portInfo = portsData[portId] || {};
        const typeInfo = PORT_TYPES[portInfo.type || 'unknown'];

        detailPanel.querySelector('.panel-icon').textContent = typeInfo.icon;
        detailPanel.querySelector('.panel-title').textContent = portName;
        detailPanel.querySelector('.panel-type').textContent = typeInfo.label;
        detailPanel.querySelector('.panel-type').style.color = typeInfo.color;

        // Trade başlığını i18n'den al
        const tradeTitle = detailPanel.querySelector('.trade-title-text');
        if (tradeTitle) tradeTitle.textContent = typeof i18n !== 'undefined' ? i18n.t('trade.title') : 'Ticaret Fiyatları';

        const tradeContent = detailPanel.querySelector('.panel-trade-content');
        const prices = tradeData[portName];

        if (prices && prices.some(p => p > 0)) {
            tradeContent.innerHTML = buildTradeTable(prices);
        } else {
            const noDataText = typeof i18n !== 'undefined' ? i18n.t('trade.noData') : 'Bu limanda ticaret verisi yok';
            tradeContent.innerHTML = `
                <div class="panel-coming-soon">
                    <span class="coming-icon">🏴‍☠️</span>
                    <span>${noDataText}</span>
                </div>
            `;
        }

        detailPanel.classList.remove('hidden');
    }

    function closeDetail() {
        if (detailPanel) detailPanel.classList.add('hidden');
        if (activePort) {
            activePort.classList.remove('port-active');
            activePort = null;
        }
    }

    function buildTradeTable(prices) {
        // Ürün isimlerini i18n'den al
        const getProductName = (engName) => {
            if (typeof i18n !== 'undefined') return i18n.t('products.' + engName);
            return engName;
        };
        const productHeader = typeof i18n !== 'undefined' ? i18n.t('trade.product') : 'Ürün';
        const priceHeader = typeof i18n !== 'undefined' ? i18n.t('trade.price') : 'Fiyat';

        let rows = PRODUCTS.map((name, i) => {
            const price = prices[i];
            if (!price) return '';
            return `<tr><td class="product-name">${getProductName(name)}</td><td class="price">${price}</td></tr>`;
        }).join('');

        return `
            <div class="trade-table-scroll">
                <table class="trade-table">
                    <thead><tr><th>${productHeader}</th><th>${priceHeader}</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    function getTradeData() { return tradeData; }
    function getProducts() { return PRODUCTS; }
    function getPortsData() { return portsData; }

    return { init, closeDetail, showDetail, getTradeData, getProducts, getPortsData, flyToPort, renderSidebarList };
})();

document.addEventListener('DOMContentLoaded', () => { PortManager.init(); });
