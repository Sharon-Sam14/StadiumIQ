# StadiumIQ Serverless Deployment Guide

This guide covers the deployment workflow for StadiumIQ's serverless components.

---

## 1. Backend Serverless Deployment (Firebase)

Deploy the Cloud Functions, Firestore rules, and indexes:

### Set Gemini Key Secret
```bash
firebase functions:secrets:set GEMINI_API_KEY="your-google-ai-studio-key"
```

### Deploy to Live Project
```bash
firebase deploy
```

---

## 2. Frontend Hosting Deployment (Vercel)

Deploy the Fan PWA, Volunteer portal, and Operations Command Center to **Vercel**:

1. Log in to Vercel and import your project repository.
2. Link the following workspaces:
   - **Fan Portal PWA**: Set root to `apps/fan-app`. Framework preset: `Vite`. Output: `dist`.
   - **Volunteer Portal**: Set root to `apps/volunteer-portal`. Framework preset: `Vite`. Output: `dist`.
   - **Command Center**: Set root to `apps/command-center`. Framework preset: `Next.js`. Output: `.next`.
3. Input client environment keys inside your Vercel project configuration dashboard (see `ENVIRONMENT_VARIABLES.md`).
