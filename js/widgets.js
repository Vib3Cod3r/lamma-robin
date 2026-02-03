/**
 * Populate weather widgets from API data
 */
/* exported updateFerryAISOnly, invalidateFerryAISMapSize, updateWidgets */

let radarMapInstance = null;
let radarOverlayLayer = null;
let ferryAisMapInstance = null;
let ferryAisMarkersLayer = null;
let ferryAisPiersLayer = null;

/** Build popup HTML for a ferry (name, speed, course, last update). */
function ferryAisPopupHtml(v) {
  const name = (v.name || v.mmsi).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const sog = v.sog != null && !isNaN(v.sog) ? `${Number(v.sog).toFixed(1)} kn` : '--';
  const cog = v.cog != null && !isNaN(v.cog) ? `${Math.round(v.cog)}°` : '--';
  const timeStr = v.time ? new Date(v.time).toLocaleString(typeof getLocale === 'function' ? getLocale() : 'en') : '--';
  const speedLabel = typeof t === 'function' ? t('speed') : 'Speed';
  const courseLabel = typeof t === 'function' ? t('course') : 'Course';
  const updatedLabel = typeof t === 'function' ? t('ferry.popupUpdated') : 'Updated';
  return `<div class="ferry-ais-popup"><strong>${name}</strong><br>${speedLabel}: ${sog} · ${courseLabel}: ${cog}<br>${updatedLabel}: ${timeStr}</div>`;
}

/** List label: "Sea Supreme (docked)" or "Sea Supreme (8 kn)". */
function ferryAisListLabel(v) {
  const name = v.name || v.mmsi;
  if (v.sog != null && !isNaN(v.sog) && v.sog < 0.5) return `${name} (${typeof t === 'function' ? t('docked') : 'docked'})`;
  if (v.sog != null && !isNaN(v.sog)) return `${name} (${Number(v.sog).toFixed(1)} kn)`;
  return name;
}

/**
 * HKO weather icon code to emoji mapping
 * @see https://www.hko.gov.hk/textonly/v2/explain/wxicon_e.htm
 */
const ICON_TO_EMOJI = {
  50: '☀️',  // Sunny
  51: '⛅',   // Sunny Periods
  52: '🌤️',  // Sunny Intervals
  53: '🌦️',  // Sunny Periods with A Few Showers
  54: '🌧️',  // Sunny Intervals with Showers
  60: '☁️',   // Cloudy
  61: '🌥️',  // Overcast
  62: '🌧️',  // Light Rain
  63: '🌧️',  // Rain
  64: '🌧️',  // Heavy Rain
  65: '⛈️',   // Thunderstorms
  70: '🌙',   // Fine (night)
  71: '🌙',
  72: '🌙',
  73: '🌙',
  74: '🌙',
  75: '🌙',
  76: '☁️',   // Mainly Cloudy (night)
  77: '🌙',   // Mainly Fine (night)
  80: '💨',   // Windy
  81: '🏜️',   // Dry
  82: '💧',   // Humid
  83: '🌫️',   // Fog
  84: '🌫️',   // Mist
  85: '🌫️',   // Haze
  90: '🔥',   // Hot
  91: '🌡️',   // Warm
  92: '🧊',   // Cool
  93: '❄️',   // Cold
};

function getWeatherEmoji(iconCode) {
  if (iconCode == null) return '🌡️';
  return ICON_TO_EMOJI[iconCode] ?? '🌤️';
}

/**
 * Approximate dew point from temperature (°C) and relative humidity (%)
 */
function calculateDewPoint(tempC, humidity) {
  if (tempC == null || humidity == null) return null;
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * tempC) / (b + tempC)) + Math.log(humidity / 100);
  return Math.round((b * alpha) / (a - alpha));
}

/**
 * Approximate "feels like" from temp and humidity (simplified heat index / humidex)
 */
function calculateFeelsLike(tempC, humidity) {
  if (tempC == null) return tempC;
  if (humidity == null) return tempC;
  if (tempC < 27) return tempC; // Below 27°C, feels like ≈ actual
  const heatIndex = tempC + 0.5555 * (6.11 * Math.exp(5417.7530 * (1 / 273.16 - 1 / (tempC + 273.15))) * humidity / 100 - 10);
  return Math.round(heatIndex);
}

/**
 * Get temperature from HKO (Hong Kong Observatory station preferred)
 */
function getHKOTemperature(rhrread) {
  if (!rhrread?.temperature?.data) return null;
  const hko = rhrread.temperature.data.find(t => t.place === 'Hong Kong Observatory');
  return hko ? hko.value : rhrread.temperature.data[0]?.value;
}

/**
 * Get humidity from HKO
 */
