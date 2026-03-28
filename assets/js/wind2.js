/**
 * wind2.js - Rüzgar Yönü Hesaplama (MAVİ oklara dayalı v2)
 * ==========================================================
 * 11 oyun-içi ekran görüntüsünden hesaplanan kesin değerler:
 *   - Dönüş hızı  : 3.75° / dakika  (96 dakikada tam 360° tur)
 *   - Dönüş yönü  : Saat yönünün TERSİne (CCW)
 *   - Referans     : MAVİ oklar (yeşil gemi oku DEĞİL)
 *
 * Doğrulama (133 dakikalık gözlem, 11 fotoğraf):
 *   03:10 → Mavi ~90° (Doğu)  |  05:23 → Mavi ~311° (Kuzeybatı)  
 *   90 - (133 × 3.75) = -408.75 → +720 = 311.25° ✓
 *
 * Formül:  açı = REF_ANGLE - (geçenDakika × 3.75)
 */

// ──────────────────────── SABİTLER ────────────────────────
const DEGREES_PER_MINUTE = 3.75;   // 96 dk = tam tur
const DEFAULT_REF_DATE   = "2026-03-26T05:20:00";
const DEFAULT_REF_ANGLE  = 322.5;
let   REF_DATE  = new Date(DEFAULT_REF_DATE);
let   REF_ANGLE = DEFAULT_REF_ANGLE;

const COMPASS_POINTS = [
    "N","NNE","NE","ENE","E","ESE","SE","SSE",
    "S","SSW","SW","WSW","W","WNW","NW","NNW"
];

// ──────────────────────── YARDIMCI ────────────────────────

function normalizeAngle(a) {
    a = a % 360;
    if (a < 0) a += 360;
    if (a === 360) a = 0;
    return a;
}

function loadWindRef() {
    const d = localStorage.getItem('windRefDate');
    const a = localStorage.getItem('windRefAngle');
    if (d && a !== null) {
        REF_DATE  = new Date(d);
        REF_ANGLE = parseFloat(a);
    }
}

function saveWindRef() {
    localStorage.setItem('windRefDate',  REF_DATE.toISOString());
    localStorage.setItem('windRefAngle', REF_ANGLE);
}

function getCompassText(angle) {
    const a   = normalizeAngle(angle);
    const idx = Math.round(a / 22.5) % 16;
    const key = COMPASS_POINTS[idx];
    return typeof i18n !== 'undefined' ? i18n.t('wind.compass.' + key) : key;
}

function setInitialDateTime() {
    const dateInput = document.getElementById('dateInput');
    const timeInput = document.getElementById('timeInput');
    if (!dateInput || !timeInput) return;
    const now = new Date();
    dateInput.value = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0')
    ].join('-');
    timeInput.value = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0')
    ].join(':');
}

function getSelectedDateTime() {
    const d = document.getElementById('dateInput');
    const t = document.getElementById('timeInput');
    if (!d || !t || !d.value || !t.value) return new Date();
    return new Date(`${d.value}T${t.value}:00`);
}

// ──────────────────────── CHEVRON ────────────────────────

function generateParticles() {
    const el = document.getElementById('wind-layer');
    if (!el) return;
    el.innerHTML = `
        <div class="wind-chevron"></div>
        <div class="wind-chevron"></div>
        <div class="wind-chevron"></div>
    `;
}

// ──────────────────────── HESAPLAMA ────────────────────────

function calculateWindDirection() {
    const windLayer   = document.getElementById('wind-layer');
    const angleValue  = document.getElementById('angleValue');
    const compassText = document.getElementById('compassText');
    if (!windLayer || !angleValue) return;

    const selected   = getSelectedDateTime();
    const diffMin    = (selected - REF_DATE) / 60000;

    // CCW: açı zaman geçtikçe AZALIR
    const raw        = REF_ANGLE - (diffMin * DEGREES_PER_MINUTE);
    const angle      = normalizeAngle(raw);

    // Chevron'lar CSS'de varsayılan olarak YUKARI (Kuzey) bakar.
    // rotate(angle) ile doğru coğrafi yöne döndürülür. -180 ofseti YOK.
    windLayer.style.transform = `rotate(${angle}deg)`;

    angleValue.textContent = Math.round(angle);

    const slider    = document.getElementById('wind-slider');
    const sliderVal = document.getElementById('wind-slider-val');
    if (slider) {
        slider.value = Math.round(angle);
        if (sliderVal) sliderVal.innerText = Math.round(angle) + '°';
    }
    if (compassText) compassText.textContent = getCompassText(angle);
}

// ──────────────────────── MANUEL ────────────────────────

function manuallySetWind(delta) {
    const now    = getSelectedDateTime();
    const diffMin = (now - REF_DATE) / 60000;
    const exact  = REF_ANGLE - (diffMin * DEGREES_PER_MINUTE);
    const snap   = Math.round(exact / 11.25) * 11.25;

    REF_DATE  = now;
    REF_ANGLE = normalizeAngle(snap + delta);
    saveWindRef();
    calculateWindDirection();
}

function syncToNow() {
    setInitialDateTime();
    calculateWindDirection();
    manuallySetWind(0);
}

/** Manuel ayarları tamamen sıfırla, fabrika değerlerine dön */
function resetWindToDefaults() {
    localStorage.removeItem('windRefDate');
    localStorage.removeItem('windRefAngle');
    REF_DATE  = new Date(DEFAULT_REF_DATE);
    REF_ANGLE = DEFAULT_REF_ANGLE;
    isManualMode = false;
    setInitialDateTime();
    calculateWindDirection();
}

// ──────────────────────── INIT ────────────────────────

let isManualMode = false;

document.addEventListener('DOMContentLoaded', () => {
    loadWindRef();

    const dateIn = document.getElementById('dateInput');
    const timeIn = document.getElementById('timeInput');
    if (!dateIn || !timeIn) return;

    dateIn.addEventListener('input', () => { isManualMode = true; calculateWindDirection(); });
    timeIn.addEventListener('input', () => { isManualMode = true; calculateWindDirection(); });

    generateParticles();
    setInitialDateTime();
    calculateWindDirection();

    // Butonlar
    const bN = document.getElementById('btn-wind-next');
    const bP = document.getElementById('btn-wind-prev');
    const bS = document.getElementById('btn-wind-sync');

    if (bN) bN.addEventListener('click', () => { isManualMode = true; manuallySetWind(-11.25); });
    if (bP) bP.addEventListener('click', () => { isManualMode = true; manuallySetWind(11.25);  });
    if (bS) bS.addEventListener('click', () => { isManualMode = false; syncToNow(); });

    // Sıfırla butonu
    const bR = document.getElementById('btn-wind-reset');
    if (bR) bR.addEventListener('click', () => { resetWindToDefaults(); });

    // Hassas Slider
    const slider = document.getElementById('wind-slider');
    if (slider) {
        slider.addEventListener('input', (e) => {
            isManualMode = true;
            const target = parseFloat(e.target.value);
            const label  = document.getElementById('wind-slider-val');
            if (label) label.innerText = target + '°';

            const diffMin = (getSelectedDateTime() - REF_DATE) / 60000;
            // CCW: angle = REF_ANGLE - (diffMin × hız)
            // Çöz: REF_ANGLE = target + (diffMin × hız)
            REF_ANGLE = target + (diffMin * DEGREES_PER_MINUTE);
            saveWindRef();
            calculateWindDirection();
        });
    }

    // Canlı mod (10 sn'de bir güncelle)
    setInterval(() => {
        if (!isManualMode) {
            setInitialDateTime();
            calculateWindDirection();
        }
    }, 10000);
});
