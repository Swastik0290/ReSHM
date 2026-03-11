# ReSHM — API CRUD Reference

> Base URL for all requests: `http://<your-server-ip>:5000`
> Replace `<your-server-ip>` with `localhost` for local testing, or your LAN / public IP for hardware devices.

---

## Authentication

Most **write** endpoints (rooms management) and all **read** endpoints (sensor data) require a **JWT Bearer token** in the request header.

```
Authorization: Bearer <token>
```

### How to get a token

**Request**
```
POST /api/auth/login
Content-Type: application/json
```
```json
{
  "email": "admin@example.com",
  "password": "yourpassword"
}
```

**Response `200 OK`**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

Copy the `token` value and use it in the **Authorization** header for every subsequent request.

> **Tip:** In Postman, go to *Authorization → Bearer Token* and paste the token. You can store it in a Postman environment variable so you don't have to re-paste it each time.

---

## Data Schemas

### Room (Device Registration)

A **Room** represents a physical location to which an IoT device is assigned.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | MongoDB document ID (use this as `roomId` in sensor endpoints) |
| `name` | String | ✅ | Human-readable room / location name |
| `description` | String | — | Optional notes about the location |
| `location.latitude` | Number | ✅ | Latitude in decimal degrees (`-90` to `90`) |
| `location.longitude` | Number | ✅ | Longitude in decimal degrees (`-180` to `180`) |
| `deviceId` | String | — | Unique hardware identifier; must match the `deviceId` your sensor sends. Sparse-unique (two rooms can both omit it, but two rooms cannot share the same value) |
| `isActive` | Boolean | — | Defaults to `true`. Set to `false` to soft-disable the device |
| `createdAt` | Date | auto | ISO timestamp of room creation |

---

### SensorReading (Ingest Payload)

Each reading posted by the hardware creates a **SensorReading** document.

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `deviceId` | String | ✅ | — | Must match a registered Room's `deviceId` |
| `latitude` | Number | ✅ | — | Current GPS latitude of the hardware |
| `longitude` | Number | ✅ | — | Current GPS longitude of the hardware |
| `temperature` | Number | — | `22` | Ambient temperature in °C (`-50` to `100`) |
| `humidity` | Number | — | `50` | Relative humidity in % (`0` to `100`) |
| `co2` | Number | — | `400` | Carbon dioxide concentration in ppm |
| `coSensor1` | Number | — | `0` | CO reading from sensor 1 in ppm |
| `coSensor2` | Number | — | `0` | CO reading from sensor 2 in ppm |
| `oxygen` | Number | — | `21` | Oxygen level in % (`0` to `100`) |
| `pulse` | Number | — | `72` | Heart rate in BPM (`0` to `300`) |
| `altitude` | Number | — | `null` | Altitude in meters above sea level |
| `smokeDetected` | Boolean | — | `false` | `true` when smoke is detected |
| `fireDetected` | Boolean | — | `false` | `true` when fire is detected |
| `source` | String | — | `Unknown` | Connection type: `Modem`, `LAN`, `WIFI`, or `Unknown` |

> **Threshold Alerts** are generated automatically on every ingest:
>
> | Metric | Warning | Critical |
> |--------|---------|----------|
> | CO (each sensor) | ≥ 30 ppm | ≥ 50 ppm |
> | CO₂ | ≥ 800 ppm | ≥ 1000 ppm |
> | Oxygen | ≤ 20.5 % | ≤ 19.5 % |
> | Pulse | ≥ 100 or ≤ 50 BPM | ≥ 120 or ≤ 40 BPM |
> | Temperature | ≥ 30 °C | ≥ 35 °C |
> | Humidity | ≥ 70 % | ≥ 80 % |
> | Smoke | — | Any detection |
> | Fire | — | Any detection |

---

## Room Endpoints

### Create a Room

```
POST /api/rooms
Authorization: Bearer <token>   (admin role required)
Content-Type: application/json
```

**Body**
```json
{
  "name": "Server Room A",
  "description": "Ground floor, east wing",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  },
  "deviceId": "esp32-room-101"
}
```

**Response `201 Created`**
```json
{
  "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
  "name": "Server Room A",
  "description": "Ground floor, east wing",
  "location": { "latitude": 28.6139, "longitude": 77.2090 },
  "deviceId": "esp32-room-101",
  "isActive": true,
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

---

### Get All Rooms

```
GET /api/rooms
Authorization: Bearer <token>
```

Returns all rooms for admins. Limited users get only their assigned room.

**Response `200 OK`** — array of Room objects (same shape as above).

---

### Get a Single Room

```
GET /api/rooms/:id
Authorization: Bearer <token>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | ObjectId | The room's `_id` |

**Response `200 OK`** — single Room object.

---

### Update a Room

```
PUT /api/rooms/:id
Authorization: Bearer <token>   (admin role required)
Content-Type: application/json
```

**Body** — any subset of fields to update:
```json
{
  "name": "Updated Room Name",
  "description": "New description",
  "location": {
    "latitude": 28.6200,
    "longitude": 77.2100
  },
  "deviceId": "esp32-room-202",
  "isActive": false
}
```

