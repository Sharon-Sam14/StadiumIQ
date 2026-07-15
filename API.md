# StadiumIQ Serverless API Reference

This document maps all cloud operations, interfaces, and serverless RAG AI triggers in the StadiumIQ system.

---

## 1. Firebase Cloud Functions HTTPS Endpoints

### Seeding Data: `seedFirestore`
* **Trigger**: HTTP GET/POST Request
* **Endpoint URL**: `https://<region>-<project-id>.cloudfunctions.net/seedFirestore`
* **Description**: Resets and populates Cloud Firestore collections with default event matches, venues, users, rewards, and checklists.
* **Response Shapes**:
  ```json
  {
    "success": true,
    "message": "Firestore database successfully seeded!"
  }
  ```

---

## 2. Callable Cloud Functions v2

These functions are invoked securely from client PWA portals via the `httpsCallable` Firebase Client SDK.

### AI Concierge: `aiConcierge`
* **Arguments**:
  ```json
  {
    "prompt": "String",
    "sessionId": "String"
  }
  ```
* **Description**: Feeds the prompt to Google Gemini 1.5 Flash using context rules regarding stadium prohibited items and bag policies.
* **Returns**:
  ```json
  {
    "success": true,
    "text": "String"
  }
  ```

### Volunteer Analytics: `getVolunteerAnalytics`
* **Arguments**: `{}`
* **Description**: Tallies total active incidents and aggregates categorizations.
* **Returns**:
  ```json
  {
    "success": true,
    "data": {
      "totalActive": 5,
      "types": { "medical": 2, "security": 3 },
      "severities": { "high": 4, "low": 1 },
      "statuses": { "active": 5 }
    }
  }
  ```

### Dynamic Concessions Optimizer: `autonomicConcessionOptimiser`
* **Arguments**:
  ```json
  {
    "overstockAlert": true
  }
  ```
* **Description**: Autonomously triggers hotdog points discounts (80p to 40p) to resolve perishable surplus risks.
* **Returns**:
  ```json
  {
    "success": true,
    "pointCost": 40
  }
  ```
