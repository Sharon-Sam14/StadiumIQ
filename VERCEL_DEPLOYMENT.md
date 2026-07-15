# Vercel Frontend Deployment Guide

This document describes how to build and deploy the React Fan PWA portal to **Vercel**.

## 1. Project Directory Configuration
- **Framework Preset**: `Vite` (for `@stadiumiq/fan-app`)
- **Root Directory**: `apps/fan-app` (if importing only the app workspace, or configured in monorepo scopes)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## 2. PWA Build Optimization
The Fan PWA incorporates workbox offline service workers (`vite-plugin-pwa`). In monorepo builds, ensure that all dependencies and workspace parameters are successfully resolved by Turborepo:
```bash
npx turbo run build --filter=@stadiumiq/fan-app
```

---

## 3. Vercel Configuration Settings
Create a new project on the [Vercel Dashboard](https://vercel.com) pointing to your GitHub repository:
- Select **Vite** as the framework.
- Set the root directory to `apps/fan-app`.
- Configure the environment variables (see `ENVIRONMENT_VARIABLES.md`).
