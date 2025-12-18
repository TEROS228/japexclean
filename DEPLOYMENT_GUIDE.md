# 🚀 Production Deployment Guide

Server IP: `85.239.237.155`

## 📋 Prerequisites Checklist

- [ ] VPS Server (Contabo Cloud VPS 10) - ✅ Ready
- [ ] Ubuntu 24.04 installed - ✅ Ready
- [ ] SSH access to server
- [ ] Domain (optional, can use IP for now)

---

## 🔧 Step 1: Connect to Server

### On Mac/Linux:
```bash
ssh root@85.239.237.155
```

### On Windows:
1. Download PuTTY: https://www.putty.org/
2. Host: `194.163.170.126`
3. Port: `22`
4. Click "Open"
5. Enter password when prompted

---

## 🛡️ Step 2: Initial Server Setup (Security First!)

Run these commands one by one:

```bash
# Update system
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git build-essential ufw

# Setup firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable

# Check firewall status
ufw status
```

---

## 🐘 Step 3: Install PostgreSQL

```bash
# Install PostgreSQL 16
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE japexclean_db;
CREATE USER japexclean WITH PASSWORD 'Zzllqqppwwaa937';
GRANT ALL PRIVILEGES ON DATABASE japexclean_db TO japexclean;
ALTER DATABASE japexclean_db OWNER TO japexclean;
\q
EOF

# Verify connection
sudo -u postgres psql -d japexclean_db -c "SELECT version();"
```

**✅ PostgreSQL is ready!**

---

## 📦 Step 4: Install Node.js & PM2

```bash
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version

# Install PM2 globally
npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd
```

**✅ Node.js & PM2 ready!**

---

## 🚀 Step 5: Deploy Application

```bash
# Create app directory
mkdir -p /var/www/japexclean
cd /var/www/japexclean

# Clone your code (you'll need to push to GitHub first)
# OR upload via SCP/SFTP

# For now, you'll upload the code manually
# Instructions below...
```

### Upload Code from Your Mac:

From your local machine (NOT on server), run:

```bash
# Compress project (excluding node_modules and .next)
cd /Users/leontrofimenko/Desktop/japexclean
tar --exclude='node_modules' --exclude='.next' --exclude='prisma/dev.db' -czf japexclean.tar.gz .

# Upload to server
scp japexclean.tar.gz root@194.163.170.126:/var/www/japexclean/

# Then on server, extract:
cd /var/www/japexclean
tar -xzf japexclean.tar.gz
rm japexclean.tar.gz
```

---

## ⚙️ Step 6: Configure Environment

```bash
cd /var/www/japexclean

# Create .env file
nano .env
```

Paste this (replace passwords):

```env
DATABASE_URL="postgresql://japexclean:YOUR_SECURE_PASSWORD_HERE@localhost:5432/japexclean_db?schema=public"
JWT_SECRET="GENERATE_RANDOM_32_CHARS"
NEXTAUTH_URL="http://194.163.170.126:3000"
NEXTAUTH_SECRET="ANOTHER_RANDOM_STRING"
NODE_ENV="production"
PORT=3000
```

**Generate secure secrets:**
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

Save file: `Ctrl+X`, then `Y`, then `Enter`

---

## 📦 Step 7: Install Dependencies & Build

```bash
cd /var/www/japexclean

# Install dependencies
npm ci --production=false

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build Next.js
npm run build

# Set proper permissions
chown -R www-data:www-data /var/www/japexclean
```

---

## 🏃 Step 8: Start Application with PM2

```bash
cd /var/www/japexclean

# Start with PM2
pm2 start npm --name "japexclean" -- start

# Save PM2 process list
pm2 save

# Check status
pm2 status
pm2 logs japexclean
```

**✅ App should be running on port 3000!**

Test: Open browser → `http://194.163.170.126:3000`

---

## 🌐 Step 9: Setup Nginx Reverse Proxy

```bash
# Install Nginx
apt install -y nginx

# Create Nginx config
nano /etc/nginx/sites-available/japexclean
```

Paste this config:

```nginx
server {
    listen 80;
    server_name 194.163.170.126;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save and activate:

```bash
# Enable site
ln -s /etc/nginx/sites-available/japexclean /etc/nginx/sites-enabled/

# Test config
nginx -t

# Restart Nginx
systemctl restart nginx
systemctl enable nginx
```

**✅ Now access via:** `http://194.163.170.126` (no port needed!)

---

## 🔐 Step 10: Setup Automatic Backups

```bash
# Create backup script
nano /root/backup-db.sh
```

Paste:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
PGPASSWORD='YOUR_DB_PASSWORD' pg_dump -U japexclean -h localhost japexclean_db > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable and schedule:

```bash
chmod +x /root/backup-db.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
```

Add this line:
```
0 2 * * * /root/backup-db.sh >> /var/log/backup.log 2>&1
```

---

## 🎉 DONE! Your site is live!

Access: `http://194.163.170.126`

---

## 📊 Useful Commands

```bash
# Check app status
pm2 status
pm2 logs japexclean

# Restart app
pm2 restart japexclean

# Check Nginx
systemctl status nginx
nginx -t

# Check PostgreSQL
systemctl status postgresql
sudo -u postgres psql -d japexclean_db

# View logs
pm2 logs japexclean --lines 100
tail -f /var/log/nginx/error.log

# Update app (after code changes)
cd /var/www/japexclean
git pull  # or upload new code
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart japexclean
```

---

## 🔜 Next Steps (After Domain Purchase)

1. Point domain DNS to: `194.163.170.126`
2. Update Nginx config with domain name
3. Install SSL certificate with Let's Encrypt:
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🆘 Troubleshooting

**App not starting?**
```bash
pm2 logs japexclean --lines 50
```

**Database connection error?**
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
psql -U japexclean -d japexclean_db -h localhost
```

**Nginx error?**
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

**Port already in use?**
```bash
lsof -i :3000
# Kill process if needed
kill -9 <PID>
```
