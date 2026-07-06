# WorldNewzs Weather Dashboard & Backend Service Documentation

This document serves as the complete technical specification and maintenance guide for the **Weather Forecast Dashboard**, API service architecture, security protocols, and UI components on WorldNewzs (`worldnewzs.in/weather`).

---

## 1. System Architecture Overview

The weather subsystem follows a secure **Server-Side Reverse Proxy & Data Aggregation** model:

```
┌─────────────────────────┐       GET /api/news/weather       ┌──────────────────────────────┐
│ React + TypeScript UI   │ ─────────────────────────────────> │ ASP.NET Core WebAPI          │
│ (Weather.tsx & Widget)  │ <───────────────────────────────── │ (WeatherController & Service)│
└─────────────────────────┘      JSON Telemetry Response       └──────────────┬───────────────┘
                                                                              │
                                                     ┌────────────────────────┴───────────────────────┐
                                                     │ Secure Backend Data Sources                    │
                                                     │  ├── Google Geocoding / Maps API (Secured Key)│
                                                     │  ├── Open-Meteo Weather Forecast API          │
                                                     │  └── Open-Meteo Air Quality Telemetry API     │
                                                     └────────────────────────────────────────────────┘
```

---

## 2. API Key Security & Vulnerability Controls

> [!IMPORTANT]
> **Key Security Protocol**: The Google API key (`AIzaSy...`) is stored **exclusively on the backend** inside `WorldNewzWebAPI/.env` as `WEATHER_API_KEY`. It is NEVER bundled in client-side JavaScript or returned in API responses.

### Security Controls Implemented:
1. **Input Sanitization**: All incoming `city` strings are stripped of unexpected control characters and capped at 80 characters using regular expressions to prevent SSRF or injection attempts.
2. **Coordinate Validation**: `lat` (-90 to +90) and `lon` (-180 to +180) parameters are strictly range-validated before processing.
3. **Denial-of-Service / Rate Limiting Protection**: Responses are cached using ASP.NET Core `IMemoryCache` for **15 minutes** per location/coordinate pair, dramatically reducing downstream API quota usage and defending against traffic floods.
4. **Secure Error Handling**: Internal exceptions, stack traces, and API key references are securely logged via `ILogger` and NEVER returned in client JSON responses.

---

## 3. Backend Endpoints & Data Model

### `GET /api/news/weather`

#### Request Query Parameters:
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `city` | `string` | Optional | Name of city or region (e.g. `Hyderabad`, `New York`, `London`). |
| `lat` | `double` | Optional | Geographic latitude for GPS auto-detection (e.g. `17.3850`). |
| `lon` | `double` | Optional | Geographic longitude for GPS auto-detection (e.g. `78.4867`). |

#### Response JSON Schema:
```json
{
  "location": "Hyderabad",
  "country": "India",
  "latitude": 17.385,
  "longitude": 78.4867,
  "timezone": "Asia/Kolkata",
  "current": {
    "temperatureC": 28.0,
    "temperatureF": 82.4,
    "feelsLikeC": 29.0,
    "feelsLikeF": 84.2,
    "humidity": 55,
    "windSpeedKmH": 12.0,
    "windDirectionDeg": 270,
    "windDirectionCompass": "W",
    "pressureHPa": 1012.0,
    "weatherCode": 2,
    "time": "2026-07-06T18:00:00Z"
  },
  "hourly": [
    {
      "time": "2026-07-06T18:00:00Z",
      "temperatureC": 28.0,
      "temperatureF": 82.4,
      "weatherCode": 2,
      "rainProbability": 15,
      "precipitationMm": 0.0,
      "windSpeedKmH": 12.0
    }
  ],
  "daily": [
    {
      "date": "2026-07-06",
      "weatherCode": 2,
      "minTempC": 22.0,
      "maxTempC": 31.0,
      "minTempF": 71.6,
      "maxTempF": 87.8,
      "precipitationSumMm": 0.5,
      "rainProbabilityMax": 20,
      "uVIndexMax": 5.2,
      "windSpeedMaxKmH": 18.0,
      "sunrise": "2026-07-06T05:40:00Z",
      "sunset": "2026-07-06T18:52:00Z",
      "moonPhaseValue": 0.45,
      "moonPhaseName": "Waxing Gibbous"
    }
  ],
  "airQuality": {
    "uS_AQI": 42,
    "statusLabel": "Good",
    "healthAdvisory": "Air quality is satisfactory, posing little to no health risk.",
    "pM2_5": 11.2,
    "pM10": 22.0,
    "co": 190.0,
    "nO2": 14.5,
    "sO2": 4.2,
    "o3": 38.0
  },
  "alerts": [
    {
      "severity": "Info",
      "title": "Weather Status",
      "Message": "Optimal outdoor climate conditions.",
      "icon": "☀️"
    }
  ]
}
```

