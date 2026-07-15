# persistent Context Memory — StadiumIQ

This file serves as a persistent context index to guide future developers and AI agents working on StadiumIQ.

---

## 1. Project Overview & Current Stack
StadiumIQ is a serverless operations platform for managing stadium events.
* **Hosting**: Vercel
* **Backend**: Google Firebase (Cloud Firestore + Authentication + Cloud Functions v2)
* **Testing framework**: Vitest (Unit and integration tests)
* **Codebase Pattern**: Decoupled monorepo workspaces managed via Turborepo.

---

## 2. Core Operational Hooks
* **[`useIncidents`](file:///c:/Users/sharo/Desktop/promptwar/apps/fan-app/src/hooks/useIncidents.ts)**: Synchronizes logged safety incidents in real-time with Firestore collections.
* **[`useEcoPoints`](file:///c:/Users/sharo/Desktop/promptwar/apps/fan-app/src/hooks/useEcoPoints.ts)**: Syncs points transactions and balances to the user's leaderboard standings.
* **[`useWebSocket`](file:///c:/Users/sharo/Desktop/promptwar/apps/fan-app/src/hooks/useWebSocket.ts)**: Implements snapshot listeners for real-time sustainability status and metrics updates.

---

## 3. Serverless Backend Functions

Located inside `functions/src/index.ts`:
- `seedFirestore`: Populates database collections with initial mock fixtures.
- `aiConcierge`: Processes concierge chat requests securely using the Gemini SDK.
- `getVolunteerAnalytics`: Generates totals metrics groupings for active incidents.
- `autonomicConcessionOptimiser`: Updates points costs dynamically during simulated concessions overstock events.

---

## 4. Key Configurations
- `firebase.json`: Emulator configuration mappings.
- `firestore.rules`: Authorization security layers.
- `apps/fan-app/src/utils/firebase.ts`: Direct client-side configurations connecting to either live services or local emulator ports.
