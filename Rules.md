# Development Rules & Standards
## StadiumIQ — FIFA World Cup 2026 GenAI Platform

**Version:** 1.0.0  
**Status:** Enforced  
**Owner:** Engineering Lead  
**Last Updated:** 2026-07-13  

> These rules are **non-negotiable** and apply to all contributors — human and AI. Violations will block pull request merges. Rules exist to ensure a maintainable, secure, scalable, and accessible production codebase.

---

## Table of Contents

1. [Coding Standards](#1-coding-standards)
2. [Naming Conventions](#2-naming-conventions)
3. [Folder Rules](#3-folder-rules)
4. [Component Rules](#4-component-rules)
5. [Error Handling Rules](#5-error-handling-rules)
6. [API Rules](#6-api-rules)
7. [Database Rules](#7-database-rules)
8. [Git Rules](#8-git-rules)
9. [Commit Message Format](#9-commit-message-format)
10. [Documentation Rules](#10-documentation-rules)
11. [Performance Rules](#11-performance-rules)
12. [Security Rules](#12-security-rules)
13. [Accessibility Rules](#13-accessibility-rules)
14. [What AI SHOULD DO](#14-what-ai-should-do)
15. [What AI MUST NEVER DO](#15-what-ai-must-never-do)

---

## 1. Coding Standards

### 1.1 General

- All code must be written in **TypeScript** (frontend/Node.js) or **Python 3.11+** (AI/ML services) or **Go 1.22+** (Navigation service).
- **No `any` types** in TypeScript. Use proper interfaces or generics.
- All functions must be **pure where possible** — no side effects unless explicitly required.
- Maximum function length: **50 lines**. If longer, extract sub-functions.
- Maximum file length: **300 lines**. If longer, split into modules.
- Use **async/await** — never `.then().catch()` chains.
- All `async` functions must handle errors (try/catch or error boundary).
- No dead code. Remove commented-out code before merging.
- Use **strict mode** in all TypeScript projects (`"strict": true` in tsconfig).
- All Python code must pass **Ruff linting** and **mypy type checking**.
- All Go code must pass `go vet` and `golangci-lint`.

### 1.2 TypeScript / JavaScript

```typescript
// GOOD: Explicit types, async/await, early returns
async function getVenueZoneDensity(venueId: string, zoneId: string): Promise<ZoneDensity> {
  if (!venueId || !zoneId) {
    throw new ValidationError('venueId and zoneId are required');
  }
  const density = await crowdRepository.getZoneDensity(venueId, zoneId);
  if (!density) {
    throw new NotFoundError(`Zone ${zoneId} not found in venue ${venueId}`);
  }
  return density;
}

// BAD: Implicit any, .then() chains, no validation
function getZone(vid, zid) {
  return crowdRepo.getZone(vid, zid).then(d => d).catch(e => null);
}
```

### 1.3 Python

```python
# GOOD: Type hints, explicit returns, docstrings
async def get_crowd_density(venue_id: str, zone_id: str) -> CrowdDensity:
    """
    Retrieve the current crowd density for a specific venue zone.
    
    Args:
        venue_id: UUID of the venue
        zone_id: Identifier for the zone within the venue
    
    Returns:
        CrowdDensity: Current density data
    
    Raises:
        ZoneNotFoundError: If the zone does not exist
    """
    density = await crowd_repository.get_zone_density(venue_id, zone_id)
    if density is None:
        raise ZoneNotFoundError(f"Zone {zone_id} not found in venue {venue_id}")
    return density

# BAD: No types, bare except, no docstring
def get_density(vid, zid):
    try:
        return repo.get(vid, zid)
    except:
        pass
```

### 1.4 Code Quality Tools

| Tool | Language | Enforced In |
|------|----------|-------------|
| ESLint + Prettier | TypeScript/JS | Pre-commit hook + CI |
| Ruff + Black | Python | Pre-commit hook + CI |
| mypy | Python | CI |
| golangci-lint | Go | Pre-commit hook + CI |
| Husky | All | Pre-commit |
| Commitlint | All | Commit-msg hook |

---

## 2. Naming Conventions

### 2.1 TypeScript / JavaScript

| Element | Convention | Example |
|---------|-----------|---------|
| Variables | camelCase | `crowdDensity`, `fanProfile` |
| Functions | camelCase | `getCrowdDensity()`, `sendAlert()` |
| React Components | PascalCase | `CrowdHeatmap`, `FanAssistant` |
| Interfaces | PascalCase (no `I` prefix) | `CrowdZone`, `FanProfile` |
| Types | PascalCase | `DensityLevel`, `AlertStatus` |
| Enums | PascalCase | `IncidentType`, `AlertLevel` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_CROWD_DENSITY`, `API_BASE_URL` |
| Files (components) | PascalCase | `CrowdHeatmap.tsx` |
| Files (utils/services) | kebab-case | `crowd-service.ts`, `api-client.ts` |
| CSS Classes | kebab-case | `crowd-heatmap`, `alert-badge` |
| Event handlers | `handle` prefix | `handleAlertClick`, `handleRouteChange` |
| Hooks | `use` prefix | `useCrowdDensity`, `useFanLocation` |

### 2.2 Python

| Element | Convention | Example |
|---------|-----------|---------|
| Variables | snake_case | `crowd_density`, `fan_profile` |
| Functions | snake_case | `get_crowd_density()`, `send_alert()` |
| Classes | PascalCase | `CrowdDensityModel`, `FanService` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_CROWD_DENSITY`, `API_BASE_URL` |
| Files/Modules | snake_case | `crowd_service.py`, `api_client.py` |
| Private methods | `_` prefix | `_calculate_surge()` |

### 2.3 Database

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | snake_case, plural | `users`, `crowd_events`, `ai_conversations` |
| Columns | snake_case | `created_at`, `venue_id`, `crowd_density` |
| Indexes | `idx_table_column` | `idx_tickets_fan_id` |
| Foreign Keys | `fk_table_column` | `fk_tickets_fan_id` |
| Primary Keys | always `id` UUID | `id UUID PRIMARY KEY` |
| Junction Tables | `table1_table2` | `matches_venues` |

### 2.4 API

| Element | Convention | Example |
|---------|-----------|---------|
| Endpoints | kebab-case, REST nouns | `/crowd-events`, `/venue-zones` |
| Query Params | camelCase | `?venueId=&zoneId=` |
| JSON Keys | camelCase | `crowdDensity`, `fanId` |
| Error Codes | SCREAMING_SNAKE_CASE | `ZONE_NOT_FOUND`, `AUTH_TOKEN_EXPIRED` |

---

## 3. Folder Rules

- **One feature per folder.** Do not mix unrelated concerns in the same directory.
- **Barrel exports required.** Every folder exposing modules must have an `index.ts` file.
- **No circular imports.** Enforce with ESLint `import/no-cycle` rule.
- **Services never import from components.** Maintain strict layering.
- **Test files live alongside source files.** `crowd-service.ts` → `crowd-service.test.ts`.
- **No `utils` dumping grounds.** If a util is only used by one module, keep it in that module.
- **Shared code must live in `packages/`.** Never copy-paste code between apps.
- **Environment-specific files stay in `infrastructure/` or `config/`.** Not in `src/`.
- **No assets in `src/`.** Images, fonts, and static files go in `public/` or blob storage.

---

## 4. Component Rules

### 4.1 React Components

- Every component must be **function-based**. Class components are forbidden.
- **One component per file.** No multiple exports of large components from one file.
- **Props must always be typed** with an explicit interface.
- **Never use inline styles.** Use CSS Modules, TailwindCSS, or design tokens.
- All interactive elements must have **unique `id` attributes** and **`aria-label`** or **`aria-labelledby`**.
- Use **memo()** for expensive components that receive the same props frequently.
- **Loading, Error, and Empty states must always be handled** in every data-fetching component.
- Components must not contain business logic. Delegate to hooks or services.
- **No component exceeds 200 lines.** Split into sub-components.

```typescript
// GOOD: Typed props, aria labels, loading state
interface CrowdZoneCardProps {
  zoneId: string;
  density: number;
  label: string;
  onAlertClick: (zoneId: string) => void;
}

const CrowdZoneCard: React.FC<CrowdZoneCardProps> = ({ zoneId, density, label, onAlertClick }) => {
  if (!density && density !== 0) return <ZoneCardSkeleton />;
  return (
    <div
      id={`zone-card-${zoneId}`}
      role="region"
      aria-label={`Zone ${label} crowd density: ${density}%`}
    >
      ...
    </div>
  );
};
```

### 4.2 UI Component Library

- All primitive UI elements (Button, Input, Card, Modal) must come from `packages/ui-kit`.
- **Never create a one-off styled button** in a feature component.
- UI Kit components must be **fully accessible** and **design-token-driven**.
- Every UI Kit component must have a corresponding **Storybook story**.

---

## 5. Error Handling Rules

- **Never swallow errors silently.** Every `catch` block must log or rethrow.
- Define **custom error classes** for all domain-specific errors.
- All API responses must use the **standard error response format** (see API Rules).
- HTTP status codes must be **semantically correct** (400 for validation, 404 for not found, 500 for server errors).
- **Never expose stack traces or internal errors** to API consumers in production.
- All unhandled promise rejections must be caught at the top level (global handler).
- Frontend must display **user-friendly error messages**, never raw error strings.
- All errors must be **logged to Datadog/Sentry** with context (userId, requestId, venueId).

```typescript
// Custom error hierarchy
class StadiumIQError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends StadiumIQError {
  constructor(message: string) { super('VALIDATION_ERROR', message, 400); }
}

class NotFoundError extends StadiumIQError {
  constructor(message: string) { super('NOT_FOUND', message, 404); }
}

class UnauthorizedError extends StadiumIQError {
  constructor(message: string) { super('UNAUTHORIZED', message, 401); }
}
```

---

## 6. API Rules

- All endpoints must be **versioned**: `/api/v1/`, `/api/v2/`, etc.
- All endpoints must require **authentication by default**. Explicitly mark public endpoints.
- All inputs must be **validated** using a schema validation library (Zod for TypeScript, Pydantic for Python).
- All responses must follow the **standard envelope format**:
  ```json
  { "success": true, "data": {}, "meta": { "requestId": "", "timestamp": "" }, "error": null }
  ```
- **Idempotency keys** required for all POST operations that create resources.
- **Rate limiting** must be configured at the API Gateway level for every route.
- Paginated endpoints must use **cursor-based pagination**, not offset.
- All API routes must have:
  - Input validation
  - Authentication check
  - Authorization check (RBAC)
  - Logging with requestId
  - Error handling
- **Never return sensitive data** (passwords, tokens, PII) in API responses unless explicitly required and scoped.
- API documentation (OpenAPI 3.1) must be generated and kept up to date for every endpoint.
- Breaking API changes require a new version; non-breaking changes are backwards compatible.

---

## 7. Database Rules

- **Every table must have:** `id (UUID)`, `created_at (TIMESTAMPTZ)`, `updated_at (TIMESTAMPTZ)`.
- **Never use auto-increment integers** as primary keys. Always use UUIDs.
- **All foreign keys must have explicit indexes** created.
- **Never perform N+1 queries.** Use joins, eager loading, or DataLoader patterns.
- **Database migrations must be versioned** and run in order (use Flyway or Prisma Migrate).
- **Never modify existing migrations** once merged to main. Create a new migration.
- **Never delete columns** in a single migration. Deprecate → migrate data → delete.
- Queries must use **parameterized statements** to prevent SQL injection (no string concatenation).
- **Sensitive columns** (emails, phone numbers) must be **encrypted at the database level**.
- All queries running in production must be **explained and indexed** — no sequential scans on large tables.
- **Transactions** must be used for any multi-step operation that must be atomic.
- **Soft deletes** preferred over hard deletes for all critical entities (`deleted_at` column).

---

## 8. Git Rules

- **Never commit directly to `main` or `develop`.** All changes go through Pull Requests.
- Branch naming: `type/short-description` (e.g., `feat/crowd-heatmap`, `fix/ble-drift-bug`).
- One logical change per PR. **Do not bundle unrelated changes.**
- PR must include:
  - Descriptive title following commit format
  - Summary of what changed and why
  - Testing steps
  - Screenshots/recordings for UI changes
  - Linked issue/ticket
- **Minimum 1 approval** required before merging to `develop`.
- **Minimum 2 approvals** required before merging to `main`.
- CI must pass before any merge is allowed.
- **Squash and merge** for feature PRs; **merge commit** for release PRs.
- Branches must be **deleted after merging**.
- `main` branch is always **deployable to production**.
- `develop` branch is always **deployable to staging**.

### 8.1 Branch Strategy

```
main         ← Production releases only
  └── develop ← Staging integration
        ├── feat/ai-assistant-voice-input
        ├── feat/crowd-surge-prediction
        ├── fix/navigation-ble-accuracy
        └── chore/update-dependencies
```

---

## 9. Commit Message Format

All commits must follow **Conventional Commits** specification.

### Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | When to Use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only changes |
| `style` | Code formatting, no logic change |
| `refactor` | Code restructuring, no feature/fix |
| `test` | Adding or updating tests |
| `chore` | Dependency updates, config changes |
| `perf` | Performance improvements |
| `ci` | CI/CD configuration changes |
| `revert` | Reverting a previous commit |

### Scopes

`fan-app` | `command-center` | `volunteer-portal` | `fan-service` | `crowd-intel` | `ai-service` | `navigation` | `transport` | `volunteer-service` | `sustainability` | `ui-kit` | `infra` | `db`

### Examples

```
feat(crowd-intel): add 15-minute surge prediction model

Implements LSTM-based crowd surge predictor using match event feed
as additional input signal. Improves prediction accuracy from 72% to 89%.

Closes #142

---

fix(fan-app): correct BLE beacon drift on iOS 18

BLE position was drifting by up to 5m on iOS 18 due to background
location permission changes. Added foreground service fallback.

Fixes #198

---

docs(ai-service): update RAG knowledge base ingestion guide

---

chore(infra): upgrade Kubernetes to 1.30 on AKS cluster
```

### Rules
- Subject line maximum **72 characters**
- Use **imperative mood**: "add feature" not "added feature"
- **No period** at the end of the subject line
- Body explains **what** and **why**, not how

---

## 10. Documentation Rules

- **Every public function must have a JSDoc / docstring** explaining purpose, parameters, and return value.
- **Every API endpoint must be documented** in OpenAPI 3.1 format in the corresponding service.
- **Every environment variable must be documented** in `.env.example` with a description and whether it's required.
- **Every architectural decision must be recorded** as an ADR (Architecture Decision Record) in `docs/adr/`.
- **README must be kept up to date** — installation, environment setup, running locally, running tests.
- **All new features must update Memory.md** after completion.
- **Breaking changes** must be documented in `CHANGELOG.md`.
- Comments explain **why**, not **what**. Self-documenting code is preferred over comments explaining the obvious.

```typescript
// BAD: Comment explains what (obvious from code)
// Loop through users
users.forEach(user => ...);

// GOOD: Comment explains why (non-obvious business logic)
// Accessibility users must receive notifications 30 min early
// due to extra transit time required per FIFA protocol v2.3.1
const notificationOffset = user.hasAccessibilityNeeds ? 30 : 10;
```

---

## 11. Performance Rules

- **Lazy load all route components** — never bundle everything upfront.
- **Images must be optimized** (WebP, proper sizing, lazy loading via `loading="lazy"`).
- **No synchronous operations in event loops.** Move blocking work to background workers.
- All database queries fetching lists must be **paginated** (max 100 items per page default).
- **Cache aggressively with Redis:**
  - Venue map data: TTL 1 hour
  - Match schedule: TTL 5 minutes
  - AI conversation context: TTL 30 minutes
  - Crowd density: TTL 30 seconds (real-time)
- **Avoid over-fetching.** Never fetch fields you don't need — select specific columns.
- **WebSocket connections must be pooled** — do not open a new connection per request.
- **Web app bundle size:** Fan PWA initial bundle must not exceed 2MB download size (gzipped) for fast loading on cellular connections.
- All API reads must target < 200ms p95 latency. Profile and optimize queries that exceed this.
- **Memoize expensive React renders** — use `React.memo`, `useMemo`, `useCallback` appropriately.
- **Token security:** Avoid saving auth tokens in standard LocalStorage. Use SessionStorage or HTTP-only cookies to mitigate XSS.
- Avoid re-renders: ensure Zustand slices are granular; don't subscribe to the entire store.

---

## 12. Security Rules

- **NEVER hardcode secrets, API keys, or credentials** anywhere in the codebase.
- All secrets must be stored in **Azure Key Vault** and injected via environment variables at runtime.
- **All user input must be sanitized and validated** before processing.
- **Never store passwords** in plain text — use Auth0 for all authentication.
- **PII must be encrypted** at rest (AES-256) and in transit (TLS 1.3).
- **Crowd camera data must not be stored** beyond the 24-hour operational window.
- No fan data is sent to third-party LLM providers — use **PII-stripped prompts** only.
- All LLM responses must go through **content filtering** before delivery to users.
- **Rate limiting** must be applied to all authentication endpoints and AI inference endpoints.
- **RBAC checks must occur in the service layer**, not just the API gateway.
- **SQL injection** prevention: always use parameterized queries or ORMs. Never concatenate SQL strings.
- **CSRF protection** on all web forms and state-changing requests.
- **Content Security Policy (CSP)** headers configured on all web apps.
- **Dependency vulnerability scans** run in CI on every PR (`npm audit`, `safety`, `trivy`).
- **Penetration testing** required before each tournament phase deployment.
- **Audit logs** maintained for all privileged actions (organizer commands, emergency broadcasts).

---

## 13. Accessibility Rules

- All web interfaces must meet **WCAG 2.2 Level AA** minimum.
- Every interactive element must have an **`aria-label`** or visible label.
- **Keyboard navigation** must work for all interactive elements (Tab, Enter, Escape).
- **Focus management** must be handled on modal open/close and route changes.
- Color alone must **not convey meaning** — use icons, text, or patterns alongside color.
- All form inputs must have **associated `<label>` elements** (not just placeholder text).
- **Error messages must be announced** by screen readers (use `aria-live="polite"` for errors).
- All images must have **meaningful `alt` text** or `alt=""` for decorative images.
- Minimum **touch target size: 44x44px** on all mobile interactive elements.
- **Color contrast ratio minimum: 4.5:1** for normal text, 3:1 for large text.
- The fan app must be tested with **VoiceOver (iOS)** and **TalkBack (Android)** before each release.
- **Text must remain readable** when system font size is increased to 200%.
- **Never remove focus outlines.** Custom styles permitted, but focus state must always be visible.
- **Time limits** (e.g., session timeouts) must warn users with an extension option.

---

## 14. What AI SHOULD DO

These rules apply when AI tools (Copilot, Gemini, Claude, etc.) assist with development:

- **Always read the existing code** in the surrounding context before generating new code.
- **Always follow the naming conventions** defined in this document.
- **Always generate typed code** — TypeScript with strict types, Python with type hints.
- **Always add JSDoc/docstrings** to every function or class generated.
- **Always use the existing UI Kit** components from `packages/ui-kit` — not raw HTML elements.
- **Always use environment variables** for any configuration value.
- **Always generate unit tests** for every function or service created.
- **Always handle loading, error, and empty states** in every component.
- **Always validate user inputs** using Zod (TypeScript) or Pydantic (Python).
- **Always separate business logic** from presentation components.
- **Always check for existing patterns** in the codebase before implementing a new approach.
- **Always create reusable, modular code.** Build for extension, not repetition.
- **Always apply accessibility attributes** to every interactive element.
- **Always update Memory.md** when completing a feature or milestone.
- **Always use the standard API response envelope** format.
- **Always add error handling** to every async function.
- **Always use dependency injection** over hardcoded module imports in services.
- **Always prefer composition over inheritance** in class design.

---

## 15. What AI MUST NEVER DO

These are absolute prohibitions — violations will be reverted immediately:

| # | Rule |
|---|------|
| 1 | **NEVER hardcode secrets, API keys, tokens, or credentials** in any file |
| 2 | **NEVER write duplicate code** — check for existing implementations first |
| 3 | **NEVER use `any` type** in TypeScript |
| 4 | **NEVER swallow exceptions** with empty `catch` blocks |
| 5 | **NEVER store PII in logs, analytics, or client-side storage** |
| 6 | **NEVER directly modify database records** outside of the service/repository layer |
| 7 | **NEVER use `innerHTML` with user-provided content** (XSS risk) |
| 8 | **NEVER build new UI components** without checking `packages/ui-kit` first |
| 9 | **NEVER commit `.env` files or secrets** to version control |
| 10 | **NEVER add dependencies** without checking for security vulnerabilities first |
| 11 | **NEVER delete database migrations** once merged to main |
| 12 | **NEVER skip input validation** — always validate before processing |
| 13 | **NEVER create components with inline styles** — use design tokens |
| 14 | **NEVER store raw images or camera frames** from crowd monitoring beyond 24 hours |
| 15 | **NEVER send unredacted fan PII to external LLM providers** |
| 16 | **NEVER bypass RBAC checks** — never trust client-side role data |
| 17 | **NEVER use `console.log` in production code** — use the structured logger |
| 18 | **NEVER create sequential integer IDs** for any database primary key |
| 19 | **NEVER skip the standard API envelope** — all responses must be wrapped |
| 20 | **NEVER merge a PR** that has failing tests or lint errors |

---

## 16. Hackathon & Demo Optimization Rules

To maximize evaluation scores during hackathon judging, the following practices are strictly enforced to demonstrate code clarity, security, efficiency, and engineering excellence:

### 16.1 Demo Seeding & Instant Readiness
- **Seed Command:** The project must include a single, executable mock database seed script (`npm run db:seed` or `python run_seed.py`). 
- **Telemetry Simulation:** The seed script must populate a realistic live-event state: 3 simulated ongoing World Cup matches, 15 ticketing gates (with varying queue lengths), 20 arena zones (with crowd densities ranging from 20% to 95%), and 10 active volunteer tasks.
- **No Manual Setup:** A judge must be able to boot the entire stack using `docker compose up` and see a fully populated operations control dashboard immediately without manually creating records.

### 16.2 GenAI Traceability & Inspector Panels
- **Prompts Isolation:** All LLM prompts must be isolated in a dedicated `prompts/` directory as structured YAML files or TypeScript templates. Prompts must never be mixed with controller/router logic.
- **LLM Logs:** In development/demo mode, every GenAI chat request must log the raw input context, system prompt template, retrieved vector chunks (for RAG), token counts, inference latency, and grounding scores.
- **Judge Debug Console:** The frontend web interfaces must include a toggleable **"AI Inspector Panel"** in demo modes, allowing judges to click any AI response and inspect the underlying system prompt, vector database distances (pgvector cosine scores), and latency metrics.

### 16.3 Structured LLM Output Enforcement
- **JSON Schema Only:** All LLM calls returning parameters (e.g., incident extraction, volunteer tasks mapping, navigation directions steps) must use structured output formatting (JSON mode or Pydantic schema validation).
- **Hallucination Safe Fallbacks:** If the LLM returns invalid JSON or violates the required schema, the service must catch the parsing exception and return a structured fallback response, preventing application crashes.

### 16.4 Extreme Performance & Caching Indicators
- **Vector Search Indexing:** pgvector queries must utilize **HNSW indexes** (`CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops)`) to show judges optimized, scalable vector retrieval.
- **API Cache Hits:** Redis caching must be implemented on all external API requests (e.g., transit GTFS-RT APIs). The response envelope metadata must include a `cacheHit: boolean` header to clearly verify database caching efficiency.

### 16.5 AI Output Guardrails & Safety
- **Content Moderation:** All user-submitted questions and LLM responses must pass a local regex filter and moderation check (e.g., checking for prompt injection keywords like "ignore previous instructions") before processing, showing robust security design.

---

*Document End — Rules.md v1.1.0*  
*These rules must be reviewed and updated at the start of each development phase.*
