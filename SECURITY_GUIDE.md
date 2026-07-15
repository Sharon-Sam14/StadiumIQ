# Security Hardening & OWASP Alignment Guide

This guide outlines security practices and defensive configurations implemented in StadiumIQ to comply with OWASP top-10 security guidelines.

---

## 🛡️ Defensive Actions

### 1. Ingress Protection (Reverse Proxy + Gateway)
- **Nginx Ingress**: Direct ingress on the host is restricted to ports `80` and `443`. Ports `8001` (Kong Admin API) and `5432` (Postgres) are accessible only within the internal Docker network.
- **Let's Encrypt SSL**: Ingress traffic is encrypted using SSL (TLS 1.3) with standard HSTS (Strict-Transport-Security) headers.

### 2. Microservice Hardening
- **Helmet Middleware**: Express services utilize Helmet to set standard HTTP security headers:
  - `Content-Security-Policy`: Restricts scripts and style resources to trusted CDNs or native endpoints.
  - `X-Frame-Options`: Set to `SAMEORIGIN` to prevent clickjacking.
  - `X-Content-Type-Options`: Set to `nosniff` to prevent MIME-type sniffing.
- **CORS Policies**: Strict CORS configuration rejects origin access outside the whitelist (whitelisted domains are mapped to frontend deployments on Vercel).
- **Zod Data Sanitization**: Incoming request bodies are parsed using strict schemas. Unexpected parameters are stripped, preventing SQL/NoSQL injection and payload poisoning.

### 3. Least-Privileged Execution
- **Non-root Containers**: Microservice runner stages utilize the `node` user instead of `root` to execute compilation bundles. If a container is compromised, the attacker has limited system privileges.

### 4. API Gateway Rate-Limiting
- Kong API Gateway rate-limiting plugin is configured on proxy routes to reject request bursts exceeding `100` calls per minute, protecting services against DDoS and resource starvation.
