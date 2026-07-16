# StadiumIQ Testing Guide

This guide details the test execution workflows across the monorepo workspaces.

---

## 1. Test Architecture

StadiumIQ implements Vitest for all unit and mock integration testing:

- **Client Portals**: Tests in `apps/fan-app/src/__tests__` verify mathematical BLE trilateration coordinate calculators, waste classification rules, and state reducer updates.
- **Backend Functions**: Tests in `functions/src/__tests__` verify HTTPS request seeding, RAG prompts, and dynamic pricing adjustments.

---

## 2. Test Execution

### Run All Monorepo Test Suites

Run the following from the repository root:

```bash
npm run test
```

### Run Client Tests Specifically

```bash
npx turbo run test --filter=@stadiumiq/fan-app
```

### Run Functions Tests Specifically

```bash
npm run test --workspace=functions
```
