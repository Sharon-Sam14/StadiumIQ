# StadiumIQ 🏟️

### GenAI-Powered FIFA World Cup 2026 Operations Platform

StadiumIQ is an event operations platform designed for the FIFA World Cup 2026. Decoupled into a serverless **Firebase + Vercel** architecture, StadiumIQ connects event fans, volunteers, and ops managers across three unified frontend portals:

1. **Fan Portal (PWA)**: Ticeting, BLE indoor navigation, eco-gamification, and AI concessions price optimizations.
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
