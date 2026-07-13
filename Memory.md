# Persistent Project Memory
## StadiumIQ — GenAI-Powered FIFA World Cup 2026 Operations Platform

This document serves as the persistent state and context memory for the StadiumIQ project. It allows developer agents and engineering teams to seamlessly transition between sessions, resume work, and maintain full situational awareness of the implementation status.

---

## 1. Project Summary

**StadiumIQ** is a GenAI-enabled stadium operations and tournament experience platform for the FIFA World Cup 2026. It integrates real-time sensors, computer vision crowd tracking, multilingual RAG chat agents, and transit coordination networks across three applications:
1. **Fan Web App** (React PWA / Vite)
2. **Organizer Command Center Dashboard** (Next.js 14)
3. **Staff & Volunteer Portal** (React PWA / Vite)

---

## 2. Current Progress

- **Current Phase:** Phase 3: Conversational AI Assistants & Translation Engine (Complete)
- **Next Milestone:** Phase 4: Real-time Crowd Intelligence & Prediction Engine
- **Progress Percentage:** ~55% (FastAPI microservice built, pgvector schema added, cosine similarity query retriever written, LLM prompt orchestrations for Fan/Staff/Manager workflows implemented, voice translation stubs configured, and build verified)

---

## 3. Completed Features

| Code | Feature Area | Description | Date Completed |
|---|---|---|---|
| FEAT-00 | Documentation Suite | Finished `PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, and `Memory.md` | 2026-07-13 |
| FEAT-01 | Monorepo Setup & Shells | Set up Turborepo workspaces, Docker Compose backends, Kong API gateway routes, and boilerplate shells for Command Center Next.js, Fan Vite PWA, and Volunteer Vite PWA with premium layout grids | 2026-07-13 |
| FEAT-02 | Database & CRUD APIs | Modeled schema.prisma relations, compiled shared database Client, constructed mock seeder script (`npm run db:seed`), and implemented express microservice APIs (Fan, Volunteer, Transport) with validation and Redis caching | 2026-07-13 |
| FEAT-03 | AI Assistants & Translation | Built FastAPI AI microservice, created pgvector KnowledgeBase schema, wrote cosine similarity retrieval query, implemented LLM prompt workflows, and integrated Speech-to-Text / Text-to-Speech translation placeholders | 2026-07-13 |

---

## 4. Pending Features

| Feature ID | Feature Area | Priority | Assigned Phase | Target Completion |
|---|---|---|---|---|
| FEAT-01 | Monorepo & Auth | P0 | Phase 1 | TBD |
| FEAT-02 | Core Database & CRUD | P0 | Phase 2 | TBD |
| FEAT-03 | Multilingual AI Chat/STT/TTS | P0 | Phase 3 | TBD |
| FEAT-04 | Crowd Intel CV/Kafka Ingestion | P0 | Phase 4 | TBD |
| FEAT-05 | Transport & Sustainability | P1 | Phase 5 | TBD |
| FEAT-06 | Load & Accessibility Hardening | P0 | Phase 6 | TBD |
| FEAT-07 | Multi-Region Active-Active Deploy | P0 | Phase 7 | TBD |

---

## 5. Current Folder Structure

```
promptwar/ (Root Workspace)
├── apps/
│   ├── command-center/         # Next.js 14 Dashboard Console
│   ├── fan-app/               # React Vite Fan Web App (PWA)
│   └── volunteer-portal/      # React Vite Volunteer Portal App (PWA)
├── docker/
│   └── postgres-init/
│       └── 01-extensions.sql   # Postgres pgvector extension initializer
├── packages/
│   ├── eslint-config/         # Shared eslint configuration rules
│   └── tsconfig/              # Shared compiler tsconfigs
├── services/
│   └── api-gateway/
│       └── kong.yml            # Declarative gateway route configuration
├── docker-compose.yml         # Developer environment backing containers
├── package.json               # Monorepo workspaces coordinator
├── turbo.json                 # Turborepo task pipeline mappings
├── Architecture.md            # System architecture details
├── Design.md                  # Layout typography and color styles
├── Memory.md                  # Ongoing developer logs (This file)
├── Phases.md                  # 7-phase step-by-step roadmap
├── PRD.md                     # StadiumIQ product specs
└── Rules.md                   # Strict programming code standards
```

---

## 6. Database Status

- **Database Engine:** PostgreSQL + pgvector extension (Core & Vector) + InfluxDB OSS (Time-Series) + Redis OSS (Cache) + OpenSearch (Search Index) + MinIO (Object Storage)
- **Status:** **Prisma Schema Modeled & Compiled**
- **Migrations:** Baseline schemas drafted in schema.prisma and generated client ready for PostgreSQL initialization.

---

## 7. API Status

- **API Architecture:** RESTful microservices + WebSockets (for alerts) + gRPC (inter-service) proxied by Kong Gateway.
- **Status:** **REST Services Mapped & Code Built**
- **Endpoints:** Downstream microservices (Fan, Volunteer, Transport) fully built, containing Zod validation layers and Redis cache lookups.

---

## 8. Known Bugs

*None. Code development has not yet commenced.*

---

## 9. Technical Decisions

| ID | Decision | Alternative Evaluated | Rationale | Date |
|---|---|---|---|---|
| DEC-01 | Monorepo Structure | Multi-repo setup | Turborepo allows sharing TypeScript typings and common validation logic across Vite (PWA) and Next.js (web) in a single repository, lowering developer friction. | 2026-07-13 |
| DEC-02 | Next.js 14 Web Portal | React SPA (Vite) | Next.js Server-Side Rendering (SSR) speeds up initial loading for Command Center dashboards, and App Router provides neat layout scoping. | 2026-07-13 |
| DEC-03 | Go for Route Computing | Node.js | Go's memory footprint and high runtime efficiency make it ideal for solving real-time graph routing (A* search with density weighting) under high-throughput loads. | 2026-07-13 |

---

## 10. Dependencies

List of standard libraries and framework packages to be initialized:

- **Frontend:** Next.js, React (Vite), Zustand, TanStack Query, TailwindCSS, Lucide Icons, Recharts.
- **Backend:** Node.js Express, Python FastAPI, Go, Kong Gateway, LangChain, Kafka-node, Prisma.
- **Infrastructure:** Docker Compose, Prometheus, Loki, Grafana, Caddy/Nginx.

---

## 11. Next Tasks

1. [x] Setup Turborepo monorepo directory structures.
2. [x] Define shared ESLint, Prettier, and custom compilation configurations.
3. [x] Configure Docker Compose mapping Postgres (pgvector), Redis, InfluxDB, MinIO, OpenSearch, and Kafka.
4. [x] Initialize Next.js 14 Command Center dashboard structure.
5. [x] Configure basic NextAuth login routes on Next.js shell.
6. [x] Design database schemas and migration files for Phase 2.
7. [x] Build database mock seeding script (`npm run db:seed`).
8. [x] Instantiate FastAPI microservice for AI & Translation endpoints (`services/ai-service`).
9. [x] Design local vector database queries using pgvector.
10. [ ] Set up FastAPI microservice for Crowd Intelligence (`services/crowd-intel-service`).
11. [ ] Configure InfluxDB time-series measurements mapping crowd density and gate queue lengths.
12. [ ] Build simulated crowd telemetry data loops.
13. [ ] Implement LSTM-based 15-minute surge prediction networks.

---

## 12. Notes

- **AI Prompt Safety:** When future agents process implementation tasks, they must read and follow the constraints in [Rules.md](file:///c:/Users/sharo/Desktop/promptwar/Rules.md) strictly (e.g., absolute typing, no hardcoded secrets, and no duplicate code blocks).
- **Offline Fallbacks:** Ensure the Fan Web App design uses Service Workers (IndexedDB) for caching navigation vectors to support users during network outages.
