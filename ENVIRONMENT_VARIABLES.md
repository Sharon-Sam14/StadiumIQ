# Environment Variables Reference

This document lists all environment variables required for StadiumIQ backend microservices and frontend portals, including templates for production configurations.

---

## 📂 Host Configuration (`.env`)
Place this file in the project root directory. It is read by Docker Compose during container startup.

```ini
# --- DATABASE CONFIG ---
POSTGRES_DB=stadiumiq_db
POSTGRES_USER=admin
POSTGRES_PASSWORD=cryptographically_secure_db_password_16_chars
DATABASE_URL=postgresql://admin:cryptographically_secure_db_password_16_chars@postgres-db:5432/stadiumiq_db?schema=public

# --- REDIS CONFIG ---
REDIS_URL=redis://redis-cache:6379

# --- KAFKA CONFIG ---
KAFKA_BROKER=kafka-broker:9092

# --- INFLUXDB CONFIG ---
INFLUXDB_URL=http://influx-db:8086
INFLUXDB_TOKEN=cryptographically_secure_token_64_chars
INFLUXDB_ORG=stadiumiq_org
INFLUXDB_BUCKET=stadiumiq_telemetry

# --- OPENSEARCH CONFIG ---
OPENSEARCH_INITIAL_ADMIN_PASSWORD=K3p$9!wQz7*vM2xP

# --- MINIO CONFIG ---
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadminpassword

# --- AI SERVICE CONFIG ---
GEMINI_API_KEY=AIzaSy_your_google_gemini_api_key_here

# --- KONG GATEWAY CONFIG ---
KONG_DECLARATIVE_CONFIG=/usr/local/kong/declarative/kong.yml
KONG_DATABASE=off
KONG_PROXY_LISTEN=0.0.0.0:8000, 0.0.0.0:8443 ssl http2
KONG_ADMIN_LISTEN=127.0.0.1:8001, 127.0.0.1:8444 ssl http2
```

---

## 📱 Frontend Configurations

### 1. Fan App (`apps/fan-app/.env`)
Create this file in the workspace directory before local builds or add in Vercel project environment settings:
```ini
VITE_API_GATEWAY_URL=https://api.stadiumiq.com
```

### 2. Volunteer Portal (`apps/volunteer-portal/.env`)
Create this file in the workspace directory before local builds or add in Vercel project environment settings:
```ini
VITE_API_GATEWAY_URL=https://api.stadiumiq.com
VITE_WEBSOCKET_ALERTS_URL=wss://api.stadiumiq.com/api
```

### 3. Command Center (`apps/command-center/.env`)
Create this file in the workspace directory before local builds or add in Vercel project environment settings:
```ini
NEXT_PUBLIC_API_GATEWAY_URL=https://api.stadiumiq.com
```
