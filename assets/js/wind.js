/**
 * wind.js - Rüzgar Yönü Hesaplama ve Parçacık Sistemi
 * 16-point compass, -3.75° per minute, quantized to 11.25° steps.
 */

const DEGREES_PER_MINUTE = 3.75;
let REF_DATE = new Date("2026-03-25T22:50:00");
let REF_ANGLE = 45;

const COMPASS_POINTS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];

function loadWindRef() {
    const savedDate = localStorage.getItem('windRefDate');
    const savedAngle = localStorage.getItem('windRefAngle');
    if (savedDate && savedAngle !== null) {
        REF_DATE = new Date(savedDate);
        REF_ANGLE = parseFloat(savedAngle);
    }
}

function saveWindRef() {
    localStorage.setItem('windRefDate', REF_DATE.toISOString());
    localStorage.setItem('windRefAngle', REF_ANGLE);
}

function getCompassText(angle) {
    // Normalize angle to 0-360
    let a = angle % 360;
    if (a < 0) a += 360;
    
    const idx = Math.round(a / 22.5) % 16;
    
    // Check if it's a half-step (e.g. 11.25, 33.75)
    const isHalfStep = Math.abs((a % 22.5) - 11.25) < 0.1;
    
    if (isHalfStep) {
        return COMPASS_POINTS[idx] + "+"; // slightly offset
    }
    return COMPASS_POINTS[idx];
}

function generateParticles() {
    const windLayer = document.getElementById('wind-layer');
    if (!windLayer) return;
    
    // Oyun içi stil, "yerinde ileri doğru hareket eden" hafif şeffaf mavi oklar
    windLayer.innerHTML = `
        <div class="wind-chevron"></div>
        <div class="wind-chevron"></div>
        <div class="wind-chevron"></div>
    `;
}

function setInitialDateTime() {
    const dateInput = document.getElementById('dateInput');
    const timeInput = document.getElementById('timeInput');
    if (!dateInput || !timeInput) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    timeInput.value = `${hours}:${minutes}`;
}

function calculateWindDirection() {
    const dateInput = document.getElementById('dateInput');
    const timeInput = document.getElementById('timeInput');
    const windLayer = document.getElementById('wind-layer');
    const angleValue = document.getElementById('angleValue');
    const compassText = document.getElementById('compassText');
    if (!dateInput || !timeInput || !windLayer || !angleValue) return;
    if (!dateInput.value || !timeInput.value) return;

    const inputDateTimeText = `${dateInput.value}T${timeInput.value}:00`;
    const currentSelectedDate = new Date(inputDateTimeText);

    const diffMs = currentSelectedDate - REF_DATE;
    const diffMinutes = diffMs / (1000 * 60);

    // Düşüş: Counter-Clockwise
    let exactAngle = REF_ANGLE - (diffMinutes * DEGREES_PER_MINUTE);

    // Rüzgar anlık dönmez, 11.25 derecelik adımlarla atlar (16 point compass half-steps)
    let displayRotation = Math.round(exactAngle / 11.25) * 11.25;

    displayRotation = displayRotation % 360;
    if (displayRotation < 0) {
        displayRotation += 360;
    }
    if (displayRotation === 360) displayRotation = 0;

    windLayer.style.transform = `rotate(${displayRotation - 180}deg)`;
    angleValue.textContent = displayRotation.toFixed(2).replace('.00', '');
    if (compassText) {
        compassText.textContent = getCompassText(displayRotation);
    }
}

function manuallySetWind(angleDelta) {
    const dateInput = document.getElementById('dateInput');
    const timeInput = document.getElementById('timeInput');
    if (!dateInput || !timeInput) return;

    const inputDateTimeText = `${dateInput.value}T${timeInput.value}:00`;
    const currentDate = new Date(inputDateTimeText);
    
    const diffMs = currentDate - REF_DATE;
    const diffMinutes = diffMs / (1000 * 60);
    const exactAngle = REF_ANGLE - (diffMinutes * DEGREES_PER_MINUTE);
    
    let snappedAngle = Math.round(exactAngle / 11.25) * 11.25;
    
    REF_DATE = currentDate;
    REF_ANGLE = snappedAngle + angleDelta;
    
    REF_ANGLE = REF_ANGLE % 360;
    if(REF_ANGLE < 0) REF_ANGLE += 360;
    
    saveWindRef();
    calculateWindDirection();
}

function syncToNow() {
    setInitialDateTime();
    calculateWindDirection();
    
    // Opsiyonel: Mevcut REF_ANGLE'ı tam olarak şuan ki snapped değere sabitleyip kaydedelim.
    manuallySetWind(0);
}

document.addEventListener('DOMContentLoaded', () => {
    loadWindRef();
    
    const dateInput = document.getElementById('dateInput');
    const timeInput = document.getElementById('timeInput');
    
    if (dateInput && timeInput) {
        dateInput.addEventListener('input', calculateWindDirection);
        timeInput.addEventListener('input', calculateWindDirection);
        
        generateParticles();
        setInitialDateTime();
        calculateWindDirection();
        
        // Manual controls
        const btnNext = document.getElementById('btn-wind-next');
        const btnPrev = document.getElementById('btn-wind-prev');
        const btnSync = document.getElementById('btn-wind-sync');
        
        if(btnNext) btnNext.addEventListener('click', () => manuallySetWind(-11.25)); // CCW
        if(btnPrev) btnPrev.addEventListener('click', () => manuallySetWind(11.25));  // CW
        if(btnSync) btnSync.addEventListener('click', syncToNow);
    }
});
