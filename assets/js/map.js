/**
 * map.js - Harita Pan & Zoom + Rüzgar Konumlandırma
 *
 * Rüzgar akışı her zaman haritanın TAM ORTASINDA kalır.
 * Harita büyütüldüğünde rüzgar da büyür, küçültüldüğünde küçülür.
 * Harita sürüklendiğinde rüzgar haritayla birlikte hareket eder.
 * Haritanın ortası ekrandan çıkarsa, rüzgar da görünmez olur.
 *
 * NOT: Drag threshold ile kısa tıklamalar port click olaylarına geçer.
 */

document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.getElementById('map-viewport');
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const windContainer = document.getElementById('wind-indicator-container');
    if (!viewport || !canvasWrapper || !windContainer) return;

    // DOM nesting sorunlarını aşmak için: rüzgar konteynerini
    // JavaScript ile doğrudan map-viewport'un içine taşı
    viewport.appendChild(windContainer);

    const MAP_WIDTH = 1863;
    const MAP_HEIGHT = 1551;
    const DRAG_THRESHOLD = 5; // px - bundan az hareket = tıklama, çok = sürükleme

    let scale = 1;
    let originX = 0;
    let originY = 0;
    let isDragging = false;
    let hasDragged = false;    // Gerçekten sürükleme oldu mu?
    let mouseDownX, mouseDownY; // İlk mouse pozisyonu (threshold için)
    let startX, startY;        // Drag hesaplama için

    // İlk açılışta haritayı tam ekrana sığdır
    function fitMapToViewport() {
        const vw = viewport.clientWidth;
        const vh = viewport.clientHeight;
        
        // Vurkaçoğlu yazısının görünmesi için üst alana 350px pay bırakarak hepbirlikte ölçekle
        const CONTENT_HEIGHT = MAP_HEIGHT + 350;
        
        const scaleX = vw / MAP_WIDTH;
        const scaleY = vh / CONTENT_HEIGHT;
        scale = Math.min(scaleX, scaleY);
        
        originX = (vw - MAP_WIDTH * scale) / 2;
        originY = (vh - CONTENT_HEIGHT * scale) / 2 + (350 * scale);
        
        updateTransform();
    }

    function updateTransform() {
        canvasWrapper.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;

        const cx = originX + (MAP_WIDTH / 2) * scale;
        const cy = originY + (MAP_HEIGHT / 2) * scale;

        windContainer.style.left = cx + 'px';
        windContainer.style.top = cy + 'px';
        windContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }

    // Zoom (Mouse Wheel)
    viewport.addEventListener('wheel', (e) => {
        e.preventDefault();

        const rect = viewport.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const zoomIntensity = 0.08;
        const delta = e.deltaY > 0 ? -1 : 1;

        let newScale = scale * (1 + delta * zoomIntensity);
        if (newScale < 0.15) newScale = 0.15;
        if (newScale > 5) newScale = 5;

        const scaleChange = newScale - scale;
        originX = originX - (cursorX - originX) * (scaleChange / scale);
        originY = originY - (cursorY - originY) * (scaleChange / scale);

        scale = newScale;
        updateTransform();
    }, { passive: false });

    // Pan (Drag) - Threshold ile tıklama/sürükleme ayrımı
    viewport.addEventListener('mousedown', (e) => {
        isDragging = true;
        hasDragged = false;
        mouseDownX = e.clientX;
        mouseDownY = e.clientY;
        startX = e.clientX - originX;
        startY = e.clientY - originY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        // Threshold kontrolü - küçük hareketleri yoksay (tıklama)
        const dx = Math.abs(e.clientX - mouseDownX);
        const dy = Math.abs(e.clientY - mouseDownY);

        if (!hasDragged && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
            hasDragged = true;
        }

        if (hasDragged) {
            originX = e.clientX - startX;
            originY = e.clientY - startY;
            updateTransform();
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        hasDragged = false;
    });

    fitMapToViewport();

    // Sidebar açılıp kapandığında haritayı yeniden sığdır
    window.addEventListener('resize', () => {
        fitMapToViewport();
    });
});
