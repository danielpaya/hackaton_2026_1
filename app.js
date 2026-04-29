/* =========================================
   MotoGuard AI — Application Core
   Complete Hackathon Demo
   Mobile-First Responsive
   ========================================= */

// =========================================
// CONFIGURATION & CONSTANTS
// =========================================
const CONFIG = {
  BOGOTA_CENTER: [4.6097, -74.0817],
  MAP_ZOOM: 14,
  SIM_SPEED_INTERVAL: 1500,
  SCORE_UPDATE_INTERVAL: 2000,
  EVENT_INTERVAL: 4000,
  COUNTDOWN_SECONDS: 30,
  TILE_URL: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  TILE_ATTR: '&copy; <a href="https://carto.com/">CARTO</a>',
};

// Bogotá simulated route (major roads)
const BOGOTA_ROUTES = {
  nqs: [
    [4.6350, -74.0830], [4.6320, -74.0828], [4.6290, -74.0825],
    [4.6260, -74.0822], [4.6230, -74.0820], [4.6200, -74.0818],
    [4.6170, -74.0815], [4.6140, -74.0812], [4.6110, -74.0810],
    [4.6080, -74.0808], [4.6050, -74.0805], [4.6020, -74.0803],
    [4.5990, -74.0800], [4.5960, -74.0798], [4.5930, -74.0795],
    [4.5900, -74.0793], [4.5870, -74.0790]
  ],
  boyaca: [
    [4.6900, -74.1100], [4.6870, -74.1098], [4.6840, -74.1095],
    [4.6810, -74.1093], [4.6780, -74.1090], [4.6750, -74.1088],
    [4.6720, -74.1085], [4.6690, -74.1082], [4.6660, -74.1080],
    [4.6630, -74.1078], [4.6600, -74.1075], [4.6570, -74.1073],
    [4.6540, -74.1070]
  ],
  caracas: [
    [4.6500, -74.0620], [4.6470, -74.0622], [4.6440, -74.0625],
    [4.6410, -74.0628], [4.6380, -74.0630], [4.6350, -74.0633],
    [4.6320, -74.0635], [4.6290, -74.0638], [4.6260, -74.0640],
    [4.6230, -74.0643], [4.6200, -74.0645], [4.6170, -74.0648]
  ],
  villavicencio: [
    [4.5800, -74.1200], [4.5810, -74.1170], [4.5820, -74.1140],
    [4.5830, -74.1110], [4.5840, -74.1080], [4.5850, -74.1050],
    [4.5860, -74.1020], [4.5870, -74.0990], [4.5880, -74.0960],
    [4.5890, -74.0930], [4.5900, -74.0900]
  ]
};

// Combine all routes into one simulation path
const SIMULATION_ROUTE = [
  ...BOGOTA_ROUTES.caracas,
  ...BOGOTA_ROUTES.nqs.slice(0, 10),
  ...BOGOTA_ROUTES.boyaca.slice(0, 8),
  ...BOGOTA_ROUTES.villavicencio.slice(0, 6)
];

// Risk zones in Bogotá
const RISK_ZONES = [
  { name: 'NQS — Zona alta accidentalidad', lat: 4.6200, lng: -74.0818, radius: 400, level: 'high' },
  { name: 'Av. Caracas — Curva peligrosa', lat: 4.6350, lng: -74.0633, radius: 350, level: 'high' },
  { name: 'Av. Boyacá — Cruce crítico', lat: 4.6750, lng: -74.1088, radius: 300, level: 'medium' },
  { name: 'Av. Villavicencio — Zona de riesgo', lat: 4.5850, lng: -74.1050, radius: 350, level: 'high' },
  { name: 'Centro — Tráfico denso', lat: 4.6097, lng: -74.0817, radius: 500, level: 'medium' },
];

// Mock drivers
const MOCK_DRIVERS = [
  { id: 1, name: 'Juan Pérez', type: 'Delivery', score: 72, risk: 'Moderado', events: 12, avatar: 'JP', trend: '+3' },
  { id: 2, name: 'Laura Gómez', type: 'Mensajería', score: 88, risk: 'Bajo', events: 3, avatar: 'LG', trend: '+5' },
  { id: 3, name: 'Andrés Rojas', type: 'Personal', score: 35, risk: 'Crítico', events: 28, avatar: 'AR', trend: '-8' },
  { id: 4, name: 'Camila Torres', type: 'Delivery', score: 94, risk: 'Bajo', events: 1, avatar: 'CT', trend: '+2' },
  { id: 5, name: 'Miguel Sánchez', type: 'Mensajería', score: 52, risk: 'Alto', events: 19, avatar: 'MS', trend: '-4' },
];

// =========================================
// TREND-BASED INSURANCE DATA MODEL
// Generates 15-day history per driver with:
// - Daily score + smoothed insurer score (0.7*hist + 0.3*recent)
// - Event types and penalty classification
// - Consistency metrics & decomposition factors
// =========================================
const SCORE_FACTORS = [
  { factor: 'Velocidad',             weight: 35 },
  { factor: 'Frenadas bruscas',      weight: 25 },
  { factor: 'Consistencia',          weight: 25 },
  { factor: 'Exposición zonas riesgo', weight: 15 },
];

// Driver-specific configs for history generation
const DRIVER_PROFILES = {
  1: { base: 78, badDay: { idx: 10, score: 42 }, decomp: { speed: 'Medio', brakes: 'Alto', consistency: 'Medio', exposure: 'Bajo' } },
  2: { base: 92, badDay: null,                    decomp: { speed: 'Bajo',  brakes: 'Bajo', consistency: 'Alto',  exposure: 'Bajo' } },
  3: { base: 38, badDay: null, chronicallyBad: true, decomp: { speed: 'Alto', brakes: 'Alto', consistency: 'Bajo', exposure: 'Alto' } },
  4: { base: 93, badDay: { idx: 10, score: 58 },  decomp: { speed: 'Bajo',  brakes: 'Medio', consistency: 'Alto', exposure: 'Bajo' } },
  5: { base: 55, badDay: { idx: 8, score: 30 },   decomp: { speed: 'Medio', brakes: 'Medio', consistency: 'Bajo', exposure: 'Alto' } },
};

const INSURANCE_DATA = {}; // Will hold generated data per driver id

function generateAllInsuranceData() {
  const eventPool = ['Velocidad', 'Frenada brusca', 'Zigzagueo', 'Zona de riesgo'];

  MOCK_DRIVERS.forEach(driver => {
    const profile = DRIVER_PROFILES[driver.id];
    const history = [];
    let insurerScore = profile.base;
    let consecutiveBadDays = 0;
    let safeDays = 0;
    let criticalDays = 0;
    let bestStreak = 0;
    let currentStreak = 0;

    for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);
      const dateStr = date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

      // Calculate daily score
      let dailyScore;
      const dayIndex = 14 - dayOffset; // 0-14, chronological

      if (profile.badDay && dayIndex === profile.badDay.idx) {
        // THE bad day
        dailyScore = profile.badDay.score;
      } else if (profile.chronicallyBad) {
        dailyScore = profile.base + Math.floor(Math.random() * 16) - 8;
        if (dayIndex > 7) dailyScore -= 10; // deteriorates
      } else {
        // Normal variation ±6 around base
        dailyScore = profile.base + Math.floor(Math.random() * 12) - 6;
      }
      dailyScore = Math.max(0, Math.min(100, dailyScore));

      // Smoothed insurer score: 0.7 * previous + 0.3 * today
      insurerScore = Math.round(0.7 * insurerScore + 0.3 * dailyScore);

      // Events
      const numEvents = dailyScore < 60 ? Math.floor(Math.random() * 3) + 2
                       : dailyScore < 80 ? Math.floor(Math.random() * 2) + 1
                       : Math.floor(Math.random() * 2);
      const eventType = numEvents > 0 ? eventPool[Math.floor(Math.random() * eventPool.length)] : 'Ninguno';
      const impact = dailyScore >= insurerScore ? `+${Math.abs(dailyScore - insurerScore)}` : `-${Math.abs(dailyScore - insurerScore)}`;

      // Penalty logic based on consecutive bad days
      if (dailyScore < 70) {
        consecutiveBadDays++;
      } else {
        consecutiveBadDays = 0;
      }

      let penalty;
      if (consecutiveBadDays === 0) penalty = 'No penaliza';
      else if (consecutiveBadDays === 1) penalty = 'En observación';
      else if (consecutiveBadDays === 2) penalty = 'Penalización leve';
      else penalty = 'Penalización fuerte';

      // Consistency tracking
      if (dailyScore >= 75) {
        safeDays++;
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
      if (dailyScore < 50) criticalDays++;

      history.push({
        date: dateStr,
        dailyScore,
        insurerScore,
        events: numEvents,
        type: eventType,
        impact,
        penalty,
      });
    }

    // Determine trend
    const firstHalf = history.slice(0, 7).reduce((s, h) => s + h.insurerScore, 0) / 7;
    const secondHalf = history.slice(8).reduce((s, h) => s + h.insurerScore, 0) / Math.max(1, history.slice(8).length);
    const trendDiff = secondHalf - firstHalf;
    const trend = trendDiff > 3 ? 'Mejora' : trendDiff < -3 ? 'Deterioro' : 'Estable';

    // Score decomposition (fixed weights, variable performance)
    const decomp = SCORE_FACTORS.map(f => {
      const key = f.factor === 'Velocidad' ? 'speed'
                : f.factor === 'Frenadas bruscas' ? 'brakes'
                : f.factor === 'Consistencia' ? 'consistency'
                : 'exposure';
      const level = profile.decomp[key];
      const impactVal = level === 'Bajo' ? Math.floor(Math.random() * 3) + 6
                      : level === 'Medio' ? Math.floor(Math.random() * 3)
                      : -(Math.floor(Math.random() * 5) + 5);
      return { ...f, level, impact: impactVal };
    });

    INSURANCE_DATA[driver.id] = {
      history,
      insurerScore: history[history.length - 1].insurerScore,
      metrics: {
        safeDaysPct: Math.round((safeDays / 15) * 100),
        criticalDays,
        bestStreak,
        trend,
      },
      decomposition: decomp,
    };
  });
}
generateAllInsuranceData();




