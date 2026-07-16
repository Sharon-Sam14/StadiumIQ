# Engineering Rules & Guidelines — StadiumIQ

This document defines strict engineering rules for all current and future development.

---

## 1. Codebase & TypeScript Rules

### Always Do:

- Write strict TypeScript typing definitions. Avoid using `any` type casts wherever possible.
- Use path aliases (e.g. `@/hooks/...` or Presets) matching workspaces configurations.
- Reuse hooks such as `useIncidents` or `useEcoPoints` to interact with collections.

### Never Do:

- Never write credentials, private keys, or API tokens inside client-side components.
- Never write raw SQL code (the repository uses NoSQL Firestore collections).

---

## 2. React & UI Rules

### Always Do:

- Protect components rendering using `useCallback` or memo structures when listening to high-throughput Firestore snapshots.
- Ensure all forms, buttons, and custom controls contain semantic `aria-label` or `aria-describedby` mappings for keyboard readers.

### Never Do:

- Never edit the visual design tokens, glassmorphic layout colors, or brand animations unless explicitly directed.

---

## 3. Firebase & Security Rules

### Always Do:

- Deploy updated `firestore.rules` checks when declaring new collections.
- Set up Gemini SDK connection keys exclusively on the backend via Firebase Secrets Manager (`GEMINI_API_KEY`).
- Use secure client authentication credentials for all write requests.

### Never Do:

- Never allow open write permissions (`allow write: if true`) inside production rules definitions.
- Never fetch private Gemini keys inside client bundles.
