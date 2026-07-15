# StadiumIQ Production Readiness Checklist

Ensure all items are verified before launching StadiumIQ in production.

---

## 🔒 1. Security & Credentials
- [ ] **Secrets Rotated**: All default passwords (`adminpassword`, `adminsecrettokenkey12345`) replaced with strong random values in `.env`.
- [ ] **No Secrets in Source Control**: Verified that `.env` is listed in `.gitignore` and no secrets have been committed.
- [ ] **Gemini API Key Configured**: Production key set in environment variables.
- [ ] **Database Connection Strings Secure**: Production DB password set to a strong credential.
- [ ] **Admin API Protection**: Expose Kong's Admin API (port `8001`) only internally (never to the public internet).

---

## 💾 2. Databases & Storage
- [ ] **PostgreSQL Ready**: pgvector extension enabled.
- [ ] **Seed Data Verified**: Schema initialized and standard database records populated.
- [ ] **InfluxDB Setup**: Org, bucket, and retention policies defined.
- [ ] **MinIO Configured**: S3 credentials set and default buckets created.

---

## ⚙️ 3. Container Configurations & Health
- [ ] **Zero-Dependency Health Checks**: Configured for all services in `docker-compose.yml`.
- [ ] **Restart Policies**: Set to `always` or `unless-stopped` for all critical services in the compose file.
- [ ] **Resource Limits**: Memory and CPU constraints defined (especially for memory-heavy OpenSearch).
- [ ] **Database Initialization Sequence**: Monitored and configured with `db-init` blocking container startups until migrations complete.

---

## 🌐 4. Networking & Routing
- [ ] **Kong Routing Rules**: Gateway mapping paths like `/api/v1/fans` to appropriate microservices.
- [ ] **Docker DNS Resolution**: Service references (e.g. `postgres-db`, `redis-cache`) used exclusively for inter-container communications.
- [ ] **SSL / HTTPS Configuration**: Active Nginx/Caddy reverse proxy with Let's Encrypt certificate.
- [ ] **No Localhost Bindings in Code**: Verified all services use relative paths or environment variables for API base URLs.