**Response `200 OK`** — updated Room object.

---

### Delete a Room

```
DELETE /api/rooms/:id
Authorization: Bearer <token>   (admin role required)
```

**Response `200 OK`**
```json
{ "message": "Room deleted successfully" }
```

---

## Sensor Data Endpoints

### Ingest a Reading (from Hardware)

> **No authentication required** — designed for direct POST from ESP32, Arduino, or any HTTP client.

```
POST /api/sensor/ingest
Content-Type: application/json
```

**Body**
```json
{
  "deviceId":      "esp32-room-101",
  "latitude":      28.6139,
  "longitude":     77.2090,
  "temperature":   27.5,
  "humidity":      65.0,
  "co2":           520,
  "coSensor1":     12,
  "coSensor2":     10,
  "oxygen":        20.9,
  "pulse":         75,
  "smokeDetected": false,
  "fireDetected":  false,
  "altitude":      150.5,
  "source":        "LAN"
}
```

**Minimal body** (only required fields)
```json
{
  "deviceId":  "esp32-room-101",
  "latitude":  28.6139,
  "longitude": 77.2090
}
```

**Response `201 Created`**
```json
{
  "message": "Reading saved",
  "reading": {
    "timestamp": "2025-01-15T10:45:00.000Z",
    "location": { "latitude": 28.6139, "longitude": 77.2090 }
  }
}
```

---

### Get All Readings for a Room

```
GET /api/sensor/readings/:roomId
Authorization: Bearer <token>
```

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `limit` | Integer | `50` | Max records per response (1 – 1000) |
| `skip` | Integer | `0` | Records to skip (for pagination) |
| `startDate` | ISO Date | — | Filter: only readings on or after this date |
| `endDate` | ISO Date | — | Filter: only readings on or before this date |

**Example**
```
GET /api/sensor/readings/64a1b2c3d4e5f6a7b8c9d0e1?limit=20&skip=0&startDate=2025-01-01&endDate=2025-01-31
```

**Response `200 OK`**
```json
{
  "readings": [ /* array of SensorReading objects */ ],
  "pagination": {
    "total": 142,
    "limit": 20,
    "skip": 0,
    "hasMore": true
  }
}
```

---

### Get Latest Reading

```
GET /api/sensor/latest/:roomId
Authorization: Bearer <token>
```

Returns the single most recent SensorReading for the room.

**Response `200 OK`** — one SensorReading object with populated `roomId` (name + location).

---

### Get Active Alerts

```
GET /api/sensor/alerts/:roomId
Authorization: Bearer <token>
```

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `limit` | Integer | `10` | Max alert readings to return |

Returns the most recent readings that triggered at least one threshold alert.

**Response `200 OK`** — array of SensorReading objects, each including an `alerts` array of strings describing what was exceeded.

---

### Get Dashboard Summary

```
GET /api/sensor/dashboard/:roomId
Authorization: Bearer <token>
```

Returns the **latest reading** plus up to **100 readings from the last 24 hours** for charting.

**Response `200 OK`**
```json
{
  "latest": { /* most recent SensorReading */ },
  "trends": [ /* array of readings in last 24 h */ ]
}
```

---

## Postman Quick-start Checklist

1. **Import** — create a new collection in Postman named `ReSHM`.
2. **Environment** — create an environment with variable `base_url = http://localhost:5000`.
3. **Login** — `POST {{base_url}}/api/auth/login` → copy the `token` from the response.
4. **Set Bearer** — in the collection's *Authorization* tab set type `Bearer Token` and value `{{token}}`. All requests in the collection inherit this.
5. **Test ingest** — `POST {{base_url}}/api/sensor/ingest` with a JSON body using your device's `deviceId`.
6. **Read it back** — `GET {{base_url}}/api/sensor/latest/<roomId>` to confirm the data was stored.

---

## Error Responses

| HTTP Status | Meaning |
|-------------|---------|
| `400 Bad Request` | Validation failed — check the `errors` array in the response body |
| `401 Unauthorized` | Missing or expired Bearer token |
| `403 Forbidden` | Authenticated but insufficient role (e.g. non-admin accessing admin route) |
| `404 Not Found` | Room or reading does not exist |
| `409 Conflict` | `deviceId` already used by another room |
| `500 Internal Server Error` | Unexpected server error — check server logs |
| `409 Conflict` | `deviceId` already used by another room |
| `500 Internal Server Error` | Unexpected server error — check server logs |
| `503 Service Unavailable`| Database connection issues |

---

## How to Run the Project

To run the project locally for development or testing:

1.  **Install All Dependencies**  
    Run this in the root directory to install both client and server packages:
    ```bash
    npm run install-all
    ```

2.  **Start Development Servers**  
    This command will start the Backend (Port 5000) and Frontend (Port 3000) concurrently:
    ```bash
    npm run dev
    ```

3.  **Individual Components** (Optional)  
    If you want to run them separately in different terminals:
    - **Backend only:** `cd server && npm run dev`
    - **Frontend only:** `cd client && npm start`

4.  **Production Build**  
    To create an optimized production bundle for the frontend:
    ```bash
    cd client && npm run build
    ```

---

*Last Updated: March 2024*
