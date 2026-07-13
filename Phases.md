# Implementation Phases
## StadiumIQ — GenAI-Powered FIFA World Cup 2026 Operations Platform

This document outlines the step-by-step roadmap for developing, testing, and deploying the StadiumIQ platform. The timeline is split into 7 strategic phases to ensure structural robustness, scalability, and seamless integration of GenAI features.

---

## Table of Contents
1. [Phase 1: Project Setup & Authentication](#phase-1-project-setup--authentication)
2. [Phase 2: Core Database & CRUD APIs](#phase-2-core-database--crud-apis)
3. [Phase 3: Conversational AI Assistants & Translation Engine](#phase-3-conversational-ai-assistants--translation-engine)
4. [Phase 4: Real-time Crowd Intelligence & Prediction Engine](#phase-4-real-time-crowd-intelligence--prediction-engine)
5. [Phase 5: Transportation Orchestration & Sustainability Modules](#phase-5-transportation-orchestration--sustainability-modules)
6. [Phase 6: End-to-End Testing & Hardening](#phase-6-end-to-end-testing--hardening)
7. [Phase 7: Production Deployment & Scale-Out](#phase-7-production-deployment--scale-out)

---

## Phase 1: Project Setup & Authentication

### Objectives
Establish the repository structure, code styling constraints, initial container configurations, local developer environments, and federated identity authentication (OAuth 2.0 / OIDC) across all applications.

### Tasks
1. **Monorepo Initialization:** Configure a Turborepo environment with shared TypeScript configs, linting rules (ESLint, Ruff for Python, golangci-lint for Go), and code formatting (Prettier).
2. **Infrastructure Mocking:** Define a `docker-compose.yml` file localizing services: PostgreSQL (with pgvector), Redis, Apache Kafka, InfluxDB, MinIO, and OpenSearch.
3. **Gateway Deployment:** Deploy Kong API Gateway locally, mapping basic routes and configuring standard security plugins (JWT validation, Rate Limiting).
4. **Authentication Setup:** Setup NextAuth / Supabase Auth (self-hosted) for the three client applications (Fan Web App PWA, Organizer Command Center, Volunteer Portal) with Role-Based Access Control (RBAC).
5. **Boilerplate Interfaces:** Initialize the Next.js Command Center, the React Vite Fan Web App (PWA), and the React Vite volunteer PWA shell with basic layout grids and local auth providers.

### Deliverables
- Fully working Turborepo git structure with Docker developer sandbox.
- Configured Kong Gateway proxying initial client requests.
- Secure, functional login/logout flows across all 3 client interfaces.

### Acceptance Criteria
- Code compilation succeeds across all app workspaces without lint errors.
- Running `docker compose up` starts all backing services successfully.
- User authentication tokens are securely retrieved, stored, and sent as bearer tokens to backend microservices.
- Admin, Staff, and Fan roles are enforced during authentication.

### Estimated Difficulty
**Difficulty:** 2/5 (Standard enterprise infrastructure setup)

---

## Phase 2: Core Database & CRUD APIs

### Objectives
Define schemas, execute migrations, and develop the foundation REST and WebSocket endpoints for managing user profiles, concessions, ticketing gate information, and incident tracking.

### Tasks
1. **Relational Database Setup:** Create database migrations using Prisma (for Node.js) and SQLAlchemy (for Python) mapping PostgreSQL tables (Users, Venues, Zones, Gates, Tickets, Volunteers, Incidents, Concessions).
2. **Fan Service API:** Implement REST endpoints for user profile management, ticket validation, and venue information fetching.
3. **Volunteer Service API:** Build schedules, duty rosters, and volunteer check-in/check-out tracking.
4. **Command Center Incident Logging:** Develop CRUD endpoints for creating, editing, assigning, and archiving operational incidents.
5. **Caching Integration:** Configure Redis as a caching layer for static stadium maps, ticketing data, and active sessions.
6. **Mock Seeding Logic:** Build the `npm run db:seed` script populating mock stadium structures, zones, active volunteer assignments, and simulated match event feeds to make the project instant-load demo ready.

### Deliverables
- Documented database schema (Entity-Relationship diagram & script files).
- OpenAPI/Swagger specifications for Fan, Volunteer, and Command APIs.
- Redis-cached database models verifying sub-50ms query times.

### Acceptance Criteria
- Schema migrations run and rollback successfully on PostgreSQL.
- Base REST services pass unit tests with > 80% coverage.
- CRUD operations for Incident Logging are exposed and authenticated via Kong Gateway.
- API documentation auto-generates on endpoint deployment.

### Estimated Difficulty
**Difficulty:** 3/5 (Data integrity mapping and initial API boilerplate)

---

## Phase 3: Conversational AI Assistants & Translation Engine

### Objectives
Deploy the LLM RAG pipelines, fine-tune intent classifiers, build voice/text translation adapters, and deploy vector database indexes for the multilingual Fan and Volunteer assistants.

### Tasks
1. **pgvector Database Config:** Setup tables and vector indices within PostgreSQL using pgvector (cosine similarity) to store chunks of stadium guides, transport rules, and FIFA FAQs.
2. **AI/LLM Microservice (FastAPI):** Build the RAG engine using LangChain, integrating Gemini API (Free Developer tier) and self-hosted Ollama (Llama-3).
3. **Intent Classifier:** Train a lightweight BERT or SVM classifier to distinguish between navigation, F&B, safety, and general Q&A queries.
4. **Speech translation Pipeline:** Integrate self-hosted faster-whisper and Kokoro-82M/Coqui TTS container endpoints to translate and speak voice queries.
5. **Human Handoff Routine:** Program a fallback channel that redirects the chat to a live volunteer in the Staff Portal when AI confidence falls below 70%.

### Deliverables
- Python-based AI/LLM microservice with custom prompt templates.
- Vector database population script that parses CSV/PDF documentation.
- Integrated translation layer supporting Tier 1 and Tier 2 languages.

### Acceptance Criteria
- Natural language query interface correctly routes requests based on classified intents (e.g., navigating vs. ticketing).
- RAG pipeline returns context-grounded answers within 2 seconds.
- Voice queries are translated and transcribed with >= 92% accuracy.
- System successfully passes chat threads to human volunteers when threshold tests fail.

### Estimated Difficulty
**Difficulty:** 4/5 (RAG tuning, prompt orchestration, and low-latency audio processing)

---

## Phase 4: Real-time Crowd Intelligence & Prediction Engine

### Objectives
Build the crowd estimation pipelines, integrate simulated CCTV camera video feeds, configure Kafka event processors, and train the LSTM-based crowd prediction models.

### Tasks
1. **Kafka Topic Architecture:** Establish event streaming topics (`crowd.events`, `alerts`, `sensor.telemetry`) with partition counts supporting high throughput.
2. **CV Image Processing Engine:** Create a computer vision service skeleton utilizing OpenCV and YOLOv8 models for crowd-counting and density estimation on video streams.
3. **Sensor Ingest Simulator:** Write scripts simulating ticketing gate throughput, BLE beacon device counts, and Wi-Fi access point pings.
4. **Predictive Surge Modeling:** Implement an LSTM model using PyTorch/TensorFlow forecasting bottlenecks 5-15 minutes in advance based on stadium schedules.
5. **Command Center Heatmaps:** Develop the WebSocket service delivering density updates to the Command Center React maps.

### Deliverables
- Python Crowd Intel Service with OpenCV frame processing.
- Multi-partition Apache Kafka cluster setup.
- Real-time dashboard heatmaps updating every 30 seconds.

### Acceptance Criteria
- Kafka handles simulated peak ingestion load (10,000 msgs/sec) without packet drops.
- Video analysis extracts crowd counts with less than 5% deviation from true counts.
- Operations dashboard renders color-coded zones matching defined Crowd Risk Levels.
- Predictive models trigger alarms 10 minutes prior to a simulated bottleneck.

### Estimated Difficulty
**Difficulty:** 5/5 (Real-time computer vision, complex telemetry pipelines, and predictive model training)

---

## Phase 5: Transportation Orchestration & Sustainability Modules

### Objectives
Integrate public transit GTFS-RT APIs, implement ride-share booking handoffs, connect smart waste bin sensors, and build gamified sustainability challenges.

### Tasks
1. **Multimodal Transit Journey Planner:** Consume public General Transit Feed Specification Real-Time (GTFS-RT) data to show bus and metro delays.
2. **Ride-share APIs Integration:** Build backend adapters linking Lyft and Uber ride-share ETAs and deep-link generation.
3. **Smart Bin Ingestion:** Set up InfluxDB time-series database to track waste levels via simulated ultrasonic sensor data.
4. **Sustainability Dashboard:** Implement data visualization widgets displaying real-time HVAC loads, waste volumes, and single-use plastic audit summaries.
5. **Fan Eco-Gamification:** Program in-app user challenges (e.g., "Sort your waste") rewarding fans with digital badges and concession vouchers.

### Deliverables
- Transport Service Node.js microservice.
- Live transit dashboard view for operations.
- Sustainability gamification module in Fan App.

### Acceptance Criteria
- Fan App generates routes incorporating both walking segments and live transit arrivals.
- Waste level exceedances (>=80%) trigger alerts to nearby cleaning staff.
- Dashboard accurately computes total carbon footprints per match.
- Fan vouchers generate correctly upon successful validation of eco-tasks.

### Estimated Difficulty
**Difficulty:** 3/5 (External API integrations and telemetry dashboards)

---

## Phase 6: End-to-End Testing & Hardening

### Objectives
Execute stress testing, security threat modeling, vulnerability scanning, and Web Accessibility (WCAG 2.2 AA) evaluations to guarantee production readiness.

### Tasks
1. **Load Testing (k6):** Create scripts to simulate 500,000 concurrent API sessions, focusing on gateway routing, session lookup, and database replication lag.
2. **Chaos Engineering:** Perform failover drills (killing main DB nodes, simulated regional internet dropouts) using Chaos Mesh.
3. **Security Penetration Testing:** Run OWASP ZAP scanners and conduct static analysis (SonarQube) to catch code injection, SQL injection, and secret leaks.
4. **Accessibility Audit:** Verify keyboard-only navigation, screen-reader audio outputs, high contrast themes, and ARIA labels.
5. **Model Guardrail Integration:** Test prompt injection defenses on the AI chatbot to prevent system hallucination or bypass hacks.

### Deliverables
- Detailed k6 load and performance reports.
- Static application security testing (SAST) logs.
- Accessibility compliance certificate (WCAG 2.2 AA checklist).

### Acceptance Criteria
- Main API endpoints sustain 500k virtual users with p95 response time <= 200ms.
- Active-active DB replication recovers in under 5 minutes (RTO <= 5 min) with zero data corruption.
- Code shows zero critical or high-risk vulnerabilities on final scanning.
- Fan App passes WCAG 2.2 AA automated scanner audits.

### Estimated Difficulty
**Difficulty:** 4/5 (Simulating large-scale user loads and correcting accessibility bottlenecks)

---

## Phase 7: Production Deployment & Scale-Out

### Objectives
Deploy the containerized stack on self-hosted VPS nodes or private server nodes with automated reverse proxying, SSL, and monitoring.

### Tasks
1. **Infrastructure Setup:** Write Docker Compose files mapping PostgreSQL + pgvector, Redis, InfluxDB, MinIO, OpenSearch, Caddy (for automatic SSL), and backend microservices.
2. **Reverse Proxy Configuration:** Configure Caddyfile/Nginx routing with automated Let's Encrypt certificates, load balancing, and rate limiting.
3. **CI/CD Pipelines:** Implement GitHub Actions pipelines to run checks, compile images, and securely pull/re-deploy containers on the target VPS via SSH.
4. **Global Traffic Management:** Setup Cloudflare (Free Tier) DNS routing with server health probes.
5. **Observability Suite:** Configure Prometheus metrics scraping, Loki log agents, and Grafana dashboards for container health.

### Deliverables
- Docker Compose production configurations and shell deployment scripts.
- Active CI/CD configuration files.
- Live monitoring dashboards (Grafana, Uptime Kuma).

### Acceptance Criteria
- Production stack deploys automatically with a single command or GitHub Action run.
- Cloudflare correctly routes traffic and caches static web assets.
- System error alerts (via Telegram bot / email) trigger immediately on container failures.
- Uptime Kuma records continuous dashboard pings.

### Estimated Difficulty
**Difficulty:** 4/5 (Orchestrating multi-region environments and global latency tuning)
