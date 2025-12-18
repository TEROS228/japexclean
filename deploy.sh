#!/bin/bash

# Deployment script for japexclean
# Usage: ./deploy.sh

set -e  # Exit on error

SERVER="root@154.12.247.109"
REMOTE_PATH="/var/www/japexclean"
LOCAL_PATH="/Users/leontrofimenko/Desktop/japexclean"

echo "🚀 Starting deployment to production server..."
echo ""

# Step 1: Sync files to server (excluding node_modules, .next, etc.)
echo "📤 Step 1: Syncing files to server..."
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'prisma/dev.db' \
  --exclude 'prisma/*.db' \
  --exclude 'public/uploads' \
  --exclude '.env.local' \
  --exclude '._*' \
  --progress \
  "$LOCAL_PATH/" "$SERVER:$REMOTE_PATH/"

echo "✅ Files synced!"
echo ""

# Step 2: Install dependencies, apply migrations, build, and restart on server
echo "🔧 Step 2: Building and restarting application on server..."
ssh $SERVER << 'ENDSSH'
  cd /var/www/japexclean

  echo "📦 Installing dependencies..."
  npm ci --production=false --quiet

  echo "🗄️  Applying database migrations..."
  if [ -f "add_compensation_type.sql" ]; then
    echo "Applying compensation type migration..."
    PGPASSWORD=Zzllqqppwwaa937 psql -U japexclean -d "japexclean_db" -f add_compensation_type.sql
    echo "✅ Migration applied successfully"
  fi

  echo "🔄 Generating Prisma client and pushing schema..."
  npx prisma generate
  npx prisma db push --accept-data-loss

  echo "⚙️  Updating nginx configuration for file uploads..."
  # Check if client_max_body_size is already set
  if ! grep -q "client_max_body_size" /etc/nginx/nginx.conf; then
    # Add it to http block
    sudo sed -i '/http {/a \    client_max_body_size 100M;' /etc/nginx/nginx.conf
    echo "✅ Added client_max_body_size to nginx"
    sudo nginx -t && sudo systemctl reload nginx
  else
    echo "✅ Nginx already configured for large uploads"
  fi

  echo "🏗️  Building application..."
  npm run build

  echo "♻️  Restarting PM2..."
  pm2 restart japexclean --update-env

  echo "📊 Application status:"
  pm2 status
ENDSSH

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌐 Your site is live at: http://85.239.237.155"
echo ""