---

## 4. Frontend UI Dashboard & Components

### 4.1 Weather Forecast Dashboard (`src/pages/Weather.tsx`)
- **Header & Location Bar**: City search input with submit button, GPS auto-detect button (`navigator.geolocation`), °C / °F unit toggle switch, and favorite cities quick-chips (persisted in `localStorage`).
- **Dynamic Ambient Theme**: Visual background container gradient shifts dynamically according to WMO weather condition code (Clear, Rain, Thunderstorm, Snow, Fog).
- **Hero Overview Card**: Displays primary temperature in °C or °F, condition icon, condition text, feels-like temp, humidity %, wind speed/direction, surface pressure, and UV index.
- **Air Quality & Pollution Radar (AQI)**: US AQI progress meter, pollutant breakdown (PM2.5, PM10, CO, NO2, O3, SO2), and localized health advisory text.
- **24-Hour Hourly Trend**: Horizontally scrollable strip of 24 hourly forecast cards displaying time, condition icon, temp, and rain chance %.
- **7–10 Day Extended Forecast**: Grid of daily cards displaying high/low temperature bar, rain chance, UV index max, and sunrise/sunset.
- **Sun & Moon Astronomy**: Sunrise/Sunset arc times, moon phase name & illuminated percentage.
- **Live Satellite Radar Map**: Embedded OpenStreetMap interactive view centered on the target location's coordinates.

### 4.2 Embedded Mini Weather Widget (`src/components/WeatherWidget.tsx`)
- Integrated into sidebars across `ReadFullArticles.tsx`, `ResultPage.tsx`, and `Discover.tsx`.
- Displays city name, current temp, condition icon, AQI pill, interactive tabs (Hourly trend, 7-Day list, Air Quality meter), °C/°F toggle button, and link to `/weather`.

---

## 5. SEO, Google Content Policies & AdSense Compliance

1. **Single `<h1>` Tag**: Exactly one `<h1>` per page ("WorldNewzs Climate & Weather Radar").
2. **Schema.org Structured Data**: Injects valid `WeatherForecast` and `Place` JSON-LD schema into `<head>` for enhanced Google Search rich snippets.
3. **Semantic HTML**: Built using standard HTML5 tags (`<main>`, `<header>`, `<section>`, `<article>`, `<footer>`).
4. **AdSense Compliance**: `AdCard` placement is visually separated from primary controls to prevent accidental clicks.
5. **Unique Test Identifiers**: All interactive controls have explicit, descriptive `id` attributes (e.g. `id="weather-search-input"`, `id="gps-location-btn"`, `id="unit-c-btn"`, `id="unit-f-btn"`).
6. **Sitemap Registration**: Listed in `/sitemap.xml` with priority `0.8` and `hourly` change frequency.

---

## 6. Maintenance & Future Extensions

- **Adding New Data Layers**: Extend `WeatherService.cs` by appending fields to `ForecastBundle` and `WeatherDashboardResponse`.
- **Refreshing Cache**: Clear cache in `WeatherService.cs` by invalidating `weather:*` keys in memory cache if needed.
