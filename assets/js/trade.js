/**
 * trade.js - Ticaret Önerileri Sistemi (Trade Recommendations)
 *
 * Google Sheets verilerinden alınan liman fiyatlarını karşılaştırarak
 * en karlı ticaret rotalarını hesaplar ve sağ panelde gösterir.
 */

const TradeSystem = (() => {
    // Ürün ağırlıkları (Calculations sheet'ten alınmıştır)
    const PRODUCT_WEIGHTS = [
        4,  // Pineapples
        7,  // Vanilla
        3,  // Wine
        5,  // Grog
        6,  // Rugs
        5,  // Leather
        7,  // Cinnamon
        12, // Coffee
        4,  // Mango
        3,  // Oil
        5,  // Nuts
        9,  // Paprika
        6,  // Pepper
        6,  // Beer
        20, // Sugar
        5,  // Salt
        14, // Tobacco
        6,  // Dates
        15, // Saffron
        20  // Silk
    ];

    let tradePanel = null;
    let isPanelOpen = false;

    function init() {
        createToggleBtn();
        createPanel();

        // Dil değiştiğinde UI'ı güncelle
        window.addEventListener('languageChanged', updateUI);
    }

    function createToggleBtn() {
        // Toggle butonu (Sol menüye eklenecek)
        const sidebar = document.getElementById('toolbar-container');
        if (!sidebar) return;

        const btnHtml = `
            <button id="trade-sys-toggle" class="w-full mt-4 flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-emerald-600/80 to-teal-600/80 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all border border-emerald-400/30 shadow-lg shadow-emerald-900/20 group">
                <span class="text-xl group-hover:scale-110 transition-transform">📈</span>
                <span data-i18n="tradeSys.toggleBtn">Ticaret Önerileri</span>
            </button>
        `;
        sidebar.insertAdjacentHTML('beforeend', btnHtml);

        document.getElementById('trade-sys-toggle').addEventListener('click', togglePanel);
    }

    function createPanel() {
        tradePanel = document.createElement('div');
        tradePanel.id = 'trade-system-panel';
        tradePanel.className = 'trade-sys-panel hidden';
        
        document.body.appendChild(tradePanel);
        renderPanelContent();
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
                <button class="ts-close" onclick="TradeSystem.closePanel()">✕</button>
            </div>
            
            <div class="ts-controls">
                <div class="ts-input-group">
                    <label data-i18n="tradeSys.from">Nereden (Alış)</label>
                    <select id="ts-from-port"></select>
                </div>
                
                <div class="ts-input-group">
                    <label data-i18n="tradeSys.to">Nereye (Satış)</label>
                    <select id="ts-to-port"></select>
                </div>
                
                <button id="ts-calc-btn" class="ts-calc-btn" data-i18n="tradeSys.calculate">Rotaları Bul</button>
            </div>
            
            <div class="ts-results-info hidden" id="ts-results-info">
                <span data-i18n="tradeSys.showingResults">En iyi 50 rota gösteriliyor</span>
            </div>
            
            <div id="ts-results" class="ts-results custom-scrollbar">
                <div class="ts-empty" data-i18n="tradeSys.emptyState">Seçim yapıp rotaları bulun</div>
            </div>
        `;

        if (typeof i18n !== 'undefined') i18n.updateDOM();

        // Event listeners
        const calcBtn = document.getElementById('ts-calc-btn');
        if (calcBtn) calcBtn.addEventListener('click', calculateRoutes);
    }

    function populateSelects() {
        const fromSelect = document.getElementById('ts-from-port');
        const toSelect = document.getElementById('ts-to-port');
        if (!fromSelect || !toSelect) return;
        
        const allText = typeof i18n !== 'undefined' ? i18n.t('tradeSys.allPorts') : 'Tüm Limanlar';

        let optionsHtml = `<option value="ALL">${allText}</option>`;
        
        if (typeof PortManager !== 'undefined') {
            const tradeData = PortManager.getTradeData();
            // Limanları alfebetik sırala
            const ports = Object.keys(tradeData).sort();
            
            ports.forEach(port => {
                // Verisi olmayanları ele
                if (tradeData[port] && tradeData[port].some(p => p > 0)) {
                    optionsHtml += `<option value="${port}">${port}</option>`;
                }
            });
        }

        const currentFrom = fromSelect.value;
        const currentTo = toSelect.value;
        
        fromSelect.innerHTML = optionsHtml;
        toSelect.innerHTML = optionsHtml;
        
        if (currentFrom) fromSelect.value = currentFrom;
        if (currentTo) toSelect.value = currentTo;
    }

    function calculateRoutes() {
        if (typeof PortManager === 'undefined') return;
        
        const fromPort = document.getElementById('ts-from-port').value;
        const toPort = document.getElementById('ts-to-port').value;
        const resultsContainer = document.getElementById('ts-results');
        const resultsInfo = document.getElementById('ts-results-info');
        
        const tradeData = PortManager.getTradeData();
        const productsList = PortManager.getProducts();
        
        let routes = [];
        
        const fromPortsList = fromPort === 'ALL' ? Object.keys(tradeData) : [fromPort];
        const toPortsList = toPort === 'ALL' ? Object.keys(tradeData) : [toPort];
        
        fromPortsList.forEach(buyPort => {
            toPortsList.forEach(sellPort => {
                if (buyPort === sellPort) return;
                
                const buyPrices = tradeData[buyPort];
                const sellPrices = tradeData[sellPort];
                
                if (!buyPrices || !sellPrices) return;
                
                productsList.forEach((productName, prodIdx) => {
                    const buyPrice = buyPrices[prodIdx];
                    const sellPrice = sellPrices[prodIdx];
                    
                    if (buyPrice > 0 && sellPrice > 0 && sellPrice > buyPrice) {
                        const profit = sellPrice - buyPrice;
                        const weight = PRODUCT_WEIGHTS[prodIdx] || 1;
                        const profitPerWeight = (profit / weight).toFixed(2);
                        
                        // Sadece kar edilecek rotaları ekle
                        routes.push({
                            product: productName,
                            buyPort: buyPort,
                            sellPort: sellPort,
                            buyPrice: buyPrice,
                            sellPrice: sellPrice,
                            profit: profit,
                            profitPerWeight: parseFloat(profitPerWeight)
                        });
                    }
                });
            });
        });
        
        // Karşılaştırma: Toplam kara göre değil, Birim Ağırlık Karına (Profit per Unit Weight) göre sırala
        // Çünkü ambar sınırlıdır, ağırlık başına en çok kar bırakan ürün en iyisidir!
        routes.sort((a, b) => b.profitPerWeight - a.profitPerWeight);
        
        // Sadece ilk 50 rotayı al
        routes = routes.slice(0, 50);
        
        displayResults(routes, resultsContainer);
        resultsInfo.classList.remove('hidden');
    }

    function displayResults(routes, container) {
        if (routes.length === 0) {
            container.innerHTML = `
                <div class="ts-empty">
                    <span class="text-3xl mb-2">🤷‍♂️</span>
                    <span data-i18n="tradeSys.noProfit">Bu kriterlerde karlı bir rota bulunamadı.</span>
                </div>
            `;
            if (typeof i18n !== 'undefined') i18n.updateDOM();
            return;
        }

        const getProductName = (engName) => {
            if (typeof i18n !== 'undefined') return i18n.t('products.' + engName);
            return engName;
        };
        
        const profitText = typeof i18n !== 'undefined' ? i18n.t('tradeSys.profit') : 'Kar';
        const weightText = typeof i18n !== 'undefined' ? i18n.t('tradeSys.perWeight') : 'Ağırlık Başına';
        const buyText = typeof i18n !== 'undefined' ? i18n.t('tradeSys.buy') : 'Alış';
        const sellText = typeof i18n !== 'undefined' ? i18n.t('tradeSys.sell') : 'Satış';

        const html = routes.map((route, index) => `
            <div class="ts-route-card ${index < 3 ? 'top-route' : ''}">
                ${index === 0 ? '<div class="top-badge">🥇 #1</div>' : ''}
                ${index === 1 ? '<div class="top-badge silver">🥈 #2</div>' : ''}
                ${index === 2 ? '<div class="top-badge bronze">🥉 #3</div>' : ''}
                
                <div class="ts-route-header">
                    <span class="ts-product-name">${getProductName(route.product)}</span>
                    <div class="ts-profit-badge">+${route.profit}</div>
                </div>
                
                <div class="ts-route-path">
                    <div class="ts-port-col">
                        <span class="ts-port-label">${buyText}</span>
                        <span class="ts-port-name text-sky-400">${route.buyPort}</span>
                        <span class="ts-price">${route.buyPrice}</span>
                    </div>
                    
                    <div class="ts-arrow">➔</div>
                    
                    <div class="ts-port-col text-right">
                        <span class="ts-port-label">${sellText}</span>
                        <span class="ts-port-name text-emerald-400">${route.sellPort}</span>
                        <span class="ts-price text-emerald-400">${route.sellPrice}</span>
                    </div>
                </div>
                
                <div class="ts-route-footer">
                    <span>${profitText}: <strong class="text-emerald-400">+${route.profit}</strong></span>
                    <span class="text-slate-500">•</span>
                    <span>${weightText}: <strong class="text-yellow-400 font-mono">${route.profitPerWeight}</strong></span>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
        if (typeof i18n !== 'undefined') i18n.updateDOM();
    }

    function togglePanel() {
        isPanelOpen = !isPanelOpen;
        if (isPanelOpen) {
            tradePanel.classList.remove('hidden');
            populateSelects(); // Açıldığında liman listesini doldur
        } else {
            tradePanel.classList.add('hidden');
        }
    }

    function closePanel() {
        isPanelOpen = false;
        tradePanel.classList.add('hidden');
    }
    
    function updateUI() {
        if (!tradePanel) return;
        renderPanelContent();
        populateSelects();
        
        // Eğer açık ve hesaplama yapılmışsa dili güncellemek için yeniden hesapla
        if (isPanelOpen && document.getElementById('ts-results').innerHTML.includes('ts-route-card')) {
            calculateRoutes();
        }
    }

    return { init, togglePanel, closePanel };
})();

document.addEventListener('DOMContentLoaded', () => { TradeSystem.init(); });
