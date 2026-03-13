#!/bin/bash

# VPS Backend Deployment Script
# Run this on the VPS to set up and start the backend

set -e

echo "========================================="
echo "Svasa Metric - Backend Deployment Script"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Node.js installation
echo -e "${BLUE}Step 1: Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"

# Step 2: Check MongoDB installation
echo -e "${BLUE}Step 2: Checking MongoDB installation...${NC}"
if ! command -v mongod &> /dev/null; then
    echo -e "${YELLOW}MongoDB not found. Installing...${NC}"
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/mongodb-server-7.0.gpg
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt-get update
    sudo apt-get install -y mongodb-org
fi
echo -e "${GREEN}✓ MongoDB installed${NC}"

# Step 3: Start MongoDB
echo -e "${BLUE}Step 3: Starting MongoDB service...${NC}"
sudo systemctl start mongod
sudo systemctl enable mongod
sleep 2
echo -e "${GREEN}✓ MongoDB started${NC}"

# Step 4: Navigate to server directory
echo -e "${BLUE}Step 4: Setting up backend directory...${NC}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/server"
echo -e "${GREEN}✓ Working directory: $(pwd)${NC}"

# Step 5: Install dependencies
echo -e "${BLUE}Step 5: Installing npm dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 6: Create .env file if it doesn't exist
echo -e "${BLUE}Step 6: Configuring environment...${NC}"
if [ ! -f .env ]; then
    cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/svasa-metric
JWT_SECRET=supersecretkey123
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
PORT=5000
NODE_ENV=production
CLIENT_ORIGIN=http://103.86.177.125,http://103.86.177.125:3000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EOF
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Step 7: Create admin user
echo -e "${BLUE}Step 7: Creating admin user...${NC}"
node scripts/create-admin.js || echo -e "${YELLOW}Admin user already exists or error occurred${NC}"

# Step 8: Setup firewall
echo -e "${BLUE}Step 8: Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw --force enable
    sudo ufw allow 22/tcp
    sudo ufw allow 5000/tcp
    sudo ufw allow 3000/tcp
    sudo ufw reload
    echo -e "${GREEN}✓ Firewall configured${NC}"
fi

# Step 9: Install/setup PM2
echo -e "${BLUE}Step 9: Setting up process manager (PM2)...${NC}"
sudo npm install -g pm2
pm2 start index.js --name "svasa-backend" || echo -e "${YELLOW}Restarting existing process...${NC}" && pm2 restart svasa-backend
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
echo -e "${GREEN}✓ PM2 configured${NC}"

# Step 10: Health check
echo -e "${BLUE}Step 10: Running health check...${NC}"
sleep 3
curl -s http://localhost:5000/api/health | grep -q "OK" && echo -e "${GREEN}✓ Backend is running and responding${NC}" || echo -e "${YELLOW}⚠ Backend may not be fully started yet${NC}"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Backend Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Backend URL: http://103.86.177.125:5000"
echo "Health Check: http://103.86.177.125:5000/api/health"
echo ""
echo "Admin Credentials:"
echo "  Email: admin@swas.com"
echo "  Password: 123456"
echo ""
echo "Useful PM2 Commands:"
echo "  pm2 logs svasa-backend"
echo "  pm2 status"
echo "  pm2 restart svasa-backend"
echo "  pm2 stop svasa-backend"
echo "  pm2 start svasa-backend"
