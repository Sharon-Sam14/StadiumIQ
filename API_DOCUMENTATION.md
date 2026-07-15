# StadiumIQ REST & WebSocket API Documentation

This document describes the REST endpoints and WebSocket protocols exposed by StadiumIQ microservices.

---

## 🎟️ Fan Service (`/api/v1/fans`)

### 1. GET `/me`
Fetches the profile details of the logged-in fan.
- **Headers**:
  - `x-user-id` (string, required): Auth0 user ID.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": "3c986473-9bf7-4c07-9611-a84d0711db7c",
    "auth0Id": "auth0|fan-priya-789",
    "email": "priya.sharma@fan.worldcup.com",
    "fullName": "Priya Sharma",
    "role": "fan",
    "createdAt": "2026-07-15T15:53:40.040Z"
  }
}
```

### 2. GET `/tickets`
Fetches matching tickets purchased by the fan. Uses Redis cache internally.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "tkt-101",
      "fanId": "3c986473-9bf7-4c07-9611-a84d0711db7c",
      "matchId": "match-82",
      "section": "212",
      "row": "D",
      "seat": "14"
    }
  ]
}
```

### 3. POST `/incidents`
Submits a fan incident report to the Command Center queue.
- **Request Body**:
```json
{
  "venueId": "e9b5f922-bfb2-4d2c-8067-9c985c5dfb56",
  "type": "medical",
  "severity": "low",
  "description": "Liquid spill in section 112 concessions area",
  "locationZone": "Section 112"
}
```
- **Response `21 Created`**:
```json
{
  "success": true,
  "data": {
    "id": "inc-982",
    "reportedBy": "3c986473-9bf7-4c07-9611-a84d0711db7c",
    "status": "open"
  }
}
```

---

## 🤝 Volunteer Service (`/api`)

### 1. GET `/tasks`
Lists all tasks assigned to the volunteer.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": "task-101",
      "title": "Redirect Section 200 flow to Gate B",
      "priority": "high",
      "status": "in_progress"
    }
  ]
}
```

### 2. PATCH `/tasks/:id`
Updates the status of a specific task.
- **Request Body**:
```json
{
  "status": "completed"
}
```

### 3. POST `/broadcast`
Broadcasts a safety alert to all connected WebSocket clients. Restricted to managers.
- **Request Body**:
```json
{
  "title": "Severe Weather Evacuation",
  "message": "Lightning alert active. Relocate spectators to shelter.",
  "severity": "high"
}
```

---

## ⚡ Real-time WebSockets Alerts (`ws://api.stadiumiq.com/api`)

Exposes a real-time event broker for safety alerts.

### Connection
```javascript
const ws = new WebSocket("wss://api.stadiumiq.com/api");
ws.onmessage = (event) => {
  const payload = JSON.parse(event.data);
  console.log("Received Alert Event:", payload);
};
```

### Events

#### 1. Welcome Message
Sent immediately upon connection:
```json
{
  "type": "WELCOME",
  "message": "Connected to StadiumIQ alerts broker."
}
```

#### 2. Safety Broadcast Alert
Pushed to all active connections when a safety alert is broadcast:
```json
{
  "type": "SAFETY_BROADCAST",
  "title": "Severe Weather Evacuation",
  "message": "Lightning alert active. Relocate spectators to shelter.",
  "severity": "high",
  "timestamp": "2026-07-15T16:00:00.000Z"
}
```
