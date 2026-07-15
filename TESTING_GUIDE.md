# Testing Reference Manual

This guide describes how to run the Vitest and Supertest testing suites configured in StadiumIQ to verify backend endpoints and frontend logic.

---

## 🧪 Running the Tests

To run all tests across all workspaces:
```bash
npm run test
```

To run tests in a specific microservice workspace:
```bash
# Fan Service
npm run test -w @stadiumiq/fan-service

# Volunteer Service
npm run test -w @stadiumiq/volunteer-service

# Transport Service
npm run test -w @stadiumiq/transport-service

# Fan App (Frontend)
npm run test -w @stadiumiq/fan-app
```

---

## 🛠️ Testing Setup Details

### 1. Backend Mock Engine
To run tests in isolation without requiring external cache brokers (Redis) or active databases:
- **Prisma Clients**: Mocks database queries using Vitest's `vi.mock("@stadiumiq/database")` to return fixture records.
- **Redis Cache Client**: Mocks `redis` client setup to bypass network calls.
- **Kafka Event Producers**: Mocks `kafkajs` client to bypass event broker setup.

### 2. Frontend Unit & Logic Tests
Vite applications utilize **Vitest** + **React Testing Library** + **JSDOM** to mount components and test UI states:
- **Incident Forms**: Verifies validation and submissions.
- **Game State Logic**: Verifies xp points calculation and progress milestones.
- **BLE Beacon Calculations**: Verifies trilateration algorithms.
- **Animations**: Verifies animation frame and delay hooks.
