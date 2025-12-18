#!/bin/bash

# Server Setup Script for japexclean
# Run this ONCE on a fresh server to install all dependencies
# Usage: ./setup-server.sh

set -e  # Exit on error

SERVER="root@154.12.247.109"

echo "🚀 Setting up new server at $SERVER..."
echo ""

ssh $SERVER << 'ENDSSH'
set -e

echo "📦 Step 1: Updating system packages..."
apt-get update
apt-get upgrade -y

echo "📦 Step 2: Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "📦 Step 3: Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

echo "📦 Step 4: Installing PM2 globally..."
npm install -g pm2

echo "📦 Step 5: Installing additional dependencies..."
apt-get install -y build-essential git rsync

echo "🗄️  Step 6: Setting up PostgreSQL database..."
# Start PostgreSQL if not running
systemctl start postgresql
systemctl enable postgresql

# Create database user and database
sudo -u postgres psql << 'EOSQL'
-- Create user if not exists
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'japexclean') THEN
      CREATE USER japexclean WITH PASSWORD 'Zzllqqppwwaa937';
   END IF;
END
$$;

-- Create database if not exists
SELECT 'CREATE DATABASE japexclean_db OWNER japexclean'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'japexclean_db')\gexec

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE japexclean_db TO japexclean;
EOSQL

echo "📁 Step 7: Creating application directory..."
mkdir -p /var/www/japexclean
cd /var/www/japexclean

echo "🔥 Step 8: Setting up firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable

echo "✅ Server setup completed!"
echo ""
echo "Next steps:"
echo "1. Copy .env.production.full to the server as .env"
echo "2. Run ./deploy.sh to deploy the application"
ENDSSH

echo ""
echo "🎉 Server setup completed successfully!"
echo "📋 Next: Run './deploy.sh' to deploy your application"
echo ""
