/**
 * Hong Kong Observatory Open Data API
 * https://www.hko.gov.hk/en/education/weather/data-and-technology/00740-Open-Data-of-Hong-Kong-Observatory.html
 */
/* exported setOnAISPositionsUpdate, fetchAllWeatherData */

const HKO = {
  WEATHER_API: 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php',
  OPENDATA_API: 'https://data.weather.gov.hk/weatherAPI/opendata/opendata.php',
  LANG: 'en'
};

// Open-Meteo: free, no API key, CORS-enabled (for pressure widget)
const OPEN_METEO = {
  API: 'https://api.open-meteo.com/v1/forecast',
  HONG_KONG: { latitude: 22.3193, longitude: 114.1694 }
};

const AQICN = {
  API_BASE: 'https://api.waqi.info/feed',
  // Free demo token - users should get their own from https://aqicn.org/api/
  TOKEN: 'demo'
};

// RainViewer: free radar imagery (personal/educational use, attribution required)
const RAINVIEWER = {
  API: 'https://api.rainviewer.com/public/weather-maps.json',
  HONG_KONG_LAT: 22.3193,
  HONG_KONG_LON: 114.1694
};

// Lamma Island ferry: Central ↔ Yung Shue Wan (embedded timetable; symbols *, #, ^ ignored)
const FERRY_WEEKDAY_CENTRAL_TO_YSW = [
  '02:30', '06:30', '07:00', '07:30', '07:50', '08:10', '08:30', '08:50', '09:10', '09:30', '10:10', '11:00', '12:00', '13:00', '13:45', '14:30', '15:15', '15:50', '16:30', '17:20', '17:40', '18:00', '18:20', '18:40', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:30', '23:30', '00:30'
];
const FERRY_WEEKDAY_YSW_TO_CENTRAL = [
  '05:30', '06:20', '06:40', '07:00', '07:20', '07:40', '08:00', '08:20', '08:40', '09:00', '09:20', '09:40', '10:30', '11:20', '12:00', '13:00', '13:45', '14:30', '15:15', '16:00', '16:30', '17:15', '17:50', '18:10', '18:30', '18:50', '19:20', '20:00', '20:30', '21:30', '22:30', '23:30'
];
const FERRY_SUNDAY_CENTRAL_TO_YSW = [
  '02:30', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:30', '22:30', '23:30', '00:30'
];
const FERRY_SUNDAY_YSW_TO_CENTRAL = [
  '05:30', '06:40', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:30', '22:30', '23:30'
];

// Sok Kwu Wan ferry: Central ↔ Sok Kwu Wan (symbols ^, @ ignored)
const FERRY_WEEKDAY_CENTRAL_TO_SKW = [
  '07:20', '08:35', '10:20', '11:50', '13:50', '15:20', '16:50', '18:45', '20:20', '21:50', '23:30'
];
const FERRY_WEEKDAY_SKW_TO_CENTRAL = [
  '06:40', '08:00', '09:35', '11:05', '12:40', '14:35', '16:05', '17:35', '19:35', '21:05', '22:40'
];
const FERRY_SUNDAY_CENTRAL_TO_SKW = [
  '07:20', '08:35', '10:20', '11:50', '12:50', '13:50', '14:35', '15:20', '16:05', '16:50', '17:35', '18:45', '19:20', '20:20', '21:50', '23:30'
];
const FERRY_SUNDAY_SKW_TO_CENTRAL = [
  '06:40', '08:00', '09:35', '11:05', '12:40', '13:50', '14:35', '15:20', '16:05', '16:50', '17:35', '18:35', '19:35', '20:20', '21:05', '22:40'
];