function getHKOHumidity(rhrread) {
  if (!rhrread?.humidity?.data) return null;
  const hko = rhrread.humidity.data.find(h => h.place === 'Hong Kong Observatory');
  return hko ? hko.value : rhrread.humidity.data[0]?.value;
}

/**
 * Parse SRS (sunrise/sunset) response - returns { sunrise, sunset }
 * HKO returns fields: ["YYYY-MM-DD","RISE","TRAN.","SET"]
 */
function parseSunriseSunset(srs) {
  if (!srs?.data?.length || !srs?.fields?.length) return { sunrise: null, sunset: null };
  const row = srs.data[0];
  if (!Array.isArray(row)) return { sunrise: null, sunset: null };

  const fields = srs.fields;
  const riseIdx = fields.findIndex(f => f && (f === 'RISE' || f.toLowerCase().includes('rise')));
  const setIdx = fields.findIndex(f => f && (f === 'SET' || f.toLowerCase().includes('set')));

  return {
    sunrise: riseIdx >= 0 ? row[riseIdx] : null,
    sunset: setIdx >= 0 ? row[setIdx] : null
  };
}

/**
 * Parse HKO time string ("0645" or "06:45") to Date on the given day
 */
function timeStringToDate(timeStr, refDate) {
  if (!timeStr || !refDate) return null;
  const s = String(timeStr).trim().replace(':', '');
  const match = s.match(/^(\d{2})(\d{2})$/);
  if (!match) return null;
  const d = new Date(refDate);
  d.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
  return d;
}

/** Sun status and position: { status, emoji, progress } for sky strip (0 = sunrise, 1 = sunset) */
function getSunStatus(sunriseStr, sunsetStr) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sunrise = timeStringToDate(sunriseStr, today);
  const sunset = timeStringToDate(sunsetStr, today);

  const fallback = { status: 'day', emoji: '☀️', progress: 0.5 };
  if (!sunrise || !sunset) return fallback;

  const sunriseMs = sunrise.getTime();
  const sunsetMs = sunset.getTime();
  const nowMs = now.getTime();
  const dayLength = sunsetMs - sunriseMs;
  const TWILIGHT_MINS = 25;

  if (nowMs < sunriseMs) {
    const minsToRise = (sunriseMs - nowMs) / 60000;
    if (minsToRise <= TWILIGHT_MINS) return { status: 'sunrise', emoji: '🌅', progress: 0 };
    return { status: 'night', emoji: '🌙', progress: 0 };
  }
  if (nowMs > sunsetMs) {
    const minsSinceSet = (nowMs - sunsetMs) / 60000;
    if (minsSinceSet <= TWILIGHT_MINS) return { status: 'sunset', emoji: '🌇', progress: 1 };
    return { status: 'night', emoji: '🌙', progress: 1 };
  }
  const progress = dayLength > 0 ? (nowMs - sunriseMs) / dayLength : 0.5;
  return { status: 'day', emoji: '☀️', progress };
}

/**
 * Parse MRS (moon rise/set) response
 * HKO returns fields: ["YYYY-MM-DD","RISE","TRAN.","SET"]
 */
function parseMoonRiseSet(mrs) {
  if (!mrs?.data?.length || !mrs?.fields?.length) return { moonrise: null, moonset: null };
  const row = mrs.data[0];
  if (!Array.isArray(row)) return { moonrise: null, moonset: null };

  const fields = mrs.fields;
  const riseIdx = fields.findIndex(f => f && (f === 'RISE' || f.toLowerCase().includes('rise')));
  const setIdx = fields.findIndex(f => f && (f === 'SET' || f.toLowerCase().includes('set')));

  return {
    moonrise: riseIdx >= 0 ? row[riseIdx] : null,
    moonset: setIdx >= 0 ? row[setIdx] : null
  };
}

/** Synodic month in days (new moon to new moon). */
const SYNODIC_MONTH_DAYS = 29.530588;

/** Reference new moon (UTC): 2000-01-06 18:14 */
const NEW_MOON_REF_UTC = new Date(Date.UTC(2000, 0, 6, 18, 14, 0, 0));

/**
 * Moon phase from date: returns { phase, emoji }.
 * Phase keys: new, waxing_crescent, first_quarter, waxing_gibbous, full, waning_gibbous, last_quarter, waning_crescent
 */
