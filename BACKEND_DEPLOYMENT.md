# Backend Deployment Guide

This guide details VM setup, Docker Compose deployment, reverse proxy setup, SSL generation, log management, and backup policies for the StadiumIQ backend services.

---

## 🛠️ Step-by-Step Server Setup

### 1. Update OS and Install Base Utilities
Connect to your Ubuntu VM via SSH:
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw jq gnupg software-properties-common ca-certificates
```

### 2. Configure Firewall (UFW)
Secure your host port exposure by restricting network ingress:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable
```

### 3. Install Docker Engine & Compose
Install the Docker GPG keys and setup the stable package registry:
```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```
Verify Docker Compose version:
```bash
docker compose version
```

---

## 🐳 Running the Services

### 1. Clone the Codebase
```bash
git clone https://github.com/your-org/stadiumiq.git /opt/stadiumiq
cd /opt/stadiumiq
```

### 2. Configure Environment Variables
Copy `.env.example` to create the production settings:
```bash
cp .env.example .env
nano .env
```
Ensure all database passwords and internal secrets are changed to cryptographically secure values (e.g., minimum 16 characters including digits and special symbols).

### 3. Start Docker Compose Stack
Compile and launch the services in background daemon mode:
```bash
sudo docker compose up -d --build
```
On startup:
- The database migrations will be run by `stadiumiq-db-init` automatically.
- Seeding scripts will run to populate the tables with structural fixtures.
- Once finished, the gateway, API microservices, cache brokers, and databases will be fully running.

Verify running statuses:
```bash
sudo docker compose ps
```

---

## 🔒 SSL & Reverse Proxy Config (Nginx + Let's Encrypt)

Rather than exposing Kong gateway port `8000` directly to the web, we configure Nginx to act as a reverse proxy on ports `80` and `443` and manage SSL termination.

### 1. Install Nginx and Certbot
```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

### 2. Configure Server Block
Create `/etc/nginx/sites-available/stadiumiq.conf`:
```nginx
server {
    listen 80;
    server_name api.stadiumiq.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Link and test configuration:
```bash
sudo ln -s /etc/nginx/sites-available/stadiumiq.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Generate Let's Encrypt SSL Certificates
Run Certbot to automate SSL generation and automatic Nginx redirection configurations:
```bash
sudo certbot --nginx -d api.stadiumiq.com --non-interactive --agree-tos -m admin@stadiumiq.com
```

---

## 📈 System Diagnostics & Backups

### 1. Log Rotation Settings
Ensure that log outputs do not fill VM disk space. Create `/etc/logrotate.d/stadiumiq-containers`:
```text
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  missingok
  delaycompress
  copytruncate
}
```

### 2. Database Backup Script
Automate daily database snapshots. Create `/opt/stadiumiq/scripts/backup-db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/stadiumiq"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
sudo docker compose exec -t postgres-db pg_dump -U admin stadiumiq_db | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
find $BACKUP_DIR -type f -mtime +14 -delete
```
Add to daily cron jobs:
```bash
chmod +x /opt/stadiumiq/scripts/backup-db.sh
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/stadiumiq/scripts/backup-db.sh") | crontab -
```
