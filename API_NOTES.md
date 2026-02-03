# Weather App - API Sources

## Data Sources

### 1. Hong Kong Observatory (HKO)
- **Weather data**: Temperature, humidity, UV, forecasts, warnings
- **Sunrise/Sunset**: `opendata.php?dataType=SRS`
- **Moonrise/Moonset**: `opendata.php?dataType=MRS`
- **Visibility**: `opendata.php?dataType=LTMV`
- **Pressure**: CSV file at `hko_data/regional-weather/latest_1min_pressure.csv`
- **No API key required** - Free and open

### 2. AQICN (World Air Quality Index)
- **Air Quality Index (AQI)**: Real-time air quality for Hong Kong
- **Endpoint**: `https://api.waqi.info/feed/hongkong/?token=YOUR_TOKEN`
- **Current token**: Using demo token (limited requests)
- **Get your own token**: https://aqicn.org/api/ (free)

## Important Notes

### Air Quality API Token
The app currently uses the AQICN demo token which has rate limits. For production use:

1. Visit https://aqicn.org/api/
2. Sign up for a free API token
3. Replace the token in `js/api.js`:

```javascript
const AQICN = {
  API_BASE: 'https://api.waqi.info/feed',
  TOKEN: 'YOUR_TOKEN_HERE'  // Replace 'demo' with your token
};
```

### Data Update Frequencies
- **Weather data**: Every 30 minutes (app refresh interval)
- **Pressure**: Updated every 10 minutes by HKO
- **Air Quality**: Real-time (updated hourly by AQICN)
- **Sun/Moon times**: Once per day (static for the date)

## Troubleshooting

### If sunrise/sunset not showing:
- Check browser console for API errors
- Verify date parameters are correct
- HKO API returns fields: `["YYYY-MM-DD","RISE","TRAN.","SET"]`

### If air quality shows "N/A":
- Demo token may have hit rate limit
- Get your own free token from AQICN
- Check network tab for 403/429 errors

### If pressure not showing:
- CSV parsing may have failed
- Check HKO CSV format hasn't changed
- Fallback to "-- hPa" if unavailable

## WebSocket (AIS) and ports 80 / 443

The ferry AIS map uses a **WebSocket** connection to `wss://stream.aisstream.io` (TLS on port 443). To ensure it works in your environment:

1. **Outbound**
   - Allow **port 443** (HTTPS/WSS) outbound so the browser can connect to AISStream.

2. **Serving the app**
   - Serve the app on **port 80** (HTTP) and/or **port 443** (HTTPS) so users can load it.
   - Open **ports 80 and 443** in your firewall for inbound traffic (e.g. `sudo firewall-cmd --add-service=http --add-service=https --permanent && sudo firewall-cmd --reload` on Fedora/RHEL, or allow TCP 80 and 443 in your cloud/VM firewall).

3. **WebSocket upgrade**
   - The app only makes *outbound* WebSocket connections to AISStream; no WebSocket server runs in this project. Any normal HTTP server on 80/443 is fine. If you later add a backend that accepts WebSockets, ensure your reverse proxy (e.g. nginx) allows the `Upgrade` and `Connection` headers for WebSocket.
