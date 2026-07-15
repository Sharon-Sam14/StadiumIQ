# Vercel Frontend Deployment Manual

This guide describes how to publish the three StadiumIQ frontend portals to Vercel and map custom subdomains for production access.

---

## ⚡ Prerequisite Accounts
1. **GitHub Account**: To store codebase repositories.
2. **Vercel Account**: Use your GitHub account to sign up at [vercel.com](https://vercel.com).
3. **Domain Registrar (Optional)**: If mapping custom domains (e.g. GoDaddy, Namecheap, Cloudflare DNS).

---

## 🚀 Step-by-Step Vercel Integration

### 1. Link Your Git Repository
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project**.
3. Select the GitHub repository containing the StadiumIQ code.

### 2. Configure Monorepo Projects

Configure each application as a separate project on Vercel:

#### A. Fan Portal (`@stadiumiq/fan-app`)
- **Project Name**: `stadiumiq-fan-app`
- **Framework Preset**: `Vite`
- **Root Directory**: `apps/fan-app`
- **Build & Development Settings**:
  - Build Command: `npm run build`
  - Output Directory: `dist`
- **Environment Variables**:
  - `VITE_API_GATEWAY_URL`: `https://api.stadiumiq.com`

#### B. Volunteer Portal (`@stadiumiq/volunteer-portal`)
- **Project Name**: `stadiumiq-volunteer-portal`
- **Framework Preset**: `Vite`
- **Root Directory**: `apps/volunteer-portal`
- **Build & Development Settings**:
  - Build Command: `npm run build`
  - Output Directory: `dist`
- **Environment Variables**:
  - `VITE_API_GATEWAY_URL`: `https://api.stadiumiq.com`
  - `VITE_WEBSOCKET_ALERTS_URL`: `wss://api.stadiumiq.com/api`

#### C. Command Center (`@stadiumiq/command-center`)
- **Project Name**: `stadiumiq-command-center`
- **Framework Preset**: `Next.js`
- **Root Directory**: `apps/command-center`
- **Build & Development Settings**:
  - Build Command: `npm run build`
  - Output Directory: `.next`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_GATEWAY_URL`: `https://api.stadiumiq.com`

---

## 🔗 Custom Domain DNS Mapping

To map custom subdomains, configure the Vercel DNS settings:

1. In the Vercel Dashboard, go to your project **Settings** > **Domains**.
2. Add your custom domain (e.g., `fan.stadiumiq.com`).
3. Vercel will prompt you to configure CNAME records in your DNS Registrar (e.g., Cloudflare, GoDaddy):
   - Type: `CNAME`
   - Name: `fan`
   - Target: `cname.vercel-dns.com.`
4. Once DNS propagates, Vercel will automatically provision SSL certificates via Let's Encrypt.
