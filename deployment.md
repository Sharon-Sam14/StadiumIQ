# StadiumIQ Deployment & Operations Manual

This document outlines the steps to deploy the StadiumIQ microservices stack to production, focusing on the **Oracle Cloud Infrastructure (OCI) Always Free Tier**, along with alternative platforms.

---

## 🏗️ Architecture Summary

StadiumIQ runs as a multi-container stack orchestrated via Docker Compose:
- **API Gateway (Kong)**: Serves as the main reverse proxy on port `8000` (proxy) and `8001` (admin).
- **Backend Services**: `fan-service` (3001), `volunteer-service` (3002), `transport-service` (3003), `ai-service` (8000 internally), and `crowd-intel-service` (8002).
- **Databases & Middleware**: PostgreSQL 16 (with pgvector), Redis 7 (caching), InfluxDB (telemetry), OpenSearch (semantic indexing), Kafka/Zookeeper (real-time messaging), and MinIO (object storage).

---

## 🚀 Oracle Cloud Always Free VM Deployment

### 1. VM Configuration
Sign up for Oracle Cloud Free Tier and create an instance with the following specifications:
- **OS**: Ubuntu 24.04 LTS
- **Shape**: `VM.Standard.A1.Flex` (ARM64 Ampere processor)
  - **OCPUs**: 4
  - **Memory**: 24 GB RAM
  - **Storage**: 100 GB Boot Volume
  > [!NOTE]
  > This ARM-based shape is part of OCI's Always Free tier and is highly recommended as it provides enough RAM to host the entire StadiumIQ middleware stack.

### 2. Configure Virtual Cloud Network (VCN) Ingress Rules
In the OCI console, navigate to **VCN > Security Lists > Default Security List** and add Ingress Rules:
- **Port 80 (HTTP)**: Source `0.0.0.0/0`, TCP port `80` (for SSL certification challenge)
- **Port 443 (HTTPS)**: Source `0.0.0.0/0`, TCP port `443` (for secure API traffic)

### 3. Server Setup & Installing Docker
SSH into your instance and run the following command to install Docker and Docker Compose:
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io docker-compose-v2

# Configure Docker to run without sudo (optional)
sudo usermod -aG docker $USER
newgrp docker

# Enable Docker service
sudo systemctl enable --now docker
```

### 4. Clone and Configure Environment
Clone the repository and copy the environment template:
```bash
git clone https://github.com/Sharon-Sam14/StadiumIQ.git
cd StadiumIQ

# Create production env
cp production_env.example .env
nano .env  # Add your secrets and Gemini API Key
```

### 5. Running the Stack
Run the docker compose command:
```bash
docker compose up -d --build
```
This will automatically:
1. Rebuild all Node and Python services.
2. Spin up PostgreSQL and wait for it to become healthy.
3. Spin up `db-init` to run migrations (`prisma db push`) and seed the database.
4. Launch the backend microservices.

---

## 🌐 Domain, HTTPS, and Reverse Proxy Configuration

To expose the Kong API gateway securely via SSL, set up **Nginx** or **Caddy** on the host.

### Option A: Using Nginx + Certbot (Recommended)
1. **Install Nginx & Certbot**:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

2. **Configure Nginx**:
   Create a configuration file at `/etc/nginx/sites-available/stadiumiq`:
   ```nginx
   server {
       server_name api.stadiumiq.yourdomain.com;

       location / {
           proxy_pass http://localhost:8000; # Routes directly to Kong API Gateway
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   Activate the site and reload Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/stadiumiq /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

3. **Request SSL Certificate**:
   ```bash
   sudo certbot --nginx -d api.stadiumiq.yourdomain.com
   ```
   Certbot will automatically obtain the Let's Encrypt certificate and update Nginx to redirect HTTP to HTTPS.

---

## 📦 Alternative Deployments

### Render / Railway / Fly.io (Platform-as-a-Service)
If deploying backend microservices separately:
1. Spin up a Managed PostgreSQL (with pgvector) and Managed Redis.
2. Deploy each service as a separate web service:
   - Provide the `DATABASE_URL` and `REDIS_URL` as env variables.
   - Set the `WORKDIR` context correctly (due to the monorepo structure).
3. Expose the services directly, using their platform-native routing and SSL.

---

## 💾 Operational Strategy

### 1. Backup Strategy (PostgreSQL & InfluxDB)
Create a daily cron job on the host VM to back up PostgreSQL:
```bash
# Backup PostgreSQL database
docker compose exec postgres-db pg_dump -U admin stadiumiq > /backups/db_$(date +%F).sql

# Retain backups for 14 days
find /backups -type f -mtime +14 -delete
```

### 2. Monitoring & Logging Strategy
- **Service Status Checks**: Check container health using `docker compose ps`.
- **Logs Ingestion**: Access logs via `docker compose logs -f [service_name]`.
- **InfluxDB Dashboard**: Visit `http://your-server-ip:8086` to inspect telemetry buckets.

### 3. Scaling Recommendations
- **Horizontal Scaling**: Since all Express services are stateless, scale them horizontally using Docker Compose:
  ```bash
  docker compose up -d --scale fan-service=3 --scale volunteer-service=3
  ```
- **Caching**: Ensure Redis is scaled or given memory limits so it doesn't crash on high load.

---

## 💰 Cost Estimate: OCI Always Free VM
- **Compute (Ampere A1 Flex)**: 4 OCPUs + 24 GB RAM — **$0.00** (Always Free)
- **Block Volume**: 100 GB Boot Volume — **$0.00** (Always Free)
- **Data Transfer**: 10 TB egress per month — **$0.00** (Always Free)
- **Total Estimated Cost**: **$0.00 / month**
