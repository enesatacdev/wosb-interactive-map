/**
 * draw.js - Harita Üzerine Çizim, İkon ve Rota Planlama Sistemi (v2)
 * ===================================================================
 * Sağdan açılır panel ile:
 *   - Kalem, Çizgi, Dikdörtgen, Daire, Yazı, Silgi çizim araçları
 *   - Haritaya yerleştirilebilir ikonlar (taşı, büyüt, küçült, sil)
 *   - Rota planlama (waypoint, mesafe hesabı, yolculuk süresi)
 *
 * Mesafe Formülü (oyun içi ölçümlerden):
 *   Harita: 1863×1551 px = 18455×15347 oyun birimi
 *   1 piksel ≈ 9.9 oyun birimi  |  ~510 birim = 1 dk yol
 */

const DrawManager = (() => {
  // ─── Araçlar ───
  const TOOLS = {
    select: { icon: "🖱️", labelKey: "draw.tools.select", cursor: "default" },
    pen: { icon: "✏️", labelKey: "draw.tools.pen", cursor: "crosshair" },
    line: { icon: "📏", labelKey: "draw.tools.line", cursor: "crosshair" },
    rect: { icon: "⬜", labelKey: "draw.tools.rect", cursor: "crosshair" },
    circle: { icon: "⭕", labelKey: "draw.tools.circle", cursor: "crosshair" },
    polygon: { icon: "⬡", labelKey: "draw.tools.polygon", cursor: "crosshair" },
    area: { icon: "〽️", labelKey: "draw.tools.area", cursor: "crosshair" },
    text: { icon: "🔤", labelKey: "draw.tools.text", cursor: "text" },
    eraser: { icon: "🧹", labelKey: "draw.tools.eraser", cursor: "crosshair" },
    route: { icon: "🧭", labelKey: "draw.tools.route", cursor: "crosshair" },
    icon: { icon: "📌", labelKey: "draw.tools.icon", cursor: "copy" },
    p2pRoute: { icon: "📏", labelKey: "draw.tools.p2pRoute", cursor: "crosshair" },
    ping: { icon: "🔘", labelKey: "draw.tools.ping", cursor: "crosshair" },
  };

  // ─── İkonlar ───
  const ICON_SET = [
    { emoji: "⚓", label: "Çapa" },
    { emoji: "🚢", label: "Gemi" },
    { emoji: "⚔️", label: "Savaş" },
    { emoji: "🏴‍☠️", label: "Korsan" },
    { emoji: "💀", label: "Tehlike" },
    { emoji: "⚠️", label: "Uyarı" },
    { emoji: "🛡️", label: "Savunma" },
    { emoji: "🔥", label: "Ateş" },
    { emoji: "💣", label: "Bomba" },
    { emoji: "🏰", label: "Kale" },
    { emoji: "📍", label: "İşaret" },
    { emoji: "⭐", label: "Yıldız" },
    { emoji: "🏳️", label: "Bayrak" },
    { emoji: "🗡️", label: "Kılıç" },
    { emoji: "🎯", label: "Hedef" },
    { emoji: "💰", label: "Hazine" },
  ];

  // ─── Harita Sabitleri ───
  const MAP_WIDTH = 1863;
  const MAP_HEIGHT = 1551;
  const PADDING = 2000;
  const CANVAS_WIDTH = MAP_WIDTH + PADDING * 2;
  const CANVAS_HEIGHT = MAP_HEIGHT + PADDING * 2;
  const STORAGE_KEY = "sb-drawings";

  // Mesafe hesabı sabitleri
  const GAME_WIDTH = 18455; // Oyun birimi
  const GAME_HEIGHT = 15347;
  const PX_TO_GAME_X = GAME_WIDTH / MAP_WIDTH; // ~9.9
  const PX_TO_GAME_Y = GAME_HEIGHT / MAP_HEIGHT; // ~9.9
  const PX_TO_GAME = (PX_TO_GAME_X + PX_TO_GAME_Y) / 2; // Ortalama
  const GAME_UNITS_PER_MINUTE = 510;

  // ─── Durum ───
  let drawCanvas = null;
  let ctx = null;
  let sidePanel = null;
  let isDrawMode = false;
  let currentTool = "pen";
  let outlineColor = "#ef4444";
  let outlineAlpha = 1.0;
  let fillColor = "#ef4444";
  let fillAlpha = 0.0;
  let currentSize = 3;
  let isDrawing = false;
  let startX = 0,
    startY = 0;
  let paths = [];
  let currentPath = [];
  let polygonPoints = []; // Poligon noktaları için
  let selectedIcon = "⚓";

  // Rota sistemi
  let routePath = []; // Aktif çizilen rotanın noktaları
  let routes = []; // Tamamlanmış rotalar [{points:[], color, size}]

  // Yazı ve İkon sistemleri (State-driven)
  let texts = []; // [{x, y, text, color, size}]
  let icons = []; // [{x, y, emoji, size}]

  // ─── INIT ───
  function init() {
    const canvasEl = document.getElementById("canvas");
    if (!canvasEl) return;

    // Yazı katmanı
    const textLayer = document.createElement("div");
    textLayer.id = "draw-text-layer";
    textLayer.style.cssText = `
            position: absolute; top: -${PADDING}px; left: -${PADDING}px;
            width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px;
            z-index: 201; pointer-events: none;
        `;
    document.getElementById("canvas-wrapper").appendChild(textLayer);

    // Dil değişimi desteği
    window.addEventListener('languageChanged', () => {
        if (sidePanel) {
            const isOpen = !sidePanel.classList.contains('hidden');
            sidePanel.remove();
            createSidePanel();
            if (isOpen) sidePanel.classList.remove('hidden');
        }
    });

    // İkon katmanı
    const iconLayer = document.createElement("div");
    iconLayer.id = "draw-icon-layer";
    iconLayer.style.cssText = `
            position: absolute; top: -${PADDING}px; left: -${PADDING}px;
            width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px;
            z-index: 202; pointer-events: none;
        `;
    document.getElementById("canvas-wrapper").appendChild(iconLayer);

    // Canvas overlay
    drawCanvas = document.createElement("canvas");
    drawCanvas.id = "draw-canvas";
    drawCanvas.width = CANVAS_WIDTH;
    drawCanvas.height = CANVAS_HEIGHT;
    drawCanvas.style.cssText = `
            position: absolute; top: -${PADDING}px; left: -${PADDING}px;
            width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px;
            z-index: 200; pointer-events: none;
        `;
    canvasEl.appendChild(drawCanvas);
    ctx = drawCanvas.getContext("2d");

    // Preview Canvas (for shapes to prevent snapshot lag)
    const previewCanvas = document.createElement("canvas");
    previewCanvas.id = "draw-preview-canvas";
    previewCanvas.width = CANVAS_WIDTH;
    previewCanvas.height = CANVAS_HEIGHT;
    previewCanvas.style.cssText = `
            position: absolute; top: -${PADDING}px; left: -${PADDING}px;
            width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px;
            z-index: 201; pointer-events: none;
        `;
    canvasEl.appendChild(previewCanvas);

    textLayer.style.zIndex = "202";
    iconLayer.style.zIndex = "203";

    // Ping katmanı
    const pingLayer = document.createElement("div");
    pingLayer.id = "draw-ping-layer";
    pingLayer.style.cssText = `
            position: absolute; top: -${PADDING}px; left: -${PADDING}px;
            width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px;
            z-index: 1000; pointer-events: none;
        `;
    document.getElementById("canvas-wrapper").appendChild(pingLayer);

    // CTRL+Z Geri Al
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        const active = document.activeElement;
        if (
          active &&
          (active.tagName === "INPUT" ||
            active.tagName === "TEXTAREA" ||
            active.isContentEditable)
        )
          return;

        if (isDrawMode && paths.length > 0) {
          paths.pop();
          redraw();
          saveDrawings();
        }
      }
    });

    createSidePanel();
    createContextMenu();
    loadDrawings();
    redraw();
  }

  // ─── SAĞ TIK MENÜSÜ ───
  let contextMenu = null;
  let selectedShape = null; // { collection: 'paths'|'routes'|'texts'|'icons', index: number }
  let isMoving = false;
  let dragStartPos = null; // {x, y} harita koordinatları

  function createContextMenu() {
    contextMenu = document.createElement("div");
    contextMenu.className = "dsp-context-menu hidden";
    contextMenu.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:11px; font-weight:bold; color:#cbd5e1;">Seçim Ayarı</span>
                <button id="ctx-close-btn" style="background:none; border:none; color:#94a3b8; font-size:12px; cursor:pointer; padding:0 4px;">✕</button>
            </div>
            <div class="dsp-options-stack">
                <div class="dsp-flex-row">
                    <span style="font-size:10px; color:#94a3b8; width:35px;">Çizgi:</span>
                    <input type="color" id="ctx-outline" value="${outlineColor}" class="dsp-color">
                    <input type="range" id="ctx-outline-alpha" min="0" max="100" value="${outlineAlpha * 100}" class="dsp-slider">
                </div>
                <div class="dsp-flex-row" id="ctx-fill-row">
                    <span style="font-size:10px; color:#94a3b8; width:35px;">Dolgu:</span>
                    <input type="color" id="ctx-fill" value="${fillColor}" class="dsp-color">
                    <input type="range" id="ctx-fill-alpha" min="0" max="100" value="${fillAlpha * 100}" class="dsp-slider">
                </div>
                <div style="display:flex; gap:4px; margin-top:6px;">
                    <button id="ctx-move-btn" class="dsp-action-btn" style="flex:1; padding:4px 0; font-size:11px;">✥ Taşı</button>
                    <button id="ctx-delete-btn" class="dsp-action-btn dsp-danger" style="flex:1; padding:4px 0; font-size:11px;">🗑️ Sil</button>
                </div>
            </div>
        `;
    document.body.appendChild(contextMenu);

    // Event Dinleyiciler
    contextMenu.querySelector("#ctx-outline").addEventListener("input", (e) => {
      if (selectedShape) {
        const target = getTargetFromSelection(selectedShape);
        if (target) {
          if (
            selectedShape.collection === "routes" ||
            selectedShape.collection === "texts"
          )
            target.color = e.target.value;
          else target.oColor = e.target.value;

          if (selectedShape.collection === "texts") {
            syncDomElements();
          }
        }
      } else {
        outlineColor = e.target.value;
        sidePanel.querySelector("#draw-outline-color").value = outlineColor;
      }
      redraw();
      saveDrawings();
    });
    contextMenu
      .querySelector("#ctx-outline-alpha")
      .addEventListener("input", (e) => {
        if (selectedShape) {
          const target = getTargetFromSelection(selectedShape);
          if (target) target.alpha = e.target.value / 100;
          if (
            selectedShape.collection === "texts" ||
            selectedShape.collection === "icons"
          )
            syncDomElements();
        } else {
          outlineAlpha = e.target.value / 100;
          sidePanel.querySelector("#draw-outline-alpha").value = e.target.value;
        }
        redraw();
        saveDrawings();
      });
    contextMenu.querySelector("#ctx-fill").addEventListener("input", (e) => {
      if (selectedShape && selectedShape.collection === "paths") {
        paths[selectedShape.index].fColor = e.target.value;
      } else {
        fillColor = e.target.value;
        sidePanel.querySelector("#draw-fill-color").value = fillColor;
      }
      redraw();
      saveDrawings();
    });
    contextMenu
      .querySelector("#ctx-fill-alpha")
      .addEventListener("input", (e) => {
        if (selectedShape && selectedShape.collection === "paths") {
          paths[selectedShape.index].fAlpha = e.target.value / 100;
        } else {
          fillAlpha = e.target.value / 100;
          sidePanel.querySelector("#draw-fill-alpha").value = e.target.value;
        }
        redraw();
        saveDrawings();
      });

    contextMenu
      .querySelector("#ctx-delete-btn")
      .addEventListener("click", () => {
        if (selectedShape) {
          const col = getCollection(selectedShape.collection);
          if (col) col.splice(selectedShape.index, 1);
          if (
            selectedShape.collection === "texts" ||
            selectedShape.collection === "icons"
          )
            syncDomElements();
          selectedShape = null;
          redraw();
          saveDrawings();
          contextMenu.classList.add("hidden");
        }
      });

    contextMenu.querySelector("#ctx-move-btn").addEventListener("click", () => {
      if (selectedShape) {
        isMoving = true;
        contextMenu.classList.add("hidden");
        // Drag start referansını onMouseMove'un ilk aşamasında belirleyeceğiz
        dragStartPos = null;
        redraw();
      }
    });

    // Kapatma butonu
    contextMenu
      .querySelector("#ctx-close-btn")
      .addEventListener("click", () => {
        contextMenu.classList.add("hidden");
        selectedShape = null;
        redraw();
      });

    // Tıklamayla kapat
    document.addEventListener("mousedown", (e) => {
      if (contextMenu && e.button !== 2 && !contextMenu.contains(e.target)) {
        if (!contextMenu.classList.contains("hidden")) {
          contextMenu.classList.add("hidden");
          selectedShape = null;
          redraw();
        }
      }
    });
  }

  function showContextMenu(x, y, shapeHit = null) {
    if (!contextMenu) return;
    selectedShape = shapeHit;

    contextMenu.style.left = x + "px";
    contextMenu.style.top = y + "px";
    contextMenu.classList.remove("hidden");

    const fillRow = contextMenu.querySelector("#ctx-fill-row");

    if (selectedShape) {
      const target = getTargetFromSelection(selectedShape);
      contextMenu.querySelector("#ctx-delete-btn").style.display = "block";

      if (
        !target ||
        selectedShape.collection === "routes" ||
        target.type === "pen" ||
        target.type === "line" ||
        target.type === "eraser" ||
        selectedShape.collection === "icons"
      ) {
        fillRow.style.display = "none";
      } else {
        fillRow.style.display = "flex";
      }

      // Mevcut renk değerlerini çek
      const ocol = target.color || target.oColor || outlineColor;
      contextMenu.querySelector("#ctx-outline").value =
        typeof ocol === "string" && ocol.startsWith("#") ? ocol : outlineColor;
      contextMenu.querySelector("#ctx-outline-alpha").value =
        (target.alpha !== undefined ? target.alpha : 1.0) * 100;

      if (target.fColor) {
        contextMenu.querySelector("#ctx-fill").value = target.fColor;
      }
      if (target.fAlpha !== undefined) {
        contextMenu.querySelector("#ctx-fill-alpha").value =
          target.fAlpha * 100;
      } else if (target.alpha !== undefined) {
        // Eğer fAlpha yoksa ama alpha varsa onu kullan (bazı v1 uyumlulukları için)
        contextMenu.querySelector("#ctx-fill-alpha").value = target.alpha * 100;
      }
    } else {
      // Global ayarlar
      contextMenu.querySelector("#ctx-delete-btn").style.display = "none";
      fillRow.style.display = "flex";
      contextMenu.querySelector("#ctx-outline").value = outlineColor;
      contextMenu.querySelector("#ctx-outline-alpha").value =
        outlineAlpha * 100;
      contextMenu.querySelector("#ctx-fill").value = fillColor;
      contextMenu.querySelector("#ctx-fill-alpha").value = fillAlpha * 100;
    }
  }

  // ─── SAĞ PANEL ───
  function createSidePanel() {
    const viewport = document.getElementById("map-viewport");
    if (!viewport) return;

    const t = (key) => (typeof i18n !== "undefined" ? i18n.t(key) : key);

    sidePanel = document.createElement("div");
    sidePanel.id = "draw-side-panel";
    sidePanel.className = "draw-side-panel hidden";
    sidePanel.innerHTML = `
            <div class="dsp-header">
                <span>🎨 ${t("draw.title")}</span>
                <button class="dsp-close" title="${t("draw.close") || "Close"}">✕</button>
            </div>

            <div class="dsp-body custom-scrollbar">
                <div class="dsp-section">
                    <div class="dsp-section-title">${t("draw.sectionTools")}</div>
                    <div class="dsp-tools">
                        ${Object.entries(TOOLS)
                          .map(
                            ([key, tool]) =>
                              `<button class="dsp-tool-btn ${key === currentTool ? "active" : ""}" data-tool="${key}" title="${t(tool.labelKey)}"><span class="dsp-tool-icon">${tool.icon}</span><span class="dsp-tool-label">${t(tool.labelKey)}</span></button>`,
                          )
                          .join("")}
                    </div>
                </div>

                <div class="dsp-section">
                    <div class="dsp-section-title">${t("draw.sectionOutline")}</div>
                    <div class="dsp-options-stack">
                        <div class="dsp-flex-row">
                            <input type="color" id="draw-outline-color" value="${outlineColor}" class="dsp-color">
                            <div class="flex-grow ml-2">
                                <div class="flex justify-between mb-1">
                                    <span class="text-[10px] font-bold text-slate-500 uppercase">${t("draw.outlineSize")}</span>
                                    <span class="text-[10px] font-bold text-sky-400" id="val-draw-size">${currentSize}px</span>
                                </div>
                                <input type="range" id="draw-size-slider" min="1" max="25" value="${currentSize}" class="dsp-slider">
                            </div>
                        </div>
                        <div class="dsp-flex-row mt-3">
                            <span class="dsp-slider-label">${t("draw.opacity")}:</span>
                            <input type="range" id="draw-outline-alpha" min="0" max="100" value="${outlineAlpha * 100}" class="dsp-slider">
                            <span class="dsp-slider-val" id="val-outline-alpha">${Math.round(outlineAlpha * 100)}%</span>
                        </div>
                    </div>
                </div>

                <div class="dsp-section">
                    <div class="dsp-section-title">${t("draw.sectionFill")}</div>
                    <div class="dsp-options-stack">
                        <div class="dsp-flex-row">
                            <input type="color" id="draw-fill-color" value="${fillColor}" class="dsp-color">
                            <div class="flex-grow ml-2">
                                <span class="dsp-slider-label">${t("draw.opacity")}:</span>
                                <input type="range" id="draw-fill-alpha" min="0" max="100" value="${fillAlpha * 100}" class="dsp-slider">
                                <span class="dsp-slider-val" id="val-fill-alpha">${Math.round(fillAlpha * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dsp-section dsp-icon-section hidden">
                    <div class="dsp-section-title">${t("draw.sectionIcons")}</div>
                    <div class="dsp-icon-grid">
                        ${ICON_SET.map(
                          (ic) =>
                            `<button class="dsp-icon-pick ${ic.emoji === selectedIcon ? "active" : ""}" data-icon="${ic.emoji}" title="${ic.label}">${ic.emoji}</button>`,
                        ).join("")}
                    </div>
                </div>

                <div class="dsp-section dsp-route-info hidden">
                    <div class="dsp-section-title">🧭 ${t("draw.sectionRoute")}</div>
                    
                    <div class="dsp-route-stats-grid">
                        <div class="dsp-stat-card">
                            <span class="ps-label">${t("draw.distance")}</span>
                            <div class="flex items-baseline gap-1">
                                <span class="text-lg font-extrabold text-sky-400" id="route-distance">0</span>
                                <span class="text-[10px] font-bold text-slate-500">${t("tradeUnits.nm")}</span>
                            </div>
                        </div>
                        <div class="dsp-stat-card">
                            <span class="ps-label">${t("draw.time")}</span>
                            <div class="flex items-baseline gap-1">
                                <span class="text-lg font-extrabold text-emerald-400" id="route-time">0</span>
                                <span class="text-[10px] font-bold text-slate-500">${t("tradeUnits.min")}</span>
                            </div>
                        </div>
                        <div class="dsp-stat-card">
                            <span class="ps-label">${t("draw.routeCount")}</span>
                            <div class="flex items-baseline gap-1">
                                <span class="text-lg font-extrabold text-amber-400" id="route-count">0</span>
                            </div>
                        </div>
                    </div>

                    <div class="dsp-route-hint">
                        ${t("draw.hint")}
                    </div>

                    <div id="route-list" class="dsp-route-list custom-scrollbar" style="max-height: 200px; overflow-y: auto;"></div>
                    
                    <button class="dsp-route-clear-btn" id="route-clear-btn">
                        <span>🗑️</span> ${t("draw.clearRoutes")}
                    </button>
                </div>

                <div class="dsp-section dsp-layers-section">
                    <div class="dsp-section-title">${t("draw.sectionLayers")}</div>
                    <div id="layer-list" class="dsp-route-list" style="margin-bottom:0; max-height:180px; overflow-y:auto;">
                        <div style="padding:10px; text-align:center; color:#64748b; font-size:11px;">${t("draw.noDrawings")}</div>
                    </div>
                </div>

                <div class="dsp-section dsp-actions">
                    <button class="dsp-action-btn" id="draw-undo">↩️ ${t("draw.undo")}</button>
                    <button class="dsp-action-btn dsp-danger" id="draw-clear">🗑️ ${t("draw.clearAll")}</button>
                </div>
            </div>
        </div>
        `;
    viewport.appendChild(sidePanel);


    // ─── Event Listeners ───
    sidePanel
      .querySelector(".dsp-close")
      .addEventListener("click", toggleDrawMode);

    // Araç seçimi
    sidePanel.querySelectorAll(".dsp-tool-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentTool = btn.dataset.tool;
        sidePanel
          .querySelectorAll(".dsp-tool-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // Seçili araca göre cursor güncelle
        viewport.style.cursor = TOOLS[currentTool].cursor;

        // İkon bölümünü göster/gizle
        sidePanel
          .querySelector(".dsp-icon-section")
          .classList.toggle("hidden", currentTool !== "icon");
        // Rota bölümünü göster/gizle
        sidePanel
          .querySelector(".dsp-route-info")
          .classList.toggle("hidden", currentTool !== "route");

        // Rota modundan çıkınca aktif rotayı bitir
        if (currentTool !== "route" && routePath.length > 0) {
          finishRoute();
        }
        // Poligon modundan çıkınca aktif poligonu bitir
        if (currentTool !== "polygon" && polygonPoints.length > 0) {
          finishPolygon();
        }
      });
    });

    // Renkler ve Şeffaflıklar
    sidePanel
      .querySelector("#draw-outline-color")
      .addEventListener("input", (e) => (outlineColor = e.target.value));
    sidePanel
      .querySelector("#draw-fill-color")
      .addEventListener("input", (e) => (fillColor = e.target.value));

    sidePanel
      .querySelector("#draw-outline-alpha")
      .addEventListener("input", (e) => {
        outlineAlpha = e.target.value / 100;
        document.getElementById("val-outline-alpha").textContent =
          e.target.value + "%";
      });
    sidePanel
      .querySelector("#draw-fill-alpha")
      .addEventListener("input", (e) => {
        fillAlpha = e.target.value / 100;
        document.getElementById("val-fill-alpha").textContent =
          e.target.value + "%";
      });

    // Kalınlık (Slider)
    const sizeSlider = sidePanel.querySelector("#draw-size-slider");
    const sizeVal = sidePanel.querySelector("#val-draw-size");
    if (sizeSlider) {
        sizeSlider.addEventListener("input", (e) => {
            currentSize = parseInt(e.target.value);
            if (sizeVal) sizeVal.textContent = currentSize + "px";
        });
    }

    // İkon seçimi
    sidePanel.querySelectorAll(".dsp-icon-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedIcon = btn.dataset.icon;
        sidePanel
          .querySelectorAll(".dsp-icon-pick")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    // Geri al
    sidePanel.querySelector("#draw-undo").addEventListener("click", () => {
      paths.pop();
      redraw();
      saveDrawings();
    });

    // Hepsini sil
    sidePanel.querySelector("#draw-clear").addEventListener("click", () => {
      if (confirm(t("draw.clearAll") + "?")) {
        paths = [];
        routes = [];
        routePath = [];
        polygonPoints = [];
        document.getElementById("draw-text-layer").innerHTML = "";
        document.getElementById("draw-icon-layer").innerHTML = "";
        redraw();
        saveDrawings();
        updateRouteStats();
      }
    });

    // Rotaları temizle
    sidePanel
      .querySelector("#route-clear-btn")
      .addEventListener("click", () => {
        routes = [];
        routePath = [];
        redraw();
        saveDrawings();
        updateRouteStats();
      });

    // Panel scroll'u engelle
    sidePanel.addEventListener("wheel", (e) => e.stopPropagation());
  }

  // ─── DRAW MODE TOGGLE ───
  function toggleDrawMode(force) {
    if (typeof force === "boolean") isDrawMode = force;
    else isDrawMode = !isDrawMode;
    
    const viewport = document.getElementById("map-viewport");
    const navDraw = document.getElementById("nav-draw");

    if (isDrawMode) {
      drawCanvas.style.pointerEvents = "auto";
      sidePanel.classList.remove("hidden");
      if (navDraw) navDraw.classList.add("active");
      viewport.style.cursor = TOOLS[currentTool].cursor;
      attachDrawEvents();
    } else {
      drawCanvas.style.pointerEvents = "none";
      sidePanel.classList.add("hidden");
      if (navDraw) navDraw.classList.remove("active");
      viewport.style.cursor = "";
      detachDrawEvents();
      if (routePath.length > 0) finishRoute();
      if (polygonPoints.length > 0) finishPolygon();
    }
  }

  function attachDrawEvents() {
    drawCanvas.addEventListener("mousedown", onMouseDown);
    drawCanvas.addEventListener("mousemove", onMouseMove);
    drawCanvas.addEventListener("mouseup", onMouseUp);
    drawCanvas.addEventListener("dblclick", onDoubleClick);
    drawCanvas.addEventListener("contextmenu", onRightClick);
    // Zoom'u engelleme! Wheel eventi haritaya geçsin
  }

  function detachDrawEvents() {
    drawCanvas.removeEventListener("mousedown", onMouseDown);
    drawCanvas.removeEventListener("mousemove", onMouseMove);
    drawCanvas.removeEventListener("mouseup", onMouseUp);
    drawCanvas.removeEventListener("dblclick", onDoubleClick);
    drawCanvas.removeEventListener("contextmenu", onRightClick);
  }

  // ─── KOORDİNAT DÖNÜŞÜMÜ ───
  function toCanvasCoords(e) {
    const rect = drawCanvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  // ─── MESAFE HESAPLAMA ───
  function pixelDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  function pxToGameUnits(pxDist) {
    return Math.round(pxDist * PX_TO_GAME);
  }

  function gameUnitsToMinutes(units) {
    return (units / GAME_UNITS_PER_MINUTE).toFixed(1);
  }

  // ─── ROTA FONİKSİYONLARI ───
  function getRouteLength(points) {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += pixelDistance(
        points[i - 1].x,
        points[i - 1].y,
        points[i].x,
        points[i].y,
      );
    }
    return total;
  }

  function updateRouteStats() {
    const distEl = document.getElementById("route-distance");
    const timeEl = document.getElementById("route-time");
    const countEl = document.getElementById("route-count");
    const listEl = document.getElementById("route-list");
    if (!distEl) return;

    let totalPx = 0;
    for (const r of routes) totalPx += getRouteLength(r.points);

    const gameUnits = pxToGameUnits(totalPx);
    const minutes = gameUnitsToMinutes(gameUnits);

    distEl.textContent = gameUnits.toLocaleString("tr-TR");
    timeEl.textContent = minutes;
    countEl.textContent = routes.length;

    // Rota listesi oluştur (her biri silinebilir)
    if (listEl) {
      listEl.innerHTML = "";
      routes.forEach((r, idx) => {
        const len = getRouteLength(r.points);
        const gu = pxToGameUnits(len);
        const mins = gameUnitsToMinutes(gu);
        const item = document.createElement("div");
        item.className = "dsp-route-item";
        item.innerHTML = `
                    <span class="dsp-route-item-info">
                        <span class="dsp-route-item-color" style="background:${r.color}"></span>
                        Rota ${idx + 1}: ${gu.toLocaleString("tr-TR")} birim · ${mins} dk
                    </span>
                    <button class="dsp-route-item-del" data-idx="${idx}" title="Sil">✕</button>
                `;
        item
          .querySelector(".dsp-route-item-del")
          .addEventListener("click", () => {
            routes.splice(idx, 1);
            redraw();
            saveDrawings();
            updateRouteStats();
          });
        listEl.appendChild(item);
      });
    }
  }

  function finishRoute() {
    if (routePath.length >= 5) {
      // Noktaları sadeleştir (her 3. noktayı al, performans için)
      const simplified = [];
      for (let i = 0; i < routePath.length; i += 3)
        simplified.push(routePath[i]);
      simplified.push(routePath[routePath.length - 1]); // Son noktayı ekle
      routes.push({
        points: simplified,
        color: getHexColor(outlineColor, outlineAlpha),
        size: currentSize + 1,
      });
      saveDrawings();
    }
    routePath = [];
    redraw();
    updateRouteStats();
  }

  function finishPolygon() {
    if (polygonPoints.length >= 3) {
      paths.push({
        type: "polygon",
        points: [...polygonPoints],
        oColor: getHexColor(outlineColor, outlineAlpha),
        fColor: getHexColor(fillColor, fillAlpha),
        size: currentSize,
      });
      saveDrawings();
    }
    polygonPoints = [];
    redraw();
  }

  // HEX + Alpha birleştirme
  function getHexColor(hex, alpha) {
    if (hex.startsWith("rgba")) return hex;
    let r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ─── HIT TESTING (Seçim Aracı) ───
  function findHitShape(x, y) {
    // En son çizilen (tersten) en üsttedir
    for (let i = paths.length - 1; i >= 0; i--) {
      const p = paths[i];
      ctx.beginPath();
      if (
        p.type === "pen" ||
        p.type === "area" ||
        p.type === "polygon" ||
        p.type === "eraser"
      ) {
        for (let j = 0; j < p.points.length; j++) {
          if (j === 0) ctx.moveTo(p.points[j].x, p.points[j].y);
          else ctx.lineTo(p.points[j].x, p.points[j].y);
        }
        if (p.type === "area" || p.type === "polygon") {
          ctx.closePath();
          if (ctx.isPointInPath(x, y))
            return { collection: "paths", index: i, type: p.type };
          ctx.lineWidth = p.size;
          // Kenarına tıklanmasını da hesaba kat
          if (ctx.isPointInStroke(x, y))
            return { collection: "paths", index: i, type: p.type };
        } else {
          ctx.lineWidth = Math.max(p.size, 10); // Seçimi kolaylaştırmak için
          if (ctx.isPointInStroke(x, y))
            return { collection: "paths", index: i, type: p.type };
        }
      } else if (p.type === "line") {
        ctx.moveTo(p.x1, p.y1);
        ctx.lineTo(p.x2, p.y2);
        ctx.lineWidth = Math.max(p.size, 10);
        if (ctx.isPointInStroke(x, y))
          return { collection: "paths", index: i, type: p.type };
      } else if (p.type === "rect") {
        ctx.rect(p.x1, p.y1, p.x2 - p.x1, p.y2 - p.y1);
        if (ctx.isPointInPath(x, y))
          return { collection: "paths", index: i, type: p.type };
        ctx.lineWidth = Math.max(p.size, 10);
        if (ctx.isPointInStroke(x, y))
          return { collection: "paths", index: i, type: p.type };
      } else if (p.type === "circle") {
        const rx = Math.abs(p.x2 - p.x1) / 2;
        const ry = Math.abs(p.y2 - p.y1) / 2;
        const cx = (p.x1 + p.x2) / 2;
        const cy = (p.y1 + p.y2) / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (ctx.isPointInPath(x, y))
          return { collection: "paths", index: i, type: p.type };
        ctx.lineWidth = Math.max(p.size, 10);
        if (ctx.isPointInStroke(x, y))
          return { collection: "paths", index: i, type: p.type };
      }
    }

    // Rotaları kontrol et
    for (let i = routes.length - 1; i >= 0; i--) {
      const r = routes[i];
      if (r.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(r.points[0].x, r.points[0].y);
      for (let j = 1; j < r.points.length; j++)
        ctx.lineTo(r.points[j].x, r.points[j].y);
      ctx.lineWidth = Math.max(r.size || 3, 10);
      if (ctx.isPointInStroke(x, y))
        return { collection: "routes", index: i, type: "route" };
    }

    // Yazıları kontrol et (Merkezleme varsayımı ile)
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      const w = t.text.length * t.size * 0.6;
      const h = t.size;
      if (
        x >= t.x - w / 2 &&
        x <= t.x + w / 2 &&
        y >= t.y - h / 2 &&
        y <= t.y + h / 2
      ) {
        return { collection: "texts", index: i, type: "text" };
      }
    }

    // İkonları kontrol et
    for (let i = icons.length - 1; i >= 0; i--) {
      const ic = icons[i];
      const s = ic.size;
      if (
        x >= ic.x - s / 2 &&
        x <= ic.x + s / 2 &&
        y >= ic.y - s / 2 &&
        y <= ic.y + s / 2
      ) {
        return { collection: "icons", index: i, type: "icon" };
      }
    }

    return null;
  }

  // ─── MOUSE EVENTS ───
  function onMouseDown(e) {
    if (e.button !== 0) return; // Sadece sol tık ile çizim yap
    e.preventDefault();
    e.stopPropagation();

    if (isMoving) {
      isMoving = false;
      saveDrawings();
      redraw();
      return;
    }

    // Eğer sağ tık menüsü açıksa, sol tık yapıldığında kapat
    if (contextMenu && !contextMenu.classList.contains("hidden")) {
      contextMenu.classList.add("hidden");
    }

    const pos = toCanvasCoords(e);

    if (currentTool === "select") {
      const hit = findHitShape(pos.x, pos.y);
      if (hit) {
        // Bulunan şekli seç ve context menüyü göster
        showContextMenu(e.clientX, e.clientY, hit);
        redraw(); // Seçimi highlight etmek için redraw
      } else {
        selectedShape = null;
        redraw();
      }
      return;
    }

    if (currentTool === "route") {
      isDrawing = true;
      routePath = [{ x: pos.x, y: pos.y }];
      return;
    }

    if (currentTool === "polygon") {
      polygonPoints.push({ x: pos.x, y: pos.y });
      redraw();
      return;
    }

    if (currentTool === "icon") {
      // İkon yerleştir
      createIcon(pos.x, pos.y, selectedIcon, 40);
      saveDrawings();
      return;
    }

    if (currentTool === "text") {
      if (e.target.closest(".draw-text-box")) return;
      createTextBox(
        pos.x,
        pos.y,
        "",
        getHexColor(outlineColor, outlineAlpha),
        currentSize * 6,
      );
      return;
    }

    if (currentTool === "ping") {
      createPing(pos.x, pos.y);
      return;
    }

    isDrawing = true;
    startX = pos.x;
    startY = pos.y;

    if (
      currentTool === "pen" ||
      currentTool === "eraser" ||
      currentTool === "area" ||
      currentTool === "p2pRoute" // Added p2pRoute here
    ) {
      currentPath = [{ x: pos.x, y: pos.y }];
      // Start drawing immediately to avoid initial gap
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  }

  function onMouseMove(e) {
    let pos = toCanvasCoords(e);

    if (isMoving && selectedShape) {
      e.preventDefault();
      if (!dragStartPos) {
        dragStartPos = pos;
        return;
      }
      const dx = pos.x - dragStartPos.x;
      const dy = pos.y - dragStartPos.y;

      const target = getTargetFromSelection(selectedShape);
      if (target) {
        if (target.points) {
          target.points.forEach((p) => {
            p.x += dx;
            p.y += dy;
          });
        } else {
          if (target.x !== undefined) target.x += dx;
          if (target.y !== undefined) target.y += dy;
          if (target.x1 !== undefined) {
            target.x1 += dx;
            target.x2 += dx;
            target.y1 += dy;
            target.y2 += dy;
          }
        }
        if (
          selectedShape.collection === "texts" ||
          selectedShape.collection === "icons"
        )
          syncDomElements();
      }
      dragStartPos = pos;
      redraw();
      document.getElementById("map-viewport").style.cursor = "move";
      return;
    }

    if (currentTool === "select" && !isDrawing) {
      const hit = findHitShape(pos.x, pos.y);
      document.getElementById("map-viewport").style.cursor = hit
        ? "pointer"
        : "default";
    }

    if (currentTool === "route" && isDrawing && routePath.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      pos = toCanvasCoords(e);
      routePath.push({ x: pos.x, y: pos.y });
      // Canlı çizim: önceki noktadan yenisine
      const prev = routePath[routePath.length - 2];
      ctx.beginPath();
      ctx.strokeStyle = getHexColor(outlineColor, outlineAlpha);
      ctx.lineWidth = currentSize + 1;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash([10, 5]);
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    if (!isDrawing) return;
    e.preventDefault();
    e.stopPropagation();
    pos = toCanvasCoords(e);

    if (currentTool === "pen") {
      currentPath.push({ x: pos.x, y: pos.y });
      ctx.beginPath();
      ctx.strokeStyle = getHexColor(outlineColor, outlineAlpha);
      ctx.lineWidth = currentSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const prev = currentPath[currentPath.length - 2];
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (currentTool === "area") {
      currentPath.push({ x: pos.x, y: pos.y });
      // Alan çizerken anlık önizleme
      const pCtx = document
        .getElementById("draw-preview-canvas")
        .getContext("2d");
      pCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      pCtx.beginPath();
      pCtx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++)
        pCtx.lineTo(currentPath[i].x, currentPath[i].y);

      pCtx.fillStyle = getHexColor(fillColor, fillAlpha);
      pCtx.fill();
      pCtx.strokeStyle = getHexColor(outlineColor, outlineAlpha);
      pCtx.lineWidth = currentSize;
      pCtx.stroke();
    } else if (currentTool === "eraser") {
      currentPath.push({ x: pos.x, y: pos.y });
      ctx.beginPath();
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = currentSize * 5;
      ctx.lineCap = "round";
      ctx.globalCompositeOperation = "destination-out";
      const prev = currentPath[currentPath.length - 2];
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    } else if (currentTool === "polygon") {
      // Polygon çizerken anlık çizgiyi göster
      if (polygonPoints.length > 0) {
        const prev = polygonPoints[polygonPoints.length - 1];
        const pCtx = document
          .getElementById("draw-preview-canvas")
          .getContext("2d");
        pCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        pCtx.beginPath();
        pCtx.strokeStyle = "rgba(34, 211, 238, 0.7)";
        pCtx.lineWidth = 2;
        pCtx.setLineDash([8, 4]);
        pCtx.moveTo(prev.x, prev.y);
        pCtx.lineTo(pos.x, pos.y);
        pCtx.stroke();
        pCtx.setLineDash([]);
      }
    } else {
      // Şekiller için preview canvas'ı kullan
      const previewCanvas = document.getElementById("draw-preview-canvas");
      const pCtx = previewCanvas.getContext("2d");
      pCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (currentTool === "p2pRoute") {
        drawP2PRoute(
          pCtx,
          startX,
          startY,
          pos.x,
          pos.y,
          getHexColor(outlineColor, outlineAlpha),
          currentSize + 1,
        );
      } else {
        drawShape(
          pCtx,
          currentTool,
          startX,
          startY,
          pos.x,
          pos.y,
          getHexColor(outlineColor, outlineAlpha),
          getHexColor(fillColor, fillAlpha),
          currentSize,
        );
      }
    }
  }

  function onMouseUp(e) {
    if (!isDrawing) return;
    isDrawing = false;
    const pos = toCanvasCoords(e);

    // Preview canvas'ı temizle
    const previewCanvas = document.getElementById("draw-preview-canvas");
    if (previewCanvas) {
      previewCanvas
        .getContext("2d")
        .clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    if (currentTool === "route") {
      finishRoute();
      return;
    }

    if (currentTool === "pen") {
      paths.push({
        type: "pen",
        points: [...currentPath],
        oColor: getHexColor(outlineColor, outlineAlpha),
        size: currentSize,
      });
    } else if (currentTool === "area") {
      // Area tamamlandığında
      const simplified = [];
      for (let i = 0; i < currentPath.length; i += 3)
        simplified.push(currentPath[i]);
      simplified.push(currentPath[currentPath.length - 1]);
      paths.push({
        type: "area",
        points: simplified,
        oColor: getHexColor(outlineColor, outlineAlpha),
        fColor: getHexColor(fillColor, fillAlpha),
        size: currentSize,
      });
    } else if (currentTool === "eraser") {
      paths.push({
        type: "eraser",
        points: [...currentPath],
        size: currentSize * 5,
      });
    } else if (
      currentTool !== "text" &&
      currentTool !== "icon" &&
      currentTool !== "polygon"
    ) {
      paths.push({
        type: currentTool,
        x1: startX,
        y1: startY,
        x2: pos.x,
        y2: pos.y,
        oColor: getHexColor(outlineColor, outlineAlpha),
        fColor: getHexColor(fillColor, fillAlpha),
        size: currentSize,
      });
    }

    currentPath = [];
    saveDrawings();
    redraw();
  }

  function onDoubleClick(e) {
    if (currentTool === "polygon" && polygonPoints.length >= 3) {
      e.preventDefault();
      e.stopPropagation();
      finishPolygon();
    }
  }

  function onRightClick(e) {
    if (!isDrawMode) return;

    if (currentTool === "route") {
      e.preventDefault();
      e.stopPropagation();
      routePath = [];
      redraw();
      showContextMenu(e.clientX, e.clientY);
    } else if (currentTool === "polygon") {
      e.preventDefault();
      e.stopPropagation();
      // Poligonu iptal etme, sadece renk mönüsünü aç
      showContextMenu(e.clientX, e.clientY);
    } else {
      e.preventDefault();
      e.stopPropagation();
      showContextMenu(e.clientX, e.clientY);
    }
  }

  // ─── ŞEKİL ÇİZİMİ ───
  function drawShape(c, type, x1, y1, x2, y2, outlineColor, fillColor, size) {
    c.beginPath();
    c.strokeStyle = outlineColor;
    c.fillStyle = fillColor;
    c.lineWidth = size;
    c.lineCap = "round";
    c.lineJoin = "round";

    if (type === "line") {
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
    } else if (type === "rect") {
      c.rect(x1, y1, x2 - x1, y2 - y1);
    } else if (type === "circle") {
      const rx = Math.abs(x2 - x1) / 2;
      const ry = Math.abs(y2 - y1) / 2;
      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    }

    if (type !== "line") c.fill();
    c.stroke();
  }

  // ─── ROTA ÇİZİMİ (smooth + ok ucu) ───
  function drawRoute(c, points, color, size) {
    if (points.length < 2) return;

    // Smooth kesikli çizgi
    c.beginPath();
    c.strokeStyle = color || "#22d3ee";
    c.lineWidth = size || 3;
    c.setLineDash([10, 5]);
    c.lineCap = "round";
    c.lineJoin = "round";
    c.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      c.lineTo(points[i].x, points[i].y);
    }
    c.stroke();
    c.setLineDash([]);

    // Başlangıç noktası (yeşil daire)
    c.beginPath();
    c.fillStyle = "#22c55e";
    c.arc(points[0].x, points[0].y, 7, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#fff";
    c.lineWidth = 2;
    c.stroke();

    // Ok ucu (üçgen) - son 2 noktadan açı hesapla
    const last = points[points.length - 1];
    const prev = points[Math.max(0, points.length - 5)];
    const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
    const arrowLen = 18;
    const arrowW = 10;

    c.beginPath();
    c.fillStyle = color || "#22d3ee";
    c.moveTo(last.x, last.y);
    c.lineTo(
      last.x - arrowLen * Math.cos(angle - Math.PI / 6),
      last.y - arrowLen * Math.sin(angle - Math.PI / 6),
    );
    c.lineTo(
      last.x - arrowLen * Math.cos(angle + Math.PI / 6),
      last.y - arrowLen * Math.sin(angle + Math.PI / 6),
    );
    c.closePath();
    c.fill();

    // Mesafe etiketi (orta nokta)
    const totalPx = getRouteLength(points);
    const gu = pxToGameUnits(totalPx);
    const mins = gameUnitsToMinutes(gu);
    const txt = `${gu.toLocaleString("tr-TR")} · ${mins} dk`;
    const midIdx = Math.floor(points.length / 2);
    const midPt = points[midIdx];

    c.font = "bold 14px Inter, sans-serif";
    const metrics = c.measureText(txt);
    const boxW = metrics.width + 14;
    const boxH = 22;

    c.fillStyle = "rgba(15, 23, 42, 0.88)";
    c.beginPath();
    c.roundRect(midPt.x - boxW / 2, midPt.y - boxH - 8, boxW, boxH, 6);
    c.fill();
    c.strokeStyle = "rgba(56,189,248,0.3)";
    c.lineWidth = 1;
    c.stroke();

    c.fillStyle = "#67e8f9";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(txt, midPt.x, midPt.y - boxH / 2 - 8);
  }

  // ─── P2P ROTA ÇİZİMİ (Straight + Badge) ───
  function drawP2PRoute(c, x1, y1, x2, y2, color, size) {
    // 1. Dashed Line
    c.beginPath();
    c.strokeStyle = color || "#ef4444";
    c.lineWidth = size || 4;
    c.setLineDash([12, 6]);
    c.lineCap = "round";
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.setLineDash([]);

    // 2. Arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const arrowLen = 20;
    c.beginPath();
    c.fillStyle = color || "#ef4444";
    c.moveTo(x2, y2);
    c.lineTo(
      x2 - arrowLen * Math.cos(angle - Math.PI / 7),
      y2 - arrowLen * Math.sin(angle - Math.PI / 7),
    );
    c.lineTo(
      x2 - arrowLen * Math.cos(angle + Math.PI / 7),
      y2 - arrowLen * Math.sin(angle + Math.PI / 7),
    );
    c.closePath();
    c.fill();

    // 3. Badge Midpoint
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const pxDist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const gu = pxToGameUnits(pxDist);
    const mins = gameUnitsToMinutes(gu);
    const txt = `${gu.toLocaleString("tr-TR")} · ${mins} dk`;

    c.font = "bold 13px Inter, sans-serif";
    const metrics = c.measureText(txt);
    const boxW = metrics.width + 16;
    const boxH = 26;

    // Badge Background (Dark Glassmorphism)
    c.fillStyle = "rgba(15, 23, 42, 0.92)";
    c.beginPath();
    c.roundRect(midX - boxW / 2, midY - boxH / 2, boxW, boxH, 8);
    c.fill();
    c.strokeStyle = "rgba(56, 189, 248, 0.4)";
    c.lineWidth = 1.5;
    c.stroke();

    // Badge Text (Cyan)
    c.fillStyle = "#67e8f9";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(txt, midX, midY);
  }

  // ─── REDRAW ───
  function redraw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Canvas çizimleri
    for (let i = 0; i < paths.length; i++) {
      const p = paths[i];
      // Katman opacity'si varsa uygula, yoksa 1.0 yap
      ctx.globalAlpha = p.alpha !== undefined ? p.alpha : 1.0;

      const isSelected =
        selectedShape &&
        selectedShape.collection === "paths" &&
        selectedShape.index === i;
      if (isSelected) {
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      if (p.type === "pen") {
        ctx.beginPath();
        ctx.strokeStyle = p.oColor || p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let i = 0; i < p.points.length; i++) {
          if (i === 0) ctx.moveTo(p.points[i].x, p.points[i].y);
          else ctx.lineTo(p.points[i].x, p.points[i].y);
        }
        ctx.stroke();
      } else if (p.type === "area" || p.type === "polygon") {
        ctx.beginPath();
        // fAlpha ve fColor'u birleştirerek kullan
        ctx.fillStyle =
          p.fColor && p.fAlpha !== undefined
            ? getHexColor(p.fColor, p.fAlpha)
            : p.fColor || "rgba(0,0,0,0)";
        ctx.strokeStyle = p.oColor || p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let i = 0; i < p.points.length; i++) {
          if (i === 0) ctx.moveTo(p.points[i].x, p.points[i].y);
          else ctx.lineTo(p.points[i].x, p.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (p.type === "eraser") {
        ctx.beginPath();
        ctx.lineWidth = p.size;
        ctx.lineCap = "round";
        // Silgi temizliği yapmalı
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = "destination-out";
        for (let i = 0; i < p.points.length; i++) {
          if (i === 0) ctx.moveTo(p.points[i].x, p.points[i].y);
          else ctx.lineTo(p.points[i].x, p.points[i].y);
        }
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      } else if (p.type === "p2pRoute") {
        drawP2PRoute(
          ctx,
          p.x1,
          p.y1,
          p.x2,
          p.y2,
          p.oColor || p.color,
          p.size,
        );
      } else if (p.type !== "text") {
        const fCol =
          p.fColor && p.fAlpha !== undefined
            ? getHexColor(p.fColor, p.fAlpha)
            : p.fColor || "rgba(0,0,0,0)";
        drawShape(
          ctx,
          p.type,
          p.x1,
          p.y1,
          p.x2,
          p.y2,
          p.oColor || p.color,
          fCol,
          p.size,
        );
      }
    }

    // Gölgeyi kapat
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // Aktif poligon çizimi
    ctx.globalAlpha = 1.0;
    if (polygonPoints.length > 0) {
      ctx.beginPath();
      ctx.fillStyle = getHexColor(fillColor, fillAlpha);
      ctx.strokeStyle = getHexColor(outlineColor, outlineAlpha);
      ctx.lineWidth = currentSize;
      for (let i = 0; i < polygonPoints.length; i++) {
        if (i === 0) ctx.moveTo(polygonPoints[i].x, polygonPoints[i].y);
        else ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }
      if (polygonPoints.length >= 3) {
        ctx.closePath();
        ctx.fill();
      }
      ctx.stroke();

      // Noktaları göster
      for (const pt of polygonPoints) {
        ctx.beginPath();
        ctx.fillStyle = "#fff";
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Tamamlanmış rotalar
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      const isSelected =
        selectedShape &&
        selectedShape.collection === "routes" &&
        selectedShape.index === i;
      if (isSelected) {
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 10;
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
      drawRoute(ctx, r.points, r.color, r.size);
    }
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // DOM elemanları seçim vurgusu
    syncDomSelection();

    // Katman listesini panele yansıt
    updateLayersList();
  }

  // ─── KATMANLAR LİSTESİ (UNIFIED) ───
  function updateLayersList() {
    const listEl = document.getElementById("layer-list");
    if (!listEl) return;

    const allItems = [
      ...icons.map((item, idx) => ({
        ...item,
        col: "icons",
        idx,
        label: `İkon: ${item.emoji}`,
      })),
      ...texts.map((item, idx) => ({
        ...item,
        col: "texts",
        idx,
        label: `Yazı: ${item.text.substring(0, 10)}...`,
      })),
      ...routes.map((item, idx) => ({
        ...item,
        col: "routes",
        idx,
        label: `Rota ${idx + 1}`,
      })),
      ...paths.map((item, idx) => ({
        ...item,
        col: "paths",
        idx,
        label: `${TOOLS[item.type]?.label || item.type} (${idx + 1})`,
      })),
    ];

    if (allItems.length === 0) {
      listEl.innerHTML =
        '<div style="padding:10px; text-align:center; color:#64748b; font-size:11px;">Henüz bir şey yok</div>';
      return;
    }

    listEl.innerHTML = "";
    // En son eklenen en üstte
    allItems.reverse().forEach((item) => {
      const el = document.createElement("div");
      el.className = "dsp-route-item";

      const isSelected =
        selectedShape &&
        selectedShape.collection === item.col &&
        selectedShape.index === item.idx;
      if (isSelected) el.style.borderColor = "#00ffff";

      const color = item.oColor || item.color || "#333";
      const alphaVal =
        (item.alpha !== undefined
          ? item.alpha
          : item.fAlpha !== undefined
            ? item.fAlpha
            : 1.0) * 100;

      el.innerHTML = `
                <div style="display:flex; flex-direction:column; width:100%; gap:4px;">
                    <div class="dsp-route-item-info">
                        <span class="dsp-route-item-color" style="background:${color}"></span>
                        <span style="flex-grow:1; cursor:pointer;" class="layer-title">${item.label}</span>
                        <button class="dsp-route-item-del" title="Sil">✕</button>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span style="font-size:9px; color:#64748b;">Opaklık:</span>
                        <input type="range" class="layer-alpha-slider dsp-slider" min="0" max="100" value="${alphaVal}" style="flex-grow:1; height:2px;">
                    </div>
                </div>
            `;

      // Seçme tıkı
      el.querySelector(".layer-title").addEventListener("click", () => {
        selectedShape = { collection: item.col, index: item.idx };
        redraw();
        // Context menüyü panel yanında göster? Şimdilik sadece seçsin
      });

      // Silme
      el.querySelector(".dsp-route-item-del").addEventListener("click", () => {
        const col = getCollection(item.col);
        if (col) col.splice(item.idx, 1);
        if (item.col === "texts" || item.col === "icons") syncDomElements();
        selectedShape = null;
        redraw();
        saveDrawings();
      });

      // Opaklık
      el.querySelector(".layer-alpha-slider").addEventListener("input", (e) => {
        const target = getCollection(item.col)[item.idx];
        const val = e.target.value / 100;
        target.alpha = val;
        if (item.col === "paths") target.fAlpha = val; // Paths için fAlpha da güncelle

        if (item.col === "texts" || item.col === "icons") syncDomElements();
        redraw();
        saveDrawings();
      });

      listEl.appendChild(el);
    });
  }

  function syncDomSelection() {
    // İkonlar
    document.querySelectorAll(".draw-icon-box").forEach((box, i) => {
      const isSelected =
        selectedShape &&
        selectedShape.collection === "icons" &&
        selectedShape.index === i;
      box.classList.toggle("selected-box", !!isSelected);
    });
    // Yazılar
    document.querySelectorAll(".draw-text-box").forEach((box, i) => {
      const isSelected =
        selectedShape &&
        selectedShape.collection === "texts" &&
        selectedShape.index === i;
      box.classList.toggle("selected-box", !!isSelected);
    });
  }

  // Helper functions (defined outside for scope)
  function getCollection(name) {
    if (name === "paths") return paths;
    if (name === "routes") return routes;
    if (name === "texts") return texts;
    if (name === "icons") return icons;
    return null;
  }

  function syncDomElements() {
    document.getElementById("draw-text-layer").innerHTML = "";
    document.getElementById("draw-icon-layer").innerHTML = "";
    for (const t of texts) createTextBox(t.x, t.y, t.text, t.color, t.size, t);
    for (const ic of icons) createIcon(ic.x, ic.y, ic.emoji, ic.size, ic);
  }

  // ─── İKON SİSTEMİ ───
  function createIcon(x, y, emoji, size, existingObj = null) {
    const iconLayer = document.getElementById("draw-icon-layer");
    if (!iconLayer) return;

    const iconObj = existingObj || {
      type: "icon",
      emoji: emoji,
      x: x,
      y: y,
      size: size,
    };
    if (!existingObj) icons.push(iconObj);

    const box = document.createElement("div");
    box.className = "draw-icon-box";
    box.style.left = iconObj.x + "px";
    box.style.top = iconObj.y + "px";
    box.style.fontSize = iconObj.size + "px";

    const iconEl = document.createElement("span");
    iconEl.className = "draw-icon-emoji";
    iconEl.textContent = iconObj.emoji;

    const toolbar = document.createElement("div");
    toolbar.className = "draw-icon-toolbar";
    toolbar.innerHTML = `
            <button class="draw-icon-btn move" title="Taşı">✥</button>
            <button class="draw-icon-btn grow" title="Büyüt">+</button>
            <button class="draw-icon-btn shrink" title="Küçült">-</button>
            <button class="draw-icon-btn delete" title="Sil">✕</button>
        `;

    box.appendChild(iconEl);
    box.appendChild(toolbar);
    iconLayer.appendChild(box);

    // Seçim ve Sağ Tık Eventleri
    box.addEventListener("mousedown", (e) => {
      if (currentTool === "select") {
        e.stopPropagation();
        const idx = icons.indexOf(iconObj);
        selectedShape = { collection: "icons", index: idx };
        redraw();
      }
    });
    box.addEventListener("contextmenu", (e) => {
      if (isDrawMode) {
        e.preventDefault();
        e.stopPropagation();
        const idx = icons.indexOf(iconObj);
        showContextMenu(e.clientX, e.clientY, {
          collection: "icons",
          index: idx,
        });
      }
    });

    // Toolbar buton eventleri
    const btns = toolbar.querySelectorAll(".draw-icon-btn");
    btns.forEach((btn) =>
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
      }),
    );

    toolbar.querySelector(".grow").addEventListener("click", () => {
      iconObj.size += 8;
      box.style.fontSize = iconObj.size + "px";
      saveDrawings();
    });

    toolbar.querySelector(".shrink").addEventListener("click", () => {
      if (iconObj.size > 16) {
        iconObj.size -= 8;
        box.style.fontSize = iconObj.size + "px";
        saveDrawings();
      }
    });

    toolbar.querySelector(".delete").addEventListener("click", () => {
      const idx = icons.indexOf(iconObj);
      if (idx > -1) icons.splice(idx, 1);
      box.remove();
      saveDrawings();
    });

    // Taşıma (Drag)
    toolbar.querySelector(".move").addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      const wrapper = document.getElementById("canvas-wrapper");
      const rect = wrapper.getBoundingClientRect();
      const scale = rect.width / MAP_WIDTH;
      const startLeft = iconObj.x;
      const startTop = iconObj.y;

      function onDrag(ev) {
        iconObj.x = startLeft + (ev.clientX - startMouseX) / scale;
        iconObj.y = startTop + (ev.clientY - startMouseY) / scale;
        box.style.left = iconObj.x + "px";
        box.style.top = iconObj.y + "px";
      }
      function onDrop() {
        window.removeEventListener("mousemove", onDrag);
        window.removeEventListener("mouseup", onDrop);
        saveDrawings();
      }
      window.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", onDrop);
    });
  }

  // ─── TEXT BOX ───
  function createTextBox(x, y, textStr, color, size, existingObj = null) {
    const textLayer = document.getElementById("draw-text-layer");
    if (!textLayer) return;

    const textObj = existingObj || {
      type: "text",
      text: textStr,
      x: x,
      y: y,
      color: color,
      size: size,
      alpha: 1.0,
    };
    if (!existingObj) texts.push(textObj);

    const box = document.createElement("div");
    box.className = "draw-text-box";
    box.style.left = textObj.x + "px";
    box.style.top = textObj.y + "px";
    box.style.color = textObj.color;
    box.style.fontSize = textObj.size + "px";
    box.style.opacity = textObj.alpha;

    const toolbar = document.createElement("div");
    toolbar.className = "draw-text-toolbar";
    toolbar.innerHTML = `
            <button class="draw-text-btn move" title="Sürükle" contenteditable="false">✥</button>
            <button class="draw-text-btn grow" title="Büyüt" contenteditable="false">A+</button>
            <button class="draw-text-btn shrink" title="Küçült" contenteditable="false">A-</button>
            <button class="draw-text-btn delete" title="Sil" contenteditable="false">🗑</button>
        `;

    const input = document.createElement("div");
    input.className = "draw-text-input";
    input.contentEditable = true;
    input.innerText = textObj.text;

    box.appendChild(toolbar);
    box.appendChild(input);
    textLayer.appendChild(box);

    // Seçim ve Sağ Tık Eventleri
    box.addEventListener("mousedown", (e) => {
      if (currentTool === "select") {
        if (e.target === input) return; // Yazarken seçimi bozma
        e.stopPropagation();
        const idx = texts.indexOf(textObj);
        selectedShape = { collection: "texts", index: idx };
        redraw();
      }
    });
    box.addEventListener("contextmenu", (e) => {
      if (isDrawMode) {
        e.preventDefault();
        e.stopPropagation();
        const idx = texts.indexOf(textObj);
        showContextMenu(e.clientX, e.clientY, {
          collection: "texts",
          index: idx,
        });
      }
    });

    if (!textStr && !existingObj) input.focus();

    input.addEventListener("input", () => {
      textObj.text = input.innerText;
      saveDrawings();
    });

    input.addEventListener("blur", () => {
      if (input.innerText.trim() === "") {
        const idx = texts.indexOf(textObj);
        if (idx > -1) texts.splice(idx, 1);
        box.remove();
      }
      saveDrawings();
    });

    const btns = toolbar.querySelectorAll(".draw-text-btn");
    btns.forEach((btn) =>
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
      }),
    );

    toolbar.querySelector(".grow").addEventListener("click", () => {
      textObj.size += 6;
      box.style.fontSize = textObj.size + "px";
      saveDrawings();
    });
    toolbar.querySelector(".shrink").addEventListener("click", () => {
      if (textObj.size > 10) {
        textObj.size -= 6;
        box.style.fontSize = textObj.size + "px";
        saveDrawings();
      }
    });
    toolbar.querySelector(".delete").addEventListener("click", () => {
      const idx = texts.indexOf(textObj);
      if (idx > -1) texts.splice(idx, 1);
      if (box.parentNode) box.remove();
      saveDrawings();
    });

    toolbar.querySelector(".move").addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      const wrapper = document.getElementById("canvas-wrapper");
      const rect = wrapper.getBoundingClientRect();
      const scale = rect.width / MAP_WIDTH;
      const startLeft = textObj.x;
      const startTop = textObj.y;

      function onDrag(ev) {
        textObj.x = startLeft + (ev.clientX - startMouseX) / scale;
        textObj.y = startTop + (ev.clientY - startMouseY) / scale;
        box.style.left = textObj.x + "px";
        box.style.top = textObj.y + "px";
      }
      function onDrop() {
        window.removeEventListener("mousemove", onDrag);
        window.removeEventListener("mouseup", onDrop);
        saveDrawings();
      }
      window.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", onDrop);
    });
  }

  // ─── KAYDET / YÜKLE ───
  function saveDrawings() {
    const fullData = {
      paths: paths,
      texts: texts,
      icons: icons,
      routes: routes,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullData));
    } catch (e) {}
  }

  function loadDrawings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      // v1 format (düz array) uyumluluğu
      if (Array.isArray(data)) {
        paths = [];
        for (const p of data) {
          if (p.type === "text")
            createTextBox(p.x, p.y, p.text, p.color, p.size);
          else paths.push(p);
        }
        return;
      }

      // v2 format
      paths = data.paths || [];
      routes = data.routes || [];
      texts = data.texts || [];
      icons = data.icons || [];

      // v1 waypoints formatını v2 points formatına çevir
      routes = routes.map((r) => ({
        points: r.points || r.waypoints || [],
        color: r.color || "#22d3ee",
        size: r.size || 3,
      }));

      if (texts.length > 0) {
        for (const t of texts)
          createTextBox(t.x, t.y, t.text, t.color, t.size, t);
      }
      if (icons.length > 0) {
        for (const ic of icons) createIcon(ic.x, ic.y, ic.emoji, ic.size, ic);
      }
    } catch (e) {}
  }

  // ─── YARDIMCILAR (TOP SCOPE) ───
  function getTargetFromSelection(sel) {
    if (!sel) return null;
    if (sel.collection === "paths") return paths[sel.index];
    if (sel.collection === "routes") return routes[sel.index];
    if (sel.collection === "texts") return texts[sel.index];
    if (sel.collection === "icons") return icons[sel.index];
    return null;
  }

  function getCollection(name) {
    if (name === "paths") return paths;
    if (name === "routes") return routes;
    if (name === "texts") return texts;
    if (name === "icons") return icons;
    return null;
  }

  function syncDomElements() {
    const textLayer = document.getElementById("draw-text-layer");
    const iconLayer = document.getElementById("draw-icon-layer");
    if (!textLayer || !iconLayer) return;

    textLayer.innerHTML = "";
    iconLayer.innerHTML = "";
    for (const t of texts) createTextBox(t.x, t.y, t.text, t.color, t.size, t);
    for (const ic of icons) createIcon(ic.x, ic.y, ic.emoji, ic.size, ic);
  }

  function createPing(x, y) {
    const layer = document.getElementById("draw-ping-layer");
    if (!layer) return;
    const ping = document.createElement("div");
    ping.className = "ping-effect";
    ping.style.left = x + "px";
    ping.style.top = y + "px";
    layer.appendChild(ping);
    // Animasyon bitince sil
    setTimeout(() => ping.remove(), 1000);
  }

  return { init, toggleDrawMode, isDrawMode: () => isDrawMode };
})();

document.addEventListener("DOMContentLoaded", () => {
  DrawManager.init();
});
