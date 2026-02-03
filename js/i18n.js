/**
 * Internationalization: English, Simplified Chinese, Traditional Chinese
 */

const LANG_STORAGE_KEY = 'hk-weather-lang';

const translations = {
  en: {
    'header.title': 'Hong Kong Weather',
    'header.loading': 'Loading...',
    'theme.light': '☀️ Light',
    'theme.dark': '🌙 Dark',
    'aria.themeLight': 'Switch to light theme',
    'aria.themeDark': 'Switch to dark theme',
    'feelsLike': 'Feels like',
    'high': 'High',
    'low': 'Low',
    'loading': 'Loading...',
    'noWarnings': 'No active warnings',
    'dataUnavailable': 'Data unavailable',
    'tideUnavailable': 'Tide data unavailable',
    'timetableUnavailable': 'Timetable unavailable',
    'departed': 'Departed',
    'docked': 'docked',
    'updated': 'Updated',
    'nextFerryIn': 'Next ferry in',
    'nextSailings': 'Next sailings (next 2 hours)',
    'departs': 'Departs',
    'ferry.positionsConfig': 'Set LAMMA_FERRY_AIS.AISSTREAM_API_KEY in api.js (API key from https://aisstream.io/apikeys) to show ferry positions.',
    'ferry.positionsUnavailable': 'Ferry positions unavailable (check AIS API).',
    'ferry.countInArea': '{n} ferry(s) in area (last 30 min)',
    'ferry.noneInArea': 'No ferries in area (last 30 min)',
    'ferry.none': 'None',
    'ferry.box.centralYungShueWan': 'Central ↔ Yung Shue Wan',
    'ferry.box.centralSokKwuWan': 'Central ↔ Sok Kwu Wan',
    'ferry.box.yswPakKokAberdeen': 'Yung Shue Wan → Pak Kok → Aberdeen',
    'ferry.box.aberdeenPakKokYsw': 'Aberdeen → Pak Kok → Yung Shue Wan',
    'ferry.dir.centralToYungShueWan': 'Central → Yung Shue Wan',
    'ferry.dir.yungShueWanToCentral': 'Yung Shue Wan → Central',
    'ferry.dir.centralToSokKwuWan': 'Central → Sok Kwu Wan',
    'ferry.dir.sokKwuWanToCentral': 'Sok Kwu Wan → Central',
    'ferry.dir.yungShueWanToAberdeen': 'Yung Shue Wan → Aberdeen',
    'ferry.dir.pakKokToAberdeen': 'Pak Kok → Aberdeen',
    'ferry.dir.aberdeenToPakKok': 'Aberdeen → Pak Kok',
    'ferry.dir.pakKokToYungShueWan': 'Pak Kok → Yung Shue Wan',
    'widget.forecast': '9-Day Forecast',
    'widget.ferry': 'Lamma Island Ferry',
    'widget.warnings': 'Weather Alerts',
    'widget.uv': 'UV Index',
    'widget.humidity': 'Humidity',
    'widget.wind': 'Wind',
    'widget.air': 'Air Quality',
    'widget.dewpoint': 'Dew Point',
    'widget.visibility': 'Visibility',
    'widget.pressure': 'Pressure',
    'widget.sea': 'Sea Temperature',
    'widget.tides': 'Tides (Quarry Bay)',
    'widget.sun': 'Sun',
    'widget.moon': 'Moon',
    'widget.radar': 'Weather Radar',
    'widget.ferryPositions': 'Ferry positions (last 30 min)',
    'sunrise': 'Sunrise',
    'sunset': 'Sunset',
    'moonrise': 'Moonrise',
    'moonset': 'Moonset',
    'radar.precipitation': 'Precipitation',
    'radar.light': 'Light',
    'radar.moderate': 'Moderate',
    'radar.heavy': 'Heavy',
    'radar.intense': 'Intense',
    'radar.loading': 'Loading radar...',
    'radar.unavailable': 'Radar unavailable',
    'radar.latestFrame': 'Latest radar frame',
    'radar.latestFrameAt': 'Latest frame · {date}',
    'dayNum': 'Day {n}',
    'currentConditions': 'Current Conditions',
    'speed': 'Speed',
    'course': 'Course',
    'failedLoad': 'Failed to load data. Retrying...',
    'error': 'Error',
    'ferry.popupUpdated': 'Updated',
    'countdown.hoursMins': '{h}h {m}m',
    'countdown.mins': '{m} min',
    'nA': 'N/A',
  },
  'zh-Hans': {
    'header.title': '香港天氣',
    'header.loading': '載入中...',
    'theme.light': '☀️ 淺色',
    'theme.dark': '🌙 深色',
    'aria.themeLight': '切換至淺色主題',
    'aria.themeDark': '切換至深色主題',
    'feelsLike': '體感',
    'high': '最高',
    'low': '最低',
    'loading': '載入中...',
    'noWarnings': '目前沒有警告',
    'dataUnavailable': '資料無法提供',
    'tideUnavailable': '潮汐資料無法提供',
    'timetableUnavailable': '班次表無法提供',
    'departed': '已開出',
    'docked': '靠泊',
    'updated': '更新於',
    'nextFerryIn': '下一班船',
    'nextSailings': '未來兩小時班次',
    'departs': '開出',
    'ferry.positionsConfig': '請在 api.js 設定 LAMMA_FERRY_AIS.AISSTREAM_API_KEY（從 https://aisstream.io/apikeys 取得）以顯示渡輪位置。',
    'ferry.positionsUnavailable': '渡輪位置無法提供（請檢查 AIS API）。',
    'ferry.countInArea': '過去 30 分鐘內 {n} 艘渡輪',
    'ferry.noneInArea': '過去 30 分鐘內沒有渡輪',
    'ferry.none': '無',
    'ferry.box.centralYungShueWan': '中環 ↔ 榕樹灣',
    'ferry.box.centralSokKwuWan': '中環 ↔ 索罟灣',
    'ferry.box.yswPakKokAberdeen': '榕樹灣 → 北角 → 香港仔',
    'ferry.box.aberdeenPakKokYsw': '香港仔 → 北角 → 榕樹灣',
    'ferry.dir.centralToYungShueWan': '中環 → 榕樹灣',
    'ferry.dir.yungShueWanToCentral': '榕樹灣 → 中環',
    'ferry.dir.centralToSokKwuWan': '中環 → 索罟灣',
    'ferry.dir.sokKwuWanToCentral': '索罟灣 → 中環',
    'ferry.dir.yungShueWanToAberdeen': '榕樹灣 → 香港仔',
    'ferry.dir.pakKokToAberdeen': '北角 → 香港仔',
    'ferry.dir.aberdeenToPakKok': '香港仔 → 北角',
    'ferry.dir.pakKokToYungShueWan': '北角 → 榕樹灣',
    'widget.forecast': '9 日預報',
    'widget.ferry': '南丫島渡輪',
    'widget.warnings': '天氣警告',
    'widget.uv': '紫外線指數',
    'widget.humidity': '濕度',
    'widget.wind': '風',
    'widget.air': '空氣質素',
    'widget.dewpoint': '露點',
    'widget.visibility': '能見度',
    'widget.pressure': '氣壓',
    'widget.sea': '海水溫度',
    'widget.tides': '潮汐（鰂魚涌）',
    'widget.sun': '太陽',
    'widget.moon': '月亮',
    'widget.radar': '天氣雷達',
    'widget.ferryPositions': '渡輪位置（過去 30 分鐘）',
    'sunrise': '日出',
    'sunset': '日落',
    'moonrise': '月出',
    'moonset': '月落',
    'radar.precipitation': '降雨',
    'radar.light': '小',
    'radar.moderate': '中',
    'radar.heavy': '大',
    'radar.intense': '極強',
    'radar.loading': '載入雷達...',
    'radar.unavailable': '雷達無法提供',
    'radar.latestFrame': '最新雷達圖',
    'radar.latestFrameAt': '最新 · {date}',
    'dayNum': '第 {n} 天',
    'currentConditions': '目前天氣',
    'speed': '航速',
    'course': '航向',
    'failedLoad': '無法載入資料，正在重試...',
    'error': '錯誤',
    'ferry.popupUpdated': '更新',
    'countdown.hoursMins': '{h} 小時 {m} 分',
    'countdown.mins': '{m} 分',
    'nA': '不適用',
  },
  'zh-Hant': {
    'header.title': '香港天氣',
    'header.loading': '載入中...',
    'theme.light': '☀️ 淺色',
    'theme.dark': '🌙 深色',
    'aria.themeLight': '切換至淺色主題',
    'aria.themeDark': '切換至深色主題',
    'feelsLike': '體感',
    'high': '最高',
    'low': '最低',
    'loading': '載入中...',
    'noWarnings': '目前沒有警告',
    'dataUnavailable': '資料無法提供',
    'tideUnavailable': '潮汐資料無法提供',
    'timetableUnavailable': '班次表無法提供',
    'departed': '已開出',
    'docked': '靠泊',
    'updated': '更新於',
    'nextFerryIn': '下一班船',
    'nextSailings': '未來兩小時班次',
    'departs': '開出',
    'ferry.positionsConfig': '請在 api.js 設定 LAMMA_FERRY_AIS.AISSTREAM_API_KEY（從 https://aisstream.io/apikeys 取得）以顯示渡輪位置。',
    'ferry.positionsUnavailable': '渡輪位置無法提供（請檢查 AIS API）。',
    'ferry.countInArea': '過去 30 分鐘內 {n} 艘渡輪',
    'ferry.noneInArea': '過去 30 分鐘內沒有渡輪',
    'ferry.none': '無',
    'ferry.box.centralYungShueWan': '中環 ↔ 榕樹灣',
    'ferry.box.centralSokKwuWan': '中環 ↔ 索罟灣',
    'ferry.box.yswPakKokAberdeen': '榕樹灣 → 北角 → 香港仔',
    'ferry.box.aberdeenPakKokYsw': '香港仔 → 北角 → 榕樹灣',
    'ferry.dir.centralToYungShueWan': '中環 → 榕樹灣',
    'ferry.dir.yungShueWanToCentral': '榕樹灣 → 中環',
    'ferry.dir.centralToSokKwuWan': '中環 → 索罟灣',
    'ferry.dir.sokKwuWanToCentral': '索罟灣 → 中環',
    'ferry.dir.yungShueWanToAberdeen': '榕樹灣 → 香港仔',
    'ferry.dir.pakKokToAberdeen': '北角 → 香港仔',
    'ferry.dir.aberdeenToPakKok': '香港仔 → 北角',
    'ferry.dir.pakKokToYungShueWan': '北角 → 榕樹灣',
    'widget.forecast': '9 日預報',
    'widget.ferry': '南丫島渡輪',
    'widget.warnings': '天氣警告',
    'widget.uv': '紫外線指數',
    'widget.humidity': '濕度',
    'widget.wind': '風',
    'widget.air': '空氣質素',
    'widget.dewpoint': '露點',
    'widget.visibility': '能見度',
    'widget.pressure': '氣壓',
    'widget.sea': '海水溫度',
    'widget.tides': '潮汐（鰂魚涌）',
    'widget.sun': '太陽',
    'widget.moon': '月亮',
    'widget.radar': '天氣雷達',
    'widget.ferryPositions': '渡輪位置（過去 30 分鐘）',
    'sunrise': '日出',
    'sunset': '日落',
    'moonrise': '月出',
    'moonset': '月落',
    'radar.precipitation': '降雨',
    'radar.light': '小',
    'radar.moderate': '中',
    'radar.heavy': '大',
    'radar.intense': '極強',
    'radar.loading': '載入雷達...',
    'radar.unavailable': '雷達無法提供',
    'radar.latestFrame': '最新雷達圖',
    'radar.latestFrameAt': '最新 · {date}',
    'dayNum': '第 {n} 天',
    'currentConditions': '目前天氣',
    'speed': '航速',
    'course': '航向',
    'failedLoad': '無法載入資料，正在重試...',
    'error': '錯誤',
    'ferry.popupUpdated': '更新',
    'countdown.hoursMins': '{h} 小時 {m} 分',
    'countdown.mins': '{m} 分',
    'nA': '不適用',
  },
};

