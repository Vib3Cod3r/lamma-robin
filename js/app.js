/**
 * Weather App - Initialization and refresh logic
 */

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const THEME_STORAGE_KEY = 'hk-weather-theme';

function getPreferredTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    if (theme === 'light') {
      btn.textContent = '🌙 Dark';
      btn.setAttribute('aria-label', 'Switch to dark theme');
    } else {
      btn.textContent = '☀️ Light';
      btn.setAttribute('aria-label', 'Switch to light theme');
    }
  }
}

function initTheme() {
  applyTheme(getPreferredTheme());
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'light' ? 'dark' : 'light');
    });
  }
}

// Apply theme before first paint to avoid flash
initTheme();

async function loadWeather() {
  const header = document.querySelector('.header');
  const main = document.querySelector('.widgets');

  try {
    header?.classList.add('loading');
    const data = await fetchAllWeatherData();
    updateWidgets(data);
    header?.classList.remove('loading');
  } catch (err) {
    console.error('Failed to load weather:', err);
    document.getElementById('weatherOverview').textContent = 'Failed to load data. Retrying...';
    document.getElementById('lastUpdated').textContent = `Error: ${err.message}`;
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
  loadWeather();
  setInterval(loadWeather, REFRESH_INTERVAL_MS);
  setInterval(updateFerryCountdown, 1000);

  if (typeof setOnAISPositionsUpdate === 'function') {
    setOnAISPositionsUpdate(refreshFerryAIS);
  }
  setInterval(refreshFerryAIS, AIS_REFRESH_MS);
});