// AI Messages
const AI_MESSAGES = {
  safe: [
    '✅ Excelente conducción. Mantén este ritmo.',
    '🛡️ Tu score se mantiene estable. ¡Buen trabajo!',
    '📊 Análisis IA: comportamiento de conducción óptimo.',
    '🎯 Sin anomalías detectadas. Ruta segura.',
  ],
  moderate: [
    '⚠️ Atención: velocidad elevada. Reduce un poco.',
    '📉 Tu score bajó levemente. Modera tu conducción.',
    '🔔 Zona de precaución detectada. Mantén distancia.',
    '⚡ Aceleración detectada. Se sugiere flujo constante.',
  ],
  risky: [
    '🚨 ¡Ojo! Zona de alto riesgo detectada. Reduce la velocidad.',
    '⛔ Frenada brusca registrada. Impacto en tu score.',
    '🔴 Zigzagueo detectado. Mantén estabilidad.',
    '📍 Estás en una zona con alta accidentalidad. Precaución.',
  ],
  critical: [
    '🆘 ¡ALERTA MÁXIMA! Tu conducción es extremadamente riesgosa.',
    '🚑 Múltiples infracciones detectadas. ¡Para y descansa!',
    '💀 Score crítico. La IA recomienda detener el viaje.',
  ]
};

// Event types
const EVENT_TYPES = [
  { type: 'hard_brake', label: 'Frenada brusca', icon: '⚠️', severity: 'risky', impact: -8 },
  { type: 'acceleration', label: 'Aceleración fuerte', icon: '⚡', severity: 'moderate', impact: -5 },
  { type: 'speeding', label: 'Exceso de velocidad', icon: '🏎️', severity: 'risky', impact: -10 },
  { type: 'zigzag', label: 'Zigzagueo detectado', icon: '↔️', severity: 'risky', impact: -7 },
  { type: 'risk_zone', label: 'Zona de alto riesgo', icon: '📍', severity: 'critical', impact: -12 },
  { type: 'good_driving', label: 'Conducción estable', icon: '✅', severity: 'safe', impact: +5 },
  { type: 'smooth_turn', label: 'Giro suave', icon: '🔄', severity: 'safe', impact: +3 },
];


// =========================================
// APPLICATION STATE
// =========================================
const state = {
  currentPage: 'landing',
  // Simulation
  simRunning: false,
  simMode: 'waiting', // waiting | real | simulated
  simRouteIndex: 0,
  simSpeed: 0,
  simScore: 85,
  simScorePrev: 85,
  simEvents: [],
  simAIMessages: [],
  simPath: [],
  simPosition: null,
  simWatchId: null,
  simLastPosition: null,
  simLastTime: null,
  // Accident
  accidentActive: false,
  accidentCountdown: CONFIG.COUNTDOWN_SECONDS,
  accidentInterval: null,
  emergencySent: false,
  // Maps
  map: null,
  marker: null,
  polyline: null,
  dashboardMap: null,
  // Charts
  charts: {},
  // Voice
  voiceEnabled: true,
  // Intervals
  intervals: [],
  // Mobile menu
  mobileMenuOpen: false,
};


// =========================================
// UTILITY FUNCTIONS
// =========================================
function $(selector) { return document.querySelector(selector); }
function $$(selector) { return document.querySelectorAll(selector); }

function getStatusClass(score) {
  if (score >= 80) return 'safe';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'risky';
  return 'critical';
}

function getStatusLabel(score) {
  if (score >= 80) return 'Seguro';
  if (score >= 60) return 'Moderado';
  if (score >= 40) return 'Riesgoso';
  return 'Crítico';
}

function getStatusColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#ef4444';
  return '#dc2626';
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(date) {
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function isMobile() {
  return window.innerWidth < 1024;
}

function getModeLabel() {
  if (state.simMode === 'real') return { text: '📡 GPS real activo', cls: 'mode-real' };
  if (state.simMode === 'simulated') return { text: '🗺️ Modo simulación', cls: 'mode-sim' };
  return { text: '⏳ Esperando permisos', cls: 'mode-waiting' };
}


// =========================================
// SPEECH API
// =========================================
function speak(text) {
  if (!state.voiceEnabled) return;
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-CO';
  utterance.rate = 1.1;
  utterance.pitch = 1;
  utterance.volume = 0.8;
  // Try getting a Spanish voice
  const voices = window.speechSynthesis.getVoices();
  const esVoice = voices.find(v => v.lang.startsWith('es'));
  if (esVoice) utterance.voice = esVoice;
  window.speechSynthesis.speak(utterance);
}


// =========================================
// NAVIGATION / ROUTING
// =========================================
function navigate(page) {
  // Cleanup previous page
  clearAllIntervals();
  if (state.simWatchId) {
    navigator.geolocation.clearWatch(state.simWatchId);
    state.simWatchId = null;
  }
  state.simRunning = false;

  // Close mobile menu
  state.mobileMenuOpen = false;

  state.currentPage = page;
  render();

  // Scroll to top
  window.scrollTo(0, 0);
}

function clearAllIntervals() {
  state.intervals.forEach(id => clearInterval(id));
  state.intervals = [];
  if (state.accidentInterval) {
    clearInterval(state.accidentInterval);
    state.accidentInterval = null;
  }
}

function toggleMobileMenu() {
  state.mobileMenuOpen = !state.mobileMenuOpen;
  const navLinks = document.getElementById('navLinks');
  if (navLinks) {
    navLinks.classList.toggle('show-mobile', state.mobileMenuOpen);
  }
  const toggle = document.getElementById('mobileToggle');
  if (toggle) {
    toggle.textContent = state.mobileMenuOpen ? '✕' : '☰';
  }
}


// =========================================
// RENDERING ENGINE
// =========================================
function render() {
  const app = document.getElementById('app');

  switch (state.currentPage) {
    case 'landing':
      app.innerHTML = renderNavbar() + renderLanding();
      break;
    case 'simulator':
      app.innerHTML = renderNavbar() + renderSimulator();
      setTimeout(() => {
        initSimulatorMap();
        // Extra invalidateSize calls for layout settling
        setTimeout(() => { if (state.map) state.map.invalidateSize(); }, 400);
        setTimeout(() => { if (state.map) state.map.invalidateSize(); }, 800);
      }, 100);
      break;
    case 'dashboard':
      app.innerHTML = renderNavbar() + renderDashboard();
      setTimeout(initDashboard, 100);
      break;
    case 'insurance':
      app.innerHTML = renderNavbar() + renderInsurance();
      break;
    case 'pitch':
      app.innerHTML = renderNavbar() + renderPitch();
      break;
  }

  // Re-init icons
  if (window.lucide) lucide.createIcons();

  // Bind events
  bindNavEvents();
}


// =========================================
// NAVBAR
// =========================================
function renderNavbar() {
  const pages = [
    { id: 'landing', label: 'Inicio', icon: 'home' },
    { id: 'simulator', label: 'Simulador', icon: 'navigation' },
    { id: 'dashboard', label: 'Dashboard', icon: 'bar-chart-3' },
    { id: 'insurance', label: 'Seguros', icon: 'shield-check' },
    { id: 'pitch', label: 'Pitch', icon: 'presentation' },
  ];

  return `
    <nav class="navbar" id="navbar">
      <a class="navbar-brand" href="#" data-nav="landing">
        <span class="logo-icon">🏍️</span>
        MotoGuard <span style="background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">AI</span>
      </a>
      <ul class="navbar-links ${state.mobileMenuOpen ? 'show-mobile' : ''}" id="navLinks">
        ${pages.map(p => `
          <li>
            <button data-nav="${p.id}" class="${state.currentPage === p.id ? 'active' : ''}">
              <i data-lucide="${p.icon}" style="width:16px;height:16px;display:inline;vertical-align:middle;margin-right:4px;"></i>
              ${p.label}
            </button>
          </li>
        `).join('')}
      </ul>
      <button class="nav-mobile-toggle" id="mobileToggle" onclick="toggleMobileMenu()">${state.mobileMenuOpen ? '✕' : '☰'}</button>
    </nav>
  `;
}

function bindNavEvents() {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.nav);
    });
  });
}


