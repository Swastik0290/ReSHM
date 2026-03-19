#!/bin/bash
# setup-nginx.sh
# Run as root on the VPS to expose the Node.js backend on port 80
# Usage: bash setup-nginx.sh

set -e

echo "=== Installing Nginx ==="
apt update -y
apt install -y nginx

echo "=== Stopping any service using port 80 ==="
systemctl stop apache2 2>/dev/null || true

echo "=== Writing Nginx site config ==="
cat > /etc/nginx/sites-available/reshm <<'EOF'
server {
    listen 80;
    server_name _;

    # Proxy all /api/* requests to Node.js on port 5000
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }
}
EOF

echo "=== Enabling site ==="
ln -sf /etc/nginx/sites-available/reshm /etc/nginx/sites-enabled/reshm
rm -f /etc/nginx/sites-enabled/default

echo "=== Testing Nginx config ==="
nginx -t

echo "=== Starting Nginx ==="
systemctl enable nginx
systemctl restart nginx

echo ""
echo "=== DONE ==="
echo "Nginx is now proxying http://103.86.177.125/api/* -> http://127.0.0.1:5000"
echo "Test with: curl http://103.86.177.125/api/health"
