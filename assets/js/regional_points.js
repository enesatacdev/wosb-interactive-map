/**
 * regional_points.js - Bölgesel Kaynak ve POI Noktaları
 */

const RegionalPointManager = (() => {
  const REGIONAL_POINTS = [
    { id: "rk1", x: 998, y: 700, count: 200, type: "volcanicOre" },
    { id: "rk2", x: 880, y: 1015, count: 200, type: "volcanicOre" },
    { id: "ck1", x: 300, y: 390, count: 1, type: "chestKey" },
    { id: "c1", x: 420, y: 440, count: 25, type: "chest" },
    { id: "vs1", x: 678, y: 380, count: 3, type: "voodooSkull" },
    { id: "ins1", x: 1200, y: 215, count: 1, type: "insurance" },
    { id: "bm1", x: 1615, y: 285, count: 20, type: "battlemark" },
    { id: "hs1", x: 197, y: 865, count: 500, type: "heavyShot" },
    { id: "ss1", x: 890, y: 1355, count: 500, type: "saxonShot" },
    { id: "bm2", x: 1215, y: 1485, count: 10, type: "battlemark" },
    { id: "cn1", x: 1463, y: 937, count: 25, type: "coin" },
    { id: "f1", x: 1597, y: 975, count: 500, type: "fish" },
    { id: "g1", x: 1695, y: 882, count: 3000, type: "gold" },
    { id: "g2", x: 1135, y: 1005, count: 7500, type: "gold" },
    { id: "cn2", x: 360, y: 1380, count: 45, type: "coin" },
    { id: "cn3", x: 680, y: 1115, count: 35, type: "coin" },
  ];

  const RESOURCE_CATEGORIES = [
    { id: "all", icon: "🌍" },
    { id: "gold", icon: "💰" },
    { id: "coin", icon: "🪙" },
    { id: "fish", icon: "🐟" },
    { id: "volcanicOre", icon: "🌋" },
    { id: "battlemark", icon: "⚔️" }
  ];

  let container = null;
  let activeFilters = new Set(RESOURCE_CATEGORIES.map(c => c.id).filter(id => id !== 'all'));
  let isInitialized = false;

  function init() {
    container = document.getElementById("regional-points");
    if (!container) return;

    renderFilters();
    renderPoints();
    renderSidebarList();
    container.style.display = "block";
    isInitialized = true;

    // Listen for language changes
    window.addEventListener("languageChanged", () => {
      if (isInitialized) {
        renderFilters();
        renderPoints();
        renderSidebarList();
      }
    });

    // Handle "Show/Hide" from Map Layers toggle
    const toggleBtn = document.getElementById("show-regional-points");
    if (toggleBtn) {
      toggleBtn.addEventListener("change", (e) => toggle(e.target.checked));
    }
  }

  function renderFilters() {
    const sidebar = document.getElementById("side-content-drawing"); // Bölgesel liste de burada
    const filterContainer = document.getElementById("regional-filter-container");
    if (!filterContainer) return;

    filterContainer.innerHTML = RESOURCE_CATEGORIES.map(cat => {
        const isActive = cat.id === 'all' 
            ? activeFilters.size === RESOURCE_CATEGORIES.length - 1 
            : activeFilters.has(cat.id);
        
        return `
            <button class="regional-filter-btn ${isActive ? 'active' : ''}" 
                    onclick="RegionalPointManager.setFilter('${cat.id}')"
                    title="${cat.id === 'all' ? 'Tümü' : i18n.t('regionalPoints.resources.'+cat.id)}">
                ${cat.icon}
            </button>
        `;
    }).join('');
  }

  function setFilter(type) {
    if (type === 'all') {
        if (activeFilters.size === RESOURCE_CATEGORIES.length - 1) {
            activeFilters.clear();
        } else {
            RESOURCE_CATEGORIES.forEach(c => { if(c.id !== 'all') activeFilters.add(c.id); });
        }
    } else {
        if (activeFilters.has(type)) {
            activeFilters.delete(type);
        } else {
            activeFilters.add(type);
        }
    }
    renderFilters();
    renderPoints();
    renderSidebarList();
  }

  function renderPoints() {
    if (!container) return;
    container.innerHTML = "";
    
    const filteredPoints = REGIONAL_POINTS.filter(p => activeFilters.has(p.type));

    filteredPoints.forEach((point) => {
      const marker = document.createElement("div");
      marker.className = "regional-marker";
      marker.style.left = point.x + "px";
      marker.style.top = point.y + "px";
      marker.dataset.id = point.id;

      const translatedType = i18n.t("regionalPoints.resources." + point.type);
      const label = `${point.count} ${translatedType}`;

      marker.innerHTML = `
                <div class="regional-marker-icon" style="background-image: url('assets/img/regional_point.png');"></div>
                <div class="regional-marker-label">${label}</div>
            `;

      container.appendChild(marker);
    });
  }

  function renderSidebarList() {
    const listContainer = document.getElementById("regional-list-container");
    if (!listContainer) return;

    listContainer.innerHTML = "";

    const queryPoints = REGIONAL_POINTS.filter(p => activeFilters.has(p.type));

    // Sort points by type then count for better listing
    const sortedPoints = [...queryPoints].sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return b.count - a.count;
    });

    sortedPoints.forEach((point) => {
      const item = document.createElement("div");
      item.className = "regional-item";

      const translatedType = i18n.t("regionalPoints.resources." + point.type);
      const goToLabel = i18n.t("regionalPoints.goTo");
      const unitLabel = i18n.t("regionalPoints.unit");

      item.innerHTML = `
            <div class="regional-item-icon-wrapper">
                <div class="regional-item-icon" style="background-image: url('assets/img/regional_point.png');"></div>
            </div>
            <div class="regional-item-info">
                <span class="regional-item-name">${translatedType}</span>
                <span class="regional-item-resource">${point.count} ${unitLabel}</span>
            </div>
            <div class="goto-btn" title="${goToLabel}">🎯</div>
        `;

      item.addEventListener("click", () => {
        if (window.MapController) {
          window.MapController.centerOn(point.x, point.y, 1.8, false, 1200);
        }
      });

      listContainer.appendChild(item);
    });
  }

  function toggle(show) {
    if (!isInitialized) init();
    if (container) {
      container.style.display = show ? "block" : "none";
    }
  }

  return { init, toggle, renderSidebarList, setFilter };
})();

// Automatic initialization
document.addEventListener("DOMContentLoaded", () => {
  RegionalPointManager.init();
});
