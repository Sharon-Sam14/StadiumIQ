# Production Deployment Pre-Flight Checklist

Before launching StadiumIQ in production, verify that all security, performance, and functionality checks are met.

---

## 🔒 Security Requirements
- [ ] **Hardcoded Secrets**: Verify that no API keys or passwords are left hardcoded in Dockerfiles or source files.
- [ ] **Database Credentials**: Change the postgres user password from the default `adminpassword` to a strong, random password.
- [ ] **OpenSearch Password**: Change `OPENSEARCH_INITIAL_ADMIN_PASSWORD` in `.env` to a strong password.
- [ ] **UFW Ingress**: Confirm that only ports `22` (SSH), `80` (HTTP), and `443` (HTTPS) are exposed on the host.
- [ ] **SSL Redirection**: Verify that visiting `http://` redirects users to `https://`.
- [ ] **Non-root Container Users**: Verify that the Node microservices are running as the `node` user in the containers.
- [ ] **Secure Headers**: Verify that Helmet is active and security headers are returned on all endpoints.

---

## 📈 Performance & Availability
- [ ] **Redis Caching**: Verify that Redis connection succeeds and caching is active on API calls.
- [ ] **Database Indexes**: Verify that indexes on database columns (`reportedBy`, `matchId`, `xpPoints`, `ecoPoints`) are applied.
- [ ] **Resource Limits**: Verify that CPU and memory limits are configured in `docker-compose.yml` for database and search engines to prevent resource starvation.

---

## 🧪 Functional Verification
- [ ] **Health Checks**: Verify that all containers show as `healthy` in `docker compose ps`.
- [ ] **Database Migrations**: Check that schema tables exist and standard seeding (challenges, rewards, default users) succeeded.
- [ ] **Kong Routing**: Confirm that routing `/api/v1/fans` and `/api/v1/volunteers` is forwarded to the correct internal microservices.
- [ ] **AI Endpoint**: Query the AI endpoint to ensure it returns successful responses from Gemini.
- [ ] **WebSocket Broadcasts**: Open a WebSocket listener to verify that safety alert broadcasts trigger instant alerts.
