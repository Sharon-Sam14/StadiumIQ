# StadiumIQ 🏟️
### GenAI-Enabled Stadium Operations & Fan/Volunteer Coordination System for the FIFA World Cup 2026

StadiumIQ is a production-ready, highly modular microservices platform designed to optimize stadium operations, streamline incident resolution, coordinate massive volunteer forces, and elevate the match-day experience for fans during the FIFA World Cup 2026.

---

## 🌟 Key Capabilities
- **Command Center Dashboard (Next.js 14):** An administrative glassmorphic operations console mapping live match states, gate throughput queues, active incident lists, and containing an AI operations co-pilot dialogue.
- **Fan PWA (Vite + React):** A fast mobile web application featuring digital ticketing QR passes, custom stadium concourse maps, active beacon distance pathfinding, and a multilingual AI concierge chat.
- **Volunteer Portal PWA (Vite + React):** A checklist tracker for volunteers to coordinate assignments, log incidents, and view AI-generated pre-shift procedural briefings.
- **AI & Translation Service (FastAPI):** A Python microservice executing pgvector-grounded RAG (Retrieval-Augmented Generation) queries to resolve stadium protocols, lost child procedures, and concession locations, alongside voice translation stubs.
- **Relational Data Hub (Prisma + PostgreSQL):** Clean relational models mapping matches, gates, tickets, incidents, and volunteer checklists.

---

## 🏗️ Architecture & Monorepo Workspaces

StadiumIQ uses a Turborepo monorepo setup:

```
stadiumiq-monorepo/
├── apps/
│   ├── command-center/      # Next.js 14 Operations Console
│   ├── fan-app/             # Vite + React Fan PWA
│   └── volunteer-portal/    # Vite + React Volunteer Checklist PWA
├── packages/
│   ├── database/            # Prisma schema, shared client connection, and seed scripts
│   ├── tsconfig/            # Shared base compiler configuration overrides
│   └── eslint-config/       # Linting and style sanity checkers
├── services/
│   ├── api-gateway/         # Kong API Gateway configuration maps
│   ├── fan-service/         # Express microservice routing Fan ticketing & profile endpoints
│   ├── volunteer-service/   # Express microservice routing Volunteer checklist transitions
│   ├── transport-service/   # Express microservice routing public transit schedules
│   └── ai-service/          # Python FastAPI RAG AI concierge & speech stubs
├── docker-compose.yml       # PostgreSQL, Redis, InfluxDB, MinIO, OpenSearch, and Kong setup
└── package.json             # Root monorepo workspace dependencies manager
```

---

## 🚀 Local Quickstart Setup

### Prerequisites
Ensure you have the following installed on your machine:
- **Node.js:** v18.x or later (recommended v20.x)
- **Docker & Docker Compose**
- **Python:** v3.10 or later (for AI microservice local validation)

### Step 1: Clone the Repository & Configure Env Variables
Copy the env template at the root:
```bash
cp .env.example .env
```
Ensure you set your database URL and optional Gemini API keys:
```env
DATABASE_URL="postgresql://admin:adminpassword@localhost:5432/stadiumiq?schema=public"
REDIS_URL="redis://localhost:6379"
GEMINI_API_KEY="your_api_key_here"
```

### Step 2: Spin Up Backing Infrastructure
Run docker compose to start PostgreSQL (with pgvector), Redis cache, InfluxDB, MinIO, OpenSearch, Kafka, and the Kong API Gateway:
```bash
docker compose up -d
```

### Step 3: Install Workspaces Dependencies
From the root directory, install npm packages and link local monorepo configurations:
```bash
npm install
```

### Step 4: Run Database Migrations & Seeding
Compile the database schemas, generate Prisma Client types, and seed the Postgres database with tournament schedules, mock fan tickets, and vector knowledge base FAQs:
```bash
# Build the database shared library
npm run build --workspace=@stadiumiq/database

# Seed the Postgres tables and vector knowledge base
npm run db:seed --workspace=@stadiumiq/database
```

### Step 5: Start Local Development Servers
Run the development command at the monorepo root to launch the Next.js console, Vite PWAs, and Node microservices concurrently:
```bash
npm run dev
```
- **Command Center:** `http://localhost:3000`
- **Fan PWA:** `http://localhost:5173`
- **Volunteer Portal:** `http://localhost:5174`

---

## 📡 Microservice REST API Directory

All backend service queries are downstream proxied by the Kong Gateway on port `8000`:

| HTTP Method | Route path | Service | Description | Cache Layer |
|---|---|---|---|---|
| **GET** | `/api/v1/fans/me` | Fan Service | Retrieves profile of the logged-in fan user | Direct DB |
| **GET** | `/api/v1/fans/tickets` | Fan Service | Retrieves active digital tickets and seat locations | Redis Cache (5 mins) |
| **POST** | `/api/v1/fans/incidents` | Fan Service | Submits a new incident report from a fan | Direct DB |
| **GET** | `/api/v1/volunteers/tasks` | Volunteer Service | Fetches checklist items assigned to a volunteer | Direct DB |
| **PATCH** | `/api/v1/volunteers/tasks/:id` | Volunteer Service | Transitions status of a volunteer checklist task | Direct DB |
| **GET** | `/api/v1/volunteers/briefing` | Volunteer Service | Returns AI-generated shift briefing based on role | Redis Cache (10 mins) |
| **POST** | `/api/v1/volunteers/incidents` | Volunteer Service | Logs a coordinator-level incident | Direct DB |
| **GET** | `/api/v1/transport` | Transport Service | Returns public transit schedules and parking rates | Mock Data |
| **POST** | `/api/v1/ai/chat` | AI Service | Grounded QA concierge response utilizing pgvector RAG | Gemini SDK |
| **POST** | `/api/v1/ai/volunteer/query` | AI Service | Responds to volunteer procedures based on SOP vector texts | Gemini SDK |
| **POST** | `/api/v1/ai/copilot/query` | AI Service | Incident mitigations suggestions for dashboard users | Gemini SDK |