// =========================================
// LANDING PAGE
// =========================================
function renderLanding() {
  return `
    <div class="landing-page page-enter">
      <section class="hero" id="hero">
        <div class="hero-content">
          <!-- Demo banner -->
          <div class="demo-banner">
            <div class="demo-banner-title">
              📱 Demo web interactiva
            </div>
            <p>Abre este link desde tu celular para probar ubicación en tiempo real.</p>
            <div class="demo-tip">✅ Si aceptas permisos de ubicación → GPS real.</div>
            <div class="demo-tip">🗺️ Si no aceptas → simulación automática en Bogotá.</div>
            <div class="demo-tip">📦 No requiere instalar nada.</div>
          </div>

          <div class="hero-badge">
            <span class="pulse-dot" style="background:var(--safe)"></span>
            Powered by Inteligencia Artificial
          </div>
          <h1 class="hero-title">
            Tu celular se convierte en un
            <span class="gradient-text">Copiloto Inteligente</span>
          </h1>
          <p class="hero-subtitle">
            MotoGuard AI analiza tu conducción en tiempo real usando sensores del dispositivo. 
            Detecta riesgos, genera alertas por voz y calcula un score dinámico para protegerte.
          </p>
          <div class="hero-buttons">
            <button class="btn btn-primary btn-lg" data-nav="simulator" id="btnStartDemo">
              <i data-lucide="play" style="width:20px;height:20px;"></i>
              Iniciar Demo
            </button>
            <button class="btn btn-secondary btn-lg" data-nav="dashboard" id="btnDashboard">
              <i data-lucide="bar-chart-3" style="width:20px;height:20px;"></i>
              Ver Dashboard
            </button>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="hero-stat-value">-73%</div>
              <div class="hero-stat-label">Reducción accidentes</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-value">15K+</div>
              <div class="hero-stat-label">Motociclistas protegidos</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-value">$2.3M</div>
              <div class="hero-stat-label">Ahorro en siniestros</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-value">98.5%</div>
              <div class="hero-stat-label">Precisión detección</div>
            </div>
          </div>
        </div>
      </section>

      <section class="features-section" id="features">
        <h2 class="section-title">¿Cómo funciona?</h2>
        <p class="section-subtitle">Tecnología de punta que protege vidas y reduce costos</p>
        <div class="features-grid">
          <div class="glass-card feature-card">
            <div class="feature-icon accent">📡</div>
            <h3>Sensores en Tiempo Real</h3>
            <p>GPS, acelerómetro y giroscopio capturan cada movimiento y generan data accionable.</p>
          </div>
          <div class="glass-card feature-card">
            <div class="feature-icon safe">🧠</div>
            <h3>IA Predictiva</h3>
            <p>Machine learning analiza patrones de conducción y predice situaciones de riesgo.</p>
          </div>
          <div class="glass-card feature-card">
            <div class="feature-icon moderate">🔊</div>
            <h3>Alertas por Voz</h3>
            <p>Copiloto virtual que alerta en tiempo real sin mirar la pantalla.</p>
          </div>
          <div class="glass-card feature-card">
            <div class="feature-icon risky">🚨</div>
            <h3>Detección de Accidentes</h3>
            <p>Detecta impactos y activa protocolos de emergencia con envío de GPS.</p>
          </div>
          <div class="glass-card feature-card">
            <div class="feature-icon accent">📊</div>
            <h3>Score Dinámico</h3>
            <p>Puntaje actualizado en tiempo real que refleja tu comportamiento.</p>
          </div>
          <div class="glass-card feature-card">
            <div class="feature-icon safe">💰</div>
            <h3>Ahorro en Seguros</h3>
            <p>Conductores seguros obtienen descuentos reales en pólizas SOAT.</p>
          </div>
        </div>
      </section>
    </div>
  `;
}