// Aberdeen / Pak Kok / Yung Shue Wan ferry (weekday + Sunday To YSW; Sunday To Aberdeen uses weekday times)
const FERRY_WEEKDAY_ABERDEEN_TO_YSW = [
  '06:00', '07:20', '08:40', '11:15', '13:45', '15:20', '16:30', '17:50', '19:15', '20:35', '22:00'
];
const FERRY_WEEKDAY_PAKKOK_TO_YSW = [
  '06:25', '07:45', '09:05', '11:40', '14:10', '15:45', '16:55', '18:15', '19:40', '21:00', '22:25'
];
const FERRY_WEEKDAY_YSW_TO_ABERDEEN = [
  '06:40', '08:00', '09:20', '12:00', '14:20', '15:55', '17:05', '18:35', '20:00', '21:10'
];
const FERRY_WEEKDAY_PAKKOK_TO_ABERDEEN = [
  '06:50', '08:10', '09:30', '12:10', '14:30', '16:05', '17:15', '18:50', '20:10', '21:20'
];
const FERRY_SUNDAY_YSW_TO_ABERDEEN = FERRY_WEEKDAY_YSW_TO_ABERDEEN;
const FERRY_SUNDAY_ABERDEEN_TO_YSW = [
  '07:20', '08:50', '10:00', '11:20', '12:40', '15:10', '16:20', '17:50', '19:15', '20:35', '22:00'
];
const FERRY_SUNDAY_PAKKOK_TO_YSW = [
  '07:45', '09:15', '10:25', '11:45', '13:05', '15:35', '16:45', '18:15', '19:40', '21:00', '22:25'
];
const FERRY_SUNDAY_PAKKOK_TO_ABERDEEN = FERRY_WEEKDAY_PAKKOK_TO_ABERDEEN;

// Lamma ferry AIS: AISStream.io WebSocket. Known vessels (name + MMSI). Zones: 1 km radius.
const LAMMA_FERRY_AIS = {
  AISSTREAM_API_KEY: '908f36fb8654bcf88515515d26a91c3e6a5ac6cf', // API key from https://aisstream.io/apikeys
  ZONE_RADIUS_KM: 3,
  POSITION_MAX_AGE_MINUTES: 30,
  FERRIES: [
    { name: 'Sea Supreme', mmsi: 477995074 },
    { name: 'Sea Smart', mmsi: 477995079 },
    { name: 'Sea Success', mmsi: 477995071 },
    { name: 'Sea Superior', mmsi: 477995075 },
    { name: 'Sea Superb', mmsi: 477995176 },
    { name: 'Sea Serene', mmsi: 477995177 },
    { name: 'Sea Speed', mmsi: 477996493 },
    { name: 'Sea Spirit', mmsi: 477995260 },
    { name: 'Sea Summit', mmsi: 477995436 },
    { name: 'Sea Shine', mmsi: 477995440 },
    { name: 'Sea Sparkle', mmsi: 477996333 }
  ],
  ZONES: {
    CENTRAL: { lat: 22.29, lon: 114.16 },
    LAMMA: { lat: 22.21, lon: 114.11 }
  }
};

/**
 * Fetch data from HKO Weather Information API
 * @param {string} dataType - flw | fnd | rhrread | warnsum | warningInfo | swt
 * @returns {Promise<object>}
 */
async function fetchWeather(dataType) {
  const url = new URL(HKO.WEATHER_API);
  url.searchParams.set('dataType', dataType);
  const lang = typeof getHKOLang === 'function' ? getHKOLang() : HKO.LANG;
  url.searchParams.set('lang', lang);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
  return response.json();
}

/**
 * Fetch data from HKO Open Data API (climate, sun, moon, visibility, etc.)
 * @param {string} dataType - SRS | MRS | LTMV | RYES | etc.
 * @param {object} params - Additional params (year, month, day, date, station, rformat)
 * @returns {Promise<object|string>}
 */
