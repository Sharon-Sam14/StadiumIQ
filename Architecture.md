# Architecture Document
## StadiumIQ — GenAI-Powered FIFA World Cup 2026 Operations Platform

**Version:** 1.0.0  
**Status:** Draft  
**Owner:** Architecture Team  
**Last Updated:** 2026-07-13  

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Application Flow](#2-application-flow)
3. [Tech Stack](#3-tech-stack)
4. [Folder Structure](#4-folder-structure)
5. [Database Schema](#5-database-schema)
6. [API Structure](#6-api-structure)
7. [Authentication Flow](#7-authentication-flow)
8. [Component Structure](#8-component-structure)
9. [State Management](#9-state-management)
10. [Third-Party Services](#10-third-party-services)
11. [Deployment Architecture](#11-deployment-architecture)

---

## 1. System Architecture

### 1.1 High-Level Architecture Overview

StadiumIQ is built on a **cloud-native, microservices-based architecture** with an event-driven backbone. The platform is composed of three primary client surfaces communicating with a unified API Gateway, backed by specialized microservices, real-time data pipelines, and AI inference engines.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT SURFACES                                   │
│  ┌──────────────────┐  ┌────────────────────┐  ┌─────────────────────────┐ │
│  │   Fan Web App    │  │  Command Center    │  │  Staff/Volunteer Portal │ │
│  │      (PWA)       │  │  (Web Dashboard)   │  │         (PWA)           │ │
│  └────────┬─────────┘  └────────┬───────────┘  └──────────┬──────────────┘ │
└───────────┼─────────────────────┼──────────────────────────┼───────────────┘
            │                     │                          │
            └──────────────────┬──┘                          │
                               │  HTTPS / WebSocket / gRPC   │
┌──────────────────────────────▼─────────────────────────────▼───────────────┐
│                          API GATEWAY LAYER                                  │
│         Kong Gateway — Auth, Rate Limiting, Routing, Observability          │
└───────────────────────────────────────────────    ┌────────▼──────┐    ┌─────────▼──────┐    ┌────────────▼────────────┐
    │  Primary DB   │    │  Time-Series   │    │   Vector DB             │
    │  PostgreSQL   │    │  InfluxDB      │    │  pgvector Extension     │
    │ (Core + Vector)│   │  (Sensor Data) │    │  (Inside PostgreSQL)    │
    └───────────────┘    └────────────────┘    └─────────────────────────┘
            │                     │                         │
    ┌────────▼──────┐    ┌─────────▼──────┐    ┌────────────▼────────────┐
    │  Cache Layer  │    │  Blob Storage  │    │   Search Index          │
    │  Redis        │    │  MinIO         │    │   OpenSearch            │
    │  (Self-Hosted)│    │  (Self-Hosted) │    │   (Self-Hosted)         │
    └───────────────┘    └────────────────┘    └─────────────────────────┘            │           │          │           │           │
┌───────────▼───────────▼──────────▼───────────▼───────────▼───────────────┐
│                     EVENT BUS (Apache Kafka)                               │
│   Topics: crowd.events | ai.requests | nav.updates | transport.status      │
│            incidents | sustainability | alerts | audit.log                 │
└──────────────────────────────────────────────────────────────────────────── ┘
            │           │           │           │           │
     ┌──────▼──┐  ┌─────▼───┐ ┌────▼────┐ ┌───▼────┐ ┌────▼────────┐
     │  Fan    │  │  Crowd  │ │  AI/LLM │ │ Trans- │ │  Volunteer  │
     │ Service │  │  Intel  │ │ Service │ │ port   │ │  Service    │
     │         │  │ Service │ │         │ │Service │ │             │
     └──────┬──┘  └─────┬───┘ └────┬────┘ └───┬────┘ └────┬────────┘
```

### 1.2 Architecture Principles

| Principle | Implementation |
|-----------|----------------|
| **Microservices** | Each domain (Fan, Crowd, AI, Transport, Volunteer) is an independent deployable service |
| **Event-Driven** | Services communicate asynchronously via Kafka; no tight coupling |
| **API-First** | All functionality exposed via versioned REST + WebSocket APIs |
| **AI-Native** | LLM inference, embeddings, and computer vision are first-class citizens |
| **Privacy-by-Design** | PII minimized at collection; data processed in-memory where possible |
| **Multi-Region** | Active-active deployment across US-East, US-West, and EU-West |
| **Offline-First (Mobile)** | Fan app works with cached data and syncs on reconnection |
| **Zero-Trust Security** | No implicit trust; every service call authenticated and authorized |

---

## 2. Application Flow

### 2.1 Fan Navigation Flow

```
Fan opens app
     │
     ├──► Location detected via BLE beacons / GPS
     │
     ├──► Fan inputs destination (seat, food, restroom, etc.)
     │
     ├──► Navigation Service queries:
     │         ├── Venue BIM (Building Information Model)
     │         ├── Live crowd density (Crowd Intel Service)
     │         └── Accessibility profile (Fan profile store)
     │
     ├──► Route computed with A* + density penalty weighting
     │
     ├──► AI Agent generates natural language directions in fan's preferred language
     │
     ├──► Route delivered via:
     │         ├── Screen (map with step indicators)
     │         ├── Voice (TTS in preferred language)
     │         └── AR overlay (optional)
     │
     └──► Continuous monitoring: on density change >= threshold → reroute + notify
```

### 2.2 Crowd Intelligence Alert Flow

```
Sensor Data Ingestion (every 5s)
     │
     ├── CCTV Computer Vision → Crowd Counter Model → Zone Density
     ├── BLE Beacon Pings → Device Count per Zone
     ├── Wi-Fi Controller → Client Count per AP Zone
     └── Gate Ticketing → Throughput per Gate
          │
          ▼
     Kafka: crowd.events topic
          │
          ▼
     Crowd Intel Service
          ├── Aggregates all signals per zone
          ├── Runs density model (30s window)
          ├── Runs predictive surge model (LSTM + match event feed)
          └── Evaluates thresholds
               │
               ├── Green/Yellow: update heatmap only
               ├── Orange: alert to Command Center dashboard
               └── Red: automated escalation → PA + staff dispatch + fan app rerouting
```

### 2.3 AI Assistant Conversation Flow

```
Fan/Volunteer sends query (text or voice)
     │
     ├── Voice: STT (Whisper API) → text transcript
     │
     ├── Language Detection (LangDetect)
     │
     ├── Intent Classification (fine-tuned classifier)
     │         ├── Navigation intent → Navigation Service
     │         ├── F&B query → Venue Data Service
     │         ├── Safety query → Safety Protocol KB
     │         └── General query → LLM RAG pipeline
     │
     ├── Context enrichment:
     │         ├── Fan location
     │         ├── Current match/schedule
     │         └── Conversation history (Redis session store)
     │
     ├── LLM inference (GPT-4o / Gemini 1.5 Pro with RAG)
     │
     ├── Confidence score check:
     │         ├── >= 70%: return AI response
     │         └── < 70%: escalate to human with full context
     │
     ├── Response generation in detected language
     │
     └── TTS (if voice mode) → response delivered
```

---

## 3. Tech Stack

### 3.1 Frontend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Fan Web App (PWA) | React + Vite (Workbox) | Progressive Web App, fast service-worker caching, no app store barrier |
| Command Center Web | Next.js 14 (App Router) | SSR for initial load speed, React for interactivity |
| Volunteer Portal | React PWA (Vite) | Lightweight React web app, offline capability, low-end mobile browser support |
| AR Wayfinding | WebXR API + three.js | Standards-compliant web AR navigation directly in browser |
| Maps/Indoor Nav | Mapbox GL JS + custom BLE layer | High-performance indoor/outdoor mapping |
| Charts & Analytics | Recharts + D3.js | Custom, performant data visualizations |
| State Management | Zustand + TanStack Query | Lightweight, performant, cache-aware state across web apps |
| Styling | CSS Modules + TailwindCSS | Utility-first, consistent tokens, isolated web styling |
| Internationalization | i18next + react-i18next | 50+ language support, lazy-loaded namespaces |

### 3.2 Backend

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| API Gateway | Kong OSS | Rate limiting, auth, routing, plugin ecosystem |
| Fan Service | Node.js + Express + TypeScript | High-concurrency, non-blocking I/O for real-time features |
| Crowd Intel Service | Python + FastAPI | Numpy/Pandas/OpenCV integration for ML pipelines |
| AI/LLM Service | Python + FastAPI + LangChain | LangChain for RAG orchestration, LLM provider abstraction |
| Navigation Service | Go (Golang) | High-performance route computation, low latency |
| Transport Service | Node.js + TypeScript | Third-party API integrations (Uber, GTFS-RT, parking) |
| Volunteer Service | Node.js + TypeScript | CRUD-heavy, real-time task assignment via WebSocket |
| Sustainability Service | Python + FastAPI | IoT sensor integration, data aggregation, ML scoring |
| Real-time Messaging | WebSocket (ws library) + Socket.io | Bidirectional real-time communication for alerts |
| Event Bus | Apache Kafka (Confluent Cloud) | High-throughput, fault-tolerant event streaming |
| Background Jobs | BullMQ (Redis-backed) | Scheduled reports, async AI processing, notifications |
| gRPC | Protocol Buffers + grpc-node | Service-to-service typed communication |

### 3.3 Database (100% Free & Self-Hosted)

| Type | Technology | Used For |
|------|-----------|----------|
| Primary Relational | PostgreSQL 16 (Self-Hosted OSS) | Users, venues, events, tickets, incidents, tasks |
| Time-Series | InfluxDB OSS (Self-Hosted OSS) | Crowd density sensor readings, energy consumption, IoT data |
| Vector Database | pgvector (Open-source PostgreSQL extension) | LLM embeddings for RAG (FAQ, procedures, venue knowledge) |
| Cache / Session | Redis 7 OSS (Self-Hosted OSS) | Session tokens, AI conversation context, real-time leaderboards |
| Search | OpenSearch 2.x (Self-Hosted OSS) | Full-text search across venues, FAQs, incidents |
| Document Store | MongoDB Community Edition (Self-Hosted OSS) | Volunteer briefings, AI-generated reports, flexible config |

### 3.4 Authentication (Free & Open Source)

| Component | Technology |
|-----------|-----------|
| Authentication Engine | NextAuth.js / Auth.js (Frontend) + self-hosted token logic |
| Protocol | JWT OAuth 2.0 / Stateless Sessions |
| Token Format | JWT (HS256 or self-signed RS256) |
| Session Management | Stateless JWTs / Redis-backed server sessions |
| Fan Auth | Free Social Logins (Google, Apple ID) + passwordless Email OTP |
| Staff/Organizer Auth | Custom user DB credentials + local TOTP validation (speakeasy/otplib) |
| Service-to-Service | Local network isolation / JWT header validation |
| Role Management | RBAC stored directly in Postgres `users.role` ENUM |

### 3.5 Storage (Free & Self-Hosted)

| Type | Technology | Used For |
|------|-----------|----------|
| Object Storage | MinIO (Self-Hosted S3-Compatible OSS) | Venue maps, media, reports, CCTV snapshots |
| CDN | Cloudflare (Free Tier) | Static web assets caching, map tiles delivery |
| File Storage | MinIO / Local Docker Volume Mounts | Operational documents, volunteer manuals |
| Backup | pg_dump / Influx backup + automated cron scripts | Automated local backups, offsite rsync (free) |

### 3.6 Deployment (100% Free & Open Source)

| Layer | Technology |
|-------|-----------|
| Container Runtime | Docker + Docker Compose (100% Free & Open-source local/production orchestration) |
| Orchestration | K3s (Lightweight Kubernetes, 100% free) or Docker Compose for production VPS |
| CI/CD | GitHub Actions (Free tier minutes) + local runners |
| Infrastructure as Code | Docker Compose files / local shell scripting |
| Reverse Proxy | Nginx / Caddy (Caddy offers automatic HTTPS for free) |
| Secrets Management | Encrypted `.env` files / Docker Secrets |
| Monitoring | Prometheus + Grafana (Self-Hosted, 100% Free OSS) |
| Logging | Loki + Grafana (Self-Hosted, 100% Free OSS) |
| Error Tracking | GlitchTip (Self-Hosted open-source Sentry alternative) |
| Uptime Monitoring | Uptime Kuma (Self-Hosted, 100% Free OSS) |

---

## 4. Folder Structure

```
stadiumiq/
├── apps/
│   ├── fan-app/                          # React Web App (PWA)
│   │   ├── src/
│   │   │   ├── pages/                    # Web pages (React Router routing)
│   │   │   │   ├── login.tsx
│   │   │   │   ├── onboarding.tsx
│   │   │   │   ├── home.tsx
│   │   │   │   ├── navigate.tsx
│   │   │   │   ├── assistant.tsx
│   │   │   │   ├── transport.tsx
│   │   │   │   ├── ticket.tsx
│   │   │   │   └── sustainability.tsx
│   │   │   ├── components/
│   │   │   │   ├── navigation/
│   │   │   │   │   ├── StadiumMap.tsx
│   │   │   │   │   ├── RouteOverlay.tsx
│   │   │   │   │   └── ARWayfinder.tsx
│   │   │   │   ├── assistant/
│   │   │   │   │   ├── ChatBubble.tsx
│   │   │   │   │   ├── VoiceInput.tsx
│   │   │   │   │   └── LanguageSelector.tsx
│   │   │   │   ├── crowd/
│   │   │   │   │   └── DensityBadge.tsx
│   │   │   │   ├── transport/
│   │   │   │   │   ├── TransitCard.tsx
│   │   │   │   │   └── RideShareOptions.tsx
│   │   │   │   └── ui/
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Card.tsx
│   │   │   │       ├── Input.tsx
│   │   │   │       ├── Modal.tsx
│   │   │   │       ├── Badge.tsx
│   │   │   │       └── Skeleton.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useNavigation.ts
│   │   │   │   ├── useAssistant.ts
│   │   │   │   ├── useCrowdDensity.ts
│   │   │   │   ├── useBLEBeacon.ts
│   │   │   │   └── useTransport.ts
│   │   │   ├── stores/
│   │   │   │   ├── fanStore.ts
│   │   │   │   ├── navigationStore.ts
│   │   │   │   └── sessionStore.ts
│   │   │   ├── services/
│   │   │   │   ├── api.ts
│   │   │   │   ├── navigationService.ts
│   │   │   │   ├── assistantService.ts
│   │   │   │   └── transportService.ts
│   │   │   ├── i18n/
│   │   │   │   ├── index.ts
│   │   │   │   └── locales/
│   │   │   │       ├── en.json
│   │   │   │       ├── es.json
│   │   │   │       ├── fr.json
│   │   │   │       └── [50+ locale files]
│   │   │   ├── types/
│   │   │   │   ├── fan.types.ts
│   │   │   │   ├── venue.types.ts
│   │   │   │   └── api.types.ts
│   │   │   └── utils/
│   │   │       ├── constants.ts
│   │   │       ├── formatters.ts
│   │   │       └── validators.ts
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── command-center/                   # Next.js 14 Organizer Web App
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/
│   │   │   │   │   └── login/
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── crowd/
│   │   │   │   │   ├── incidents/
│   │   │   │   │   ├── volunteers/
│   │   │   │   │   ├── sustainability/
│   │   │   │   │   └── reports/
│   │   │   │   ├── api/                  # Next.js API routes (BFF layer)
│   │   │   │   └── layout.tsx
│   │   │   ├── components/
│   │   │   │   ├── heatmap/
│   │   │   │   │   ├── CrowdHeatmap.tsx
│   │   │   │   │   └── ZoneCard.tsx
│   │   │   │   ├── copilot/
│   │   │   │   │   ├── AICopilot.tsx
│   │   │   │   │   └── QueryInput.tsx
│   │   │   │   ├── incidents/
│   │   │   │   │   ├── IncidentFeed.tsx
│   │   │   │   │   └── IncidentDetail.tsx
│   │   │   │   ├── charts/
│   │   │   │   │   ├── DensityTimeline.tsx
│   │   │   │   │   ├── SustainabilityChart.tsx
│   │   │   │   │   └── ThroughputChart.tsx
│   │   │   │   └── ui/                   # Shared UI primitives
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── websocket.ts
│   │   │   │   └── api-client.ts
│   │   │   └── styles/
│   │   │       ├── globals.css
│   │   │       └── design-tokens.css
│   │   ├── public/
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── volunteer-portal/                 # React Web App (PWA)
│       ├── src/
│       │   ├── pages/
│       │   │   ├── ShiftBriefing.tsx
│       │   │   ├── TaskQueue.tsx
│       │   │   ├── AIAssistant.tsx
│       │   │   └── IncidentReport.tsx
│       │   ├── components/
│       │   └── services/
│       ├── vite.config.ts
│       ├── index.html
│       └── package.json
│
├── services/                             # Backend Microservices
│   ├── api-gateway/                      # Kong configuration
│   │   ├── kong.yml
│   │   ├── plugins/
│   │   └── routes/
│   │
│   ├── fan-service/                      # Node.js + TypeScript
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── fanController.ts
│   │   │   │   ├── ticketController.ts
│   │   │   │   └── incidentController.ts
│   │   │   ├── routes/
│   │   │   │   ├── fanRoutes.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   ├── fanService.ts
│   │   │   │   ├── ticketService.ts
│   │   │   │   └── notificationService.ts
│   │   │   ├── models/
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── rateLimit.middleware.ts
│   │   │   │   └── validate.middleware.ts
│   │   │   ├── kafka/
│   │   │   │   ├── producer.ts
│   │   │   │   └── consumer.ts
│   │   │   └── app.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── crowd-intel-service/              # Python + FastAPI
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── crowd_router.py
│   │   │   │   └── alert_router.py
│   │   │   ├── models/
│   │   │   │   ├── crowd_density_model.py
│   │   │   │   ├── surge_predictor.py
│   │   │   │   └── computer_vision.py
│   │   │   ├── services/
│   │   │   │   ├── crowd_aggregator.py
│   │   │   │   ├── alert_engine.py
│   │   │   │   └── heatmap_generator.py
│   │   │   ├── kafka/
│   │   │   │   ├── producer.py
│   │   │   │   └── consumer.py
│   │   │   └── main.py
│   │   ├── models/                       # Trained ML model artifacts
│   │   │   ├── surge_predictor_v2.pkl
│   │   │   └── crowd_cv_model/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── ai-service/                       # Python + FastAPI + LangChain
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── chat_router.py
│   │   │   │   └── copilot_router.py
│   │   │   ├── chains/
│   │   │   │   ├── fan_assistant_chain.py
│   │   │   │   ├── ops_copilot_chain.py
│   │   │   │   └── volunteer_chain.py
│   │   │   ├── rag/
│   │   │   │   ├── indexer.py
│   │   │   │   ├── retriever.py
│   │   │   │   └── knowledge_base/
│   │   │   │       ├── venue_faq.md
│   │   │   │       ├── emergency_protocols.md
│   │   │   │       └── tournament_schedule.json
│   │   │   ├── guardrails/
│   │   │   │   ├── content_filter.py
│   │   │   │   └── factual_grounding.py
│   │   │   ├── translation/
│   │   │   │   ├── stt_service.py
│   │   │   │   └── tts_service.py
│   │   │   └── main.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── navigation-service/               # Go (Golang)
│   │   ├── cmd/
│   │   │   └── server/
│   │   │       └── main.go
│   │   ├── internal/
│   │   │   ├── router/
│   │   │   │   ├── astar.go
│   │   │   │   └── density_weight.go
│   │   │   ├── ble/
│   │   │   │   └── beacon_tracker.go
│   │   │   ├── models/
│   │   │   └── api/
│   │   ├── pkg/
│   │   ├── go.mod
│   │   └── Dockerfile
│   │
│   ├── transport-service/                # Node.js + TypeScript
│   │   ├── src/
│   │   │   ├── integrations/
│   │   │   │   ├── gtfs.client.ts
│   │   │   │   ├── uber.client.ts
│   │   │   │   ├── lyft.client.ts
│   │   │   │   └── parking.client.ts
│   │   │   ├── services/
│   │   │   └── routes/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── volunteer-service/                # Node.js + TypeScript
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── websocket/
│   │   │   └── routes/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── sustainability-service/           # Python + FastAPI
│       ├── src/
│       │   ├── sensors/
│       │   ├── scoring/
│       │   └── api/
│       ├── requirements.txt
│       └── Dockerfile
│
├── packages/                             # Shared packages (monorepo)
│   ├── shared-types/                     # TypeScript types shared across apps
│   │   ├── src/
│   │   │   ├── fan.types.ts
│   │   │   ├── venue.types.ts
│   │   │   ├── crowd.types.ts
│   │   │   └── index.ts
│   │   └── package.json
│   ├── shared-utils/                     # Utility functions
│   │   ├── src/
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   └── constants.ts
│   │   └── package.json
│   └── ui-kit/                           # Shared React/RN component library
│       ├── src/
│       │   ├── Button/
│       │   ├── Card/
│       │   ├── Input/
│       │   └── index.ts
│       └── package.json
│
├── infrastructure/                       # IaC and DevOps
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── modules/
│   │   │   ├── aks/
│   │   │   ├── postgres/
│   │   │   ├── redis/
│   │   │   ├── kafka/
│   │   │   └── storage/
│   │   └── environments/
│   │       ├── dev.tfvars
│   │       ├── staging.tfvars
│   │       └── prod.tfvars
│   ├── kubernetes/
│   │   ├── namespaces/
│   │   ├── services/
│   │   │   ├── fan-service.yaml
│   │   │   ├── crowd-intel-service.yaml
│   │   │   ├── ai-service.yaml
│   │   │   └── [other services]
│   │   ├── ingress/
│   │   ├── hpa/                          # Horizontal Pod Autoscalers
│   │   └── configmaps/
│   └── scripts/
│       ├── deploy.sh
│       ├── rollback.sh
│       └── seed-db.sh
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── cd-staging.yml
│       └── cd-production.yml
│
├── docs/
│   ├── PRD.md
│   ├── Architecture.md
│   ├── Rules.md
│   ├── Phases.md
│   ├── Design.md
│   └── Memory.md
│
├── docker-compose.yml                    # Local development environment
├── pnpm-workspace.yaml
├── turbo.json                            # Turborepo config
└── README.md
```

---

## 5. Database Schema

### 5.1 Core PostgreSQL Tables

#### `users` table
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_id      VARCHAR(128) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE,
  phone         VARCHAR(50),
  full_name     VARCHAR(255),
  preferred_lang VARCHAR(10) DEFAULT 'en',
  role          ENUM('fan','volunteer','staff','venue_manager','fifa_admin') NOT NULL,
  accessibility_needs JSONB DEFAULT '{}',
  dietary_prefs  JSONB DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `venues` table
```sql
CREATE TABLE venues (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  city          VARCHAR(100) NOT NULL,
  country       CHAR(2) NOT NULL,
  capacity      INTEGER NOT NULL,
  timezone      VARCHAR(50) NOT NULL,
  bim_version   VARCHAR(20),
  beacon_network_id VARCHAR(100),
  geolocation   POINT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `matches` table
```sql
CREATE TABLE matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id      UUID REFERENCES venues(id),
  home_team     VARCHAR(100) NOT NULL,
  away_team     VARCHAR(100) NOT NULL,
  kickoff_time  TIMESTAMPTZ NOT NULL,
  status        ENUM('scheduled','live','completed','postponed') DEFAULT 'scheduled',
  attendance    INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `tickets` table
```sql
CREATE TABLE tickets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_id        UUID REFERENCES users(id),
  match_id      UUID REFERENCES matches(id),
  seat_section  VARCHAR(20) NOT NULL,
  seat_row      VARCHAR(10) NOT NULL,
  seat_number   VARCHAR(10) NOT NULL,
  gate          VARCHAR(10),
  qr_code       TEXT UNIQUE NOT NULL,
  is_accessible BOOLEAN DEFAULT FALSE,
  is_used       BOOLEAN DEFAULT FALSE,
  used_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `incidents` table
```sql
CREATE TABLE incidents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id      UUID REFERENCES venues(id),
  match_id      UUID REFERENCES matches(id),
  reported_by   UUID REFERENCES users(id),
  type          ENUM('medical','crowd','security','infrastructure','lost_item','other') NOT NULL,
  severity      ENUM('low','medium','high','critical') NOT NULL,
  description   TEXT,
  ai_summary    TEXT,
  ai_actions    JSONB DEFAULT '[]',
  location_zone VARCHAR(100),
  status        ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `volunteer_tasks` table
```sql
CREATE TABLE volunteer_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id  UUID REFERENCES users(id),
  assigned_by   UUID REFERENCES users(id),
  match_id      UUID REFERENCES matches(id),
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  priority      ENUM('low','medium','high','urgent') DEFAULT 'medium',
  status        ENUM('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  due_at        TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `ai_conversations` table
```sql
CREATE TABLE ai_conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  session_id    VARCHAR(128) NOT NULL,
  channel       ENUM('fan_app','kiosk','volunteer_portal','command_center') NOT NULL,
  language      VARCHAR(10) NOT NULL,
  messages      JSONB NOT NULL DEFAULT '[]',
  escalated     BOOLEAN DEFAULT FALSE,
  escalated_to  UUID REFERENCES users(id),
  confidence    FLOAT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `sustainability_events` table
```sql
CREATE TABLE sustainability_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id      UUID REFERENCES venues(id),
  match_id      UUID REFERENCES matches(id),
  event_type    ENUM('energy','waste','water','plastic') NOT NULL,
  zone          VARCHAR(100),
  value         FLOAT NOT NULL,
  unit          VARCHAR(20) NOT NULL,
  recorded_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.2 InfluxDB Measurements (Time-Series)

```
Measurement: crowd_density
  Tags:    venue_id, zone_id, match_id
  Fields:  density_pct (float), device_count (int), camera_count (int)
  Time:    every 30 seconds

Measurement: gate_throughput
  Tags:    venue_id, gate_id, match_id
  Fields:  fans_per_hour (int), queue_length (int), wait_time_sec (int)
  Time:    every 60 seconds

Measurement: energy_consumption
  Tags:    venue_id, zone_id
  Fields:  kwh (float), zone_name (string)
  Time:    every 5 minutes

Measurement: transport_demand
  Tags:    venue_id, transport_type, match_id
  Fields:  demand_index (float), eta_minutes (float)
  Time:    every 2 minutes
```

---

## 6. API Structure

### 6.1 API Versioning Strategy

All APIs are versioned under `/api/v1/`. Breaking changes introduce a new major version.

### 6.2 REST API Endpoints

#### Fan Service (`/api/v1/fans`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/fans/me` | Get current fan profile | Fan |
| PATCH | `/api/v1/fans/me` | Update fan preferences | Fan |
| GET | `/api/v1/fans/tickets` | Get fan's tickets | Fan |
| POST | `/api/v1/fans/incidents` | Report an incident | Fan |
| GET | `/api/v1/fans/recommendations` | Get AI-personalized recommendations | Fan |

#### Navigation Service (`/api/v1/navigation`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/navigation/route` | Calculate route to destination | Fan |
| GET | `/api/v1/navigation/venues/:id/map` | Get venue indoor map data | Fan |
| GET | `/api/v1/navigation/venues/:id/zones/density` | Get live zone density | Fan |
| POST | `/api/v1/navigation/route/accessible` | Calculate accessible route | Fan |

#### AI Service (`/api/v1/ai`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/ai/chat` | Send message to fan assistant | Fan |
| POST | `/api/v1/ai/copilot/query` | Query ops AI co-pilot | Venue Manager |
| POST | `/api/v1/ai/translate` | Translate text in real time | Any |
| POST | `/api/v1/ai/stt` | Speech to text conversion | Any |
| GET | `/api/v1/ai/conversations/:id` | Get conversation history | Any |

#### Crowd Intelligence (`/api/v1/crowd`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/crowd/venues/:id/heatmap` | Get real-time crowd heatmap | Venue Manager |
| GET | `/api/v1/crowd/venues/:id/zones` | Get all zone density readings | Venue Manager |
| GET | `/api/v1/crowd/venues/:id/alerts` | Get active crowd alerts | Venue Manager |
| POST | `/api/v1/crowd/alerts/:id/acknowledge` | Acknowledge an alert | Venue Manager |
| GET | `/api/v1/crowd/venues/:id/forecast` | Get 15-min surge forecast | Venue Manager |

#### Volunteer Service (`/api/v1/volunteers`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/volunteers/tasks` | Get assigned tasks | Volunteer |
| PATCH | `/api/v1/volunteers/tasks/:id` | Update task status | Volunteer |
| GET | `/api/v1/volunteers/briefing` | Get AI shift briefing | Volunteer |
| POST | `/api/v1/volunteers/incidents` | Submit incident report | Volunteer |
| GET | `/api/v1/volunteers/location` | Get all volunteer locations | Venue Manager |

### 6.3 WebSocket Events

```
Client → Server:
  crowd:subscribe       { venueId, zones[] }
  alert:subscribe       { venueId }
  task:subscribe        { volunteerId }
  location:update       { userId, lat, lng, zone }

Server → Client:
  crowd:density_update  { zoneId, density, timestamp }
  crowd:alert           { alertId, level, zone, message, actions[] }
  task:assigned         { taskId, title, priority, dueAt }
  incident:created      { incidentId, type, severity, zone }
  emergency:broadcast   { message, venueId, timestamp }
```

### 6.4 API Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-07-13T14:30:00Z",
    "version": "v1"
  },
  "error": null
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CROWD_ZONE_NOT_FOUND",
    "message": "The specified zone does not exist in this venue.",
    "details": {}
  }
}
```

---

## 7. Authentication Flow

### 7.1 Fan Authentication (Social Login)

```
1. Fan clicks "Continue with Google/Apple" in Web App
2. Web App redirects to Auth0 Universal Login page
3. Auth0 authenticates with Google/Apple OAuth
4. Auth0 redirects back to Web App with authorization code
5. Web App exchanges code for access_token + id_token + refresh_token
6. Web App stores tokens securely (SessionStorage / secure HTTP-only cookies)
7. All API calls include: Authorization: Bearer <access_token>
8. Kong Gateway validates JWT signature against local token public keys
9. Kong forwards claims to downstream service
10. Refresh token used to silently refresh access token in background background
```

### 7.2 Staff / Organizer Authentication (MFA)

```
1. Staff navigates to Command Center web app
2. Enters organizational email + password
3. Auth0 prompts for TOTP MFA (Google Authenticator / Auth0 Guardian)
4. On success, local Auth service issues JWT with organization + role claims
5. Session stored server-side (Redis) + cookie-based for web
6. Role-based access enforced by Kong route-level authorization plugin
7. Session expires after 8 hours; re-authentication required
```

### 7.3 Service-to-Service Authentication

```
1. Each microservice holds a client certificate (mTLS)
2. Istio service mesh enforces mTLS on all inter-service traffic
3. Service-specific RBAC controls which services can call which endpoints
4. API calls carry service identity in X-Service-ID header
5. Audit log records all service-to-service calls
```

---

## 8. Component Structure

### 8.1 Fan PWA Component Hierarchy

```
App
├── AuthProvider (Auth0)
└── RouterProvider (React Router)
    ├── PublicLayout
    │   ├── LoginView
    │   └── OnboardingView
    └── ProtectedLayout (requires auth)
        ├── HomeView
        │   ├── MatchBanner
        │   ├── QuickActionGrid
        │   └── NotificationFeed
        ├── NavigateView
        │   ├── StadiumMapView
        │   │   ├── MapboxMap
        │   │   ├── RoutePolyline
        │   │   ├── DensityHeatmapLayer
        │   │   └── BeaconMarkers
        │   ├── RoutePanel
        │   │   ├── DirectionStep
        │   │   └── ETABadge
        │   └── ARWayfinderOverlay
        ├── AssistantView
        │   ├── MessageList
        │   │   ├── UserBubble
        │   │   └── AIBubble
        │   ├── InputBar
        │   │   ├── TextInput
        │   │   └── VoiceInputButton
        │   └── LanguageSelector
        ├── TransportView
        │   ├── JourneyPlanner
        │   ├── TransitOptions
        │   │   └── TransitCard
        │   └── RideShareOptions
        └── TicketView
            ├── QRCodeDisplay
            └── SeatInfo
```

### 8.2 Command Center Component Hierarchy

```
App
├── AuthProvider (Auth0)
└── DashboardLayout
    ├── Sidebar
    │   ├── VenueSelector
    │   ├── NavItem (Crowd, Incidents, Volunteers, Sustainability, Reports)
    │   └── AlertBadge
    ├── TopBar
    │   ├── MatchClock
    │   ├── VenueStats (capacity, attendance)
    │   └── EmergencyButton
    └── MainContent (route-based)
        ├── CrowdPage
        │   ├── StadiumHeatmap (D3 + Canvas)
        │   ├── ZoneCard[]
        │   ├── AlertFeed
        │   └── AICopilotPanel
        │       ├── QueryInput
        │       └── ResponseCard
        ├── IncidentsPage
        │   ├── IncidentMap
        │   ├── IncidentList
        │   └── IncidentDetail
        ├── VolunteersPage
        │   ├── VolunteerMap
        │   ├── TaskBoard
        │   └── TaskAssignModal
        ├── SustainabilityPage
        │   ├── EnergyChart
        │   ├── WasteTracker
        │   └── VenueLeaderboard
        └── ReportsPage
            ├── MatchReportCard
            └── ExportOptions
```

---

## 9. State Management

### 9.1 Fan Web App PWA (Zustand + TanStack Query)

```
Global Stores (Zustand — persistent, sync):
├── sessionStore
│   ├── userId, accessToken, refreshToken
│   └── userProfile (language, accessibility, dietary)
├── navigationStore
│   ├── currentLocation { lat, lng, zone, floor }
│   ├── activeRoute { steps[], eta, destination }
│   └── mapSettings { accessibleMode, floor }
└── appStore
    ├── selectedVenueId, selectedMatchId
    └── offlineMode (boolean)

Server State (TanStack Query — cached, auto-refetched):
├── useTickets()          → GET /fans/tickets
├── useCrowdDensity()     → GET /crowd/zones/density (30s refetch)
├── useTransportOptions() → GET /transport/options
└── useAIConversation()   → POST /ai/chat (mutation)
```

### 9.2 Command Center (Zustand + TanStack Query + WebSocket)

```
Global Stores (Zustand):
├── authStore         → user session, role, venue access
├── alertStore        → active alerts[], acknowledged[]
└── crowdStore        → live heatmap data, zone densities

Real-time (WebSocket + Zustand):
├── crowd:density_update → updates crowdStore.zones[zoneId]
├── crowd:alert          → appends to alertStore.active[]
└── incident:created     → triggers notification + feed update

Server State (TanStack Query):
├── useIncidents()        → GET /incidents (5s refetch)
├── useVolunteerLocations() → GET /volunteers/location (10s refetch)
└── useSustainabilityData() → GET /sustainability/metrics
```

---

## 10. Third-Party Services

| Service | Provider | Purpose | Integration Method |
|---------|----------|---------|-------------------|
| LLM Inference | Gemini API (Generous Free Tier) / Ollama (Self-hosted Llama-3-8B) | Fan assistant, ops copilot | REST API (LangChain / Ollama SDK) |
| Speech-to-Text | Whisper (Local Python / faster-whisper) | Voice input for 50+ languages | Local Python container endpoint |
| Text-to-Speech | Kokoro-82M / Coqui TTS (Self-hosted OSS) | Voice responses in 50+ languages | Local Python container endpoint |
| Indoor Positioning | Open-Source BLE beacons (generic hardware) | Fan location tracking | Web Bluetooth API / Local scanning |
| Maps | MapLibre GL JS + OpenStreetMap | Indoor/outdoor maps, routing tiles | Open-source JS libraries (100% Free) |
| Identity | Supabase Auth (Self-hosted OSS) / NextAuth | Authentication + authorization | Stateless JWT / Local middleware |
| Ride-Share | Uber API + Lyft API | Transport options, ETAs | REST API (Free Developer Sandbox access) |
| Transit Data | GTFS-RT Feeds (per host city) | Real-time transit updates | Open-data Protocol Buffer streams (Free) |
| Push Notifications | Web Push API (FCM Free Tier) | Web push notifications | Service Worker (100% Free) |
| SMS / Alerts | Telegram Bot API / Discord Webhooks | Emergency updates, volunteer task pings | HTTP REST API (100% Free) |
| Monitoring | Prometheus + Grafana (Self-hosted OSS) | APM, metrics, dashboards, alerts | Node exporter + PromQL queries |
| Error Tracking | GlitchTip (Self-hosted OSS) | Runtime error monitoring | Sentry SDK (pointing to local endpoint) |
| Payments (future) | Stripe Sandbox | F&B pre-order mock tests | Developer API (Free) |
| Computer Vision | Local Python OpenCV + YOLOv8 | Crowd counting | Local Python script / ONNX runtime |
| Vector DB | pgvector (PostgreSQL extension) | LLM knowledge retrieval (RAG) | SQL Queries (100% Free / Self-hosted) |
| Email | Gmail SMTP (Nodemailer) / SendGrid Free Tier | Transactional emails | SMTP client (100% Free) |
| Weather | OpenWeatherMap API (Free Tier) | Real-time weather at venues | REST API |

---

## 11. Deployment Architecture

### 11.1 Hosting Strategy (100% Free & Self-Hosted Infrastructure)

**Production Platform:** Private Virtual Server Node (Ubuntu Linux VPS) or standard home lab hardware running Docker Compose.  
**CDN & Security:** Cloudflare (Free Tier: SSL, basic firewall, static web assets caching).  
**ML/AI Workloads:** Local GPU Server running Ollama (Llama-3-8b-instruct) or Gemini API developer free tier.

### 11.2 Region / Machine Strategy

| Node Name | Purpose | Services Deployed |
|--------|---------|-------------------|
| Production VM 1 | Central Web Gateway, DB, Frontend, and Core APIs | Nginx/Caddy, PostgreSQL, Redis, Fan/Volunteer APIs, Command Center |
| Production VM 2 (Optional) | Real-time crowd processing and Event Hub | Apache Kafka, InfluxDB, OpenSearch, Crowd Intelligence CV scripts |
| Local ML Node (Optional) | AI/LLM Local Inference Engine | Ollama container, Whisper container, Kokoro TTS container |

### 11.3 Docker Compose System Layout (Self-Hosted Stack)

```
stadiumiq-stack/ (Single Server or Swarm)
├── Container: reverse-proxy      (Caddy or Nginx - Free SSL + Routing)
├── Container: kong-gateway        (API Gateway Layer - OSS Version)
├── Container: postgres-db         (PostgreSQL + pgvector extension)
├── Container: influx-db           (InfluxDB OSS for sensor time-series)
├── Container: redis-cache         (Redis OSS for sessions and sockets)
├── Container: opensearch          (OpenSearch for incident search)
├── Container: kafka-broker        (Apache Kafka Event bus)
├── Container: fan-service         (Node.js Web App API)
├── Container: volunteer-service   (Node.js Task API)
├── Container: crowd-intel-service (FastAPI + YOLOv8 simulation)
├── Container: ai-service          (FastAPI + Ollama/Gemini API integration)
├── Container: transport-service   (Node.js Transit Integration)
├── Container: monitoring-stack
│   ├── prometheus                 (Metrics collection)
│   ├── loki                       (Log aggregation)
│   └── grafana                    (Visualization and Alert dashboard)
└── Container: uptime-kuma         (Uptime monitors + Telegram alerting)
```

### 11.4 CI/CD Pipeline

```
Developer pushes to feature branch
           │
           ▼
GitHub Actions: CI Pipeline
  ├── Lint + Type Check (ESLint, TypeScript, Ruff)
  ├── Unit Tests (Jest, pytest)
  ├── Integration Tests
  ├── Docker image build
  ├── Container security scan (Trivy)
  └── Push image to Azure Container Registry
           │
           ▼ (on merge to main)
ArgoCD: Deploy to STAGING
  ├── Automated E2E tests (Playwright)
  ├── Performance tests (k6)
  └── Smoke tests
           │
           ▼ (manual approval required)
ArgoCD: Deploy to PRODUCTION
  ├── Blue-green deployment (zero downtime)
  ├── Canary rollout: 10% → 50% → 100%
  └── Automated rollback on error rate > 1%
```

---

*Document End — Architecture.md v1.0.0*