// =========================================
// SIMULATOR PAGE — Mobile-first redesign
// =========================================
function renderSimulator() {
  const status = getStatusClass(state.simScore);
  const statusLabel = getStatusLabel(state.simScore);
  const statusColor = getStatusColor(state.simScore);
  const circumference = 2 * Math.PI * 56;
  const offset = circumference - (state.simScore / 100) * circumference;
  const trendDir = state.simScore >= state.simScorePrev ? '↑' : '↓';
  const trendColor = state.simScore >= state.simScorePrev ? 'var(--safe)' : 'var(--risky)';
  const mode = getModeLabel();

  return `
    <div class="simulator-page page-enter" id="simulatorPage">
      <div class="sim-map-container">
        <div id="map"></div>

        <!-- Mode indicator -->
        <div class="sim-mode-indicator ${mode.cls}" id="simModeIndicator">
          <span class="pulse-dot" style="background:currentColor;width:6px;height:6px;"></span>
          ${mode.text}
        </div>

        <!-- Speed & Status overlay (top-left) -->
        <div class="sim-speed-overlay">
          <div class="glass-card-sm speed-card">
            <div class="speed-value" id="simSpeedValue" style="color:${statusColor}">${state.simSpeed}</div>
            <div class="speed-unit">km/h</div>
          </div>
          <div class="glass-card-sm speed-card" style="min-width:auto;padding:0.35rem 0.6rem !important;">
            <span class="status-badge status-${status}" id="simStatusBadge">
              <span class="pulse-dot" style="background:${statusColor}"></span>
              ${statusLabel}
            </span>
          </div>
        </div>

        <!-- Floating score mini (bottom-left of map, mobile only) -->
        <div class="sim-map-score-float" id="scoreFloatMobile">
          <div class="glass-card-sm score-mini">
            <div class="score-mini-number" id="scoreMiniNum" style="color:${statusColor}">${state.simScore}</div>
            <div>
              <div class="score-mini-label">Score</div>
              <div class="score-mini-label" style="color:${trendColor}" id="scoreMiniTrend">${trendDir}${Math.abs(state.simScore - state.simScorePrev)}</div>
            </div>
          </div>
        </div>

        <!-- Floating controls (bottom-right of map, mobile only) -->
        <div class="sim-map-controls-float" id="controlsFloatMobile">
          ${!state.simRunning
            ? `<button class="btn btn-primary btn-sm" onclick="startSimulation()" id="btnStartFloat">
                <i data-lucide="play" style="width:14px;height:14px;"></i> Iniciar
              </button>`
            : `<button class="btn btn-secondary btn-sm" onclick="stopSimulation()" id="btnStopFloat">
                <i data-lucide="square" style="width:14px;height:14px;"></i> Parar
              </button>`
          }
          <button class="btn btn-danger btn-sm" onclick="triggerAccident()" id="btnAccidentFloat">
            <i data-lucide="alert-triangle" style="width:14px;height:14px;"></i> Impacto
          </button>
        </div>
      </div>

      <!-- Bottom panel / sidebar -->
      <div class="sim-bottom-panel" id="simSidebar">
        <div class="bottom-panel-handle"></div>

        <!-- Score Gauge (visible fully on desktop, compact on mobile) -->
        <div class="glass-card score-gauge" id="scoreGauge">
          <div class="score-circle">
            <svg viewBox="0 0 120 120">
              <circle class="score-bg" cx="60" cy="60" r="56" />
              <circle class="score-fg" cx="60" cy="60" r="56"
                stroke="${statusColor}"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}" />
            </svg>
            <div class="score-number" style="color:${statusColor}" id="scoreNumber">${state.simScore}</div>
          </div>
          <div class="score-label">Score de Conducción</div>
          <div class="score-trend" style="color:${trendColor}">
            ${trendDir} ${Math.abs(state.simScore - state.simScorePrev)} pts esta sesión
          </div>
        </div>

        <!-- AI Panel -->
        <div class="glass-card ai-panel" id="aiPanel">
          <h3>
            <i data-lucide="bot" style="width:16px;height:16px;"></i>
            Copiloto IA
          </h3>
          <div id="aiMessages">
            ${state.simAIMessages.length === 0 
              ? '<div class="ai-message">🤖 Sistema listo. Inicia el viaje para activar el análisis IA.</div>'
              : state.simAIMessages.slice(-3).map(m => `<div class="ai-message">${m}</div>`).join('')
            }
          </div>
          <div class="ai-controls">
            <button class="btn btn-sm btn-secondary" onclick="toggleVoice()" id="voiceToggle">
              <i data-lucide="${state.voiceEnabled ? 'volume-2' : 'volume-x'}" style="width:14px;height:14px;"></i>
              ${state.voiceEnabled ? 'Voz On' : 'Voz Off'}
            </button>
          </div>
        </div>

        <!-- Events -->
        <div class="events-panel" id="eventsPanel">
          <h3>
            <i data-lucide="activity" style="width:14px;height:14px;"></i>
            Eventos Detectados
          </h3>
          <div id="eventsList">
            ${state.simEvents.length === 0
              ? '<p style="color:var(--text-muted);font-size:0.75rem;">Esperando eventos...</p>'
              : state.simEvents.slice(-6).reverse().map(ev => `
                <div class="event-item event-${ev.severity}">
                  <div class="event-icon">${ev.icon}</div>
                  <div class="event-info">
                    <div class="event-title">${ev.label}</div>
                    <div class="event-time">${ev.time} · ${ev.impact > 0 ? '+' : ''}${ev.impact} pts</div>
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>

        <!-- Controls (desktop only — mobile uses floating buttons) -->
        <div class="sim-controls" id="simControls">
          ${!state.simRunning
            ? `<button class="btn btn-primary" onclick="startSimulation()" id="btnStartSim" style="flex:1;">
                <i data-lucide="play" style="width:16px;height:16px;"></i> Iniciar Viaje
              </button>`
            : `<button class="btn btn-secondary" onclick="stopSimulation()" id="btnStopSim" style="flex:1;">
                <i data-lucide="square" style="width:16px;height:16px;"></i> Detener
              </button>`
          }
          <button class="btn btn-danger" onclick="triggerAccident()" id="btnAccident">
            <i data-lucide="alert-triangle" style="width:16px;height:16px;"></i> Simular Impacto
          </button>
        </div>
      </div>

      ${state.accidentActive ? renderAccidentOverlay() : ''}
    </div>
  `;
}


// =========================================
// MAP INITIALIZATION
// =========================================
function initSimulatorMap() {
  if (state.map) {
    state.map.remove();
    state.map = null;
  }

  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  // Wait for container to have actual dimensions (critical for mobile flex layouts)
  if (mapEl.clientWidth === 0 || mapEl.clientHeight === 0) {
    setTimeout(initSimulatorMap, 100);
    return;
  }

  state.map = L.map('map', {
    center: CONFIG.BOGOTA_CENTER,
    zoom: CONFIG.MAP_ZOOM,
    zoomControl: false,
    attributionControl: false,
  });

  L.tileLayer(CONFIG.TILE_URL, {
    attribution: CONFIG.TILE_ATTR,
    maxZoom: 19,
  }).addTo(state.map);

  // Risk zones
  RISK_ZONES.forEach(zone => {
    const color = zone.level === 'high' ? '#ef4444' : '#f59e0b';
    L.circle([zone.lat, zone.lng], {
      radius: zone.radius,
      color: color,
      fillColor: color,
      fillOpacity: 0.12,
      weight: 1,
      opacity: 0.4,
    }).addTo(state.map);

    L.marker([zone.lat, zone.lng], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: `<div class="risk-zone-label">⚠ ${zone.name}</div>`,
        iconSize: [200, 20],
        iconAnchor: [100, 10],
      })
    }).addTo(state.map);
  });

  // Polyline for route trail
  state.polyline = L.polyline([], {
    color: '#6366f1',
    weight: 4,
    opacity: 0.8,
    smoothFactor: 1,
  }).addTo(state.map);

  // Initial marker
  const markerIcon = L.divIcon({
    className: 'custom-marker',
    html: '<div class="marker-dot"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  state.marker = L.marker(CONFIG.BOGOTA_CENTER, { icon: markerIcon }).addTo(state.map);

  // Force invalidate then add heatmap (deferred to avoid canvas 0-width crash)
  state.map.invalidateSize();

  setTimeout(() => {
    if (!state.map) return;
    state.map.invalidateSize();

    // Now add heatmap after the container has fully settled
    try {
      const heatPoints = RISK_ZONES.map(z => [z.lat, z.lng, z.level === 'high' ? 0.8 : 0.5]);
      RISK_ZONES.forEach(z => {
        for (let i = 0; i < 10; i++) {
          heatPoints.push([
            z.lat + (Math.random() - 0.5) * 0.008,
            z.lng + (Math.random() - 0.5) * 0.008,
            z.level === 'high' ? 0.6 : 0.3
          ]);
        }
      });

      L.heatLayer(heatPoints, {
        radius: 30,
        blur: 25,
        maxZoom: 17,
        gradient: { 0.2: '#f59e0b', 0.5: '#ef4444', 1: '#dc2626' }
      }).addTo(state.map);
    } catch(e) {
      console.log('Heatmap not available', e);
    }
  }, 500);

  // Additional invalidateSize calls for mobile layout settling
  setTimeout(() => { if (state.map) state.map.invalidateSize(); }, 200);
  setTimeout(() => { if (state.map) state.map.invalidateSize(); }, 1000);
}


// =========================================
// SIMULATION ENGINE
// =========================================
function startSimulation() {
  state.simRunning = true;
  state.simEvents = [];
  state.simAIMessages = [];
  state.simScore = 85;
  state.simScorePrev = 85;
  state.simRouteIndex = 0;
  state.simPath = [];
  state.simMode = 'waiting';

  // Update mode indicator
  updateModeIndicator();

  // Try real geolocation first
  if ('geolocation' in navigator) {
    addAIMessage('📡 Solicitando permiso de ubicación...');
    updateAIUI();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Real geolocation mode
        state.simMode = 'real';
        updateModeIndicator();
        addAIMessage('📡 ¡GPS real activado! Monitoreando tu posición en tiempo real.');
        speak('GPS real activado. Monitoreando tu posición.');
        startRealTracking();
      },
      (err) => {
        // Fallback to simulation
        state.simMode = 'simulated';
        updateModeIndicator();
        addAIMessage('🗺️ Modo simulación activado. Ruta predefinida en Bogotá.');
        speak('Modo simulación activado. Ruta en Bogotá.');
        startSimulatedTracking();
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  } else {
    state.simMode = 'simulated';
    updateModeIndicator();
    addAIMessage('🗺️ Modo simulación activado. Ruta predefinida en Bogotá.');
    startSimulatedTracking();
  }

  updateSimUI();
}

function updateModeIndicator() {
  const el = document.getElementById('simModeIndicator');
  if (!el) return;
  const mode = getModeLabel();
  el.className = `sim-mode-indicator ${mode.cls}`;
  el.innerHTML = `<span class="pulse-dot" style="background:currentColor;width:6px;height:6px;"></span> ${mode.text}`;
}

function startRealTracking() {
  state.simWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, speed, accuracy } = pos.coords;
      const now = Date.now();

      // Calculate speed if not available
      let currentSpeed = speed != null ? speed * 3.6 : 0; // m/s to km/h
      if (!currentSpeed && state.simLastPosition && state.simLastTime) {
        const dist = haversineDistance(
          state.simLastPosition.lat, state.simLastPosition.lng,
          latitude, longitude
        );
        const timeDiff = (now - state.simLastTime) / 1000;
        if (timeDiff > 0) currentSpeed = (dist / timeDiff) * 3.6;
      }

      state.simSpeed = Math.round(clamp(currentSpeed, 0, 200));
      state.simPosition = { lat: latitude, lng: longitude };
      state.simLastPosition = { lat: latitude, lng: longitude };
      state.simLastTime = now;

      // Update map
      if (state.marker) state.marker.setLatLng([latitude, longitude]);
      if (state.map) state.map.panTo([latitude, longitude]);
      state.simPath.push([latitude, longitude]);
      if (state.polyline) state.polyline.setLatLngs(state.simPath);

      // Check risk zones
      checkRiskZones(latitude, longitude);
    },
    (err) => console.log('Geolocation error:', err),
    { enableHighAccuracy: true, maximumAge: 1000 }
  );

  // Start event/score simulation even in real mode
  startEventSimulation();
}

function startSimulatedTracking() {
  const simInterval = setInterval(() => {
    if (!state.simRunning) return;

    const route = SIMULATION_ROUTE;
    if (state.simRouteIndex >= route.length) {
      state.simRouteIndex = 0;
      state.simPath = [];
    }

    const pos = route[state.simRouteIndex];
    const jitter = () => (Math.random() - 0.5) * 0.0003;
    const lat = pos[0] + jitter();
    const lng = pos[1] + jitter();

    state.simPosition = { lat, lng };
    state.simSpeed = randomBetween(20, 80);

    // Update map
    if (state.marker) state.marker.setLatLng([lat, lng]);
    if (state.map) state.map.panTo([lat, lng], { animate: true, duration: 1.2 });
    state.simPath.push([lat, lng]);
    if (state.polyline) state.polyline.setLatLngs(state.simPath);

    // Check risk zones
    checkRiskZones(lat, lng);

    state.simRouteIndex++;
    updateSpeedUI();
  }, CONFIG.SIM_SPEED_INTERVAL);

  state.intervals.push(simInterval);
  startEventSimulation();
}

function startEventSimulation() {
  // Random events
  const eventInterval = setInterval(() => {
    if (!state.simRunning) return;

    const eventType = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    addEvent(eventType);

    // Update score
    state.simScorePrev = state.simScore;
    state.simScore = clamp(state.simScore + eventType.impact, 0, 100);

    // Generate AI message
    const status = getStatusClass(state.simScore);
    const msgs = AI_MESSAGES[status];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    addAIMessage(msg);

    // Speak if it's risky
    if (status === 'risky' || status === 'critical') {
      speak(msg.replace(/[^\wáéíóúñ\s]/g, ''));
    }

    // Simulate speed variation
    if (state.simMode === 'simulated') {
      if (eventType.type === 'speeding') state.simSpeed = randomBetween(90, 130);
      else if (eventType.type === 'hard_brake') state.simSpeed = randomBetween(5, 20);
      else state.simSpeed = randomBetween(25, 65);
    }

    updateSimUI();
  }, CONFIG.EVENT_INTERVAL);

  state.intervals.push(eventInterval);

  // Score recovery over time
  const scoreRecovery = setInterval(() => {
    if (!state.simRunning) return;
    if (state.simScore < 85) {
      state.simScorePrev = state.simScore;
      state.simScore = clamp(state.simScore + 1, 0, 100);
      updateScoreUI();
    }
  }, 3000);

  state.intervals.push(scoreRecovery);
}

function checkRiskZones(lat, lng) {
  RISK_ZONES.forEach(zone => {
    const dist = haversineDistance(lat, lng, zone.lat, zone.lng);
    if (dist < zone.radius) {
      if (!state.simEvents.some(e => e.type === 'risk_zone' && Date.now() - e.timestamp < 15000)) {
        const ev = EVENT_TYPES.find(e => e.type === 'risk_zone');
        addEvent({ ...ev, label: `Zona de riesgo: ${zone.name}` });
        state.simScorePrev = state.simScore;
        state.simScore = clamp(state.simScore - 12, 0, 100);
        addAIMessage(`🚨 ¡Atención! Entrando en ${zone.name}. Reduce la velocidad.`);
        speak(`Atención. Zona de alto riesgo. ${zone.name}`);
        updateSimUI();
      }
    }
  });
}

function addEvent(eventType) {
  state.simEvents.push({
    ...eventType,
    time: formatTime(new Date()),
    timestamp: Date.now(),
  });
}

function addAIMessage(msg) {
  state.simAIMessages.push(msg);
  if (state.simAIMessages.length > 20) state.simAIMessages = state.simAIMessages.slice(-20);
}

function stopSimulation() {
  state.simRunning = false;
  clearAllIntervals();
  if (state.simWatchId) {
    navigator.geolocation.clearWatch(state.simWatchId);
    state.simWatchId = null;
  }
  addAIMessage('🛑 Viaje finalizado. Score final: ' + state.simScore);
  updateSimUI();
}

function toggleVoice() {
  state.voiceEnabled = !state.voiceEnabled;
  updateSimUI();
}


// =========================================
// UI UPDATE FUNCTIONS (partial updates)
// =========================================
function updateSimUI() {
  updateSpeedUI();
  updateScoreUI();
  updateEventsUI();
  updateAIUI();
  updateControlsUI();
  updateMobileFloats();
}

function updateSpeedUI() {
  const speedEl = document.getElementById('simSpeedValue');
  const statusBadge = document.getElementById('simStatusBadge');
  const status = getStatusClass(state.simScore);
  const statusLabel = getStatusLabel(state.simScore);
  const statusColor = getStatusColor(state.simScore);

  if (speedEl) {
    speedEl.textContent = state.simSpeed;
    speedEl.style.color = statusColor;
  }

  if (statusBadge) {
    statusBadge.className = `status-badge status-${status}`;
    statusBadge.innerHTML = `<span class="pulse-dot" style="background:${statusColor}"></span> ${statusLabel}`;
  }
}

function updateScoreUI() {
  const scoreNumber = document.getElementById('scoreNumber');
  const scoreGauge = document.getElementById('scoreGauge');
  if (!scoreGauge) return;

  const status = getStatusClass(state.simScore);
  const statusColor = getStatusColor(state.simScore);
  const circumference = 2 * Math.PI * 56;
  const offset = circumference - (state.simScore / 100) * circumference;
  const trendDir = state.simScore >= state.simScorePrev ? '↑' : '↓';
  const trendColor = state.simScore >= state.simScorePrev ? 'var(--safe)' : 'var(--risky)';

  const fg = scoreGauge.querySelector('.score-fg');
  if (fg) {
    fg.setAttribute('stroke', statusColor);
    fg.setAttribute('stroke-dashoffset', offset);
  }

  if (scoreNumber) {
    scoreNumber.textContent = state.simScore;
    scoreNumber.style.color = statusColor;
  }

  const trendEl = scoreGauge.querySelector('.score-trend');
  if (trendEl) {
    trendEl.style.color = trendColor;
    trendEl.textContent = `${trendDir} ${Math.abs(state.simScore - state.simScorePrev)} pts esta sesión`;
  }
}

function updateMobileFloats() {
  // Update floating score mini
  const scoreMiniNum = document.getElementById('scoreMiniNum');
  const scoreMiniTrend = document.getElementById('scoreMiniTrend');
  const statusColor = getStatusColor(state.simScore);
  const trendDir = state.simScore >= state.simScorePrev ? '↑' : '↓';
  const trendColor = state.simScore >= state.simScorePrev ? 'var(--safe)' : 'var(--risky)';

  if (scoreMiniNum) {
    scoreMiniNum.textContent = state.simScore;
    scoreMiniNum.style.color = statusColor;
  }
  if (scoreMiniTrend) {
    scoreMiniTrend.textContent = `${trendDir}${Math.abs(state.simScore - state.simScorePrev)}`;
    scoreMiniTrend.style.color = trendColor;
  }
}

function updateEventsUI() {
  const eventsList = document.getElementById('eventsList');
  if (!eventsList) return;

  const events = state.simEvents.slice(-6).reverse();
  if (events.length === 0) {
    eventsList.innerHTML = '<p style="color:var(--text-muted);font-size:0.75rem;">Esperando eventos...</p>';
    return;
  }

  eventsList.innerHTML = events.map(ev => `
    <div class="event-item event-${ev.severity}">
      <div class="event-icon">${ev.icon}</div>
      <div class="event-info">
        <div class="event-title">${ev.label}</div>
        <div class="event-time">${ev.time} · ${ev.impact > 0 ? '+' : ''}${ev.impact} pts</div>
      </div>
    </div>
  `).join('');
}

function updateAIUI() {
  const aiMessages = document.getElementById('aiMessages');
  if (!aiMessages) return;

  const msgs = state.simAIMessages.slice(-3);
  if (msgs.length === 0) {
    aiMessages.innerHTML = '<div class="ai-message">🤖 Sistema listo. Inicia el viaje para activar el análisis IA.</div>';
    return;
  }

  aiMessages.innerHTML = msgs.map(m => `<div class="ai-message">${m}</div>`).join('');
}

function updateControlsUI() {
  const controls = document.getElementById('simControls');
  if (!controls) return;

  controls.innerHTML = `
    ${!state.simRunning
      ? `<button class="btn btn-primary" onclick="startSimulation()" id="btnStartSim" style="flex:1;">
          <i data-lucide="play" style="width:16px;height:16px;"></i> Iniciar Viaje
        </button>`
      : `<button class="btn btn-secondary" onclick="stopSimulation()" id="btnStopSim" style="flex:1;">
          <i data-lucide="square" style="width:16px;height:16px;"></i> Detener
        </button>`
    }
    <button class="btn btn-danger" onclick="triggerAccident()" id="btnAccident">
      <i data-lucide="alert-triangle" style="width:16px;height:16px;"></i> Simular Impacto
    </button>
  `;

  // Also update mobile floating controls
  const floatControls = document.getElementById('controlsFloatMobile');
  if (floatControls) {
    floatControls.innerHTML = `
      ${!state.simRunning
        ? `<button class="btn btn-primary btn-sm" onclick="startSimulation()" id="btnStartFloat">
            <i data-lucide="play" style="width:14px;height:14px;"></i> Iniciar
          </button>`
        : `<button class="btn btn-secondary btn-sm" onclick="stopSimulation()" id="btnStopFloat">
            <i data-lucide="square" style="width:14px;height:14px;"></i> Parar
          </button>`
      }
      <button class="btn btn-danger btn-sm" onclick="triggerAccident()" id="btnAccidentFloat">
        <i data-lucide="alert-triangle" style="width:14px;height:14px;"></i> Impacto
      </button>
    `;
  }

  if (window.lucide) lucide.createIcons();
}


// =========================================
// ACCIDENT DETECTION
// =========================================
function renderAccidentOverlay() {
  if (state.emergencySent) {
    return `
      <div class="accident-overlay" id="accidentOverlay">
        <div class="accident-card">
          <div class="emergency-sent">
            <div class="check-icon">✓</div>
            <h2 style="font-size:1.25rem;margin-bottom:0.5rem;">Emergencia Enviada</h2>
            <p style="color:var(--text-secondary);margin-bottom:0.75rem;font-size:0.85rem;">
              Tu ubicación GPS ha sido compartida con los servicios de emergencia.
            </p>
            <div class="glass-card-sm" style="text-align:left;margin-bottom:0.75rem;">
              <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.35rem;">📍 Coordenadas enviadas:</p>
              <p style="font-family:var(--font-mono);font-size:0.8rem;">
                Lat: ${state.simPosition ? state.simPosition.lat.toFixed(6) : '4.609700'}<br/>
                Lng: ${state.simPosition ? state.simPosition.lng.toFixed(6) : '-74.081700'}
              </p>
              <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.35rem;">
                🕐 ${formatTime(new Date())}<br/>
                📞 Contacto de emergencia notificado<br/>
                🏥 Ambulancia más cercana alertada
              </p>
            </div>
            <button class="btn btn-primary" onclick="closeAccident()" style="width:100%;">Cerrar</button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="accident-overlay" id="accidentOverlay">
      <div class="accident-card">
        <div class="accident-icon">🚨</div>
        <h2 style="font-size:1.25rem;color:var(--critical);">¡Impacto Detectado!</h2>
        <p style="color:var(--text-secondary);font-size:0.85rem;">
          Se ha detectado un posible accidente. Si estás bien, cancela la alerta.
        </p>
        <div class="accident-countdown" id="accidentCountdown">${state.accidentCountdown}</div>
        <p style="color:var(--text-muted);font-size:0.75rem;">
          Enviando emergencia en ${state.accidentCountdown}s...
        </p>
        <div class="accident-buttons">
          <button class="btn btn-success btn-lg" onclick="cancelAccident()" id="btnCancelAccident">
            ✓ Estoy bien
          </button>
          <button class="btn btn-danger btn-lg" onclick="sendEmergency()" id="btnSendEmergency">
            🚑 Enviar Emergencia
          </button>
        </div>
      </div>
    </div>
  `;
}

function triggerAccident() {
  state.accidentActive = true;
  state.accidentCountdown = CONFIG.COUNTDOWN_SECONDS;
  state.emergencySent = false;

  speak('¡Alerta! Posible impacto detectado. Si estás bien, cancela la alerta.');

  // Re-render to show overlay
  updateAccidentUI();

  state.accidentInterval = setInterval(() => {
    state.accidentCountdown--;
    const countdownEl = document.getElementById('accidentCountdown');
    if (countdownEl) countdownEl.textContent = state.accidentCountdown;

    if (state.accidentCountdown <= 0) {
      clearInterval(state.accidentInterval);
      sendEmergency();
    }
  }, 1000);
}

function updateAccidentUI() {
  // Remove existing overlay
  const existing = document.getElementById('accidentOverlay');
  if (existing) existing.remove();

  if (state.accidentActive) {
    const simPage = document.getElementById('simulatorPage');
    if (simPage) {
      simPage.insertAdjacentHTML('beforeend', renderAccidentOverlay());
    } else {
      document.body.insertAdjacentHTML('beforeend', renderAccidentOverlay());
    }
  }
}

function cancelAccident() {
  state.accidentActive = false;
  if (state.accidentInterval) {
    clearInterval(state.accidentInterval);
    state.accidentInterval = null;
  }
  addAIMessage('✅ Alerta cancelada. Nos alegra que estés bien. Continúa con precaución.');
  speak('Alerta cancelada. Nos alegra que estés bien.');

  const overlay = document.getElementById('accidentOverlay');
  if (overlay) overlay.remove();
  updateAIUI();
}

function sendEmergency() {
  if (state.accidentInterval) {
    clearInterval(state.accidentInterval);
    state.accidentInterval = null;
  }
  state.emergencySent = true;
  speak('Emergencia enviada. Tu ubicación ha sido compartida con servicios de emergencia.');
  updateAccidentUI();
}

function closeAccident() {
  state.accidentActive = false;
  state.emergencySent = false;
  const overlay = document.getElementById('accidentOverlay');
  if (overlay) overlay.remove();
}


// =========================================
// DASHBOARD
// =========================================
function renderDashboard() {
  return `
    <div class="dashboard-page page-enter">
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h1>Dashboard B2B</h1>
          <p>Panel ejecutivo para aseguradoras y empresas de delivery</p>
        </div>

        <!-- KPIs -->
        <div class="kpi-grid">
          <div class="glass-card kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon" style="background:var(--accent-bg);color:var(--accent-light);">
                <i data-lucide="users" style="width:18px;height:18px;"></i>
              </div>
              <span class="kpi-change positive">+12%</span>
            </div>
            <div class="kpi-value">1,247</div>
            <div class="kpi-label">Conductores Activos</div>
          </div>
          <div class="glass-card kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon" style="background:var(--risky-bg);color:var(--risky);">
                <i data-lucide="alert-triangle" style="width:18px;height:18px;"></i>
              </div>
              <span class="kpi-change negative">-8%</span>
            </div>
            <div class="kpi-value">156</div>
            <div class="kpi-label">Riesgo Alto</div>
          </div>
          <div class="glass-card kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon" style="background:var(--moderate-bg);color:var(--moderate);">
                <i data-lucide="zap" style="width:18px;height:18px;"></i>
              </div>
              <span class="kpi-change negative">-23%</span>
            </div>
            <div class="kpi-value">342</div>
            <div class="kpi-label">Eventos Críticos</div>
          </div>
          <div class="glass-card kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon" style="background:var(--safe-bg);color:var(--safe);">
                <i data-lucide="target" style="width:18px;height:18px;"></i>
              </div>
              <span class="kpi-change positive">+5</span>
            </div>
            <div class="kpi-value">76.4</div>
            <div class="kpi-label">Score Promedio</div>
          </div>
          <div class="glass-card kpi-card">
            <div class="kpi-header">
              <div class="kpi-icon" style="background:var(--safe-bg);color:var(--safe);">
                <i data-lucide="dollar-sign" style="width:18px;height:18px;"></i>
              </div>
              <span class="kpi-change positive">+18%</span>
            </div>
            <div class="kpi-value">$487K</div>
            <div class="kpi-label">Ahorro Estimado</div>
          </div>
        </div>

        <!-- Charts -->
        <div class="dashboard-grid">
          <div class="glass-card chart-card">
            <h3><i data-lucide="activity" style="width:16px;height:16px;"></i> Eventos por Hora</h3>
            <div class="chart-container">
              <canvas id="chartEvents"></canvas>
            </div>
          </div>
          <div class="glass-card chart-card">
            <h3><i data-lucide="pie-chart" style="width:16px;height:16px;"></i> Distribución de Score</h3>
            <div class="chart-container">
              <canvas id="chartScore"></canvas>
            </div>
          </div>
          <div class="glass-card chart-card dashboard-grid-full">
            <h3><i data-lucide="trending-up" style="width:16px;height:16px;"></i> Evolución de Score (30 días)</h3>
            <div class="chart-container">
              <canvas id="chartEvolution"></canvas>
            </div>
          </div>
        </div>

        <!-- Drivers Table -->
        <div class="glass-card" style="padding:1rem;margin-bottom:1.25rem;position:relative;">
          <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.5rem;">
            <i data-lucide="user-check" style="width:16px;height:16px;"></i> Conductores
          </h3>
          <div class="drivers-table-container">
            <table class="drivers-table">
              <thead>
                <tr>
                  <th>Conductor</th>
                  <th>Tipo</th>
                  <th>Score</th>
                  <th>Riesgo</th>
                  <th>Eventos</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                ${MOCK_DRIVERS.map(d => {
                  const scoreStatus = getStatusClass(d.score);
                  const scoreColor = getStatusColor(d.score);
                  const riskClass = d.risk === 'Bajo' ? 'safe' : d.risk === 'Moderado' ? 'moderate' : d.risk === 'Alto' ? 'risky' : 'critical';
                  return `
                    <tr>
                      <td>
                        <div class="driver-name">
                          <div class="driver-avatar">${d.avatar}</div>
                          <span>${d.name}</span>
                        </div>
                      </td>
                      <td style="color:var(--text-secondary)">${d.type}</td>
                      <td>
                        <div class="score-bar">
                          <span style="font-family:var(--font-mono);font-weight:600;color:${scoreColor}">${d.score}</span>
                          <div class="score-bar-track">
                            <div class="score-bar-fill" style="width:${d.score}%;background:${scoreColor}"></div>
                          </div>
                        </div>
                      </td>
                      <td><span class="status-badge status-${riskClass}">${d.risk}</span></td>
                      <td style="font-family:var(--font-mono)">${d.events}</td>
                      <td style="color:${d.trend.startsWith('+') ? 'var(--safe)' : 'var(--risky)'};font-family:var(--font-mono);font-weight:600;">${d.trend}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Dashboard Map -->
        <div class="glass-card" style="padding:1rem;margin-bottom:2rem;">
          <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.5rem;">
            <i data-lucide="map-pin" style="width:16px;height:16px;"></i> Mapa de Calor — Zonas de Riesgo
          </h3>
          <div class="dashboard-map" id="dashboardMap"></div>
        </div>
      </div>
    </div>
  `;
}

function initDashboard() {
  initDashboardCharts();
  initDashboardMap();
}

function initDashboardCharts() {
  Chart.defaults.color = '#a0a0b8';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = "'Inter', sans-serif";

  // Events by hour
  const ctxEvents = document.getElementById('chartEvents');
  if (ctxEvents) {
    new Chart(ctxEvents, {
      type: 'bar',
      data: {
        labels: ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm'],
        datasets: [
          {
            label: 'Frenadas',
            data: [5, 12, 8, 15, 10, 18, 25, 14, 7],
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderRadius: 4,
          },
          {
            label: 'Velocidad',
            data: [3, 8, 5, 10, 7, 14, 20, 12, 5],
            backgroundColor: 'rgba(245, 158, 11, 0.7)',
            borderRadius: 4,
          },
          {
            label: 'Zigzagueo',
            data: [2, 5, 3, 6, 4, 8, 12, 7, 3],
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10, font: { size: 10 } } } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 } } },
          y: { beginAtZero: true, ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  // Score distribution (doughnut)
  const ctxScore = document.getElementById('chartScore');
  if (ctxScore) {
    new Chart(ctxScore, {
      type: 'doughnut',
      data: {
        labels: ['Seguro', 'Moderado', 'Riesgoso', 'Crítico'],
        datasets: [{
          data: [42, 31, 18, 9],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#dc2626'],
          borderWidth: 0,
          spacing: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10, font: { size: 10 } } }
        }
      }
    });
  }

  // Score evolution (line)
  const ctxEvolution = document.getElementById('chartEvolution');
  if (ctxEvolution) {
    const days = Array.from({ length: 30 }, (_, i) => `D${i + 1}`);
    const baseScore = 65;
    const scores = days.map((_, i) => {
      return baseScore + Math.floor(Math.random() * 15) + (i * 0.5);
    });

    new Chart(ctxEvolution, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: 'Score Promedio',
          data: scores.map(s => Math.min(s, 95)),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 10 } } },
          y: { min: 50, max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 10 } } }
        }
      }
    });
  }
}

