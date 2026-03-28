/**
 * port_settings.js - Liman Ayarları Yönetimi
 * Kullanıcıların limanları özelleştirmesini sağlar.
 */

const PortSettingsManager = (() => {
    const STORAGE_KEY = 'sb-port-custom-settings';
    const ICON_LIST = [
        { id: 'k', path: 'assets/img/k.png', label: 'Küçük' },
        { id: 'n', path: 'assets/img/n.png', label: 'Tarafsız' },
        { id: 'f', path: 'assets/img/f.png', label: 'Kale' },
        { id: 'p', path: 'assets/img/p.png', label: 'Korsan' }
    ];

    let customSettings = {}; // portId -> settings

    function init() {
        loadSettings();
        renderUI();
        applyAllSettings();
        
        // Arama kutusu dinleyici
        const searchInput = document.getElementById('port-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => renderUI(e.target.value));
        }

        // i18n değişince listeyi yenile
        window.addEventListener('languageChanged', () => renderUI(searchInput ? searchInput.value : ''));
    }
    function loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) customSettings = JSON.parse(saved);
        } catch (e) {
            console.error('Liman ayarları yüklenemedi:', e);
        }
    }

    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customSettings));
    }

    function getSetting(portId, field, defaultValue) {
        if (!customSettings[portId]) return defaultValue;
        return customSettings[portId][field] !== undefined ? customSettings[portId][field] : defaultValue;
    }

    function updateSetting(portId, field, value) {
        if (!customSettings[portId]) customSettings[portId] = {};
        customSettings[portId][field] = value;
        saveSettings();
        applyToDOM(portId);
    }

    function applyAllSettings() {
        // PortManager.getPortsData() veya PORTS_COORDINATES kullanılabilir
        // Şimdilik DOM üzerinden gidelim
        document.querySelectorAll('img[data-port-id]').forEach(img => {
            applyToDOM(img.dataset.portId);
        });
    }

    function applyToDOM(portId) {
        const img = document.querySelector(`img[data-port-id="${portId}"]`);
        const label = document.querySelector(`.label[data-port-id="${portId}"]`);
        if (!img) return;

        const settings = customSettings[portId] || {};
        
        // 1. Görünürlük (Ayrı ayrı)
        const showIcon = settings.showIcon !== undefined ? settings.showIcon : true;
        const showLabel = settings.showLabel !== undefined ? settings.showLabel : true;
        
        img.style.display = showIcon ? 'block' : 'none';
        if (label) label.style.display = showLabel ? 'block' : 'none';

        if (!showIcon && !showLabel) return;

        // 2. İkon
        if (settings.icon) {
            const iconObj = ICON_LIST.find(i => i.id === settings.icon);
            if (iconObj) img.src = iconObj.path;
        }

        // 3. Ölçek (Scale)
        const scale = settings.scale || 1.0;
        img.style.transform = `scale(${scale})`;

        // 4. İsim Boyutu
        if (label) {
            const fontSize = settings.labelSize || 20;
            label.style.fontSize = fontSize + 'px';
        }
    }

    function renderUI(filter = '') {
        const container = document.getElementById('port-settings-list');
        if (!container) return;

        // Liman listesini al
        const ports = PortManager.getPortsData();
        const query = filter.toLowerCase().trim();
        
        // Filtrele ve Sırala
        const sortedIds = Object.keys(ports)
            .filter(id => ports[id].name.toLowerCase().includes(query))
            .sort((a, b) => ports[a].name.localeCompare(ports[b].name));

        const t = (key) => typeof i18n !== 'undefined' ? i18n.t(key) : key;

        if (sortedIds.length === 0) {
            container.innerHTML = `<div class="text-center py-8 text-slate-500 text-[11px] italic">${t("tooltip.noData")}</div>`;
            return;
        }

        container.innerHTML = sortedIds.map(id => {
            const p = ports[id];
            const settings = customSettings[id] || {};
            const scale = settings.scale || 1.0;
            const labelSize = settings.labelSize || 20;
            const showIcon = settings.showIcon !== undefined ? settings.showIcon : true;
            const showLabel = settings.showLabel !== undefined ? settings.showLabel : true;
            const currentIcon = settings.icon || (p.icon.includes('/k.png') ? 'k' : p.icon.includes('/n.png') ? 'n' : p.icon.includes('/f.png') ? 'f' : 'p');

            return `
                <div class="ps-card" data-id="${id}">
                    <div class="ps-header" onclick="PortSettingsManager.handleHeaderClick('${id}', this)">
                        <div class="ps-title-info">
                            <div class="ps-badge-icon">
                                <img src="assets/img/${currentIcon}.png" alt="">
                            </div>
                            <span class="ps-name-text">${p.name}</span>
                        </div>
                        <span class="ps-arrow">▼</span>
                    </div>
                    <div class="ps-body">
                        <div class="ps-form-group">
                            <label class="ps-label">${t("portSettings.owner")}</label>
                            <input type="text" class="ps-input" value="${settings.owner || ''}" 
                                oninput="PortSettingsManager.updateSetting('${id}', 'owner', this.value)" placeholder="${t("portSettings.ownerPlaceholder")}">
                        </div>
                        <div class="ps-form-group">
                            <label class="ps-label">${t("portSettings.clan")}</label>
                            <input type="text" class="ps-input" value="${settings.clan || ''}" 
                                oninput="PortSettingsManager.updateSetting('${id}', 'clan', this.value)" placeholder="${t("portSettings.clanPlaceholder")}">
                        </div>
                        <div class="ps-form-group">
                            <label class="ps-label">${t("portSettings.warHours")}</label>
                            <input type="text" class="ps-input" value="${settings.warHours || ''}" 
                                oninput="PortSettingsManager.updateSetting('${id}', 'warHours', this.value)" placeholder="${t("portSettings.warPlaceholder")}">
                        </div>
                        
                        <div class="ps-form-group">
                            <label class="ps-label">${t("portSettings.iconSelect")}</label>
                            <div class="ps-icon-selector">
                                ${ICON_LIST.map(icon => `
                                    <div class="ps-icon-option ${currentIcon === icon.id ? 'active' : ''}" 
                                        onclick="PortSettingsManager.changeIcon('${id}', '${icon.id}', this)" title="${t("portSettings.icons." + icon.id)}">
                                        <img src="${icon.path}" alt="">
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="ps-control-row">
                            <span class="ps-control-label">${t("portSettings.iconScale")}</span>
                            <div class="flex items-center gap-2 flex-1">
                                <input type="range" min="0.5" max="3" step="0.1" value="${scale}" class="w-full accent-sky-500"
                                    oninput="PortSettingsManager.updateSetting('${id}', 'scale', parseFloat(this.value)); this.nextElementSibling.textContent = this.value + 'x'">
                                <span class="ps-slider-val">${scale}x</span>
                            </div>
                        </div>

                        <div class="ps-control-row">
                            <span class="ps-control-label">${t("portSettings.labelSize")}</span>
                            <div class="flex items-center gap-2 flex-1">
                                <input type="range" min="8" max="40" step="1" value="${labelSize}" class="w-full accent-sky-500"
                                    oninput="PortSettingsManager.updateSetting('${id}', 'labelSize', parseInt(this.value)); this.nextElementSibling.textContent = this.value + 'px'">
                                <span class="ps-slider-val">${labelSize}px</span>
                            </div>
                        </div>

                        <div class="ps-form-group border-t border-slate-700/30 pt-3">
                            <label class="flex items-center justify-between mb-2 cursor-pointer">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">${t("portSettings.showIcon")}</span>
                                <span class="toggle-switch transform scale-75">
                                    <input type="checkbox" ${showIcon ? 'checked' : ''} 
                                        onchange="PortSettingsManager.updateSetting('${id}', 'showIcon', this.checked)">
                                    <span class="toggle-slider"></span>
                                </span>
                            </label>
                            <label class="flex items-center justify-between cursor-pointer">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">${t("portSettings.showLabel")}</span>
                                <span class="toggle-switch transform scale-75">
                                    <input type="checkbox" ${showLabel ? 'checked' : ''} 
                                        onchange="PortSettingsManager.updateSetting('${id}', 'showLabel', this.checked)">
                                    <span class="toggle-slider"></span>
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function handleHeaderClick(portId, headerElement) {
        // 1. Haritada git
        if (typeof PortManager !== 'undefined' && PortManager.flyToPort) {
            PortManager.flyToPort(portId);
        }
        
        // 2. Diğerlerini kapat (Accordion mantığı)
        const currentCard = headerElement.parentElement;
        document.querySelectorAll('.ps-card.active').forEach(card => {
            if (card !== currentCard) card.classList.remove('active');
        });

        // 3. Paneli aç/kapat
        currentCard.classList.toggle('active');
    }

    function changeIcon(portId, iconId, element) {
        // UI güncelle
        const card = element.closest('.ps-card');
        card.querySelectorAll('.ps-icon-option').forEach(opt => opt.classList.remove('active'));
        element.classList.add('active');
        
        // Header ikonunu güncelle
        card.querySelector('.ps-badge-icon img').src = `assets/img/${iconId}.png`;
        
        // Ayarı kaydet ve uygula
        updateSetting(portId, 'icon', iconId);
    }

    return { init, updateSetting, changeIcon, handleHeaderClick, getSettings: (id) => customSettings[id] || {} };
})();

document.addEventListener('DOMContentLoaded', () => {
    // PortManager init() olduktan sonra çalışması güvenli olur
    setTimeout(() => PortSettingsManager.init(), 100);
});
