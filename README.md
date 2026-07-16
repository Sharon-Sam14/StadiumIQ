# StadiumIQ 🏟️

### GenAI-Powered FIFA World Cup 2026 Operations Platform

StadiumIQ is an event operations platform designed for the FIFA World Cup 2026. Decoupled into a serverless **Firebase + Vercel** architecture, StadiumIQ connects event fans, volunteers, and ops managers across three unified frontend portals:

1. **Fan Portal (PWA)**: Ticketing, BLE indoor navigation, eco-gamification, and AI concessions price optimizations.
2. **Volunteer Portal**: Active incident reporting and checklists.
3. **Command Center**: Real-time crowd surge alerts and incident analytics.

---

## 🏗️ Monorepo Workspaces

```text
promptwar/
├── apps/
│   ├── command-center/         # Next.js 14 Operations Console
│   ├── fan-app/                # Vite React Fan PWA (port 5173)
│   └── volunteer-portal/       # Vite React Volunteer portal (port 5174)
├── packages/
│   ├── tsconfig/               # Shared tsconfig configurations
│   └── eslint-config/          # Shared ESLint rule configurations
├── functions/                  # Firebase Cloud Functions (Node/TS)
├── firebase.json               # Firebase project configuration
├── firestore.rules             # Database read/write access policies
└── storage.rules               # Storage bucket permissions
```

---

## ⚡ Quickstart

### 1. Configure Environment

```bash
cp .env.example .env
# Edit .env and supply VITE_FIREBASE_* parameters and GEMINI_API_KEY
```

### 2. Start Firebase Emulators

Ensure the Firebase CLI is installed, then launch the local emulators:

```bash
firebase emulators:start
```

### 3. Seed Database

Trigger the seed Cloud Function to initialize default matches, venues, challenges, and rewards data:

```bash
curl http://localhost:5001/stadiumiq-serverless/us-central1/seedFirestore
```

### 4. Boot Portals

Start all React frontend portals concurrently using Turborepo:

```bash
npm run dev
```

---

## 🧪 Validation & Testing

Run all workspace test suites (including client BLE path solvers and backend callable functions mocks):

```bash
npm run test
```

Verify formatting and lint guidelines:

```bash
npm run lint
```

---

## 📄 Operations Manuals Index

| Manual                                                     | Topic                                                    |
| :--------------------------------------------------------- | :------------------------------------------------------- |
| **[Architecture.md](./Architecture.md)**                   | System topology, data flow, and spatial path equations.  |
| **[API.md](./API.md)**                                     | Callable Cloud Functions endpoints catalog.              |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)**                       | Hosting on Firebase and Vercel.                          |
| **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**           | Beginner step-by-step credentials and deployment guides. |
| **[TESTING.md](./TESTING.md)**                             | Running Vitest suites and mocks.                         |
| **[SECURITY.md](./SECURITY.md)**                           | Role access boundaries and Helmet headers configuration. |
| **[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)** | Full environment configuration template.                 |
| **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)**   | Pre-flight check specifications.                         |
| **[CONTRIBUTING.md](./CONTRIBUTING.md)**                   | Coding style, Prettier, and commits.                     |
| **[CHANGELOG.md](./CHANGELOG.md)**                         | Tracking versions and new features releases.             |
| **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**             | Port conflict and emulator fixes.                        |

---

## 🗺️ Feature Implementation Index

StadiumIQ is built with a dual architecture containing a self-contained simulated workspace inside `App.tsx` alongside modular workspace structures to support testing, local development, and production scaling.

| Feature Area | Architectural Component / Files | Description |
| :--- | :--- | :--- |
| **Generative AI Concierge** | [functions/src/index.ts (aiConcierge)](file:///c:/Users/sharo/Desktop/promptwar/functions/src/index.ts#L184-L229) <br> [apps/fan-app/.../AssistantTab.tsx](file:///c:/Users/sharo/Desktop/promptwar/apps/fan-app/src/views/fan/tabs/AssistantTab.tsx) <br> [App.tsx (FanTabAi)](file:///c:/Users/sharo/Desktop/promptwar/apps/fan-app/src/App.tsx#L1791-L1992) | Queries Gemini 1.5 Flash using secure proxy function. Falls back to static localized RAG in case of connectivity errors. |
| **BLE Indoor Navigation** | [App.tsx (calculateBleDistance)](file:///c:/Users/sharo/Desktop/promptwar/apps/fan-app/src/App.tsx#L25-L28) <br> [App.tsx (FanTabNavigate)](file:///c:/Users/sharo/Desktop/promptwar/apps/fan-app/src/App.tsx#L1522-L1789) <br> [volunteer-portal/src/App.tsx](file:///c:/Users/sharo/Desktop/promptwar/apps/volunteer-portal/src/App.tsx#L88-L133) | 3-beacon RSSI path-loss distance calculator and 2D linear trilateration coordinate solver. |
| **Sustainability Gamification** | [App.tsx (FanTabEco)](file:///c:/Users/sharo/Desktop/promptwar/apps/fan-app/src/App.tsx#L2095-L2419) <br> [apps/fan-app/src/utils/wasteClassifier.ts](file:///c:/Users/sharo/Desktop/promptwar/apps/fan-app/src/utils/wasteClassifier.ts) | Eco-gamification challenges, points log, carbon counters, and AI keyword waste classifier. |
| **Concessions Price-Drop** | [functions/src/index.ts (autonomicConcessionOptimiser)](file:///c:/Users/sharo/Desktop/promptwar/functions/src/index.ts#L273-L308) <br> [App.tsx (autonomic price tracker)](file:///c:/Users/sharo/Desktop/promptwar/apps/fan-app/src/App.tsx#L288-L301) | Autonomously adjusts point costs of hotdog concession items to mitigate waste during overstock alerts. |
| **Volunteer Checklists & SOP** | [volunteer-portal/src/App.tsx](file:///c:/Users/sharo/Desktop/promptwar/apps/volunteer-portal/src/App.tsx#L340-L398) <br> [App.tsx (VolunteerPortalView)](file:///c:/Users/sharo/Desktop/promptwar/apps/fan-app/src/App.tsx#L2863-L3082) | Active checklist tasks, status updates, and interactive procedural SOP manuals guide. |
| **Command Operations Dashboard** | [command-center/src/app/page.tsx](file:///c:/Users/sharo/Desktop/promptwar/apps/command-center/src/app/page.tsx) <br> [App.tsx (CommandCenterView)](file:///c:/Users/sharo/Desktop/promptwar/apps/fan-app/src/App.tsx#L2425-L2857) | Central operations control console monitoring live crowd occupancy alerts, active incident logs, and pricing controls. |
