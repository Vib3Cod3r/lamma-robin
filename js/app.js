/**
 * Weather App - Initialization and refresh logic
 */
/* exported onLangChange */

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const THEME_STORAGE_KEY = 'hk-weather-theme';
const FERRY_VISIBLE_KEY = 'hk-weather-ferry-visible';

function getPreferredTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

function updateThemeButtonLabels() {
  const btn = document.getElementById('themeToggle');
  if (!btn || typeof t !== 'function') return;
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'light') {
    btn.textContent = t('theme.dark');
    btn.setAttribute('aria-label', t('aria.themeDark'));
  } else {
    btn.textContent = t('theme.light');
    btn.setAttribute('aria-label', t('aria.themeLight'));
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  updateThemeButtonLabels();
}

function initTheme() {
  applyTheme(getPreferredTheme());
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'light' ? 'dark' : 'light');
      closeHeaderMenu();
    });
  }
}

function closeHeaderMenu() {
  const menu = document.getElementById('headerMenu');
  const toggle = document.getElementById('menuToggle');
  if (menu) menu.classList.remove('is-open');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function initMenuToggle() {
  const toggle = document.getElementById('menuToggle');
  const menu = document.getElementById('headerMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen);
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  document.getElementById('langSelect')?.addEventListener('change', closeHeaderMenu);

  document.addEventListener('click', (e) => {
    if (menu.classList.contains('is-open') && !menu.contains(e.target) && !toggle.contains(e.target)) {
      closeHeaderMenu();
    }
  });
}

// Apply theme before first paint to avoid flash
initTheme();

function getFerryVisible() {
  return localStorage.getItem(FERRY_VISIBLE_KEY) !== 'false';
}

function applyFerryVisibility(visible) {
  const tracker = document.getElementById('ferry-ais');
  const bar = document.getElementById('ferryHiddenBar');
  if (tracker) tracker.style.display = visible ? '' : 'none';
  if (bar) bar.hidden = visible;
  if (visible && typeof invalidateFerryAISMapSize === 'function') {
    invalidateFerryAISMapSize();
  }
}

function initFerryToggle() {
  applyFerryVisibility(getFerryVisible());
  const hideBtn = document.getElementById('ferryTrackerHide');
  const showBtn = document.getElementById('ferryWidgetShow');
  if (hideBtn) {
    hideBtn.addEventListener('click', () => {
      applyFerryVisibility(false);
      localStorage.setItem(FERRY_VISIBLE_KEY, 'false');
    });
  }
  if (showBtn) {
    showBtn.addEventListener('click', () => {
      applyFerryVisibility(true);
      localStorage.setItem(FERRY_VISIBLE_KEY, 'true');
    });
  }
}

async function loadWeather() {
  const header = document.querySelector('.header');

  try {
    header?.classList.add('loading');
    const data = await fetchAllWeatherData();
    updateWidgets(data);
    header?.classList.remove('loading');
  } catch (err) {
    console.error('Failed to load weather:', err);
    const overview = document.getElementById('weatherOverview');
    const updated = document.getElementById('lastUpdated');
    if (overview && typeof t === 'function') overview.textContent = t('failedLoad');
    if (updated && typeof t === 'function') updated.textContent = `${t('error')}: ${err.message}`;
    header?.classList.remove('loading');
    setTimeout(loadWeather, 10000);
  }
}

// Ferry AIS: refresh section when WebSocket gets new positions or every 15 s
const AIS_REFRESH_MS = 15 * 1000;

function refreshFerryAIS() {
  if (typeof getAISFerriesInArea !== 'function' || typeof updateFerryAISOnly !== 'function') return;
  const list = getAISFerriesInArea();
  updateFerryAISOnly(list);
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof initLang === 'function') initLang();
  initMenuToggle();
  initFerryToggle();
  loadWeather();
  setInterval(loadWeather, REFRESH_INTERVAL_MS);
  setInterval(updateFerryCountdown, 1000);

  if (typeof setOnAISPositionsUpdate === 'function') {
    setOnAISPositionsUpdate(refreshFerryAIS);
  }
  setInterval(refreshFerryAIS, AIS_REFRESH_MS);
});

function onLangChange() {
  loadWeather();
}
