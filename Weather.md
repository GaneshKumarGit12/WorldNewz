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
                                                     │  ├── OpenWeatherMap API (Secured Key)          │
                                                     │  ├── OpenWeather Air Pollution API             │
                                                     │  └── Open-Meteo Telemetry Fallback             │
                                                     └────────────────────────────────────────────────┘
```

---

## 2. API Key Security & Vulnerability Controls

> [!IMPORTANT]
> **Key Security Protocol**: The OpenWeather API key (`f3df209adf631bebe02daa54dab5fc5c`) is stored **exclusively on the backend** inside `WorldNewzWebAPI/.env` as `WEATHER_API_KEY`. It is NEVER bundled in client-side JavaScript or returned in API responses.

### Security Controls Implemented:
1. **Input Sanitization**: All incoming `city` strings are stripped of unexpected control characters and capped at 80 characters using regular expressions to prevent SSRF or injection attempts.
2. **Coordinate Validation**: Latitude (`-90` to `+90`) and longitude (`-180` to `+180`) parameter ranges are strictly range-validated before processing.
3. **Denial-of-Service / Rate Limiting Protection**: Responses are cached using ASP.NET Core `IMemoryCache` for **15 minutes** per location/coordinate pair, dramatically reducing downstream API quota usage and defending against traffic floods.
4. **Secure Error Handling**: Internal exceptions, stack traces, and API key references are securely logged via `ILogger` and NEVER returned in client JSON responses.

---

## 3. UI Dashboard Layout & Reference Design System

The weather dashboard matches the sleek modern glassmorphism reference design:

### 3.1 Overview Section
- **Temperature Card**: Current temp (e.g. `22°C`), weather condition icon, low/high range pill (`L 18°C H 25°C`), and city/country location indicator.
- **Air Quality Card**: Dotted circular SVG radial ring meter displaying `AQI 14`, status indicator bar (`Good`), and health advice statement.
- **Weekly Temperature Line Chart**: Smooth SVG curve graph displaying 7-day temperature trends (`Mon` to `Sun`), active day vertical dotted highlight line, and temperature labels.

### 3.2 Today's Highlight Section
- **Wind Status**: SVG wave line graph with speed (`7.4 km/h`) and timestamp.
- **UV Index**: Semi-circular gauge meter with value (`5.50 UV`).
- **Sunrise & Sunset**: Arc diagram with sun marker at current position.
- **Humidity & Fog Density**: Water drop % (`87%`) and visibility density (`500 m`).
- **Notification CTA Card**: Starry aurora gradient card with headline *"GET AUTOMATIC ALERTS FOR SUDDEN WEATHER CHANGES STRAIGHT TO YOUR DEVICE!"* and toggle button.

---

## 4. Maintenance & Future Extensions

- **Refreshing API Keys**: To update the OpenWeather key in the future, edit `WEATHER_API_KEY` in `WorldNewzWebAPI/.env`.
- **Cache Clearing**: Invalidate `weather:*` keys in ASP.NET Core `IMemoryCache` if instant data refresh is required.