async function fetchOpenData(dataType, params = {}) {
  const url = new URL(HKO.OPENDATA_API);
  url.searchParams.set('dataType', dataType);
  const lang = typeof getHKOLang === 'function' ? getHKOLang() : HKO.LANG;
  url.searchParams.set('lang', lang);
  url.searchParams.set('rformat', params.rformat || 'json');

  Object.entries(params).forEach(([key, value]) => {
    if (key !== 'rformat' && value != null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open Data API error: ${response.status}`);
  return response.json();
}

/**
 * Get current date parts for HK timezone
 */
function getHKDate() {
  const now = new Date();
  const hkOffset = 8 * 60; // HK is UTC+8
  const localOffset = now.getTimezoneOffset();
  const hkTime = new Date(now.getTime() + (hkOffset + localOffset) * 60000);
  const y = hkTime.getFullYear();
  const m = hkTime.getMonth() + 1;
  const d = hkTime.getDate();
  const pad = n => String(n).padStart(2, '0');
  const yesterday = new Date(hkTime);
  yesterday.setDate(yesterday.getDate() - 1);
  const yY = yesterday.getFullYear();
  const mM = yesterday.getMonth() + 1;
  const dD = yesterday.getDate();
  const dayOfWeek = hkTime.getDay(); // 0 = Sunday
  const hkMinutes = hkTime.getHours() * 60 + hkTime.getMinutes();

  return {
    year: y,
    month: m,
    day: d,
    date: `${y}${pad(m)}${pad(d)}`,
    dateStr: `${y}-${pad(m)}-${pad(d)}`,
    dateYesterday: `${yY}${pad(mM)}${pad(dD)}`,
    dayOfWeek,
    hkMinutes
  };
}

/**
 * Fetch atmospheric pressure from Open-Meteo (Hong Kong)
 * Free, no API key, CORS-enabled.
 * @returns {Promise<string|null>} Pressure value with unit (e.g., "1013.2 hPa")
 */
async function fetchPressure() {
  try {
    const url = new URL(OPEN_METEO.API);
    url.searchParams.set('latitude', OPEN_METEO.HONG_KONG.latitude);
    url.searchParams.set('longitude', OPEN_METEO.HONG_KONG.longitude);
    url.searchParams.set('current', 'surface_pressure');

    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();

    const hPa = data?.current?.surface_pressure;
    if (hPa != null && typeof hPa === 'number') {
      return `${hPa} hPa`;
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Convert 24h "HH:MM" to "H:MM a.m." / "H:MM p.m." for display and parseFerryTime
 */
function format24hToAmPm(hhmm) {
  const parts = String(hhmm).trim().split(':');
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) || 0;
  if (h === 0) h = 12;
  const hour = h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'a.m.' : 'p.m.';
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Parse ferry timetable string to minutes since midnight (e.g. "7:00 a.m." -> 420)
 */
function parseFerryTime(str) {
  if (!str || typeof str !== 'string') return null;
  const s = str.trim().toLowerCase();
  let hour = 0;
  let minute = 0;
  if (s.includes('noon')) {
    hour = 12;
  } else if (s.includes('midnight') || (s.includes('12:') && s.includes('a.m.'))) {
    const m = s.match(/(\d+):(\d+)/);
    if (m) minute = parseInt(m[2], 10);
    hour = m && parseInt(m[1], 10) === 12 ? 0 : parseInt(m[1], 10);
  } else {
    const m = s.match(/(\d+):(\d+)\s*(a\.m\.|p\.m\.)/);
    if (!m) return null;
    hour = parseInt(m[1], 10);
    minute = parseInt(m[2], 10);
    if (m[3] === 'p.m.' && hour !== 12) hour += 12;
    if (m[3] === 'a.m.' && hour === 12) hour = 0;
  }
  return hour * 60 + minute;
}

/**
 * Build next sailings (next 2 hours) and next departure ISO from a sorted sailings array
 */
function buildNextSailings(sailings, hk) {
  const nowMin = hk.hkMinutes;
  const window = 120;
  const dayMin = 24 * 60;
  const nextSailings = [];
  let nextDepartureAtMinutes = null;

  for (const s of sailings) {
    const inWindow = nowMin + window <= dayMin
      ? (s.atMinutes > nowMin && s.atMinutes <= nowMin + window)
      : (s.atMinutes > nowMin || s.atMinutes <= (nowMin + window) % dayMin);
    if (inWindow) {
      nextSailings.push(s);
      if (nextDepartureAtMinutes == null) nextDepartureAtMinutes = s.atMinutes;
    }
  }
  if (nextSailings.length === 0) {
    for (const s of sailings) {
      if (s.atMinutes > nowMin) {
        nextSailings.push(s);
        if (nextDepartureAtMinutes == null) nextDepartureAtMinutes = s.atMinutes;
        break;
      }
    }
  }
  if (nextSailings.length === 0 && sailings.length > 0) {
    nextDepartureAtMinutes = sailings[0].atMinutes;
    nextSailings.push(sailings[0]);
  }

  let nextDepartureIso = null;
  if (nextDepartureAtMinutes != null) {
    const h = Math.floor(nextDepartureAtMinutes / 60);
    const min = nextDepartureAtMinutes % 60;
    const pad = n => String(n).padStart(2, '0');
    const isTomorrow = nextDepartureAtMinutes <= nowMin;
    const d = new Date(hk.year, hk.month - 1, hk.day);
    if (isTomorrow) d.setDate(d.getDate() + 1);
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    nextDepartureIso = `${dateStr}T${pad(h)}:${pad(min)}:00+08:00`;
  }

  return { nextSailings, nextDepartureIso };
}

/**
 * Build sailings array from embedded 24h time strings
 */
function sailingsFrom24h(times) {
  const sailings = [];
  for (const hhmm of times) {
    const timeStr = format24hToAmPm(hhmm);
    const atMinutes = parseFerryTime(timeStr);
    if (atMinutes != null) sailings.push({ timeStr, atMinutes });
  }
  sailings.sort((a, b) => a.atMinutes - b.atMinutes);
  return sailings;
}

/**
 * Get Lamma ferry timetable from embedded data (both directions, next 2 hours)
 * @returns {Promise<object>} { toYungShueWan: {...}, toCentral: {...} }
 */
async function fetchFerryTimetable() {
  const hk = getHKDate();
  const isSundayOrPH = hk.dayOfWeek === 0;

  const timesToYSW = isSundayOrPH ? FERRY_SUNDAY_CENTRAL_TO_YSW : FERRY_WEEKDAY_CENTRAL_TO_YSW;
  const timesToCentral = isSundayOrPH ? FERRY_SUNDAY_YSW_TO_CENTRAL : FERRY_WEEKDAY_YSW_TO_CENTRAL;

  const sailingsToYSW = sailingsFrom24h(timesToYSW);
  const sailingsToCentral = sailingsFrom24h(timesToCentral);

  const timesToSKW = isSundayOrPH ? FERRY_SUNDAY_CENTRAL_TO_SKW : FERRY_WEEKDAY_CENTRAL_TO_SKW;
  const timesFromSKW = isSundayOrPH ? FERRY_SUNDAY_SKW_TO_CENTRAL : FERRY_WEEKDAY_SKW_TO_CENTRAL;
  const sailingsToSKW = sailingsFrom24h(timesToSKW);
  const sailingsFromSKW = sailingsFrom24h(timesFromSKW);

  const timesAberdeenToYSW = isSundayOrPH ? FERRY_SUNDAY_ABERDEEN_TO_YSW : FERRY_WEEKDAY_ABERDEEN_TO_YSW;
  const timesPakKokToYSW = isSundayOrPH ? FERRY_SUNDAY_PAKKOK_TO_YSW : FERRY_WEEKDAY_PAKKOK_TO_YSW;
  const timesYSWToAberdeen = isSundayOrPH ? FERRY_SUNDAY_YSW_TO_ABERDEEN : FERRY_WEEKDAY_YSW_TO_ABERDEEN;
  const timesPakKokToAberdeen = isSundayOrPH ? FERRY_SUNDAY_PAKKOK_TO_ABERDEEN : FERRY_WEEKDAY_PAKKOK_TO_ABERDEEN;
  const sailingsAberdeenToYSW = sailingsFrom24h(timesAberdeenToYSW);
  const sailingsPakKokToYSW = sailingsFrom24h(timesPakKokToYSW);
  const sailingsYSWToAberdeen = sailingsFrom24h(timesYSWToAberdeen);
  const sailingsPakKokToAberdeen = sailingsFrom24h(timesPakKokToAberdeen);

  return {
    toYungShueWan: { ...buildNextSailings(sailingsToYSW, hk), hkDateStr: hk.dateStr },
    toCentral: { ...buildNextSailings(sailingsToCentral, hk), hkDateStr: hk.dateStr },
    toSokKwuWan: { ...buildNextSailings(sailingsToSKW, hk), hkDateStr: hk.dateStr },
    sokKwuWanToCentral: { ...buildNextSailings(sailingsFromSKW, hk), hkDateStr: hk.dateStr },
    yswToAberdeen: { ...buildNextSailings(sailingsYSWToAberdeen, hk), hkDateStr: hk.dateStr },
    pakKokToAberdeen: { ...buildNextSailings(sailingsPakKokToAberdeen, hk), hkDateStr: hk.dateStr },
    aberdeenToYSW: { ...buildNextSailings(sailingsAberdeenToYSW, hk), hkDateStr: hk.dateStr },
    pakKokToYSW: { ...buildNextSailings(sailingsPakKokToYSW, hk), hkDateStr: hk.dateStr }
  };
}

/**
 * Fetch air quality from AQICN (World Air Quality Index)
 * @returns {Promise<object|null>} { aqi: number, category: string }
 */
async function fetchAirQuality() {
  try {
    const response = await fetch(`${AQICN.API_BASE}/hongkong/?token=${AQICN.TOKEN}`);
    if (!response.ok) return null;
    const data = await response.json();
    
    if (data.status === 'ok' && data.data?.aqi) {
      const aqi = data.data.aqi;
      let category = 'Good';
      if (aqi > 300) category = 'Hazardous';
      else if (aqi > 200) category = 'Very Unhealthy';
      else if (aqi > 150) category = 'Unhealthy';
      else if (aqi > 100) category = 'Unhealthy for Sensitive Groups';
      else if (aqi > 50) category = 'Moderate';
      
      return { aqi, category };
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch air quality:', err);
    return null;
  }
}

/**
 * Fetch RainViewer radar metadata (past 2 hours, 10-min steps).
 * Returns { host, path } for latest frame to build image URL.
 * @returns {Promise<object|null>} { host, path, generated } or null
 */
async function fetchRadar() {
  try {
    const response = await fetch(RAINVIEWER.API);
    if (!response.ok) return null;
    const data = await response.json();
    const host = data.host;
    const past = data.radar?.past;
    if (!host || !Array.isArray(past) || past.length === 0) return null;
    const latest = past[past.length - 1];
    return { host, path: latest.path, generated: data.generated };
  } catch (err) {
    console.error('RainViewer radar fetch failed:', err);
    return null;
  }
}

/**
 * Build RainViewer radar image URL centered on Hong Kong.
 * @param {string} host - e.g. https://tilecache.rainviewer.com
 * @param {string} path - e.g. /v2/radar/1609402200
 * @param {object} opts - { size, zoom, color, options }
 * @returns {string}
 */
function _buildRadarImageUrl(host, path, opts = {}) {
  const size = opts.size || 512;
  const zoom = opts.zoom || 4;
  const color = opts.color || 2;
  const options = opts.options != null ? opts.options : '1_0';
  const lat = RAINVIEWER.HONG_KONG_LAT;
  const lon = RAINVIEWER.HONG_KONG_LON;
  const base = host.replace(/\/$/, '');
  return `${base}${path}/${size}/${zoom}/${lat}/${lon}/${color}/${options}.png`;
}

/**
 * Check if point (lat, lon) is within radiusKm of center (centerLat, centerLon)
 */
function _pointInCircle(lat, lon, centerLat, centerLon, radiusKm) {
  const R = 6371;
  const dLat = (lat - centerLat) * Math.PI / 180;
  const dLon = (lon - centerLon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(centerLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c <= radiusKm;
}

// AISStream: latest position per MMSI (updated by WebSocket)
let aisStreamPositions = {};
/** Trail of [lat, lon] per MMSI (last N points for path line) */
let aisStreamTrails = {};
const AIS_TRAIL_POINTS = 30;
let aisStreamSocket = null;
let aisStreamStarted = false;
/** Called when new AIS positions arrive; used to refresh ferry map without full reload. */
let onAISPositionsUpdate = null;

/**
 * Start AISStream WebSocket; subscribes to Hong Kong bbox and Lamma ferry MMSIs.
 */
function startAISStream() {
  const key = (LAMMA_FERRY_AIS.AISSTREAM_API_KEY || '').trim();
  if (!key || aisStreamStarted) return;

  const mmsiSet = new Set(LAMMA_FERRY_AIS.FERRIES.map(f => f.mmsi));
  const nameByMmsi = Object.fromEntries(LAMMA_FERRY_AIS.FERRIES.map(f => [f.mmsi, f.name]));
  const { CENTRAL, LAMMA } = LAMMA_FERRY_AIS.ZONES;
  const latMin = Math.min(CENTRAL.lat, LAMMA.lat) - 0.05;
  const latMax = Math.max(CENTRAL.lat, LAMMA.lat) + 0.05;
  const lonMin = Math.min(CENTRAL.lon, LAMMA.lon) - 0.05;
  const lonMax = Math.max(CENTRAL.lon, LAMMA.lon) + 0.05;

  try {
    aisStreamSocket = new WebSocket('wss://stream.aisstream.io/v0/stream');
    aisStreamStarted = true;
  } catch (err) {
    aisStreamStarted = false;
    console.error('AISStream WebSocket create failed:', err);
    return;
  }

  aisStreamSocket.addEventListener('open', () => {
    const subscriptionMessage = {
      APIkey: key,
      BoundingBoxes: [[[lonMin, latMin], [lonMax, latMax]]],
      FiltersShipMMSI: LAMMA_FERRY_AIS.FERRIES.map(f => String(f.mmsi)),
      FilterMessageTypes: ['PositionReport']
    };
    aisStreamSocket.send(JSON.stringify(subscriptionMessage));
  });

  aisStreamSocket.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.MessageType !== 'PositionReport' || !msg.Message?.PositionReport) return;
      const pr = msg.Message.PositionReport;
      const mmsi = pr.UserID != null ? Number(pr.UserID) : null;
      if (mmsi == null || !mmsiSet.has(mmsi)) return;
      const lat = pr.Latitude != null ? Number(pr.Latitude) : null;
      const lon = pr.Longitude != null ? Number(pr.Longitude) : null;
      if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) return;
      const cog = pr.Cog != null ? Number(pr.Cog) : (pr.COG != null ? Number(pr.COG) : (pr.Course != null ? Number(pr.Course) : (pr.CourseOverGround != null ? Number(pr.CourseOverGround) : null)));
      const sog = pr.Sog != null ? Number(pr.Sog) : (pr.Speed != null ? Number(pr.Speed) : (pr.SpeedOverGround != null ? Number(pr.SpeedOverGround) : null));
      aisStreamPositions[mmsi] = {
        mmsi,
        name: nameByMmsi[mmsi] || String(mmsi),
        lat,
        lon,
        cog: cog != null && !isNaN(cog) ? cog : null,
        sog: sog != null && !isNaN(sog) ? sog : null,
        time: new Date().toISOString()
      };
      if (!aisStreamTrails[mmsi]) aisStreamTrails[mmsi] = [];
      aisStreamTrails[mmsi].push([lat, lon]);
      if (aisStreamTrails[mmsi].length > AIS_TRAIL_POINTS) aisStreamTrails[mmsi].shift();
      if (onAISPositionsUpdate) onAISPositionsUpdate();
    } catch (_) { /* ignore parse errors */ }
  });

  aisStreamSocket.addEventListener('close', () => { aisStreamStarted = false; });
  aisStreamSocket.addEventListener('error', () => { aisStreamStarted = false; });
}

/**
 * Get Lamma ferries with position in last 30 min.
 */
function getAISFerriesInArea() {
  const key = (LAMMA_FERRY_AIS.AISSTREAM_API_KEY || '').trim();
  if (!key) return null;

  const nameByMmsi = Object.fromEntries(LAMMA_FERRY_AIS.FERRIES.map(f => [f.mmsi, f.name]));
  const maxAgeMs = LAMMA_FERRY_AIS.POSITION_MAX_AGE_MINUTES * 60 * 1000;
  const now = Date.now();

  const result = [];
  for (const mmsi of Object.keys(aisStreamPositions)) {
    const v = aisStreamPositions[mmsi];
    const posTime = v.time ? new Date(v.time).getTime() : 0;
    if (now - posTime > maxAgeMs) continue;
    result.push({
      mmsi: v.mmsi,
      name: v.name || nameByMmsi[v.mmsi] || String(v.mmsi),
      lat: v.lat,
      lon: v.lon,
      cog: v.cog != null ? v.cog : null,
      sog: v.sog != null ? v.sog : null,
      time: v.time,
      trail: (aisStreamTrails[v.mmsi] || []).slice()
    });
  }
  return result;
}

/**
 * Register callback to run when new AIS positions arrive (so UI can refresh ferry map).
 * @param {function|null} fn - Called with no args; typically calls getAISFerriesInArea() and updates UI.
 */
function setOnAISPositionsUpdate(fn) {
  onAISPositionsUpdate = typeof fn === 'function' ? fn : null;
}

/**
 * Ferry AIS: uses AISStream WebSocket. Starts stream if key set; returns ferries (last 30 min).
 * @returns {Promise<Array<{ mmsi, name, lat, lon, time }>|null>}
 */
function fetchAISFerries() {
  const key = (LAMMA_FERRY_AIS.AISSTREAM_API_KEY || '').trim();
  if (!key) return Promise.resolve(null);
  startAISStream();
  return Promise.resolve(getAISFerriesInArea());
}

/**
 * Fetch all weather data needed for the app
 */
async function fetchAllWeatherData() {
  const hkDate = getHKDate();

  const [rhrread, flw, fnd, warnsum, swt, srs, mrs, ltmv, ryes, pressure, airQuality, ferry, tides, radar, aisFerries] = await Promise.allSettled([
    fetchWeather('rhrread'),
    fetchWeather('flw'),
    fetchWeather('fnd'),
    fetchWeather('warnsum'),
    fetchWeather('swt'),
    fetchOpenData('SRS', { year: hkDate.year, month: hkDate.month, day: hkDate.day }),
    fetchOpenData('MRS', { year: hkDate.year, month: hkDate.month, day: hkDate.day }),
    fetchOpenData('LTMV'),
    fetchOpenData('RYES', { date: hkDate.dateYesterday }),
    fetchPressure(),
    fetchAirQuality(),
    fetchFerryTimetable(),
    fetchOpenData('HLT', { year: hkDate.year, month: hkDate.month, day: hkDate.day, station: 'QUB', rformat: 'json' }),
    fetchRadar(),
    fetchAISFerries()
  ]);

  return {
    rhrread: rhrread.status === 'fulfilled' ? rhrread.value : null,
    flw: flw.status === 'fulfilled' ? flw.value : null,
    fnd: fnd.status === 'fulfilled' ? fnd.value : null,
    warnsum: warnsum.status === 'fulfilled' ? warnsum.value : null,
    swt: swt.status === 'fulfilled' ? swt.value : null,
    srs: srs.status === 'fulfilled' ? srs.value : null,
    mrs: mrs.status === 'fulfilled' ? mrs.value : null,
    ltmv: ltmv.status === 'fulfilled' ? ltmv.value : null,
    ryes: ryes.status === 'fulfilled' ? ryes.value : null,
    pressure: pressure.status === 'fulfilled' ? pressure.value : null,
    airQuality: airQuality.status === 'fulfilled' ? airQuality.value : null,
    ferry: ferry.status === 'fulfilled' ? ferry.value : null,
    tides: tides.status === 'fulfilled' ? tides.value : null,
    radar: radar.status === 'fulfilled' ? radar.value : null,
    aisFerries: aisFerries.status === 'fulfilled' ? aisFerries.value : null
  };
}
