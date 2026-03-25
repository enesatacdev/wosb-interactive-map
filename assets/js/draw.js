/**
 * draw.js - Harita Üzerine Çizim ve Yazı Sistemi
 *
 * Paint benzeri araçlar: Kalem, Çizgi, Dikdörtgen, Daire, Yazı, Silgi
 * Çizimler harita koordinat sisteminde olup zoom/pan ile birlikte hareket eder.
 * localStorage'da kaydedilir.
 */

const DrawManager = (() => {
    const TOOLS = {
        pen: { icon: '✏️', label: 'Kalem', cursor: 'crosshair' },
        line: { icon: '📏', label: 'Çizgi', cursor: 'crosshair' },
        rect: { icon: '⬜', label: 'Dikdörtgen', cursor: 'crosshair' },
        circle: { icon: '⭕', label: 'Daire', cursor: 'crosshair' },
        text: { icon: '🔤', label: 'Yazı', cursor: 'text' },
        eraser: { icon: '🧹', label: 'Silgi', cursor: 'crosshair' }
    };

    let drawCanvas = null;
    let ctx = null;
    let toolbar = null;
    let isDrawMode = false;
    let currentTool = 'pen';
    let currentColor = '#ef4444';
    let currentSize = 3;
    let isDrawing = false;
    let startX = 0, startY = 0;
    let paths = [];        // Tüm çizimler
    let currentPath = [];  // Aktif kalem çizgisi
    let snapshot = null;   // Geçici şekil çizimi için snapshot

    const MAP_WIDTH = 1863;
    const MAP_HEIGHT = 1551;
    const PADDING = 2000;
    const CANVAS_WIDTH = MAP_WIDTH + PADDING * 2;
    const CANVAS_HEIGHT = MAP_HEIGHT + PADDING * 2;
    const STORAGE_KEY = 'sb-drawings';

    function init() {
        const canvasEl = document.getElementById('canvas');
        if (!canvasEl) return;

        // DOM tabanlı Yazı Katmanı
        const textLayer = document.createElement('div');
        textLayer.id = 'draw-text-layer';
        textLayer.style.cssText = `
            position: absolute; top: -${PADDING}px; left: -${PADDING}px;
            width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px;
            z-index: 201; pointer-events: none;
        `;
        document.getElementById('canvas-wrapper').appendChild(textLayer);

        // Canvas overlay oluştur (harita koordinat sisteminde, dışa taşan pay bırakarak)
        drawCanvas = document.createElement('canvas');
        drawCanvas.id = 'draw-canvas';
        drawCanvas.width = CANVAS_WIDTH;
        drawCanvas.height = CANVAS_HEIGHT;
        drawCanvas.style.cssText = `
            position: absolute; top: -${PADDING}px; left: -${PADDING}px;
            width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px;
            z-index: 200; pointer-events: none;
        `;
        canvasEl.appendChild(drawCanvas);
        ctx = drawCanvas.getContext('2d');

        createToolbar();
        loadDrawings();
        redraw();
    }

    function createToolbar() {
        const viewport = document.getElementById('map-viewport');
        if (!viewport) return;

        toolbar = document.createElement('div');
        toolbar.id = 'draw-toolbar';
        toolbar.className = 'draw-toolbar hidden';
        toolbar.innerHTML = `
            <div class="dt-tools">
                ${Object.entries(TOOLS).map(([key, t]) =>
                    `<button class="dt-btn ${key === currentTool ? 'active' : ''}" data-tool="${key}" title="${t.label}">${t.icon}</button>`
                ).join('')}
            </div>
            <div class="dt-separator"></div>
            <div class="dt-options">
                <input type="color" id="draw-color" value="${currentColor}" class="dt-color" title="Renk">
                <div class="dt-size">
                    <button class="dt-size-btn" data-size="2" title="İnce"><span class="dot" style="width:2px;height:2px"></span></button>
                    <button class="dt-size-btn active" data-size="4" title="Normal"><span class="dot" style="width:4px;height:4px"></span></button>
                    <button class="dt-size-btn" data-size="8" title="Kalın"><span class="dot" style="width:8px;height:8px"></span></button>
                    <button class="dt-size-btn" data-size="14" title="Çok Kalın"><span class="dot" style="width:14px;height:14px"></span></button>
                </div>
            </div>
            <div class="dt-separator"></div>
            <div class="dt-actions">
                <button class="dt-btn dt-undo" title="Geri Al">↩️</button>
                <button class="dt-btn dt-clear" title="Temizle">🗑️</button>
            </div>
        `;
        viewport.appendChild(toolbar);

        // Toggle butonu (harita üstünde)
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'draw-toggle';
        toggleBtn.className = 'draw-toggle-btn';
        toggleBtn.innerHTML = '🎨';
        toggleBtn.title = 'Çizim Modu';
        viewport.appendChild(toggleBtn);

        // Event listeners
        toggleBtn.addEventListener('click', toggleDrawMode);

        toolbar.querySelectorAll('.dt-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                currentTool = btn.dataset.tool;
                toolbar.querySelectorAll('.dt-btn[data-tool]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        toolbar.querySelector('#draw-color').addEventListener('input', (e) => {
            currentColor = e.target.value;
        });

        toolbar.querySelectorAll('.dt-size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentSize = parseInt(btn.dataset.size);
                toolbar.querySelectorAll('.dt-size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        toolbar.querySelector('.dt-undo').addEventListener('click', () => {
            paths.pop();
            redraw();
            saveDrawings();
        });

        toolbar.querySelector('.dt-clear').addEventListener('click', () => {
            if (confirm('Tüm çizimler silinsin mi?')) {
                paths = [];
                document.getElementById('draw-text-layer').innerHTML = '';
                redraw();
                saveDrawings();
            }
        });

        // Toolbar'da scroll'u engelle (harita zoom yapmasın)
        toolbar.addEventListener('wheel', (e) => e.stopPropagation());
    }

    function toggleDrawMode() {
        isDrawMode = !isDrawMode;
        const toggleBtn = document.getElementById('draw-toggle');
        const viewport = document.getElementById('map-viewport');

        if (isDrawMode) {
            drawCanvas.style.pointerEvents = 'auto';
            toolbar.classList.remove('hidden');
            toggleBtn.classList.add('active');
            viewport.style.cursor = TOOLS[currentTool].cursor;
            attachDrawEvents();
        } else {
            drawCanvas.style.pointerEvents = 'none';
            toolbar.classList.add('hidden');
            toggleBtn.classList.remove('active');
            viewport.style.cursor = '';
            detachDrawEvents();
        }
    }

    function attachDrawEvents() {
        drawCanvas.addEventListener('mousedown', onMouseDown);
        drawCanvas.addEventListener('mousemove', onMouseMove);
        drawCanvas.addEventListener('mouseup', onMouseUp);
        drawCanvas.addEventListener('wheel', (e) => e.stopPropagation());
    }

    function detachDrawEvents() {
        drawCanvas.removeEventListener('mousedown', onMouseDown);
        drawCanvas.removeEventListener('mousemove', onMouseMove);
        drawCanvas.removeEventListener('mouseup', onMouseUp);
    }

    // Ekran koordinatlarını canvas koordinatlarına dönüştür
    function toCanvasCoords(e) {
        const rect = drawCanvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function onMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        isDrawing = true;
        const pos = toCanvasCoords(e);
        startX = pos.x;
        startY = pos.y;

        if (currentTool === 'pen' || currentTool === 'eraser') {
            currentPath = [{ x: pos.x, y: pos.y }];
        }

        if (currentTool === 'text') {
            isDrawing = false;
            // Eğer zaten bir metin kutusuna tıkladıysa iptal et
            if (e.target.closest('.draw-text-box')) return;
            
            // Eğer yazma modunda boşluğa tıkladıysa, o noktada DOM objesi yarat
            createTextBox(pos.x, pos.y, '', currentColor, currentSize * 6);
            return;
        }

        // Snapshot al (shape çizimi için)
        snapshot = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    function onMouseMove(e) {
        if (!isDrawing) return;
        e.preventDefault();
        e.stopPropagation();
        const pos = toCanvasCoords(e);

        if (currentTool === 'pen') {
            currentPath.push({ x: pos.x, y: pos.y });
            ctx.beginPath();
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            const prev = currentPath[currentPath.length - 2];
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } else if (currentTool === 'eraser') {
            currentPath.push({ x: pos.x, y: pos.y });
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = currentSize * 5;
            ctx.lineCap = 'round';
            ctx.globalCompositeOperation = 'destination-out';
            const prev = currentPath[currentPath.length - 2];
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        } else {
            // Shape preview: restore snapshot and draw preview
            ctx.putImageData(snapshot, 0, 0);
            drawShape(ctx, currentTool, startX, startY, pos.x, pos.y, currentColor, currentSize);
        }
    }

    function onMouseUp(e) {
        if (!isDrawing) return;
        isDrawing = false;
        const pos = toCanvasCoords(e);

        if (currentTool === 'pen') {
            paths.push({
                type: 'pen', points: [...currentPath],
                color: currentColor, size: currentSize
            });
        } else if (currentTool === 'eraser') {
            paths.push({
                type: 'eraser', points: [...currentPath],
                size: currentSize * 5
            });
        } else if (currentTool !== 'text') {
            paths.push({
                type: currentTool,
                x1: startX, y1: startY, x2: pos.x, y2: pos.y,
                color: currentColor, size: currentSize
            });
        }

        currentPath = [];
        saveDrawings();
    }

    function drawShape(c, type, x1, y1, x2, y2, color, size) {
        c.beginPath();
        c.strokeStyle = color;
        c.lineWidth = size;
        c.lineCap = 'round';

        if (type === 'line') {
            c.moveTo(x1, y1);
            c.lineTo(x2, y2);
        } else if (type === 'rect') {
            c.rect(x1, y1, x2 - x1, y2 - y1);
        } else if (type === 'circle') {
            const rx = Math.abs(x2 - x1) / 2;
            const ry = Math.abs(y2 - y1) / 2;
            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2;
            c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        }
        c.stroke();
    }

    function redraw() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        for (const p of paths) {
            if (p.type === 'pen') {
                ctx.beginPath();
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                for (let i = 0; i < p.points.length; i++) {
                    if (i === 0) ctx.moveTo(p.points[i].x, p.points[i].y);
                    else ctx.lineTo(p.points[i].x, p.points[i].y);
                }
                ctx.stroke();
            } else if (p.type === 'eraser') {
                ctx.beginPath();
                ctx.lineWidth = p.size;
                ctx.lineCap = 'round';
                ctx.globalCompositeOperation = 'destination-out';
                for (let i = 0; i < p.points.length; i++) {
                    if (i === 0) ctx.moveTo(p.points[i].x, p.points[i].y);
                    else ctx.lineTo(p.points[i].x, p.points[i].y);
                }
                ctx.stroke();
                ctx.globalCompositeOperation = 'source-over';
            } else if (p.type === 'text') {
                // Eski text çizimleri artık DOM'a aktarılıyor. (Geriye uyumluluk için burayı tuttuk ama DOM devralıyor)
            } else {
                drawShape(ctx, p.type, p.x1, p.y1, p.x2, p.y2, p.color, p.size);
            }
        }
    }

    function saveDrawings() {
        const textLayer = document.getElementById('draw-text-layer');
        const textData = [];
        if (textLayer) {
            const boxes = textLayer.querySelectorAll('.draw-text-box');
            boxes.forEach(box => {
                const input = box.querySelector('.draw-text-input');
                const t = input.innerText.trim();
                if (t === '') return;
                textData.push({
                    type: 'text',
                    text: t,
                    x: parseFloat(box.style.left),
                    y: parseFloat(box.style.top),
                    color: box.style.color,
                    size: parseInt(box.style.fontSize)
                });
            });
        }
        const fullData = [...paths, ...textData];
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fullData)); } catch (e) {}
    }

    function loadDrawings() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const loadedPaths = JSON.parse(data);
                paths = [];
                for (const p of loadedPaths) {
                    if (p.type === 'text') {
                        createTextBox(p.x, p.y, p.text, p.color, p.size);
                    } else {
                        paths.push(p);
                    }
                }
            }
        } catch (e) {}
    }

    
    function createTextBox(x, y, textStr, color, size) {
        const textLayer = document.getElementById('draw-text-layer');
        if (!textLayer) return;

        const box = document.createElement('div');
        box.className = 'draw-text-box';
        box.style.left = x + 'px';
        box.style.top = y + 'px';
        box.style.color = color;
        box.style.fontSize = size + 'px';

        const toolbar = document.createElement('div');
        toolbar.className = 'draw-text-toolbar';
        toolbar.innerHTML = `
            <button class="draw-text-btn move" title="Sürükle" contenteditable="false">✥</button>
            <button class="draw-text-btn grow" title="Büyüt" contenteditable="false">A+</button>
            <button class="draw-text-btn shrink" title="Küçült" contenteditable="false">A-</button>
            <button class="draw-text-btn delete" title="Sil" contenteditable="false">🗑</button>
        `;

        const input = document.createElement('div');
        input.className = 'draw-text-input';
        input.contentEditable = true;
        input.innerText = textStr;

        box.appendChild(toolbar);
        box.appendChild(input);
        textLayer.appendChild(box);

        if (!textStr) input.focus();

        input.addEventListener('blur', () => {
            if (input.innerText.trim() === '') {
                box.remove();
            }
            saveDrawings();
        });

        const btnGrow = toolbar.querySelector('.grow');
        const btnShrink = toolbar.querySelector('.shrink');
        const btnDelete = toolbar.querySelector('.delete');
        const btnMove = toolbar.querySelector('.move');

        [btnGrow, btnShrink, btnDelete, btnMove].forEach(btn => {
            btn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
        });

        btnGrow.addEventListener('click', () => {
            let s = parseInt(box.style.fontSize);
            box.style.fontSize = (s + 6) + 'px';
            saveDrawings();
        });

        btnShrink.addEventListener('click', () => {
            let s = parseInt(box.style.fontSize);
            if (s > 10) box.style.fontSize = (s - 6) + 'px';
            saveDrawings();
        });

        btnDelete.addEventListener('click', () => {
            box.remove();
            saveDrawings();
        });

        // Sürükleme (Drag & Drop) mantığı
        btnMove.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const startMouseX = e.clientX;
            const startMouseY = e.clientY;
            
            const wrapper = document.getElementById('canvas-wrapper');
            const rect = wrapper.getBoundingClientRect();
            // Harita zoom oranını hesapla (kutu hareketini scale'e uydurmak için)
            const scale = rect.width / MAP_WIDTH;

            const startLeft = parseFloat(box.style.left);
            const startTop = parseFloat(box.style.top);

            function onDrag(ev) {
                const dx = (ev.clientX - startMouseX) / scale;
                const dy = (ev.clientY - startMouseY) / scale;
                box.style.left = (startLeft + dx) + 'px';
                box.style.top = (startTop + dy) + 'px';
            }

            function onDrop() {
                window.removeEventListener('mousemove', onDrag);
                window.removeEventListener('mouseup', onDrop);
                saveDrawings();
            }

            window.addEventListener('mousemove', onDrag);
            window.addEventListener('mouseup', onDrop);
        });
    }
    
    return { init, toggleDrawMode };
})();

document.addEventListener('DOMContentLoaded', () => { DrawManager.init(); });
