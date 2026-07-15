# StadiumIQ 🏟️
### GenAI-Powered FIFA World Cup 2026 Operations Platform

> **"To make the FIFA World Cup 2026 the most intelligently operated and inclusively experienced sporting event in human history."**

StadiumIQ is a production-ready, enterprise-grade monorepo platform that delivers a unified AI intelligence layer across three primary surfaces — a **Fan PWA**, an **Organizer Command Center**, and a **Volunteer Portal** — to manage crowd safety, navigation, multi-language support, incident analytics, and eco-gamification for the largest sporting event in history.

---

## 🌟 Platform Highlights

| Surface | Audience | Technology |
|---------|----------|------------|
| **Fan Web App (PWA)** | Global Fans | React 18 + Vite + TailwindCSS |
| **Organizer Command Center** | Venue Ops / FIFA HQ | Next.js 14 App Router |
| **Staff & Volunteer Portal** | Volunteers & Staff | React 18 + Vite PWA |
| **AI Concierge Service** | All Surfaces | Python FastAPI + Gemini SDK |
| **Data & Persistence** | Backend | Prisma ORM + PostgreSQL + Redis |
| **Real-time Messaging** | Backend | WebSockets + Apache Kafka |
| **API Routing** | Backend | Kong API Gateway |

---

## 🚀 Core Feature Areas (All 8 Phases Complete)

### ✅ Phase 1 — Monorepo Setup & App Shells
- Turborepo monorepo with shared `tsconfig` and `eslint-config` packages
- Docker Compose backing infrastructure (PostgreSQL, Redis, InfluxDB, Kafka, Kong)
- Glassmorphic UI design system across all three apps (dark mode, brand-gold/green palette)

### ✅ Phase 2 — Database & CRUD APIs
- Prisma schema with relational models: `User`, `Ticket`, `Match`, `Gate`, `Incident`, `VolunteerTask`, `KnowledgeBase`
- Express microservices: Fan Service (3001), Volunteer Service (3002), Transport Service (3003)
- Database seeder with FIFA match schedules, gate configs, tickets, and volunteer checklists

### ✅ Phase 3 — AI Concierge & Multilingual Support
- Python FastAPI AI service with Gemini SDK + pgvector RAG retrieval
- Fan-facing AI chat with simulated prompt inspector for hackathon demo
- Graceful fallback context when pgvector extension unavailable

### ✅ Phase 4 — Crowd Intelligence & Forecasting
- InfluxDB integration for real-time telemetry ingestion
- NumPy crowd surge prediction (5–15 min forecast window)
- Alert thresholds: Green (<60%), Yellow (60–79%), Orange (80–89%), Red (≥90%)

### ✅ Phase 5 — Real-time Alerts & Pub/Sub
- Apache Kafka event topics + WebSocket broadcast server
- Manager-triggered `POST /api/v1/volunteers/broadcast` safety alerts
- Live safety banners on Fan PWA and Command Center

