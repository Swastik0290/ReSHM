#!/bin/bash

# VPS Debugging & Recovery Script
# Run this on the VPS to diagnose and fix login issues

echo "========================================="
echo "VPS Login Issue Debugger"
echo "========================================="
echo ""

# Check if backend is running
echo "[1] Checking if backend is running..."
curl -s http://localhost:5000/api/health && echo "✓ Backend is running" || echo "✗ Backend is not running"
echo ""

# Check MongoDB connection
echo "[2] Checking MongoDB connection..."
mongosh --eval "db.version()" && echo "✓ MongoDB is running" || echo "✗ MongoDB is not running"
echo ""

# Check if admin user exists
echo "[3] Checking if admin user exists..."
mongosh svasa-metric --eval "
db.users.findOne({ email: 'admin@swas.com' }, { username: 1, email: 1, role: 1, password: 1 })"
echo ""

# Check all users
echo "[4] All users in database:"
mongosh svasa-metric --eval "db.users.find({}, { username: 1, email: 1, role: 1 })"
echo ""

echo "========================================="
echo "Recovery Options:"
echo "========================================="
echo ""
echo "Option A: Create admin user (if not exists)"
echo "  Run: node scripts/create-admin.js"
echo ""
echo "Option B: Reset admin password"
echo "  Run: node scripts/reset-admin-password.js"
echo ""
echo "Option C: Delete and recreate admin user"
echo '  mongosh svasa-metric --eval "db.users.deleteOne({ email: '"'"'admin@swas.com'"'"' })"'
echo "  Then: node scripts/create-admin.js"
echo ""