let currentLang = 'en';

function getStoredLang() {
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === 'en' || stored === 'zh-Hans' || stored === 'zh-Hant') return stored;
  return 'en';
}

function getLocale() {
  return currentLang;
}

/** HKO API lang parameter: en | sc (Simplified) | tc (Traditional) */
function getHKOLang() {
  if (currentLang === 'zh-Hans') return 'sc';
  if (currentLang === 'zh-Hant') return 'tc';
  return 'en';
}

/** Get translated string for key; fallback to English then key. */
function t(key, params) {
  const str = (translations[currentLang] && translations[currentLang][key]) ||
    translations.en[key] ||
    key;
  if (!params) return str;
  return Object.keys(params).reduce((s, k) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]), str);
}

function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.title = t('header.title');
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  // Theme button is updated by app.js applyTheme when lang changes
  if (typeof updateThemeButtonLabels === 'function') updateThemeButtonLabels();
}

function setLang(lang) {
  if (lang !== 'en' && lang !== 'zh-Hans' && lang !== 'zh-Hant') return;
  currentLang = lang;
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  applyTranslations();
}

function initLang() {
  currentLang = getStoredLang();
  document.documentElement.lang = currentLang;
  const select = document.getElementById('langSelect');
  if (select) {
    select.value = currentLang;
    select.addEventListener('change', () => {
      setLang(select.value);
      if (typeof onLangChange === 'function') onLangChange();
    });
  }
  applyTranslations();
}