function getMoonPhase(date) {
  const d = date ? new Date(date) : new Date();
  const daysSince = (d.getTime() - NEW_MOON_REF_UTC.getTime()) / (24 * 60 * 60 * 1000);
  const cycle = ((daysSince % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const t = cycle / SYNODIC_MONTH_DAYS; // 0 = new, 0.5 = full

  const phases = [
    { max: 0.03, phase: 'new', emoji: '🌑' },
    { max: 0.22, phase: 'waxing_crescent', emoji: '🌒' },
    { max: 0.28, phase: 'first_quarter', emoji: '🌓' },
    { max: 0.47, phase: 'waxing_gibbous', emoji: '🌔' },
    { max: 0.53, phase: 'full', emoji: '🌕' },
    { max: 0.72, phase: 'waning_gibbous', emoji: '🌖' },
    { max: 0.78, phase: 'last_quarter', emoji: '🌗' },
    { max: 0.97, phase: 'waning_crescent', emoji: '🌘' },
    { max: 1, phase: 'new', emoji: '🌑' }
  ];
  for (const p of phases) {
    if (t <= p.max) return { phase: p.phase, emoji: p.emoji };
  }
  return { phase: 'new', emoji: '🌑' };
}

/**
 * Moon position status and progress for sky strip (0 = moonrise, 1 = moonset).
 * Handles moonset next day (when moonset time is earlier than moonrise).
 */
function getMoonStatus(moonriseStr, moonsetStr) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const moonrise = timeStringToDate(moonriseStr, today);
  let moonset = timeStringToDate(moonsetStr, today);
  if (!moonrise || !moonset) return { status: 'unknown', emoji: '🌙', progress: 0.5 };

  if (moonset.getTime() <= moonrise.getTime()) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    moonset = timeStringToDate(moonsetStr, tomorrow);
  }
  const riseMs = moonrise.getTime();
  const setMs = moonset.getTime();
  const nowMs = now.getTime();
  const upLength = setMs - riseMs;
  const TWILIGHT_MINS = 20;

  if (nowMs < riseMs) {
    const minsToRise = (riseMs - nowMs) / 60000;
    if (minsToRise <= TWILIGHT_MINS) return { status: 'rising', emoji: '🌙', progress: 0 };
    return { status: 'below', emoji: '🌙', progress: 0 };
  }
  if (nowMs > setMs) {
    const minsSinceSet = (nowMs - setMs) / 60000;
    if (minsSinceSet <= TWILIGHT_MINS) return { status: 'setting', emoji: '🌙', progress: 1 };
    return { status: 'below', emoji: '🌙', progress: 1 };
  }
  const progress = upLength > 0 ? (nowMs - riseMs) / upLength : 0.5;
  return { status: 'up', emoji: '🌙', progress };
}

/**
 * Parse HKO HLT (High and Low Tides) response for one day
 * @param {object} hlt - { fields: string[], data: string[][] }
 * @returns {Array<{ timeStr: string, height: string, type: string }>}
 */
function parseTides(hlt) {
  if (!hlt?.fields?.length || !Array.isArray(hlt.data)) return [];
  const fields = hlt.fields;
  const timeIdx = fields.findIndex(f => f && (f === 'Time' || f.toLowerCase() === 'time'));
  const heightIdx = fields.findIndex(f => f && (f === 'Height(m)' || (f.toLowerCase && f.toLowerCase().includes('height'))));
  if (timeIdx < 0 || heightIdx < 0) return [];

  const rows = hlt.data.slice(0, 12);
  const result = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row) || row.length <= Math.max(timeIdx, heightIdx)) continue;
    const timeRaw = row[timeIdx];
    const height = row[heightIdx];
    if (timeRaw == null || height == null) continue;
    const timeStr = String(timeRaw).length === 4
      ? `${String(timeRaw).slice(0, 2)}:${String(timeRaw).slice(2)}`
      : String(timeRaw);
    const type = (i % 2 === 0) ? 'Low' : 'High';
    result.push({ timeStr, height: String(height), type });
  }
  return result;
}

/**
 * Extract pressure from RYES (Weather and Radiation Report)
 */
function getPressureFromRYES(ryes) {
  if (!ryes || typeof ryes !== 'object') return null;
  for (const key of Object.keys(ryes)) {
    if (key.toLowerCase().includes('pressure')) return ryes[key];
  }
  return null;
}

/**
 * Tell Leaflet to recalculate the ferry AIS map size. Call when the ferry section becomes
 * visible (e.g. after being hidden) so the map tiles render correctly.
 */
function invalidateFerryAISMapSize() {
  if (ferryAisMapInstance) ferryAisMapInstance.invalidateSize();
}

/**
 * Update only the ferry AIS section (caption, list, map markers).
 * Call this when AIS data arrives (WebSocket) or on a timer so boats appear without full reload.
 * @param {Array<{ mmsi, name, lat, lon, cog?, time? }>|null} ferryList - null = unavailable, [] = none in area
 */
