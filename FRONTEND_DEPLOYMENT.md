# Frontend Deployment Guide

This guide describes how to publish the three StadiumIQ web applications (@stadiumiq/fan-app, @stadiumiq/volunteer-portal, @stadiumiq/command-center) to Vercel, integrating with GitHub for automated GitOps CI/CD delivery pipelines.

---

## ⚡ Deployment Targets

Each of the three user portals represents a workspace inside our monorepo:

1. **Fan Portal** (`apps/fan-app`):
   - Runtime: Vite Single Page Application (SPA)
   - Route path mappings: Serves public and ticketing users.
   - Vercel target domain: `fan.stadiumiq.com`

2. **Volunteer Portal** (`apps/volunteer-portal`):
   - Runtime: Vite Single Page Application (SPA)
   - Route path mappings: Serves volunteers for real-time tasking.
   - Vercel target domain: `volunteer.stadiumiq.com`

3. **Command Center** (`apps/command-center`):
   - Runtime: Next.js (App Router)
   - Route path mappings: Dashboard for operation command metrics.
   - Vercel target domain: `command.stadiumiq.com`

---

## 🚀 Step-by-Step Vercel Setup

We deploy each app separately using Vercel's multi-project monorepo settings.

### 1. Link Your Git Repository
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project**.
3. Select your GitHub repository containing the StadiumIQ code.

### 2. Configure project settings on Vercel

Repeat this step for each of the three applications:

#### A. Project Settings: Fan Portal (`@stadiumiq/fan-app`)
- **Project Name**: `stadiumiq-fan-app`
- **Framework Preset**: `Vite`
- **Root Directory**: `apps/fan-app`
- **Build & Development Settings**:
  - Build Command: `npm run build` (Runs `tsc && vite build` inside the workspace)
  - Output Directory: `dist`
- **Environment Variables**:
  - `VITE_API_GATEWAY_URL`: `https://api.stadiumiq.com`

#### B. Project Settings: Volunteer Portal (`@stadiumiq/volunteer-portal`)
- **Project Name**: `stadiumiq-volunteer-portal`
- **Framework Preset**: `Vite`
- **Root Directory**: `apps/volunteer-portal`
- **Build & Development Settings**:
  - Build Command: `npm run build`
  - Output Directory: `dist`
- **Environment Variables**:
  - `VITE_API_GATEWAY_URL`: `https://api.stadiumiq.com`
  - `VITE_WEBSOCKET_ALERTS_URL`: `wss://api.stadiumiq.com/api`

#### C. Project Settings: Command Center (`@stadiumiq/command-center`)
- **Project Name**: `stadiumiq-command-center`
- **Framework Preset**: `Next.js`
- **Root Directory**: `apps/command-center`
- **Build & Development Settings**:
  - Build Command: `npm run build` (Runs `next build` inside the workspace)
  - Output Directory: `.next`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_GATEWAY_URL`: `https://api.stadiumiq.com`

---

## 🔗 DNS & Domain Mapping

To map custom subdomains, configure the Vercel DNS settings:

1. In the Vercel Dashboard, go to your project **Settings** > **Domains**.
2. Add your custom domain (e.g., `fan.stadiumiq.com`).
3. Vercel will prompt you to configure CNAME records in your DNS Registrar (e.g., Cloudflare, GoDaddy):
   - Type: `CNAME`
   - Name: `fan`
   - Target: `cname.vercel-dns.com.`
4. Once DNS propagates, Vercel will automatically provision SSL certificates via Let's Encrypt.
