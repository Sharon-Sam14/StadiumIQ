# StadiumIQ Folder Layout — Frontend & Backend Categorization

This document provides a clear mapping of the StadiumIQ directory structure categorized into Frontend and Backend tiers.

---

## 🗺️ System Layout Diagram

```text
stadiumiq-monorepo/
│
├── 🎨 FRONTEND PORTALS (Hosted on Vercel)
│   ├── apps/
│   │   ├── fan-app/                # Vite + React (PWA) Client
│   │   ├── volunteer-portal/       # Vite + React Client
│   │   └── command-center/         # Next.js 14 Management Panel
│   └── packages/
│       ├── tsconfig/               # Shared TS Configurations
│       └── eslint-config/          # Shared Lint Configuration
│
└── ⚙️ BACKEND SERVICES (Hosted on Firebase / Gemini API)
    ├── functions/
    │   ├── src/
    │   │   ├── __tests__/          # Vitest backend tests
    │   │   └── index.ts            # Cloud Functions v2 definitions
    │   └── package.json            # Node backend dependencies
    │
    └── FIREBASE CONFIGURATION FILES
        ├── firebase.json           # Firebase CLI & Emulator setup
        ├── firestore.rules         # Security access policies
        ├── firestore.indexes.json  # Firestore query indexes
        └── storage.rules           # Cloud Storage security rules
```

---

## 🎨 Frontend Tier Mappings

The frontend components run in the client's web browser and communicate with the Firebase backend using client SDKs.

| Directory / File                                                                             | Type              | Description                                                                         |
| :------------------------------------------------------------------------------------------- | :---------------- | :---------------------------------------------------------------------------------- |
| **[apps/fan-app/](file:///c:/Users/sharo/Desktop/promptwar/apps/fan-app)**                   | Vite PWA app      | Fan PWA containing ticketing, eco-gamification views, and AI assistant interface.   |
| **[apps/volunteer-portal/](file:///c:/Users/sharo/Desktop/promptwar/apps/volunteer-portal)** | Vite App          | Portal for stadium volunteers to report incidents and view checklists.              |
| **[apps/command-center/](file:///c:/Users/sharo/Desktop/promptwar/apps/command-center)**     | Next.js 14 App    | Real-time operations console displaying crowd metrics and alerts.                   |
| **`packages/tsconfig/`**                                                                     | TS config presets | Shared configurations to verify typescript compiles identically across all portals. |
| **`packages/eslint-config/`**                                                                | ESLint presets    | Shared formatting guidelines.                                                       |

---

## ⚙️ Backend Tier Mappings

The backend components execute serverless logic, validate rules, query databases, and connect to AI services.

| Directory / File                                                                              | Type                      | Description                                                                                                                                 |
| :-------------------------------------------------------------------------------------------- | :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------ |
| **[functions/src/index.ts](file:///c:/Users/sharo/Desktop/promptwar/functions/src/index.ts)** | TypeScript code           | Contains the definitions for backend handlers: `seedFirestore`, `aiConcierge`, `getVolunteerAnalytics`, and `autonomicConcessionOptimiser`. |
| **[firestore.rules](file:///c:/Users/sharo/Desktop/promptwar/firestore.rules)**               | Access policies           | Enforces role-based checks (`fifa_admin`, `volunteer`) before client writes are committed to Firestore.                                     |
| **[firestore.indexes.json](file:///c:/Users/sharo/Desktop/promptwar/firestore.indexes.json)** | Database index config     | Speeds up points leaderboard sorting queries.                                                                                               |
| **[storage.rules](file:///c:/Users/sharo/Desktop/promptwar/storage.rules)**                   | Storage security policies | Enforces that only logged-in sessions can upload assets.                                                                                    |
| **[firebase.json](file:///c:/Users/sharo/Desktop/promptwar/firebase.json)**                   | Emulator & Deploy config  | Allocates local emulator ports (auth, functions, firestore, storage) and maps codebase sources.                                             |
