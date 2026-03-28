/**
 * map.js - Harita Pan & Zoom + Rüzgar Konumlandırma
 */

document.addEventListener("DOMContentLoaded", () => {
  const viewport = document.getElementById("map-viewport");
  const canvasWrapper = document.getElementById("canvas-wrapper");
  const windContainer = document.getElementById("wind-indicator-container");
  if (!viewport || !canvasWrapper || !windContainer) return;

  viewport.appendChild(windContainer);

  const MAP_WIDTH = 1863;
  const MAP_HEIGHT = 1551;
  const DRAG_THRESHOLD = 5;

  let scale = 1;
  let originX = 0;
  let originY = 0;
  let isDragging = false;
  let hasDragged = false;
  let mouseDownX, mouseDownY;
  let startX, startY;

  // Animation State
  let animationFrame = null;

  function fitMapToViewport() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const CONTENT_HEIGHT = MAP_HEIGHT + 350;

    const scaleX = vw / MAP_WIDTH;
    const scaleY = vh / CONTENT_HEIGHT;
    scale = Math.min(scaleX, scaleY);

    originX = (vw - MAP_WIDTH * scale) / 2;
    originY = (vh - CONTENT_HEIGHT * scale) / 2 + 350 * scale;

    updateTransform();
  }

  function updateTransform() {
    canvasWrapper.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;

    const cx = originX + (MAP_WIDTH / 2) * scale;
    const cy = originY + (MAP_HEIGHT / 2) * scale;

    windContainer.style.left = cx + "px";
    windContainer.style.top = cy + "px";
    windContainer.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  // Smooth Animation Helper
  function animateTo(targetX, targetY, targetScale, duration = 800) {
    if (animationFrame) cancelAnimationFrame(animationFrame);

    const startXVal = originX;
    const startYVal = originY;
    const startScale = scale;
    const startTime = performance.now();

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOutCubic(progress);

      originX = startXVal + (targetX - startXVal) * easedProgress;
      originY = startYVal + (targetY - startYVal) * easedProgress;
      scale = startScale + (targetScale - startScale) * easedProgress;

      updateTransform();

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        animationFrame = null;
      }
    }

    animationFrame = requestAnimationFrame(step);
  }

  // Zoom (Wheel)
  viewport.addEventListener(
    "wheel",
    (e) => {
      if (animationFrame) cancelAnimationFrame(animationFrame); // Mouse wheel interrupts animation
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
    },
    { passive: false },
  );

  // Pan (Drag)
  viewport.addEventListener("mousedown", (e) => {
    if (animationFrame) cancelAnimationFrame(animationFrame); // Drag interrupts animation
    isDragging = true;
    hasDragged = false;
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;
    startX = e.clientX - originX;
    startY = e.clientY - originY;
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
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

  window.addEventListener("mouseup", () => {
    isDragging = false;
    hasDragged = false;
  });

  // Exposed API
  window.MapController = {
    centerOn: (x, y, targetScale = 1.2, instant = false, duration = 800) => {
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;

      const finalX = vw / 2 - x * targetScale;
      const finalY = vh / 2 - y * targetScale;

      if (instant) {
        scale = targetScale;
        originX = finalX;
        originY = finalY;
        updateTransform();
      } else {
        animateTo(finalX, finalY, targetScale, duration);
      }
    },
    getScale: () => scale,
  };

  fitMapToViewport();
  window.addEventListener("resize", fitMapToViewport);
});
