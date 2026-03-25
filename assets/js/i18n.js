/**
 * i18n.js - Çoklu Dil Desteği (Internationalization)
 *
 * Kullanım:
 * - HTML'de: <span data-i18n="sidebar.ports">Limanlar</span>
 * - JS'de:   i18n.t('sidebar.ports') → "Limanlar" veya "Ports"
 * - Dil değişimi: i18n.setLanguage('en')
 *
 * Çeviriler inline olarak gömülüdür (file:// CORS sorunu çözümü).
 * Yeni dil eklemek için: LANG_DATA objesine yeni key ekleyin.
 */

const i18n = (() => {
    // Tüm dil verileri inline (CORS-immune)
    const LANG_DATA = {
        tr: {
            app: { title: "World of Sea Battle - Interactive Map" },
            sidebar: {
                brand: "World of Sea Battle", subtitle: "Interactive Map by Vurkaçoğlu",
                windControl: "Rüzgar Kontrolü",
                date: "Tarih", time: "Saat",
                windDirection: "Rüzgar Yönü",
                mapLayers: "Harita Katmanları",
                ports: "Limanlar", lighthouses: "Fenerler", fastTravel: "Hızlı Seyahat",
                islands: "Kişisel Adalar", production: "Üretim Alanları",
                altars: "Sunaklar", forts: "Kaleler", pvpBorder: "PvP Sınırı", windLayer: "Rüzgar Çizgileri",
                language: "Dil"
            },
            products: {
                Pineapples: "Ananas", Vanilla: "Vanilya", Wine: "Şarap", Grog: "Grog",
                Rugs: "Halı", Leather: "Deri", Cinnamon: "Tarçın", Coffee: "Kahve",
                Mango: "Mango", Oil: "Yağ", Nuts: "Fındık", Paprika: "Biber",
                Pepper: "Karabiber", Beer: "Bira", Sugar: "Şeker", Salt: "Tuz",
                Tobacco: "Tütün", Dates: "Hurma", Saffron: "Safran", Silk: "İpek"
            },
            trade: { title: "Ticaret Fiyatları", product: "Ürün", price: "Fiyat", noData: "Bu limanda ticaret verisi yok" },
            tradeSys: {
                toggleBtn: "Ticaret Önerileri",
                title: "Ticaret Önerileri",
                subtitle: "En karlı rotaları keşfedin",
                from: "Nereden (Alış)",
                to: "Nereye (Satış)",
                allPorts: "Tüm Limanlar",
                calculate: "Rotaları Bul",
                showingResults: "En iyi 50 rota gösteriliyor",
                emptyState: "Seçim yapıp rotaları bulun",
                noProfit: "Bu kriterlerde karlı bir rota bulunamadı.",
                profit: "Kar",
                perWeight: "Ağırlık Başına",
                buy: "Alış",
                sell: "Satış"
            },
            tooltip: {
                port: "Liman",
                clickForDetails: "Detaylar için tıklayın",
                noData: "Veri bulunamadı"
            }
        },
        en: {
            app: { title: "World of Sea Battle - Interactive Map" },
            sidebar: {
                brand: "World of Sea Battle", subtitle: "Interactive Map by Vurkaçoğlu",
                windControl: "Wind Control",
                date: "Date", time: "Time",
                windDirection: "Wind Direction",
                mapLayers: "Map Layers",
                ports: "Ports", lighthouses: "Lighthouses", fastTravel: "Fast Travel",
                islands: "Personal Islands", production: "Production Sites",
                altars: "Altars", forts: "Forts", pvpBorder: "PvP Border", windLayer: "Wind Flow",
                language: "Language"
            },
            products: {
                Pineapples: "Pineapples", Vanilla: "Vanilla", Wine: "Wine", Grog: "Grog",
                Rugs: "Rugs", Leather: "Leather", Cinnamon: "Cinnamon", Coffee: "Coffee",
                Mango: "Mango", Oil: "Oil", Nuts: "Nuts", Paprika: "Paprika",
                Pepper: "Pepper", Beer: "Beer", Sugar: "Sugar", Salt: "Salt",
                Tobacco: "Tobacco", Dates: "Dates", Saffron: "Saffron", Silk: "Silk"
            },
            trade: { title: "Trade Prices", product: "Product", price: "Price", noData: "No trade data for this port" },
            tradeSys: {
                toggleBtn: "Trade Routes",
                title: "Trade Recommendations",
                subtitle: "Discover the most profitable routes",
                from: "From (Buy)",
                to: "To (Sell)",
                allPorts: "All Ports",
                calculate: "Find Routes",
                showingResults: "Showing top 50 routes",
                emptyState: "Select ports to find routes",
                noProfit: "No profitable route found for these criteria.",
                profit: "Profit",
                perWeight: "Per Unit Weight",
                buy: "Buy",
                sell: "Sell"
            },
            tooltip: {
                port: "Port",
                clickForDetails: "Click for details",
                noData: "No data found"
            }
        }
    };

    let currentLang = 'tr';
    try { currentLang = localStorage.getItem('sb-lang') || 'tr'; } catch(e) {}
    let translations = LANG_DATA[currentLang] || LANG_DATA.tr;

    // Nested key'den değer al: "sidebar.ports" → translations.sidebar.ports
    function t(key) {
        const keys = key.split('.');
        let val = translations;
        for (const k of keys) {
            if (val && typeof val === 'object' && k in val) {
                val = val[k];
            } else {
                return key;
            }
        }
        return typeof val === 'string' ? val : key;
    }

    // [data-i18n] attribute'lu tüm elementleri güncelle
    function updateDOM() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translated = t(key);
            if (translated !== key) el.textContent = translated;
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translated = t(key);
            if (translated !== key) el.placeholder = translated;
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const translated = t(key);
            if (translated !== key) el.title = translated;
        });
    }

    // Dil değiştir
    function setLanguage(lang) {
        if (!LANG_DATA[lang]) return;
        currentLang = lang;
        translations = LANG_DATA[lang];
        try { localStorage.setItem('sb-lang', lang); } catch(e) {}
        updateDOM();

        const selector = document.getElementById('lang-select');
        if (selector) selector.value = lang;

        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    function getCurrentLang() { return currentLang; }

    // Başlat
    function init() {
        translations = LANG_DATA[currentLang] || LANG_DATA.tr;
        updateDOM();

        const selector = document.getElementById('lang-select');
        if (selector) {
            selector.value = currentLang;
            selector.addEventListener('change', (e) => setLanguage(e.target.value));
        }
    }

    return { t, setLanguage, getCurrentLang, init, updateDOM };
})();

document.addEventListener('DOMContentLoaded', () => { i18n.init(); });
