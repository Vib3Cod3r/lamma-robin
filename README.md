# Hong Kong Weather

A responsive web app displaying Hong Kong weather conditions, 9-day forecast, Lamma Island ferry schedules, tides, and more. Built for desktop and mobile browsers.

## Features

- **Current weather** – Temperature, feels-like, high/low, conditions
- **9-day forecast** – Daily temperature and weather overview
- **Lamma Island Ferry** – Countdown and sailings for Central Pier 4 ↔ Yung Shue Wan (with optional AIS ferry positions map)
- **Weather radar** – RainViewer precipitation map for Hong Kong
- **Widgets** – UV index, air quality, wind, humidity, dew point, visibility, pressure, sea temperature, tides (Quarry Bay), sunrise/sunset, moon rise/set
- **Weather alerts** – Hong Kong Observatory warnings
- **Theme toggle** – Light/dark mode

## Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/vib3cod3r/lamma-robin.git
   cd lamma-robin
   ```

2. Serve the app with any static file server, e.g.:
   ```bash
   python -m http.server 8000
   ```
   Then open `http://localhost:8000` in your browser.

## Docker

Build and push the image to the registry using the helper script:

```bash
./build-image.sh
```

The script builds and pushes `registry.fanjango.com.hk/vib3cod3r/lamma-robin:latest`. Ensure you are logged in to the registry and have permission to push.

## Data Sources

- **Hong Kong Observatory (HKO)** – Weather, forecasts, warnings, sun/moon times, tides, pressure (no API key required)
- **RainViewer** – Weather radar imagery
- **AQICN** – Air quality (uses demo token; see [API_NOTES.md](API_NOTES.md) to add your own)

## API Configuration

For production use, add your own AQICN token in `js/api.js` (see [API_NOTES.md](API_NOTES.md)). The ferry AIS map uses AISStream via WebSocket on port 443.

## Tech Stack

- Vanilla HTML, CSS, JavaScript
- [Leaflet](https://leafletjs.com/) for maps
- Hong Kong Observatory Open Data API