function initDashboardMap() {
  const mapEl = document.getElementById('dashboardMap');
  if (!mapEl) return;

  const dashMap = L.map('dashboardMap', {
    center: CONFIG.BOGOTA_CENTER,
    zoom: 12,
    zoomControl: false,
    attributionControl: false,
  });

  L.tileLayer(CONFIG.TILE_URL, {
    attribution: CONFIG.TILE_ATTR,
    maxZoom: 19,
  }).addTo(dashMap);

  // Risk zones with circles
  RISK_ZONES.forEach(zone => {
    const color = zone.level === 'high' ? '#ef4444' : '#f59e0b';
    L.circle([zone.lat, zone.lng], {
      radius: zone.radius,
      color: color,
      fillColor: color,
      fillOpacity: 0.2,
      weight: 2,
      opacity: 0.6,
    }).addTo(dashMap);
  });

  // Heatmap
  try {
    const heatPoints = [];
    RISK_ZONES.forEach(z => {
      heatPoints.push([z.lat, z.lng, z.level === 'high' ? 1 : 0.6]);
      for (let i = 0; i < 20; i++) {
        heatPoints.push([
          z.lat + (Math.random() - 0.5) * 0.012,
          z.lng + (Math.random() - 0.5) * 0.012,
          Math.random() * 0.5 + 0.2
        ]);
      }
    });
    L.heatLayer(heatPoints, {
      radius: 35,
      blur: 28,
      maxZoom: 15,
      gradient: { 0.2: '#fbbf24', 0.5: '#f59e0b', 0.8: '#ef4444', 1: '#dc2626' }
    }).addTo(dashMap);
  } catch(e) {
    console.log('Heatmap not available:', e);
  }

  // Mock driver positions
  MOCK_DRIVERS.forEach(d => {
    const lat = CONFIG.BOGOTA_CENTER[0] + (Math.random() - 0.5) * 0.05;
    const lng = CONFIG.BOGOTA_CENTER[1] + (Math.random() - 0.5) * 0.05;
    const color = getStatusColor(d.score);

    L.circleMarker([lat, lng], {
      radius: 6,
      fillColor: color,
      fillOpacity: 0.9,
      color: 'white',
      weight: 2,
    }).addTo(dashMap).bindPopup(`
      <div style="font-family:Inter,sans-serif;font-size:12px;">
        <strong>${d.name}</strong><br/>
        Score: <span style="color:${color};font-weight:700;">${d.score}</span><br/>
        ${d.type} · ${d.risk}
      </div>
    `);
  });

  setTimeout(() => dashMap.invalidateSize(), 300);
}


