# WorldNewz Transportation Subsystem Architecture

This document details the system design, data structures, and services for the **Transportation booking simulator** page in WorldNewz.

---

## 1. System Overview

The Transportation subsystem mimics real-world ride-hailing services like Ola or Uber. Since it operates in a demonstration and evaluation setting, it uses a mock real-time vehicle simulation on a custom-designed canvas vector map. The ride matching, driver status updates, coordinates, and ride history are backed by a persistent database in the ASP.NET Core backend.

```
[React UI Page] <--- Polling / Fetching ---> [TransportationController]
       │                                                 │
       ▼                                                 ▼
[Interactive Map] (Real-time updates)           [Database / DBContext]
                                              (CabDrivers & RideBookings)
```

---

## 2. Database Objects (Schema)

The SQLite/PostgreSQL schema consists of two tables: `CabDrivers` and `RideBookings`.

### A. CabDrivers Table
Stores driver information, current location coordinates, vehicle classification, and availability.

```sql
CREATE TABLE CabDrivers (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    VehicleType TEXT NOT NULL,       -- "Bike", "Auto", "Sedan", "Premium"
    VehicleNumber TEXT NOT NULL,
    Latitude REAL NOT NULL,
    Longitude REAL NOT NULL,
    IsAvailable INTEGER NOT NULL DEFAULT 1,
    Rating REAL NOT NULL DEFAULT 4.5
);
```

### B. RideBookings Table
Persists user ride requests, fares, and simulated journey states.

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

## 3. Vehicle Classes & Fares

We offer four tiers of transportation services:

| Service Type | Base Fare (INR) | Per Km Rate (INR) | Avg speed (km/h) | Description |
|---|---|---|---|---|
| **Bike** 🏍️ | 15.00 | 7.00 | 45 | Rapid two-wheeler for traffic evasion |
| **Auto** 🛺 | 25.00 | 12.00 | 35 | Budget three-wheeler regional transport |
| **Sedan** 🚗 | 50.00 | 16.00 | 45 | Comfortable standard 4-seater |
| **Premium** 👑 | 120.00 | 25.00 | 50 | High-end luxury sedan experience |

---

## 4. Distance, Pricing, & ETA Calculations

1. **Distance Estimation**: Pick-up and destination inputs are mapped to coordinate nodes. We calculate direct geometric distance or a Manhattan distance on our layout nodes:
   $$\text{Distance} = \sqrt{(\Delta \text{Latitude})^2 + (\Delta \text{Longitude})^2} \times 111.12 \text{ km}$$
2. **Fare Calculation**:
   $$\text{Price} = \text{BaseFare} + (\text{Distance} \times \text{PerKmRate})$$
3. **Simulated ETA**:
   $$\text{ETA (Minutes)} = \frac{\text{Distance}}{\text{AvgSpeed}} \times 60 + \text{congestionOffset}$$

---

## 5. Backend Simulation State Machine

When a ride is booked (`POST /api/transportation/book`):
1. **Requested**: The API verifies inputs, creates a booking row, and queries `CabDrivers` for the nearest available driver of the requested `VehicleType`.
2. **Accepted**: A matching driver is set to `IsAvailable = 0` (unavailable), and their ID is linked to the session.
3. **Arrived**: The backend driver simulates movement to the passenger coordinate. Once reached, status switches to "Arrived".
4. **InProgress**: Passenger boards, and driver moves along the vector path toward the destination.
5. **Completed**: Driver arrives at the destination. The booking row updates to "Completed", the driver is freed (`IsAvailable = 1`), and their coordinates are set to the destination.

This state machine is simulated in a background task or updated procedurally when the client polls `GET /api/transportation/ride/{id}` by calculating elapsed time since `CreatedAt`. This avoids heavy persistent threads in development and remains extremely light and robust.
