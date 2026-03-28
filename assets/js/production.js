/**
 * production.js - Üretim Alanları Yönetimi (Demir, İpek vb.)
 */

const ProductionManager = (() => {
    let productionNodes = [];
    let activeFilters = new Set();
    let isInitialized = false;

    // Harita üzerindeki İngilizce etiketlerin i18n anahtarlarıyla eşleşmesi
    const TYPE_MAPPING = {
        'iron': 'demir',
        'wood': 'kereste',
        'resin': 'resin',
        'rum': 'rum',
        'water': 'su',
        'coal': 'komur',
        'copper': 'bakir',
        'farm': 'ciftlik',
        'silver': 'gumush',
        'silk': 'ipek',
        'hemp': 'kenevir',
        'leather': 'deri',
        'cloth': 'kumash',
        'tobacco': 'tutun',
        'dye': 'boya'
    };

    const RESOURCE_ICONS = {
        "all": "🌍",
        "demir": "assets/img/iron.png",
        "kereste": "assets/img/wood.png",
        "resin": "assets/img/resin.png",
        "su": "assets/img/water.png",
        "rum": "assets/img/rum.png",
        "komur": "assets/img/coal.png",
        "bakir": "assets/img/copper.png",
        "ciftlik": "assets/img/farm.png",
        "ipek": "🧵", // Görsel yoksa emoji
        "kenevir": "🌿",
        "deri": "🐂",
        "gumush": "🥈",
        "kumash": "👕",
        "tutun": "🍂",
        "boya": "🎨"
    };

    function init() {
        if (isInitialized) return;
        
        // DOM'daki statik üretim alanlarını tara (.productionxy sınıfını kullan)
        const elements = document.querySelectorAll('.productionxy');
        elements.forEach((el, index) => {
            const style = el.getAttribute('style') || '';
            
            // Koordinatları ayıkla
            const leftMatch = style.match(/left:\s*([0-9.]+)px/);
            const topMatch = style.match(/top:\s*([0-9.]+)px/);
            
            // Tipi belirlemek için bir sonraki etiketi oku (productionxylabel)
            const labelEl = el.nextElementSibling;
            let rawType = 'unknown';
            let title = 'Bilinmeyen';
            
            if (labelEl && labelEl.classList.contains('productionxylabel')) {
                const text = labelEl.textContent.trim();
                const firstWord = text.split(' ')[0].toLowerCase();
                
                // Eğer tip haritadan kaldırıldıysa (matbaa gibi), onu atlayalım
                if (firstWord === 'printshop') {
                    el.style.display = 'none';
                    labelEl.style.display = 'none';
                    return;
                }

                rawType = TYPE_MAPPING[firstWord] || firstWord;
                title = text.split('#')[0].trim();
            }

            // --- İKON ENJEKSİYONU (Haritadaki noktanın içine resmi koy) ---
            const iconPath = RESOURCE_ICONS[rawType];
            if (iconPath && iconPath.includes('.png')) {
                // Noktayı şeffaf yap ve resmi içine ortalayarak ekle
                el.style.background = 'transparent';
                el.style.width = '24px';
                el.style.height = '24px';
                el.style.display = 'flex';
                el.style.alignItems = 'center';
                el.style.justifyContent = 'center';
                el.style.overflow = 'visible';
                el.style.zIndex = '150';
                
                // Orijinal nokta merkezini korumak için transform-translate kullanıyoruz
                el.innerHTML = `<img src="${iconPath}" style="width: 24px; height: 24px; pointer-events: none; transform: translate(-50%, -50%); position: absolute; left: 50%; top: 50%;">`;
            }

            const node = {
                id: 'prod-' + index,
                element: el,
                labelElement: labelEl,
                title: title,
                type: rawType,
                x: leftMatch ? parseFloat(leftMatch[1]) : 0,
                y: topMatch ? parseFloat(topMatch[1]) : 0
            };
            
            productionNodes.push(node);
            activeFilters.add(rawType);
        });

        setupEvents();
        renderFilters();
        
        // Başlangıçta filtreleri uygula (senkronizasyon için)
        applyFilters();
        
        // Başlangıç durumuna göre ana konteynırı ayarla
        const toggleBtn = document.getElementById('show-production');
        if (toggleBtn) {
            toggle(toggleBtn.checked);
        }

        isInitialized = true;
    }

    function setupEvents() {
        const searchInput = document.getElementById('production-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => renderSidebarList(e.target.value));
        }

        // Katman toggle dinleyicisi
        const toggleBtn = document.getElementById('show-production');
        if (toggleBtn) {
            toggleBtn.addEventListener('change', (e) => toggle(e.target.checked));
        }

        window.addEventListener('languageChanged', () => {
            renderFilters();
            renderSidebarList();
        });
    }

    function renderFilters() {
        const container = document.getElementById('production-filter-container');
        if (!container) return;

        const typesInMap = [...new Set(productionNodes.map(n => n.type))].sort();
        
        let html = `
            <div class="grid grid-cols-2 gap-2 w-full">
        `;

        typesInMap.forEach(type => {
            const isActive = activeFilters.has(type);
            const iconPath = RESOURCE_ICONS[type];
            const iconHtml = iconPath && iconPath.includes('.png') 
                ? `<img src="${iconPath}" class="w-4 h-4 object-contain">`
                : `<span class="text-xs">${iconPath || '📦'}</span>`;
            
            const label = i18n.t(`production.resources.${type}`);

            html += `
                <div class="flex items-center justify-between p-2 bg-slate-800/40 rounded-lg border border-slate-700/50">
                    <div class="flex items-center gap-2 overflow-hidden">
                        ${iconHtml}
                        <span class="text-[10px] font-bold text-slate-300 truncate">${label}</span>
                    </div>
                    <label class="toggle-switch scale-75 origin-right">
                        <input type="checkbox" ${isActive ? 'checked' : ''} onchange="ProductionManager.setFilter('${type}')">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    function toggleAll() {
        const types = [...new Set(productionNodes.map(n => n.type))];
        if (activeFilters.size === types.length) {
            activeFilters.clear();
        } else {
            types.forEach(t => activeFilters.add(t));
        }
        applyFilters();
    }

    function setFilter(type) {
        if (activeFilters.has(type)) {
            activeFilters.delete(type);
        } else {
            activeFilters.add(type);
        }
        applyFilters();
    }

    function applyFilters() {
        productionNodes.forEach(node => {
            const show = activeFilters.has(node.type);
            node.element.style.display = show ? 'block' : 'none';
            // Ensure labelElements are always hidden
            if (node.labelElement) node.labelElement.style.display = 'none';
        });
        renderSidebarList(document.getElementById('production-search-input')?.value || '');
    }

    function renderSidebarList(query = '') {
        const container = document.getElementById('production-list-container');
        if (!container) return;

        const searchTerm = query.toLowerCase();
        const list = productionNodes.filter(n => 
            activeFilters.has(n.type) && 
            n.title.toLowerCase().includes(searchTerm)
        ).sort((a,b) => a.title.localeCompare(b.title));

        if (list.length === 0) {
            container.innerHTML = '<div class="text-center py-8 opacity-40 text-xs">Sonuç bulunamadı</div>';
            return;
        }

        container.innerHTML = list.map(node => {
            const iconPath = RESOURCE_ICONS[node.type];
            const iconHtml = iconPath && iconPath.includes('.png') 
                ? `<img src="${iconPath}" class="w-4 h-4 object-contain">`
                : `<span class="text-xs">${iconPath || '📦'}</span>`;
            
            const label = i18n.t(`production.resources.${node.type}`);
            
            return `
                <div class="port-list-item group" onclick="ProductionManager.flyTo('${node.id}')">
                    <div class="flex items-center gap-3 flex-1 min-width-0">
                        <div class="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700/50 group-hover:border-sky-500/50 transition-colors">
                            ${iconHtml}
                        </div>
                        <div class="flex flex-col min-width-0">
                            <span class="text-[11px] font-bold text-slate-200 group-hover:text-white truncate transition-colors">${label}</span>
                        </div>
                    </div>
                    <div class="text-right shrink-0">
                        <span class="text-[10px] font-mono text-sky-400/70 group-hover:text-sky-400 transition-colors">${Math.round(node.x)}, ${Math.round(node.y)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function flyTo(id) {
        const node = productionNodes.find(n => n.id === id);
        if (node && window.MapController) {
            window.MapController.centerOn(node.x, node.y, 2, false, 800);
            node.element.classList.add('highlight-pulse');
            setTimeout(() => node.element.classList.remove('highlight-pulse'), 3000);
        }
    }

    function toggle(show) {
        const parent = document.getElementById('productionsxy');
        if (parent) {
            parent.style.display = show ? 'block' : 'none';
        }
        
        // Filitreleri uygula
        applyFilters();
    }

    return { init, toggleAll, setFilter, flyTo };
})();

// DOM Yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    ProductionManager.init();
});
