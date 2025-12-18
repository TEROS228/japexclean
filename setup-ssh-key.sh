#!/bin/bash

# Script to setup SSH key on the server
# Usage: ./setup-ssh-key.sh <root-password>

if [ -z "$1" ]; then
    echo "Usage: ./setup-ssh-key.sh <root-password>"
    echo "Example: ./setup-ssh-key.sh MyRootPassword123"
    exit 1
fi

SERVER="root@85.239.237.155"
ROOT_PASSWORD="$1"

echo "🔑 Setting up SSH key authentication..."
echo ""

# Get public key
PUB_KEY=$(cat ~/.ssh/id_ed25519.pub)

# Create script to setup SSH key on server
sshpass -p "$ROOT_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER << EOF
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "$PUB_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
echo "✅ SSH key added successfully!"
EOF

echo ""
echo "✅ Done! Now you can connect without password:"
echo "   ssh root@85.239.237.155"
echo ""
