/**
 * visitor.js - Gerçek Ziyaretçi Sayısı Yönetimi (Global)
 */

const VisitorManager = (() => {
    // API: Bir proje adı ('sea-battle-wind-tracer-global') üzerinden hits/up ile her giriş sayılır.
    const API_URL = 'https://api.counterapi.dev/v1/sea-battle-wind-tracer-v1/hits/up';
    const SESSION_LOCK = 'sb-visitor-session';

    async function init() {
        // Oturum başına sadece bir kere saydır (Sayfa yenilemelerini saymasın, gerçek ziyaretçi)
        const hasCounted = sessionStorage.getItem(SESSION_LOCK);
        
        if (!hasCounted) {
            await fetchCount(true);
            sessionStorage.setItem(SESSION_LOCK, 'true');
        } else {
            // Sadece mevcut sayıyı çek
            const getUrl = API_URL.replace('/up', '');
            await fetchCount(false, getUrl);
        }

        // Dil değişimini dinle
        window.addEventListener('languageChanged', () => {
            updateUI(lastKnownCount);
        });
    }

    let lastKnownCount = 0;

    async function fetchCount(increment = true, url = API_URL) {
        try {
            const response = await fetch(url);
            const data = await response.json();
            lastKnownCount = data.count || 0;
            updateUI(lastKnownCount);
        } catch (error) {
            console.error('Ziyaretçi verisi alınamadı:', error);
            // Fallback: Yerel storage'dan son bildiğimiz rakamı göster
            lastKnownCount = parseInt(localStorage.getItem('sb-last-visitor-val') || '0');
            updateUI(lastKnownCount);
        }
    }

    function updateUI(countVal) {
        const displayElement = document.getElementById('visitor-count-val');
        const labelElement = document.getElementById('visitor-label');
        const buyRumElement = document.querySelector('.buy-rum-text');

        if (displayElement) {
            displayElement.textContent = formatNumber(countVal);
            // Son başarılı rakamı yedekle
            localStorage.setItem('sb-last-visitor-val', countVal);
        }

        if (labelElement && typeof i18n !== 'undefined') {
            labelElement.textContent = i18n.t('visitor.count');
        }

        if (buyRumElement && typeof i18n !== 'undefined') {
            buyRumElement.textContent = i18n.t('visitor.buyrum');
        }
    }

    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
    VisitorManager.init();
});
