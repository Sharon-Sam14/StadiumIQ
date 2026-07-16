# Vercel Deployment & Setup Guide for StadiumIQ

This document explains step-by-step how to deploy StadiumIQ's three React-based frontends to **Vercel** using the Vercel Hobby Plan (100% Free).

---

## 🏗️ Portals to Deploy

StadiumIQ contains three separate workspace applications inside the `apps/` directory:

1. **Fan Portal (PWA)**: `apps/fan-app` (Vite, port `5173`)
2. **Volunteer Portal**: `apps/volunteer-portal` (Vite, port `5174`)
3. **Operations Command Center**: `apps/command-center` (Next.js, port `3000`)

---

## 🛠️ Step-by-Step Vercel Setup

### 1. Push Your Code to GitHub

Ensure your repository is pushed to a private or public GitHub repository.

1. Create a repository on GitHub (e.g., `stadiumiq-monorepo`).
2. Commit your local files and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/stadiumiq-monorepo.git
   git push -u origin main
   ```

### 2. Log in to Vercel

1. Go to [Vercel](https://vercel.com/) and click **Sign Up** (or **Log In**).
2. Choose **Continue with GitHub** to authorize Vercel to access your repositories.

### 3. Deploy the Fan Portal PWA (`apps/fan-app`)

1. In the Vercel dashboard, click **Add New...** and select **Project**.
2. Find your `stadiumiq-monorepo` repository and click **Import**.
3. **Configure Project**:
   - **Project Name**: `stadiumiq-fan-app`
   - **Framework Preset**: Select **Vite**.
   - **Root Directory**: Click _Edit_ and select **`apps/fan-app`**, then click _Continue_.
   - **Build and Output Settings**:
     - Build Command: `npx turbo run build --filter=@stadiumiq/fan-app`
     - Output Directory: `dist`
   - **Environment Variables**: Add your Firebase configuration keys (see [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)):
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
4. Click **Deploy**. Vercel will install dependencies, compile the TypeScript code, build the PWA bundles, and provide a live URL.

### 4. Deploy the Volunteer Portal (`apps/volunteer-portal`)

1. In the Vercel dashboard, click **Add New...** and select **Project**.
2. Import the same `stadiumiq-monorepo` repository.
3. **Configure Project**:
   - **Project Name**: `stadiumiq-volunteer-portal`
   - **Framework Preset**: Select **Vite**.
   - **Root Directory**: Click _Edit_ and select **`apps/volunteer-portal`**, then click _Continue_.
   - **Build and Output Settings**:
     - Build Command: `npx turbo run build --filter=@stadiumiq/volunteer-portal`
     - Output Directory: `dist`
   - **Environment Variables**: Add the same set of `VITE_FIREBASE_*` credentials.
4. Click **Deploy**.

### 5. Deploy the Operations Command Center (`apps/command-center`)

1. In the Vercel dashboard, click **Add New...** and select **Project**.
2. Import the same `stadiumiq-monorepo` repository.
3. **Configure Project**:
   - **Project Name**: `stadiumiq-command-center`
   - **Framework Preset**: Select **Next.js** (Next.js 14 App Router project).
   - **Root Directory**: Click _Edit_ and select **`apps/command-center`**, then click _Continue_.
   - **Build and Output Settings**:
     - Build Command: `npx turbo run build --filter=@stadiumiq/command-center`
     - Output Directory: `.next`
   - **Environment Variables**: Add the same set of `VITE_FIREBASE_*` credentials.
4. Click **Deploy**.

---

## 🚨 Troubleshooting Common Vercel Errors

### 1. Build Failure: TS Config References Not Found

- **Symptom**: Next.js or Vite builds fail complaining about packages `@stadiumiq/tsconfig` or eslint definitions.
- **Fix**: Ensure you do NOT exclude the root workspace context. Vercel automatically detects the root `package.json` and workspaces. If it fails, ensure that the monorepo root package management files (`package-lock.json`) are checked in correctly.

### 2. PWA Service Worker Errors

- **Symptom**: PWA registration throws file errors or caching issues in browser console.
- **Fix**: Check that `vite-plugin-pwa` build outputs align. By default, Vite stores build outputs in `dist` which is captured correctly by Vercel.
