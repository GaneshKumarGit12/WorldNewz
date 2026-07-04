# WorldNewz Transportation Subsystem Architecture (Google Maps Platform)

This document details the system design, data structures, and services for the **Transportation booking platform** in WorldNewz, powered by the **Google Maps Platform** (Directions API, Distance Matrix API, Places Autocomplete API, Maps JavaScript SDK, and Transit Mode).

---

## 1. System Overview

The Transportation subsystem is a full-featured ride-hailing and transit platform designed like Ola or Uber. It utilizes real-time Google Maps Platform REST APIs and JavaScript SDK to deliver accurate address search, distance & duration matrix calculations, turn-by-turn routing steps, and public transit (Metro / Bus) routes.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                    React UI Page                                       │
│    (Google Maps JS SDK + Places Autocomplete + Directions Renderer + Transit Layer)   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Polling / REST Proxy
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             TransportationController (.NET)                             │
│       (Proxies Google Maps Platform APIs & Manages Driver Simulation State)            │
└───────────────┬───────────────────────────┬───────────────────────────┬────────────────┘
                │                           │                           │
                ▼                           ▼                           ▼
    [Google Places API]        [Google Distance Matrix]     [Google Directions API]
    (Autocomplete Suggestions) (Distance & Travel Duration) (Polylines & Transit Steps)
```

---

## 2. Google Maps Platform Integrations

### A. Places Autocomplete API Proxy
- **Endpoint**: `GET /api/transportation/places-autocomplete?input={query}`
- **Purpose**: Provides real-time debounced location search suggestions worldwide, with India/Delhi region prioritization.

### B. Distance Matrix API Proxy
- **Endpoint**: `POST /api/transportation/matrix`
- **Purpose**: Computes actual road distance (in meters) and estimated travel duration (in seconds) for `driving`, `transit`, `bicycling`, or `walking` modes.

### C. Directions API Proxy & Transit Mode (`mode=transit`)
- **Endpoint**: `POST /api/transportation/directions`
- **Purpose**: Fetches overview polyline string, origin/destination coordinates, turn-by-turn routing steps, and public transit info (Metro lines and Bus stops).

### D. Google Maps JavaScript SDK
- **Frontend Component**: [TransportationPage.tsx](file:///c:/WorldNewz/worldnewz_UI/src/pages/TransportationPage.tsx)
- **Features**: Custom Dark Mode map theme (`#0d1117`), interactive Markers for Pickup, Destination, and Driver Position, Traffic Layer toggle, and dynamic bounds fitting.

---

## 3. Database Objects (Schema)

The SQLite/PostgreSQL schema consists of two tables: `CabDrivers` and `RideBookings`.

### A. CabDrivers Table
Stores driver information, current location coordinates, vehicle classification, and availability.

```sql
CREATE TABLE CabDrivers (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    VehicleType TEXT NOT NULL,       -- "Bike", "Auto", "Sedan", "Premium", "Transit"
    VehicleNumber TEXT NOT NULL,
    Latitude REAL NOT NULL,
    Longitude REAL NOT NULL,
    IsAvailable INTEGER NOT NULL DEFAULT 1,
    Rating REAL NOT NULL DEFAULT 4.5
);
```

### B. RideBookings Table
Persists user ride requests, fares, and journey states.

```sql
CREATE TABLE RideBookings (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserEmail TEXT NOT NULL,
    PickupLocation TEXT NOT NULL,
    Destination TEXT NOT NULL,
    VehicleType TEXT NOT NULL,
    Price REAL NOT NULL,
    Status TEXT NOT NULL,            -- "Requested", "Accepted", "Arrived", "InProgress", "Completed"
    CreatedAt TEXT NOT NULL,
    ETA INTEGER NOT NULL             -- In seconds, estimated time of arrival/completion
);
```

---

## 4. Vehicle Classes & Dynamic Fares Matrix

Fares are dynamically calculated using real distance metrics returned by Google Distance Matrix:

$$\text{Price} = \text{BaseFare} + (\text{GoogleDistanceInKm} \times \text{PerKmRate})$$

| Service Type | Base Fare (INR) | Per Km Rate (INR) | Mode | Description |
|---|---|---|---|---|
| **Bike** 🏍️ | 15.00 | 7.00 | Driving | Rapid two-wheeler for traffic evasion |
| **Auto** 🛺 | 25.00 | 12.00 | Driving | Budget three-wheeler regional transport |
| **Sedan** 🚗 | 50.00 | 16.00 | Driving | Comfortable standard 4-seater |
| **Premium** 👑 | 120.00 | 25.00 | Driving | High-end luxury sedan experience |
| **Transit** 🚇 | 10.00 | 3.00 | Transit | Public Metro / Bus network routing |

---

## 5. Security & AdSense Compliance

- **API Key Security**: The Google Maps API Key is stored safely in `.env` (`GOOGLE_MAPS_API_KEY`) and is never committed to source control or exposed in public components.
- **AdSense Layout Integrity**: Search controls, live map windows, and AdCards maintain distinct visual container padding and unique DOM element IDs (`id="pickup-location-input"`, `id="book-ride-button"`, etc.) to prevent accidental clicks and uphold Core Web Vitals standards.
- **SEO & Schema**: Includes localized `SEOMeta` metadata, canonical URLs, and `JSONLDBreadcrumb` structured schema markup.