// =========================================
// INSURANCE MODULE — TREND-BASED
// =========================================
let insuranceChart = null; // Track chart instance for cleanup

function renderInsurance() {
  const selectedDriver = MOCK_DRIVERS[3]; // Camila Torres — default (best case to demo)
  return `
    <div class="dashboard-page page-enter">
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h1>Seguros Dinámicos — Modelo de Tendencias</h1>
          <p>Evaluación basada en comportamiento consistente, no en eventos aislados</p>
        </div>

        <div class="insurance-section" id="insuranceSection">
          <!-- Driver selector -->
          <div class="glass-card" style="padding:1rem;margin-bottom:1rem;">
            <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.5rem;">
              <i data-lucide="user" style="width:16px;height:16px;"></i> Seleccionar Conductor
            </h3>
            <div class="insurance-driver-chips">
              ${MOCK_DRIVERS.map(d => `
                <button class="btn btn-sm ${d.id === selectedDriver.id ? 'btn-primary' : 'btn-secondary'}" 
                  onclick="renderInsuranceFor(${d.id})" id="insBtn${d.id}">
                  ${d.avatar} ${d.name.split(' ')[0]}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Full insurance content -->
          <div id="insuranceContent">
            ${renderInsuranceFullContent(selectedDriver)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderInsuranceFullContent(driver) {
  const data = INSURANCE_DATA[driver.id];
  const iScore = data.insurerScore;
  const scoreColor = getStatusColor(iScore);
  const scoreLabel = getStatusLabel(iScore);
  const m = data.metrics;
  const trendIcon = m.trend === 'Mejora' ? '📈' : m.trend === 'Deterioro' ? '📉' : '➡️';
  const trendColor = m.trend === 'Mejora' ? 'var(--safe)' : m.trend === 'Deterioro' ? 'var(--risky)' : 'var(--moderate)';

  // Pricing based on INSURER score (not daily)
  const basePremium = 850000;
  const discount = Math.round((iScore / 100) * 35);
  const actualDiscount = Math.max(5, Math.min(35, discount));
  const newPremium = Math.round(basePremium * (1 - actualDiscount / 100));
  const savings = basePremium - newPremium;

  // Find bad day info
  const badDay = data.history.find(h => h.dailyScore < h.insurerScore - 15);
  const badDayMsg = badDay 
    ? `El evento del <strong>${badDay.date}</strong> redujo el score diario a <strong>${badDay.dailyScore}</strong>, pero el score asegurador se mantuvo en <strong>${badDay.insurerScore}</strong> gracias a la consistencia acumulada.`
    : '';

  // Generate IA insight
  let insightMsg;
  if (iScore >= 80) {
    insightMsg = `<strong>${driver.name}</strong> mantiene un score asegurador de <strong style="color:${scoreColor}">${iScore}/100</strong>. 
    El <strong>${m.safeDaysPct}%</strong> de sus trayectos son seguros, con una mejor racha de <strong>${m.bestStreak} días</strong> consecutivos. 
    ${badDayMsg ? badDayMsg : 'No se registran caídas significativas.'}
    <br><br>
    <strong style="color:var(--accent-light)">Este conductor no se penaliza por un evento aislado; se evalúa su tendencia completa.</strong> 
    Su consistencia le permite acceder al máximo nivel de descuento.`;
  } else if (iScore >= 60) {
    insightMsg = `<strong>${driver.name}</strong> presenta un score asegurador moderado de <strong style="color:${scoreColor}">${iScore}/100</strong>.
    ${m.safeDaysPct}% de días seguros y ${m.criticalDays} días críticos en los últimos 15 días.
    ${badDayMsg}
    <br><br>
    <strong style="color:var(--accent-light)">Este conductor no se penaliza por un evento aislado; se evalúa su tendencia completa.</strong>
    Se recomienda mejorar frenadas y velocidad para acceder a mejores descuentos.`;
  } else {
    insightMsg = `<strong>${driver.name}</strong> presenta un score asegurador de riesgo: <strong style="color:${scoreColor}">${iScore}/100</strong>.
    Solo ${m.safeDaysPct}% de días seguros, con ${m.criticalDays} días críticos. Tendencia: <strong>${m.trend}</strong>.
    <br><br>
    <strong style="color:var(--moderate)">Aunque evaluamos tendencias y no eventos aislados, este conductor muestra un patrón repetido de riesgo.</strong>
    Se recomiendan capacitaciones obligatorias antes de poder acceder a descuentos.`;
  }

  return `
    <!-- 1. TREND CHART -->
    <div class="glass-card" style="padding:1rem;margin-bottom:1rem;">
      <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:0.5rem;display:flex;align-items:center;gap:0.5rem;">
        <i data-lucide="trending-up" style="width:16px;height:16px;"></i>
        Tendencia de Score — ${driver.name}
      </h3>
      <p style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.75rem;">
        Fórmula: <code style="background:rgba(255,255,255,0.06);padding:0.15rem 0.4rem;border-radius:4px;font-size:0.65rem;">Score Asegurador = 0.7 × histórico + 0.3 × reciente</code>
      </p>
      <div class="chart-container" style="height:260px;">
        <canvas id="insuranceTrendChart"></canvas>
      </div>
    </div>

    <!-- 2. CONSISTENCY METRICS -->
    <div class="ins-metrics-grid">
      <div class="glass-card ins-metric-card">
        <div class="ins-metric-value" style="color:var(--safe)">${m.safeDaysPct}%</div>
        <div class="ins-metric-label">Días seguros</div>
      </div>
      <div class="glass-card ins-metric-card">
        <div class="ins-metric-value" style="color:var(--risky)">${m.criticalDays}</div>
        <div class="ins-metric-label">Días críticos</div>
      </div>
      <div class="glass-card ins-metric-card">
        <div class="ins-metric-value" style="color:var(--accent-light)">${m.bestStreak}</div>
        <div class="ins-metric-label">Mejor racha</div>
      </div>
      <div class="glass-card ins-metric-card">
        <div class="ins-metric-value" style="color:${trendColor}">${trendIcon}</div>
        <div class="ins-metric-label">${m.trend}</div>
      </div>
    </div>

    <!-- 3. SCORE DECOMPOSITION TABLE -->
    <div class="glass-card" style="padding:1rem;margin-bottom:1rem;">
      <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.5rem;">
        <i data-lucide="sliders" style="width:16px;height:16px;"></i>
        Descomposición del Score
      </h3>
      <div class="ins-table-wrapper">
        <table class="ins-table">
          <thead>
            <tr>
              <th>Factor</th>
              <th>Peso</th>
              <th>Desempeño</th>
              <th>Impacto</th>
            </tr>
          </thead>
          <tbody>
            ${data.decomposition.map(d => {
              const levelClass = d.level === 'Bajo' ? 'safe' : d.level === 'Medio' ? 'moderate' : 'risky';
              const levelLabel = d.level === 'Bajo' ? 'Bajo riesgo' : d.level === 'Medio' ? 'Riesgo medio' : 'Alto riesgo';
              const impactColor = d.impact >= 0 ? 'var(--safe)' : 'var(--risky)';
              return `
                <tr>
                  <td style="font-weight:600;">${d.factor}</td>
                  <td style="font-family:var(--font-mono);text-align:center;">${d.weight}%</td>
                  <td><span class="status-badge status-${levelClass}" style="font-size:0.65rem;">${levelLabel}</span></td>
                  <td style="font-family:var(--font-mono);font-weight:700;color:${impactColor};text-align:center;">${d.impact > 0 ? '+' : ''}${d.impact}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- 4. HISTORY TABLE -->
    <div class="glass-card" style="padding:1rem;margin-bottom:1rem;">
      <h3 style="font-size:0.9rem;font-weight:700;margin-bottom:0.75rem;display:flex;align-items:center;gap:0.5rem;">
        <i data-lucide="calendar" style="width:16px;height:16px;"></i>
        Historial de 15 Días
      </h3>
      <div class="ins-table-wrapper">
        <table class="ins-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Score Día</th>
              <th>Score Aseg.</th>
              <th>Eventos</th>
              <th>Tipo</th>
              <th>Impacto</th>
              <th>Penalización Prima</th>
            </tr>
          </thead>
          <tbody>
            ${data.history.map(h => {
              const dayColor = getStatusColor(h.dailyScore);
              const insColor = getStatusColor(h.insurerScore);
              const isBadDay = h.dailyScore < h.insurerScore - 15;
              const rowClass = isBadDay ? 'ins-row-bad' : '';
              const penaltyClass = h.penalty === 'No penaliza' ? 'safe' 
                                 : h.penalty === 'En observación' ? 'moderate'
                                 : h.penalty === 'Penalización leve' ? 'risky' 
                                 : 'critical';
              return `
                <tr class="${rowClass}">
                  <td style="white-space:nowrap;font-weight:600;">${h.date}</td>
                  <td style="font-family:var(--font-mono);font-weight:700;color:${dayColor};text-align:center">${h.dailyScore}</td>
                  <td style="font-family:var(--font-mono);font-weight:700;color:${insColor};text-align:center">${h.insurerScore}</td>
                  <td style="font-family:var(--font-mono);text-align:center">${h.events}</td>
                  <td style="font-size:0.7rem;white-space:nowrap">${h.type}</td>
                  <td style="font-family:var(--font-mono);font-weight:600;color:${h.impact.startsWith('+') ? 'var(--safe)' : h.impact === '0' ? 'var(--text-muted)' : 'var(--risky)'};text-align:center">${h.impact}</td>
                  <td><span class="ins-penalty-badge ins-penalty-${penaltyClass}">${h.penalty}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- 5. AI INSIGHT -->
    <div class="glass-card ins-insight-card" style="margin-bottom:1rem;">
      <div class="ins-insight-header">
        <span class="ins-insight-icon">🧠</span>
        <h3>Insight IA — Análisis de Tendencia</h3>
      </div>
      <p class="ins-insight-text">${insightMsg}</p>
    </div>

    <!-- 6. PRICING -->
    <div class="glass-card" style="padding:1.25rem;margin-bottom:1rem;">
      <div style="text-align:center;margin-bottom:1rem;">
        <div class="driver-avatar" style="width:50px;height:50px;font-size:1rem;margin:0 auto 0.5rem;">
          ${driver.avatar}
        </div>
        <h2 style="font-size:1.1rem;font-weight:800;">${driver.name}</h2>
        <p style="color:var(--text-secondary);font-size:0.75rem;">${driver.type}</p>
        <span class="status-badge status-${getStatusClass(iScore)}" style="margin-top:0.35rem;">
          Score Asegurador: ${iScore} — ${scoreLabel}
        </span>
      </div>

      <div class="insurance-comparison">
        <div class="insurance-column">
          <div class="insurance-label">Prima Base SOAT</div>
          <div class="insurance-price" style="color:var(--text-muted);text-decoration:line-through;">
            $${basePremium.toLocaleString('es-CO')}
          </div>
          <p style="font-size:0.7rem;color:var(--text-muted);margin-top:0.15rem;">COP / año</p>
        </div>
        <div class="insurance-arrow">→</div>
        <div class="insurance-column">
          <div class="insurance-label">Prima con MotoGuard AI</div>
          <div class="insurance-price" style="color:${scoreColor};">
            $${newPremium.toLocaleString('es-CO')}
          </div>
          <p style="font-size:0.7rem;color:var(--text-muted);margin-top:0.15rem;">COP / año</p>
          <div class="insurance-discount">
            <i data-lucide="trending-down" style="width:16px;height:16px;"></i>
            -${actualDiscount}% descuento
          </div>
        </div>
      </div>

      <div style="text-align:center;margin:1rem 0;">
        <div class="glass-card-sm" style="display:inline-flex;gap:0.75rem;padding:0.75rem 1.5rem;">
          <div style="text-align:center;">
            <div style="font-size:1.25rem;font-weight:800;color:var(--safe);font-family:var(--font-mono);">
              $${savings.toLocaleString('es-CO')}
            </div>
            <div style="font-size:0.65rem;color:var(--text-muted);">Ahorro anual</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 7. B2B EXECUTIVE MESSAGE -->
    <div class="glass-card ins-b2b-card">
      <h3 style="font-size:0.95rem;font-weight:800;margin-bottom:0.75rem;color:var(--accent-light);display:flex;align-items:center;gap:0.5rem;">
        <i data-lucide="building-2" style="width:16px;height:16px;"></i>
        Para Aseguradoras: Evaluación basada en comportamiento
      </h3>
      <div class="ins-b2b-points">
        <div class="ins-b2b-point">
          <div class="ins-b2b-icon">🛡️</div>
          <div>
            <strong>Reduce falsos castigos</strong>
            <p>Un solo evento negativo no destruye la prima del conductor. El modelo de suavización (<code>0.7 × histórico + 0.3 × reciente</code>) absorbe anomalías aisladas.</p>
          </div>
        </div>
        <div class="ins-b2b-point">
          <div class="ins-b2b-icon">📊</div>
          <div>
            <strong>Premia la consistencia</strong>
            <p>Los conductores con trayectos sostenidamente seguros obtienen descuentos reales, incentivando buenas prácticas a largo plazo.</p>
          </div>
        </div>
        <div class="ins-b2b-point">
          <div class="ins-b2b-icon">🎯</div>
          <div>
            <strong>Segmentación real del riesgo</strong>
            <p>Diferenciamos entre un conductor que tuvo un mal día y uno con un patrón repetido de conducción peligrosa. Solo este último es penalizado.</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initInsuranceChart(driverId) {
  const data = INSURANCE_DATA[driverId];
  if (!data) return;

  // Destroy previous chart
  if (insuranceChart) {
    insuranceChart.destroy();
    insuranceChart = null;
  }

  const ctx = document.getElementById('insuranceTrendChart');
  if (!ctx) return;

  Chart.defaults.color = '#a0a0b8';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';

  const labels = data.history.map(h => h.date);
  const dailyScores = data.history.map(h => h.dailyScore);
  const insurerScores = data.history.map(h => h.insurerScore);

  // Color points based on risk for daily line
  const pointColors = dailyScores.map(s => getStatusColor(s));
  const pointRadii = data.history.map(h => h.dailyScore < h.insurerScore - 15 ? 7 : 3);

  insuranceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Score Diario',
          data: dailyScores,
          borderColor: 'rgba(245, 158, 11, 0.8)',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          fill: false,
          tension: 0.3,
          borderWidth: 2,
          borderDash: [6, 3],
          pointBackgroundColor: pointColors,
          pointBorderColor: pointColors,
          pointRadius: pointRadii,
          pointHoverRadius: 8,
        },
        {
          label: 'Score Asegurador',
          data: insurerScores,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 2,
          pointHoverRadius: 6,
          pointBackgroundColor: '#6366f1',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 14, padding: 12, font: { size: 11 }, usePointStyle: true }
        },
        tooltip: {
          callbacks: {
            afterBody: function(context) {
              const idx = context[0].dataIndex;
              const h = data.history[idx];
              let lines = [];
              if (h.events > 0) lines.push(`Eventos: ${h.events} (${h.type})`);
              lines.push(`Penalización: ${h.penalty}`);
              if (h.dailyScore < h.insurerScore - 15) lines.push('⚠️ DÍA MALO DETECTADO');
              return lines;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45 } },
        y: { 
          min: 0, max: 100, 
          grid: { color: 'rgba(255,255,255,0.04)' }, 
          ticks: { font: { size: 10 }, stepSize: 20 }
        }
      }
    }
  });
}

// Global function for driver selection in insurance module
window.renderInsuranceFor = function(driverId) {
  const driver = MOCK_DRIVERS.find(d => d.id === driverId);
  if (!driver) return;

  // Update content
  const contentEl = document.getElementById('insuranceContent');
  if (contentEl) {
    contentEl.innerHTML = renderInsuranceFullContent(driver);
  }

  // Update button states
  MOCK_DRIVERS.forEach(d => {
    const btn = document.getElementById(`insBtn${d.id}`);
    if (btn) {
      btn.className = `btn btn-sm ${d.id === driverId ? 'btn-primary' : 'btn-secondary'}`;
    }
  });

  if (window.lucide) lucide.createIcons();

  // Re-init chart for new driver
  setTimeout(() => initInsuranceChart(driverId), 100);
};


// =========================================
// PITCH / STORYTELLING
// =========================================
function renderPitch() {
  return `
    <div class="dashboard-page page-enter">
      <div class="dashboard-container">
        <div class="dashboard-header" style="text-align:center;margin-bottom:2rem;">
          <div class="hero-badge" style="margin:0 auto 1rem;">
            <span class="pulse-dot" style="background:var(--accent)"></span>
            Pitch Deck
          </div>
          <h1 style="font-size:clamp(1.5rem,5vw,2.5rem);font-weight:900;">
            <span style="background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">MotoGuard AI</span>
          </h1>
          <p style="color:var(--text-secondary);font-size:clamp(0.85rem,2.5vw,1.1rem);margin-top:0.35rem;">
            El copiloto inteligente que salva vidas
          </p>
        </div>

        <div class="pitch-section">
          <div class="pitch-timeline">
            <div class="pitch-item">
              <h3 style="color:var(--risky);">🔴 El Problema</h3>
              <p>
                En Colombia, más de <strong>7,000 motociclistas mueren al año</strong>. 
                Las aseguradoras pierden <strong>$2.3 billones COP</strong> en siniestros.
                No existe segmentación real de riesgo: todos pagan lo mismo.
              </p>
            </div>

            <div class="pitch-item">
              <h3 style="color:var(--safe);">✅ La Solución</h3>
              <p>
                MotoGuard AI convierte el celular en un <strong>copiloto inteligente</strong>.
                Usando GPS, acelerómetro y giroscopio, analizamos la conducción en tiempo real,
                generamos alertas por voz y activamos protocolos de emergencia.
              </p>
            </div>

            <div class="pitch-item">
              <h3 style="color:var(--accent-light);">🧠 Inteligencia Artificial</h3>
              <p>Nuestro motor de IA procesa datos de sensores para:</p>
              <ul style="margin-top:0.35rem;padding-left:1rem;">
                <li>Detectar frenadas bruscas, excesos y zigzagueo</li>
                <li>Identificar zonas de alto riesgo</li>
                <li>Predecir situaciones de riesgo</li>
                <li>Detectar accidentes automáticamente</li>
                <li>Generar un score dinámico</li>
              </ul>
            </div>

            <div class="pitch-item">
              <h3 style="color:var(--moderate);">💰 Modelo de Negocio</h3>
              <p><strong>B2B SaaS</strong> para aseguradoras y empresas de delivery:</p>
              <div class="glass-card-sm" style="margin-top:0.5rem;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
                  <div>
                    <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:0.15rem;">Aseguradoras</div>
                    <p style="font-size:0.8rem;color:var(--text-secondary);">$3-5 USD/conductor/mes</p>
                  </div>
                  <div>
                    <div style="font-size:0.65rem;color:var(--text-muted);margin-bottom:0.15rem;">Delivery</div>
                    <p style="font-size:0.8rem;color:var(--text-secondary);">$2-4 USD/conductor/mes</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="pitch-item">
              <h3 style="color:var(--safe);">🚀 Impacto</h3>
              <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.6rem;margin-top:0.75rem;">
                <div class="glass-card-sm" style="text-align:center;padding:0.85rem;">
                  <div style="font-size:1.5rem;font-weight:800;background:var(--gradient-safe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">-73%</div>
                  <div style="font-size:0.65rem;color:var(--text-muted);">Menos accidentes</div>
                </div>
                <div class="glass-card-sm" style="text-align:center;padding:0.85rem;">
                  <div style="font-size:1.5rem;font-weight:800;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">-35%</div>
                  <div style="font-size:0.65rem;color:var(--text-muted);">Costo siniestros</div>
                </div>
                <div class="glass-card-sm" style="text-align:center;padding:0.85rem;">
                  <div style="font-size:1.5rem;font-weight:800;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">+90%</div>
                  <div style="font-size:0.65rem;color:var(--text-muted);">Precisión scoring</div>
                </div>
                <div class="glass-card-sm" style="text-align:center;padding:0.85rem;">
                  <div style="font-size:1.5rem;font-weight:800;background:var(--gradient-safe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">15K+</div>
                  <div style="font-size:0.65rem;color:var(--text-muted);">Vidas protegidas</div>
                </div>
              </div>
            </div>

            <div class="pitch-item">
              <h3 style="color:var(--accent-light);">🏁 ¿Por qué ahora?</h3>
              <p>
                Colombia es el <strong>2do país con más motos en LATAM</strong>. 
                InsurTech crece 25% anual. Los sensores de smartphone permiten análisis 
                en tiempo real. La IA generativa habilita alertas contextuales.
              </p>
            </div>
          </div>

          <div style="text-align:center;margin-top:2rem;padding-bottom:2rem;display:flex;gap:0.75rem;justify-content:center;flex-wrap:wrap;">
            <button class="btn btn-primary btn-lg" data-nav="simulator">
              <i data-lucide="play" style="width:18px;height:18px;"></i>
              Probar Demo
            </button>
            <button class="btn btn-secondary btn-lg" data-nav="dashboard">
              <i data-lucide="bar-chart-3" style="width:18px;height:18px;"></i>
              Ver Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}


// =========================================
// WINDOW RESIZE HANDLER
// =========================================
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (state.map) state.map.invalidateSize();
  }, 200);
});


// =========================================
// INITIALIZE APP
// =========================================
document.addEventListener('DOMContentLoaded', () => {
  // Preload voices for Web Speech API
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  render();
});


// =========================================
// EXPOSE GLOBAL FUNCTIONS
// =========================================
window.startSimulation = startSimulation;
window.stopSimulation = stopSimulation;
window.triggerAccident = triggerAccident;
window.cancelAccident = cancelAccident;
window.sendEmergency = sendEmergency;
window.closeAccident = closeAccident;
window.toggleVoice = toggleVoice;
window.navigate = navigate;
window.toggleMobileMenu = toggleMobileMenu;