### ✅ Phase 6 — Spatial Navigation & BLE Indoor Positioning
- Custom SVG stadium map with dynamic gate congestion markers
- RSSI path-loss formula for BLE beacon distance calculation
- 2D trilateration solver (Cramer's rule) + walk simulator slider

### ✅ Phase 7 — Operations Analytics & Telemetry Dashboard
- Prisma `groupBy` aggregations for incident status, severity, and category
- `GET /api/v1/volunteers/analytics` REST endpoint
- Dynamic Command Center cards + Gate queue wait-time histogram charts

### ✅ Phase 8 — Sustainable Green Upgrades & Gamification
- Eight new Prisma models for eco-gamification (EcoPointTransaction, Reward, Achievement, Challenge, Leaderboard, RecyclingLog, SustainabilityMetric, UserBadge)
- Nine sustainability REST endpoints (points balance, rewards redemption, QR check-ins, recycling logs)
- Fan PWA **Eco Earn** tab: check-in simulator, AI waste sorter, leaderboards, badge carousel, rewards store with QR voucher modals

---

## 🏗️ Monorepo Structure

```
promptwar/
├── apps/
│   ├── command-center/         # Next.js 14 Operations Console  (port 3000)
│   ├── fan-app/                # Vite React Fan PWA             (port 5173)
│   └── volunteer-portal/       # Vite React Volunteer PWA       (port 5174)
├── packages/
│   ├── database/               # Prisma schema, client, seed scripts
│   ├── tsconfig/               # Shared base + vite tsconfig presets
│   └── eslint-config/          # Shared ESLint rule configurations
├── services/
│   ├── api-gateway/            # Kong declarative gateway routes (kong.yml)
│   ├── fan-service/            # Express: Fan ticketing & incidents
│   ├── volunteer-service/      # Express: Volunteer + Sustainability APIs
│   ├── transport-service/      # Express: Transit schedule routes
│   └── ai-service/             # FastAPI: RAG concierge + AI briefings
├── docker-compose.yml          # Full local infrastructure stack
├── .env                        # Environment variables
├── turbo.json                  # Turborepo task pipeline
├── PRD.md                      # Product Requirements Document
├── Architecture.md             # System architecture overview
├── Phases.md                   # 8-phase implementation roadmap
├── Design.md                   # UI/UX design system tokens
├── Memory.md                   # Developer session memory log
└── Rules.md                    # Code standards and rules
```

---

## ⚡ Production Quickstart

### Prerequisites
- **Node.js** v20.x or later (v22.x recommended)
- **Docker & Docker Compose**

### Step 1: Clone & Configure Environment
```bash
git clone https://github.com/Sharon-Sam14/StadiumIQ.git
cd StadiumIQ
cp .env.example .env
# Edit .env with your Google Gemini API Key and secret values
```

### Step 2: Build & Start the Docker Compose Stack
Compile all TypeScript workspaces and build the container stack:
```bash
docker compose up -d --build
```
On startup, `stadiumiq-db-init` will automatically push the schema to PostgreSQL, seed initial data fixtures (default users, challenges, rewards), and compile the prisma engine.

Verify that all 12 services show as `(healthy)`:
```bash
docker compose ps
```

---

## 🧪 Testing and CI/CD

StadiumIQ contains a complete automated integration and unit test suite targeting critical paths, game calculations, BLE indoor navigation algorithms, and API endpoints.

To run all lint checks and test suites across the monorepo:
```bash
# Run lint check
npm run lint

# Run all tests (75/75 passing)
npm run test
```

### GitHub Actions CI/CD Pipeline
Every push or pull request to the `main` branch triggers the [`.github/workflows/ci-cd.yml`](./.github/workflows/ci-cd.yml) automated pipeline, which executes:
1. **Linter gating check** (`eslint` verification)
2. **Automated unit and integration tests** (`vitest` + `supertest`)
3. **TypeScript workspace compiling** (`tsc`)
4. **Docker Compose building** (`docker compose build`)

---

## 📡 REST API Reference

### Fan Service (port 3001)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/fans/me` | Retrieve logged-in fan profile |
| GET | `/api/v1/fans/tickets` | Retrieve active digital tickets (cached) |
| POST | `/api/v1/fans/incidents` | Submit a fan incident report |

### Volunteer Service (port 3002)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/volunteers/tasks` | Fetch volunteer task checklist |
| PATCH | `/api/v1/volunteers/tasks/:id` | Update task completion status |
| GET | `/api/v1/volunteers/briefing` | AI-generated pre-shift briefing |
| POST | `/api/v1/volunteers/incidents` | Log a coordinator incident |
| POST | `/api/v1/volunteers/broadcast` | Broadcast WebSocket safety alert |
| GET | `/api/v1/volunteers/analytics` | Incident analytics aggregations |

### Sustainability & Gamification (port 3002)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sustainability/points/balance` | Eco points + XP balance |
| POST | `/api/v1/sustainability/points/transaction` | Add/spend eco points |
| GET | `/api/v1/sustainability/rewards` | Rewards store items |
| POST | `/api/v1/sustainability/rewards/redeem` | Redeem points for voucher |
| GET | `/api/v1/sustainability/challenges` | Daily sustainability missions |
| GET | `/api/v1/sustainability/leaderboard` | Top fan eco standings |
| GET | `/api/v1/sustainability/metrics` | Stadium sustainability telemetry |
| POST | `/api/v1/sustainability/qr/validate` | Validate QR check-in |
| POST | `/api/v1/sustainability/recycling/log` | Log recycling station drop |

### Transport Service (port 3003)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/transport` | Public transit schedules and parking |

### AI Service (port 8000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/chat` | pgvector RAG fan concierge chat |
| POST | `/api/v1/ai/volunteer/query` | Volunteer procedure AI assistant |
| POST | `/api/v1/ai/copilot/query` | Command center AI co-pilot |

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite 5, Next.js 14, TailwindCSS 3, Lucide React |
| **Backend** | Node.js 20, Express 4, TypeScript 5 (modular layered architecture) |
| **AI** | Python 3.11, FastAPI, Google Gemini SDK, pgvector (RAG) |
| **Database** | PostgreSQL 16 (with pgvector), Prisma ORM 5, Redis 7 (caching) |
| **Messaging** | Apache Kafka, WebSockets (ws library) |
| **Infrastructure** | Docker Compose, Kong API Gateway, InfluxDB, Turborepo |
| **PWA** | vite-plugin-pwa, Service Workers, Web App Manifest |

---

## 🌿 Sustainability & Eco-Gamification

The Fan PWA **Eco Earn** tab delivers a complete green gamification loop:

- 🍃 **Eco Points** — earned by scanning QR codes at transit gates, recycling bins, water refills, and sponsor booths
- 🏆 **Fan XP Leaderboard** — top eco contributors ranked stadium-wide
- 🎯 **Daily Missions** — public transit, smart bin recycling, sponsor booth visits
- 🤖 **AI Waste Segregation Assistant** — classifies waste (plastic/aluminium/paper/organic) to the correct bin
- 🎁 **Rewards Store** — redeem points for concession vouchers, merchandise discounts, subway passes
- 📊 **Live Impact Metrics** — waste saved (kg), carbon offset (kg CO₂), water refills, transit rides

---

## 📊 Key Performance Targets

| Metric | Target |
|--------|--------|
| Platform Uptime (match windows) | ≥ 99.99% |
| API p95 Response Time | ≤ 200ms |
| AI Concierge Response Time | ≤ 2.0s |
| Concurrent Active Sessions | 500,000+ |
| Fan PWA First Contentful Paint | ≤ 1.5s on 4G |
| Languages Supported | 50+ |
| Gate Throughput Improvement | 1,800 → 2,400 fans/hr |
| Fan NPS Score Target | ≥ 75 |

---

## 📄 Operations Manuals & Documentation Index

| Document | Purpose |
|----------|---------|
| **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** | Production topology & deployment lifecycle overview |
| **[BACKEND_DEPLOYMENT.md](./BACKEND_DEPLOYMENT.md)** | backend VM configuration, reverse proxy setup, SSL, log rotation, and backups |
| **[FRONTEND_DEPLOYMENT.md](./FRONTEND_DEPLOYMENT.md)** | Vercel deployment and CI/CD pipelines |
| **[ORACLE_CLOUD_SETUP.md](./ORACLE_CLOUD_SETUP.md)** | Oracle Cloud VM setup, VCN creation, and firewall Security Lists configuration |
| **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** | Custom domains configuration and DNS setups |
| **[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)** | Full templates and list of required keys for all microservices |
| **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** | Pre-flight security and auditing checklist |
| **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)** | OWASP Hardening alignment, non-root users execution, Helmet configuration |
| **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** | Mock test setup parameters and testing index references |
| **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** | REST endpoint schemas and WebSocket event specs |
| **[PRD.md](./PRD.md)** | Full product requirements, user stories, and success metrics |
| **[Architecture.md](./Architecture.md)** | System architecture, service boundaries, and data flows |
| **[Phases.md](./Phases.md)** | 8-phase implementation roadmap |
| **[Design.md](./Design.md)** | UI/UX design tokens, palette, typography, component patterns |
| **[Memory.md](./Memory.md)** | Developer session memory and progress tracking |
| **[Rules.md](./Rules.md)** | Strict code standards, patterns, and architectural rules |

---

*StadiumIQ v1.1.0 — Enterprise Production Grade Upgrade Complete ✅*
