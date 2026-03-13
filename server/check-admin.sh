#!/bin/bash

# VPS Admin User Diagnostic Script
# Run this on the VPS to diagnose and fix admin user issues

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}VPS Admin User Diagnostic${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 1. Check backend running
echo -e "${BLUE}[1/5] Checking if backend is running...${NC}"
if curl -s http://localhost:5000/api/health | grep -q "OK"; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
    echo -e "${YELLOW}Try: pm2 restart svasa-backend${NC}"
fi
echo ""

# 2. Check MongoDB
echo -e "${BLUE}[2/5] Checking MongoDB...${NC}"
if mongosh --eval "db.version()" &>/dev/null; then
    echo -e "${GREEN}✓ MongoDB is running${NC}"
else
    echo -e "${RED}✗ MongoDB is not running${NC}"
    echo -e "${YELLOW}Try: sudo systemctl start mongod${NC}"
fi
echo ""

# 3. Check if admin user exists
echo -e "${BLUE}[3/5] Checking for admin user in database...${NC}"
ADMIN_USER=$(mongosh svasa-metric --quiet --eval "
db.users.findOne(
  { email: 'admin@swas.com' },
  { _id: 1, username: 1, email: 1, role: 1 }
)" 2>/dev/null)

if [ -z "$ADMIN_USER" ] || [ "$ADMIN_USER" = "null" ]; then
    echo -e "${RED}✗ Admin user NOT found${NC}"
    echo -e "${YELLOW}Creating admin user...${NC}"
    cd "$(dirname "$0")/.."
    node scripts/create-admin.js
    echo -e "${GREEN}✓ Admin user created${NC}"
else
    echo -e "${GREEN}✓ Admin user found${NC}"
    echo "  $ADMIN_USER"
fi
echo ""

# 4. Test login endpoint
echo -e "${BLUE}[4/5] Testing login endpoint...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swas.com","password":"123456"}' 2>/dev/null)

if echo "$LOGIN_RESPONSE" | grep -q '"token"'; then
    echo -e "${GREEN}✓ Login successful${NC}"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "  Token: ${TOKEN:0:50}..."
elif echo "$LOGIN_RESPONSE" | grep -q "Invalid credentials"; then
    echo -e "${RED}✗ Login failed: Invalid credentials${NC}"
    echo -e "${YELLOW}Reset admin password:${NC}"
    echo -e "${YELLOW}  node scripts/reset-admin-password.js${NC}"
else
    echo -e "${RED}✗ Login endpoint error${NC}"
    echo "  Response: $LOGIN_RESPONSE"
fi
echo ""

# 5. List all users
echo -e "${BLUE}[5/5] All users in database:${NC}"
mongosh svasa-metric --quiet --eval "
db.users.find(
  {},
  { username: 1, email: 1, role: 1, verified: 1 }
)" 2>/dev/null || echo -e "${YELLOW}Could not list users${NC}"
echo ""

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Admin Credentials:${NC}"
echo -e "${GREEN}  Email: admin@swas.com${NC}"
echo -e "${GREEN}  Password: 123456${NC}"
echo -e "${BLUE}=========================================${NC}"
