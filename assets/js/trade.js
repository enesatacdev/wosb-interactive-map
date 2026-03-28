const TradeSystem = (() => {
    // Ürün ağırlıkları (Calculations sheet'ten alınmıştır)
    const PRODUCT_WEIGHTS = [
        4, 7, 3, 5, 6, 5, 7, 12, 4, 3, 5, 9, 6, 6, 20, 5, 14, 6, 15, 20
    ];

    const PVP_CENTER = { x: 931, y: 775 };
    const PVP_RADIUS = 360;

    // Harita Sabitleri (draw.js ile senkronize)
    const PX_TO_GAME = 9.9; 
    const GAME_UNITS_PER_MINUTE = 510;

    let tradePanel = null;
    let currentRouteLine = null;

    function init() {
        createPanel();
        window.addEventListener('languageChanged', updateUI);
    }

    function createPanel() {
        tradePanel = document.getElementById('trade-panel-container');
        if (!tradePanel) return;
        tradePanel.className = 'trade-sys-panel';
        renderPanelContent();
        populateSelects();
    }

    function renderPanelContent() {
        if (!tradePanel) return;
        const t = (key) => typeof i18n !== 'undefined' ? i18n.t(key) : key;
        
        tradePanel.innerHTML = `
            <div class="ts-header">
                <div>
                    <h2 class="ts-title">📈 <span data-i18n="tradeSys.title">Ticaret Önerileri</span></h2>
                    <p class="ts-subtitle" data-i18n="tradeSys.subtitle">En karlı rotaları keşfedin</p>
                </div>
            </div>
            
            <div class="ts-controls">
                <div class="grid grid-cols-2 gap-3">
                    <div class="ts-input-group">
                        <label data-i18n="tradeSys.from">Nereden (Alış)</label>
                        <select id="ts-from-port" class="ts-select"></select>
                    </div>
                    <div class="ts-input-group">
                        <label data-i18n="tradeSys.to">Nereye (Satış)</label>
                        <select id="ts-to-port" class="ts-select"></select>
                    </div>
                </div>

                <div class="flex items-end gap-3 mt-1">
                    <div class="ts-input-group flex-1">
                        <label data-i18n="tradeSys.sortBy">Sıralama</label>
                        <select id="ts-sort-by" class="ts-select">
                            <option value="efficiency" data-i18n="tradeSys.sortEfficiency">Verimlilik (Karlılık)</option>
                            <option value="profit" data-i18n="tradeSys.sortProfit">Toplam Kar</option>
                            <option value="weightProfit" data-i18n="tradeSys.sortWeightProfit">Ağırlık Başı Kar</option>
                            <option value="distance" data-i18n="tradeSys.sortDistance">En Yakın Mesafe</option>
                        </select>
                    </div>
                    <div class="ts-input-group w-[110px]">
                        <label class="text-[10px] text-slate-500 uppercase font-bold tracking-tight mb-1 cursor-pointer" for="ts-include-pvp" data-i18n="tradeSys.includePvp">PvP Dahil</label>
                        <div class="flex items-center h-[42px] bg-slate-800/40 rounded-xl px-3 border border-slate-700/50">
                            <label class="toggle-switch"><input type="checkbox" id="ts-include-pvp"><span class="toggle-slider"></span></label>
                        </div>
                    </div>
                </div>
                
                <div class="flex gap-2 mt-4">
                    <div class="ts-input-group flex-1">
                        <label data-i18n="tradeSys.cargoCapacity">Gemi Kapasitesi</label>
                        <input type="number" id="ts-cargo-capacity" class="ts-select" value="100" min="0">
                    </div>
                </div>

                <div class="flex gap-2 mt-4">
                    <button id="ts-calc-btn" class="ts-calc-btn flex-[2]" data-i18n="tradeSys.calculate">Rotaları Bul</button>
                    <button id="ts-clear-route-btn" class="ts-clear-btn hidden" title="${t('tradeSys.clearRoute')}">🧹</button>
                </div>
            </div>
            
            <div class="ts-results-info hidden" id="ts-results-info">
                <span data-i18n="tradeSys.showingResults">Sonuçlar</span>
            </div>
            
            <div id="ts-results" class="ts-results custom-scrollbar">
                <div class="ts-empty" data-i18n="tradeSys.emptyState">Seçim yapıp rotaları bulun</div>
            </div>
        `;

        // Event Listener: Calculate
        const calcBtn = document.getElementById('ts-calc-btn');
        if (calcBtn) calcBtn.addEventListener('click', calculateRoutes);

        // Event Listener: Clear Route
        const clearBtn = document.getElementById('ts-clear-route-btn');
        if (clearBtn) clearBtn.addEventListener('click', clearRouteFromMap);
        
        if (typeof i18n !== 'undefined') i18n.updateDOM();
    }

    function populateSelects() {
        const fromSelect = document.getElementById('ts-from-port');
        const toSelect = document.getElementById('ts-to-port');
        if (!fromSelect || !toSelect) return;
        
        const allText = typeof i18n !== 'undefined' ? i18n.t('tradeSys.allPorts') : 'Tüm Limanlar';
        let optionsHtml = `<option value="ALL">${allText}</option>`;
        
        if (typeof PortManager !== 'undefined') {
            const ports = Object.keys(PortManager.getTradeData()).sort();
            ports.forEach(port => {
                optionsHtml += `<option value="${port}">${port}</option>`;
            });
        }
        fromSelect.innerHTML = optionsHtml;
        toSelect.innerHTML = optionsHtml;
    }

    function calculateDistance(p1, p2) {
        if (!p1 || !p2) return 9999;
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function checkPvPIntersection(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;
        const t = Math.max(0, Math.min(1, ((PVP_CENTER.x - p1.x) * dx + (PVP_CENTER.y - p1.y) * dy) / lenSq));
        const projX = p1.x + t * dx;
        const projY = p1.y + t * dy;
        const distToCenter = Math.sqrt((projX - PVP_CENTER.x) ** 2 + (projY - PVP_CENTER.y) ** 2);
        return distToCenter < PVP_RADIUS;
    }

    function calculateRoutes() {
        if (typeof PortManager === 'undefined') return;
        const fromPort = document.getElementById('ts-from-port').value;
        const toPort = document.getElementById('ts-to-port').value;
        const sortBy = document.getElementById('ts-sort-by').value;
        const excludePvp = !document.getElementById('ts-include-pvp').checked;
        const cargoCapacity = parseFloat(document.getElementById('ts-cargo-capacity').value) || 0;
        
        const tradeData = PortManager.getTradeData();
        const portsMeta = PortManager.getPortsData();
        const productsList = PortManager.getProducts();
        
        const findMeta = (name) => {
            if (!portsMeta || !name) return null;
            const searchName = name.toLowerCase().trim();
            // 1. Direct key match (slugified)
            if (portsMeta[searchName]) return portsMeta[searchName];
            // 2. Name field match
            const key = Object.keys(portsMeta).find(k => (portsMeta[k].name || '').toLowerCase().trim() === searchName);
            return key ? portsMeta[key] : null;
        };

        const fromPortsList = fromPort === 'ALL' ? Object.keys(tradeData) : [fromPort];
        const toPortsList = toPort === 'ALL' ? Object.keys(tradeData) : [toPort];
        
        let routes = [];
        fromPortsList.forEach(buyPort => {
            toPortsList.forEach(sellPort => {
                if (buyPort === sellPort) return;
                const buyPrices = tradeData[buyPort];
                const sellPrices = tradeData[sellPort];
                if (!buyPrices || !sellPrices) return;

                const m1 = findMeta(buyPort);
                const m2 = findMeta(sellPort);
                if (!m1 || !m2) return;

                const dist = (m1 && m2) ? calculateDistance(m1, m2) : 9999;
                const crossesPvp = (m1 && m2) ? checkPvPIntersection(m1, m2) : false;
                
                // Strict PvP Filter
                if (excludePvp && crossesPvp) return;

                const effectiveDist = Math.max(1, dist);

                productsList.forEach((productName, prodIdx) => {
                    const buyPrice = buyPrices[prodIdx];
                    const sellPrice = sellPrices[prodIdx];
                    if (buyPrice > 0 && sellPrice > buyPrice) {
                        const profit = sellPrice - buyPrice;
                        const weight = PRODUCT_WEIGHTS[prodIdx] || 1;
                        const profitPerWeight = profit / weight;
                        
                        // Efficiency: How much gold you make per nautical mile per weight unit
                        const efficiency = (profitPerWeight * 1000) / effectiveDist;

                        const distanceUnits = Math.round(dist * PX_TO_GAME);
                        const timeMins = (distanceUnits / GAME_UNITS_PER_MINUTE).toFixed(1);

                        routes.push({
                            product: productName,
                            buyPort: buyPort, sellPort: sellPort,
                            buyPrice, sellPrice, profit,
                            profitPerWeight,
                            distance: distanceUnits,
                            time: timeMins,
                            efficiency,
                            crossesPvp,
                            totalProfit: profitPerWeight * cargoCapacity,
                            m1, m2
                        });
                    }
                });
            });
        });

        // Sorting Logic
        if (sortBy === 'efficiency') routes.sort((a, b) => b.efficiency - a.efficiency);
        else if (sortBy === 'profit') routes.sort((a, b) => b.profit - a.profit);
        else if (sortBy === 'weightProfit') routes.sort((a, b) => b.profitPerWeight - a.profitPerWeight);
        else if (sortBy === 'distance') routes.sort((a, b) => a.distance - b.distance);

        displayResults(routes.slice(0, 50), document.getElementById('ts-results'));
        const resultsInfo = document.getElementById('ts-results-info');
        resultsInfo.innerHTML = `<span>${t('tradeSys.showingResults')} (${routes.length})</span>`;
        resultsInfo.classList.remove('hidden');
    }

    function displayResults(routes, container) {
        if (routes.length === 0) {
            container.innerHTML = `<div class="ts-empty">🤷‍♂️ <span data-i18n="tradeSys.noProfit">No routes found</span></div>`;
            return;
        }

        const t = (key) => i18n.t(key);
        container.innerHTML = routes.map((r, i) => `
            <div class="ts-route-card ${i < 3 ? 'top-route' : ''}" onclick="TradeSystem.showRouteOnMap('${r.buyPort}', '${r.sellPort}')">
                ${i < 3 ? `<div class="top-badge ${i==1?'silver':i==2?'bronze':''}">#${i+1}</div>` : ''}
                <div class="ts-route-header">
                    <span class="ts-product-name">${t('products.'+r.product)}</span>
                    <div class="ts-profit-badge">+${Math.round(r.profit)}</div>
                </div>
                <div class="ts-route-path">
                    <div class="ts-port-col">
                        <span class="ts-port-label">${t('tradeSys.buy')}</span>
                        <span class="ts-port-name">${r.buyPort}</span>
                        <span class="ts-price">${r.buyPrice}</span>
                    </div>
                    <div class="ts-arrow">➔</div>
                    <div class="ts-port-col text-right">
                        <span class="ts-port-label">${t('tradeSys.sell')}</span>
                        <span class="ts-port-name">${r.sellPort}</span>
                        <span class="ts-price">${r.sellPrice}</span>
                    </div>
                </div>
                <div class="ts-route-footer">
                    <span>${t('tradeSys.distance')}: <strong>${r.distance.toLocaleString(i18n.getCurrentLang() === 'tr' ? 'tr-TR' : 'en-US')} ${t('tradeUnits.nm')}</strong> · <strong>${r.time} ${t('tradeUnits.min')}</strong></span>
                    ${r.crossesPvp ? `<span class="text-rose-500 font-bold">${t('tradeSys.pvpWarning')}</span>` : ''}
                    <div class="flex justify-between mt-1 pt-1 border-t border-slate-700/50">
                        <span class="text-sky-400 font-bold">${Math.round(r.profitPerWeight * 10) / 10} ${t('tradeSys.perWeightUnit')}</span>
                        <span class="text-emerald-400 font-bold">${t('tradeSys.totalProfit')}: ${Math.round(r.totalProfit).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `).join('');
        if (typeof i18n !== 'undefined') i18n.updateDOM();
    }

    function showRouteOnMap(fromName, toName) {
        const portsMeta = PortManager.getPortsData();
        const findPort = (name) => {
            const search = name.toLowerCase().trim();
            return Object.values(portsMeta).find(p => (p.name || '').toLowerCase().trim() === search);
        };

        const m1 = findPort(fromName);
        const m2 = findPort(toName);
        if (!m1 || !m2) return;

        // Draw Line
        const canvasWrapper = document.getElementById('canvas-wrapper');
        clearRouteFromMap(true);

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.cssText = "position:absolute; top:0; left:0; pointer-events:none; z-index:210;";
        svg.id = "trade-route-svg";

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        // Add Offset (16px) to center the line on the 32x32 port icons
        line.setAttribute("x1", Number(m1.x) + 16);
        line.setAttribute("y1", Number(m1.y) + 16);
        line.setAttribute("x2", Number(m2.x) + 16);
        line.setAttribute("y2", Number(m2.y) + 16);
        line.setAttribute("stroke", "#0ea5e9");
        line.setAttribute("stroke-width", "5");
        line.setAttribute("stroke-dasharray", "10,10");
        line.style.filter = "drop-shadow(0 0 8px #0ea5e9)";
        
        svg.appendChild(line);
        canvasWrapper.appendChild(svg);
        currentRouteLine = svg;

        // Show/Hide Clear Button
        document.getElementById('ts-clear-route-btn').classList.remove('hidden');

        // Center map
        if (typeof MapController !== 'undefined') {
            const midX = (m1.x + m2.x) / 2;
            const midY = (m1.y + m2.y) / 2;
            MapController.centerOn(midX, midY, 0.6, false, 1000);
        }
    }

    function clearRouteFromMap(silent = false) {
        if (currentRouteLine) {
            currentRouteLine.remove();
            currentRouteLine = null;
        }
        if (!silent) {
            document.getElementById('ts-clear-route-btn').classList.add('hidden');
        }
    }

    function updateUI() {
        if (!tradePanel) return;
        renderPanelContent();
        populateSelects();
    }

    return { init, calculateRoutes, showRouteOnMap, updateUI, clearRouteFromMap };
})();

document.addEventListener('DOMContentLoaded', () => TradeSystem.init());