function updateFerryAISOnly(ferryList) {
  const ferryAisCaptionEl = document.getElementById('ferryAisCaption');
  const ferryAisListEl = document.getElementById('ferryAisList');
  const ferryAisMapEl = document.getElementById('ferryAisMap');
  const hasKey = typeof LAMMA_FERRY_AIS !== 'undefined' && (LAMMA_FERRY_AIS.AISSTREAM_API_KEY || '').trim().length > 0;

  if (ferryAisCaptionEl) {
    if (!hasKey) {
      ferryAisCaptionEl.textContent = typeof t === 'function' ? t('ferry.positionsConfig') : 'Set LAMMA_FERRY_AIS.AISSTREAM_API_KEY in api.js (API key from https://aisstream.io/apikeys) to show ferry positions.';
      if (ferryAisListEl) ferryAisListEl.innerHTML = '';
    } else if (ferryList === null) {
      ferryAisCaptionEl.textContent = typeof t === 'function' ? t('ferry.positionsUnavailable') : 'Ferry positions unavailable (check AIS API).';
      if (ferryAisListEl) ferryAisListEl.innerHTML = '';
    } else {
      const list = Array.isArray(ferryList) ? ferryList : [];
      ferryAisCaptionEl.textContent = list.length
        ? (typeof t === 'function' ? t('ferry.countInArea', { n: list.length }) : `${list.length} ferry(s) in area (last 30 min)`)
        : (typeof t === 'function' ? t('ferry.noneInArea') : 'No ferries in area (last 30 min)');
      if (ferryAisListEl) {
        ferryAisListEl.innerHTML = list.length
          ? list.map(v => `<li>${ferryAisListLabel(v)}</li>`).join('')
          : '<li>' + (typeof t === 'function' ? t('ferry.none') : 'None') + '</li>';
      }
    }
  }

  if (ferryAisMapEl && typeof L !== 'undefined' && typeof LAMMA_FERRY_AIS !== 'undefined') {
    if (!hasKey) {
      ferryAisMapEl.style.display = 'none';
    } else {
      ferryAisMapEl.style.display = '';
      if (ferryAisMapInstance) {
        if (ferryAisMarkersLayer) {
          ferryAisMapInstance.removeLayer(ferryAisMarkersLayer);
          ferryAisMarkersLayer = null;
        }
        const list = Array.isArray(ferryList) ? ferryList : [];
        if (list.length > 0) {
          ferryAisMarkersLayer = L.layerGroup();
          list.forEach(v => {
            const cog = v.cog != null && !isNaN(v.cog) ? v.cog : 0;
            const icon = L.divIcon({
              className: 'ferry-ais-arrow',
              html: `<span style="display:inline-block;transform:rotate(${cog}deg);font-size:22px;line-height:1;color:#1d9bf0;text-shadow:0 0 2px #fff, 0 1px 3px rgba(0,0,0,0.5);" title="${(v.name || v.mmsi).replace(/"/g, '&quot;')}">▲</span>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            });
            const m = L.marker([v.lat, v.lon], { icon })
              .bindTooltip(v.name || String(v.mmsi), { permanent: false, direction: 'top' })
              .bindPopup(ferryAisPopupHtml(v), { maxWidth: 280 });
            ferryAisMarkersLayer.addLayer(m);
            if (v.trail && v.trail.length >= 2) {
              const line = L.polyline(v.trail, { color: '#1d9bf0', weight: 2, opacity: 0.7, dashArray: '4,4' });
              ferryAisMarkersLayer.addLayer(line);
            }
          });
          ferryAisMarkersLayer.addTo(ferryAisMapInstance);
        }
      }
    }
  }
}

/**
 * Update all widgets with API data
 */
function updateWidgets(data) {
  const temp = getHKOTemperature(data.rhrread);
  const humidity = getHKOHumidity(data.rhrread);
  const dewPoint = temp != null && humidity != null ? calculateDewPoint(temp, humidity) : null;
  const feelsLike = temp != null && humidity != null ? calculateFeelsLike(temp, humidity) : temp;

  // Current weather icon (from rhrread or today's forecast)
  const currentIcon = data.rhrread?.icon?.[0] ?? data.fnd?.weatherForecast?.[0]?.ForecastIcon;
  const currentEmoji = getWeatherEmoji(currentIcon);

  // Current temp & overview
  document.getElementById('currentEmoji').textContent = currentEmoji;
  document.getElementById('locationEmoji').textContent = currentEmoji;
  document.getElementById('currentTemp').textContent = temp ?? '--';
  const feelsLikeStr = typeof t === 'function' ? t('feelsLike') : 'Feels like';
  document.getElementById('feelsLike').textContent = feelsLike != null ? `${feelsLikeStr} ${feelsLike}°C` : `${feelsLikeStr} --°C`;
  document.getElementById('weatherOverview').textContent =
    data.flw?.forecastDesc || data.flw?.generalSituation || (typeof t === 'function' ? t('loading') : 'Loading...');

  // Today's highs & lows (from fnd first day)
  const todayForecast = data.fnd?.weatherForecast?.[0];
  if (todayForecast) {
    document.getElementById('tempHigh').textContent = todayForecast.forecastMaxtemp?.value ?? '--';
    document.getElementById('tempLow').textContent = todayForecast.forecastMintemp?.value ?? '--';
    document.getElementById('todayForecast').textContent = todayForecast.forecastWeather || '';
  } else {
    document.getElementById('todayForecast').textContent = '';
  }

  // 9-day forecast (day names, forecastWeather, forecastWind come from HKO API in selected language)
  const grid = document.getElementById('forecastGrid');
  grid.innerHTML = '';
  if (data.fnd?.weatherForecast) {
    data.fnd.weatherForecast.forEach((day, i) => {
      const emoji = getWeatherEmoji(day.ForecastIcon);
      const card = document.createElement('div');
      card.className = 'forecast-card';
      card.innerHTML = `
        <div class="forecast-card__emoji">${emoji}</div>
        <div class="forecast-card__day">${day.week || (typeof t === 'function' ? t('dayNum', { n: i + 1 }) : `Day ${i + 1}`)}</div>
        <div class="forecast-card__temps">${day.forecastMaxtemp?.value ?? '--'}° / ${day.forecastMintemp?.value ?? '--'}°</div>
        <div class="forecast-card__weather">${day.forecastWeather || ''}</div>
        <div class="forecast-card__wind">${day.forecastWind || ''}</div>
      `;
      grid.appendChild(card);
    });
  }

  // Warnings
  const warningsEl = document.getElementById('warningsContent');
  const warnItems = [];
  if (data.warnsum && typeof data.warnsum === 'object') {
    Object.values(data.warnsum).forEach(w => {
      if (w?.name && w?.actionCode !== 'CANCEL') warnItems.push(w.name);
    });
  }
  if (data.swt?.swt?.length) {
    data.swt.swt.forEach(w => warnItems.push(w.desc || w));
  }
  warningsEl.textContent = warnItems.length ? warnItems.join(' • ') : (typeof t === 'function' ? t('noWarnings') : 'No active warnings');

  // UV
  const uv = data.rhrread?.uvindex?.data?.[0];
  document.getElementById('uvValue').textContent = uv?.value ?? '--';
  document.getElementById('uvDesc').textContent = uv?.desc ?? '';

  // Humidity
  document.getElementById('humidityValue').textContent = humidity ?? '--';

  // Wind (from today's forecast)
  const windText = todayForecast?.forecastWind || data.flw?.forecastDesc?.match(/wind[s]?[^.]*/i)?.[0] || '--';
  document.getElementById('windValue').textContent = windText;

  // Air Quality
  if (data.airQuality) {
    document.getElementById('airValue').textContent = data.airQuality.aqi;
    document.getElementById('airCategory').textContent = data.airQuality.category;
  } else {
    document.getElementById('airValue').textContent = 'N/A';
    document.getElementById('airCategory').textContent = 'Data unavailable';
  }

  // Dew point
  document.getElementById('dewpointValue').textContent = dewPoint ?? '--';

  // Visibility
  let visibility = null;
  if (data.ltmv?.data?.length && data.ltmv?.fields?.length) {
    const visIdx = data.ltmv.fields.findIndex(f => /visibility/i.test(f));
    if (visIdx >= 0 && data.ltmv.data[0]) {
      visibility = data.ltmv.data[0][visIdx];
    }
  }
  document.getElementById('visibilityValue').textContent = visibility ?? (typeof t === 'function' ? t('loading') : 'Loading...');

  // Pressure (from HKO CSV or fallback to RYES)
  const pressure = data.pressure || getPressureFromRYES(data.ryes);
  document.getElementById('pressureValue').textContent = pressure ?? '-- hPa';

  // Sea temperature (from HKO 9-day forecast)
  const seaTemp = data.fnd?.seaTemp?.value ?? data.fnd?.seaTemp;
  const seaTempEl = document.getElementById('seaTempValue');
  if (seaTempEl) seaTempEl.textContent = seaTemp != null ? seaTemp : '--';

  // Tides (HKO HLT – Quarry Bay)
  const tideListEl = document.getElementById('tideList');
  if (tideListEl) {
    const items = parseTides(data.tides);
    if (items.length) {
      tideListEl.innerHTML = items.map(t => `<li><span class="tide-time">${t.timeStr} ${t.type}</span><span class="tide-height">${t.height} m</span></li>`).join('');
    } else {
      tideListEl.innerHTML = '<li>Tide data unavailable</li>';
    }
  }

  // Sun (times + status + sky strip)
  const sun = parseSunriseSunset(data.srs);
  document.getElementById('sunriseValue').textContent = sun.sunrise ?? '--';
  document.getElementById('sunsetValue').textContent = sun.sunset ?? '--';
  const sunStatus = getSunStatus(sun.sunrise, sun.sunset);
  const sunStatusEmojiEl = document.getElementById('sunStatusEmoji');
  const sunStatusTextEl = document.getElementById('sunStatusText');
  const sunPositionIconEl = document.getElementById('sunPositionIcon');
  if (sunStatusEmojiEl) sunStatusEmojiEl.textContent = sunStatus.emoji;
  if (sunStatusTextEl) {
    const key = 'sun.status.' + sunStatus.status;
    sunStatusTextEl.textContent = typeof t === 'function' ? t(key) : sunStatus.status;
    sunStatusTextEl.setAttribute('data-i18n', key);
  }
  if (sunPositionIconEl) {
    sunPositionIconEl.textContent = sunStatus.emoji;
    sunPositionIconEl.style.left = (sunStatus.progress * 100) + '%';
  }

  // Moon (phase + position + sky strip)
  const moon = parseMoonRiseSet(data.mrs);
  document.getElementById('moonriseValue').textContent = moon.moonrise ?? '--';
  document.getElementById('moonsetValue').textContent = moon.moonset ?? '--';
  const moonPhase = getMoonPhase();
  const moonPhaseEmojiEl = document.getElementById('moonPhaseEmoji');
  const moonPhaseTextEl = document.getElementById('moonPhaseText');
  if (moonPhaseEmojiEl) moonPhaseEmojiEl.textContent = moonPhase.emoji;
  if (moonPhaseTextEl) {
    const phaseKey = 'moon.phase.' + moonPhase.phase;
    moonPhaseTextEl.textContent = typeof t === 'function' ? t(phaseKey) : moonPhase.phase;
    moonPhaseTextEl.setAttribute('data-i18n', phaseKey);
  }
  const moonStatus = getMoonStatus(moon.moonrise, moon.moonset);
  const moonStatusEmojiEl = document.getElementById('moonStatusEmoji');
  const moonStatusTextEl = document.getElementById('moonStatusText');
  const moonPositionIconEl = document.getElementById('moonPositionIcon');
  if (moonStatusEmojiEl) moonStatusEmojiEl.textContent = moonStatus.emoji;
  if (moonStatusTextEl) {
    const statusKey = 'moon.status.' + moonStatus.status;
    moonStatusTextEl.textContent = typeof t === 'function' ? t(statusKey) : moonStatus.status;
    moonStatusTextEl.setAttribute('data-i18n', statusKey);
  }
  if (moonPositionIconEl) {
    const isBelow = moonStatus.status === 'below';
    moonPositionIconEl.style.visibility = isBelow ? 'hidden' : '';
    moonPositionIconEl.textContent = moonStatus.emoji;
    moonPositionIconEl.style.left = (moonStatus.progress * 100) + '%';
  }

  // Ferry (Lamma: both directions)
  const ferryToYSW = data.ferry?.toYungShueWan;
  const ferryToCentral = data.ferry?.toCentral;

  const setFerryDirection = (listId, countdownId, nextTimeId, dir) => {
    const listEl = document.getElementById(listId);
    const countdownEl = document.getElementById(countdownId);
    const nextTimeEl = document.getElementById(nextTimeId);
    if (!listEl) return;
    if (dir?.nextSailings?.length) {
      listEl.innerHTML = dir.nextSailings.map(s => `<li>${s.timeStr}</li>`).join('');
      const first = dir.nextSailings[0];
      const departsStr = typeof t === 'function' ? t('departs') : 'Departs';
      if (nextTimeEl) nextTimeEl.textContent = first ? `${departsStr} ${first.timeStr}` : '';
      if (countdownEl) {
        if (dir.nextDepartureIso) {
          countdownEl.setAttribute('data-next-departure', dir.nextDepartureIso);
        } else {
          countdownEl.textContent = '--';
          countdownEl.removeAttribute('data-next-departure');
        }
      }
    } else {
      listEl.innerHTML = '<li>' + (typeof t === 'function' ? t('timetableUnavailable') : 'Timetable unavailable') + '</li>';
      if (nextTimeEl) nextTimeEl.textContent = '';
      if (countdownEl) {
        countdownEl.textContent = '--';
        countdownEl.removeAttribute('data-next-departure');
      }
    }
  };

  setFerryDirection('ferryList', 'ferryCountdown', 'ferryNextTime', ferryToYSW);
  setFerryDirection('ferryListToCentral', 'ferryCountdownToCentral', 'ferryNextTimeToCentral', ferryToCentral);
  setFerryDirection('ferryListToSKW', 'ferryCountdownToSKW', 'ferryNextTimeToSKW', data.ferry?.toSokKwuWan);
  setFerryDirection('ferryListSKWToCentral', 'ferryCountdownSKWToCentral', 'ferryNextTimeSKWToCentral', data.ferry?.sokKwuWanToCentral);
  setFerryDirection('ferryListYSWToAberdeen', 'ferryCountdownYSWToAberdeen', 'ferryNextTimeYSWToAberdeen', data.ferry?.yswToAberdeen);
  setFerryDirection('ferryListPakKokToAberdeen', 'ferryCountdownPakKokToAberdeen', 'ferryNextTimePakKokToAberdeen', data.ferry?.pakKokToAberdeen);
  setFerryDirection('ferryListAberdeenToYSW', 'ferryCountdownAberdeenToYSW', 'ferryNextTimeAberdeenToYSW', data.ferry?.aberdeenToYSW);
  setFerryDirection('ferryListPakKokToYSW', 'ferryCountdownPakKokToYSW', 'ferryNextTimePakKokToYSW', data.ferry?.pakKokToYSW);
  updateFerryCountdown();

  // Ferry AIS positions (last 30 min) - Doesnt work yet
  const ferryAisMapEl = document.getElementById('ferryAisMap');
  const ferryAisCaptionEl = document.getElementById('ferryAisCaption');
  const ferryAisListEl = document.getElementById('ferryAisList');
  if (ferryAisCaptionEl) {
    const hasKey = typeof LAMMA_FERRY_AIS !== 'undefined' && (LAMMA_FERRY_AIS.AISSTREAM_API_KEY || '').trim().length > 0;
    if (!hasKey) {
      ferryAisCaptionEl.textContent = typeof t === 'function' ? t('ferry.positionsConfig') : 'Set LAMMA_FERRY_AIS.AISSTREAM_API_KEY in api.js (API key from https://aisstream.io/apikeys) to show ferry positions.';
      if (ferryAisListEl) ferryAisListEl.innerHTML = '';
    } else if (data.aisFerries === null) {
      ferryAisCaptionEl.textContent = typeof t === 'function' ? t('ferry.positionsUnavailable') : 'Ferry positions unavailable (check AIS API).';
      if (ferryAisListEl) ferryAisListEl.innerHTML = '';
    } else {
      const list = Array.isArray(data.aisFerries) ? data.aisFerries : [];
      ferryAisCaptionEl.textContent = list.length
        ? (typeof t === 'function' ? t('ferry.countInArea', { n: list.length }) : `${list.length} ferry(s) in area (last 30 min)`)
        : (typeof t === 'function' ? t('ferry.noneInArea') : 'No ferries in area (last 30 min)');
      if (ferryAisListEl) {
        ferryAisListEl.innerHTML = list.length
          ? list.map(v => `<li>${ferryAisListLabel(v)}</li>`).join('')
          : '<li>' + (typeof t === 'function' ? t('ferry.none') : 'None') + '</li>';
      }
    }
  }
  if (ferryAisMapEl && typeof L !== 'undefined' && typeof LAMMA_FERRY_AIS !== 'undefined') {
    const hasKey = (LAMMA_FERRY_AIS.AISSTREAM_API_KEY || '').trim().length > 0;
    if (!hasKey) {
      ferryAisMapEl.style.display = 'none';
    } else {
      ferryAisMapEl.style.display = '';
      if (!ferryAisMapInstance) {
        const centerLat = (LAMMA_FERRY_AIS.ZONES.CENTRAL.lat + LAMMA_FERRY_AIS.ZONES.LAMMA.lat) / 2;
        const centerLon = (LAMMA_FERRY_AIS.ZONES.CENTRAL.lon + LAMMA_FERRY_AIS.ZONES.LAMMA.lon) / 2;
        ferryAisMapInstance = L.map('ferryAisMap', { center: [centerLat, centerLon], zoom: 12, zoomControl: true });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19
        }).addTo(ferryAisMapInstance);
        ferryAisPiersLayer = L.layerGroup();
        const central = LAMMA_FERRY_AIS.ZONES.CENTRAL;
        const lamma = LAMMA_FERRY_AIS.ZONES.LAMMA;
        L.circleMarker([central.lat, central.lon], { radius: 8, fillColor: '#1d9bf0', color: '#fff', weight: 2, fillOpacity: 0.9 })
          .bindPopup('Central Pier 4').addTo(ferryAisPiersLayer);
        L.circleMarker([lamma.lat, lamma.lon], { radius: 8, fillColor: '#1d9bf0', color: '#fff', weight: 2, fillOpacity: 0.9 })
          .bindPopup('Yung Shue Wan').addTo(ferryAisPiersLayer);
        ferryAisPiersLayer.addTo(ferryAisMapInstance);
      }
      if (ferryAisMarkersLayer) {
        ferryAisMapInstance.removeLayer(ferryAisMarkersLayer);
        ferryAisMarkersLayer = null;
      }
      const list = Array.isArray(data.aisFerries) ? data.aisFerries : [];
      if (list.length > 0) {
        ferryAisMarkersLayer = L.layerGroup();
        list.forEach(v => {
          const cog = v.cog != null && !isNaN(v.cog) ? v.cog : 0;
          const icon = L.divIcon({
            className: 'ferry-ais-arrow',
            html: `<span style="display:inline-block;transform:rotate(${cog}deg);font-size:22px;line-height:1;color:#1d9bf0;text-shadow:0 0 2px #fff, 0 1px 3px rgba(0,0,0,0.5);" title="${(v.name || v.mmsi).replace(/"/g, '&quot;')}">▲</span>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          const m = L.marker([v.lat, v.lon], { icon })
            .bindTooltip(v.name || String(v.mmsi), { permanent: false, direction: 'top' })
            .bindPopup(ferryAisPopupHtml(v), { maxWidth: 280 });
          ferryAisMarkersLayer.addLayer(m);
          if (v.trail && v.trail.length >= 2) {
            const line = L.polyline(v.trail, { color: '#1d9bf0', weight: 2, opacity: 0.7, dashArray: '4,4' });
            ferryAisMarkersLayer.addLayer(line);
          }
        });
        ferryAisMarkersLayer.addTo(ferryAisMapInstance);
      }
    }
  }

  // Radar (RainViewer on Leaflet map, Hong Kong)
  const radarMapEl = document.getElementById('radarMap');
  const radarCaptionEl = document.getElementById('radarCaption');
  if (radarMapEl && radarCaptionEl && typeof L !== 'undefined' && RAINVIEWER) {
    if (data.radar?.host && data.radar?.path) {
      const host = data.radar.host.replace(/\/$/, '');
      const path = data.radar.path;
      const tileUrl = `${host}${path}/256/{z}/{x}/{y}/2/1_0.png`;

      if (!radarMapInstance) {
        radarMapInstance = L.map('radarMap', {
          center: [RAINVIEWER.HONG_KONG_LAT, RAINVIEWER.HONG_KONG_LON],
          zoom: 9,
          zoomControl: true
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19
        }).addTo(radarMapInstance);
      }

      if (radarOverlayLayer) {
        radarMapInstance.removeLayer(radarOverlayLayer);
      }
      radarOverlayLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        maxNativeZoom: 7,
        opacity: 0.75
      }).addTo(radarMapInstance);

      const gen = data.radar.generated;
      const locale = typeof getLocale === 'function' ? getLocale() : 'en';
      radarCaptionEl.textContent = gen
        ? (typeof t === 'function' ? t('radar.latestFrameAt', { date: new Date(gen * 1000).toLocaleString(locale) }) : `Latest frame · ${new Date(gen * 1000).toLocaleString()}`)
        : (typeof t === 'function' ? t('radar.latestFrame') : 'Latest radar frame');
    } else {
      radarCaptionEl.textContent = typeof t === 'function' ? t('radar.unavailable') : 'Radar unavailable';
    }
  }

  // Last updated
  const updateTime = data.rhrread?.updateTime || data.flw?.updateTime || data.fnd?.updateTime;
  document.getElementById('lastUpdated').textContent = updateTime
    ? `Updated ${new Date(updateTime).toLocaleString()}`
    : 'Updated --';
}

/**
 * Update one ferry countdown element. Call every second from app.js for both directions.
 */
function updateFerryCountdown() {
  const countdownIds = [
    'ferryCountdown', 'ferryCountdownToCentral', 'ferryCountdownToSKW', 'ferryCountdownSKWToCentral',
    'ferryCountdownYSWToAberdeen', 'ferryCountdownPakKokToAberdeen', 'ferryCountdownAberdeenToYSW', 'ferryCountdownPakKokToYSW'
  ];
  countdownIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const iso = el.getAttribute('data-next-departure');
    if (!iso) return;
    const next = new Date(iso);
    const now = new Date();
    const ms = next - now;
    if (ms <= 0) {
      el.textContent = typeof t === 'function' ? t('departed') : 'Departed';
      return;
    }
    const totalMins = Math.floor(ms / 60000);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours > 0) {
      el.textContent = typeof t === 'function' ? t('countdown.hoursMins', { h: hours, m: mins }) : `${hours}h ${mins}m`;
    } else {
      el.textContent = typeof t === 'function' ? t('countdown.mins', { m: mins }) : `${mins} min`;
    }
  });
}
