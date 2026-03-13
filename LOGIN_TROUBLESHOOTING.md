# Login Invalid Credentials - Troubleshooting Guide

## Problem
Getting "Invalid Credentials" error when trying to login

## Root Causes & Solutions

### 1. ⚠️ Most Common: Admin User Not Created on VPS
If you deployed to VPS and didn't run the creation script, the admin user won't exist in the VPS database.

**Solution:** On the VPS, run:
```bash
cd /path/to/Svasa-Metric/server
node scripts/create-admin.js
```

### 2. ⚠️ Wrong Credentials Being Used
Make sure you're using the EXACT credentials:
- **Email**: `admin@swas.com` (not admin@svasa.com)
- **Password**: `123456`

Check the login form carefully for typos.

### 3. ✓ Admin User Exists but Password is Wrong
If the admin user exists but password is incorrect, reset it:

```bash
node scripts/reset-admin-password.js
```

This will reset the password to: `123456`

### 4. 🔍 Database is Wrong
If deployed to VPS but MongoDB is pointing to wrong database:

Check `.env` file:
```bash
cat server/.env | grep MONGODB_URI
```

Should be:
```
MONGODB_URI=mongodb://localhost:27017/svasa-metric
```

Or if using remote MongoDB, ensure the database contains the admin user.

## Verification Steps

### Step 1: Verify Backend is Running
```bash
curl http://103.86.177.125:5000/api/health
# Should return: {"status":"OK","message":"Server is running"}
```

### Step 2: Check MongoDB Connection
```bash
mongosh svasa-metric
# If connected, prompt appears
```

### Step 3: Check If Admin User Exists
```bash
mongosh svasa-metric --eval "db.users.findOne({ email: 'admin@swas.com' })"
```

Should return:
```json
{
  "_id": ObjectId(...),
  "username": "Admin User",
  "email": "admin@swas.com",
  "role": "admin",
  "verified": true,
  "password": "$2a$10$..." (hashed)
}
```

### Step 4: Manually Test Login Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swas.com","password":"123456"}'
```

Should return token and user data, NOT "Invalid credentials"

## Complete Recovery Procedure

If nothing works, follow these steps:

### On the VPS:
```bash
# 1. Stop the backend
pm2 stop svasa-backend

# 2. Clear admin users and recreate
mongosh svasa-metric --eval "db.users.deleteMany({ role: 'admin' })"

# 3. Create new admin user
node scripts/create-admin.js

# 4. Restart backend
pm2 start svasa-backend

# 5. Check logs
pm2 logs svasa-backend
```

### From Local Machine (PowerShell):
```powershell
# Test login
$body = '{"email":"admin@swas.com","password":"123456"}'
$response = Invoke-WebRequest -Uri "http://103.86.177.125:5000/api/auth/login" `
  -Method POST `
  -Headers @{'Content-Type' = 'application/json'} `
  -Body $body `
  -UseBasicParsing

$response.Content | ConvertFrom-Json | ConvertTo-Json
```

## Admin User Details

**Username**: `Admin User`
**Email**: `admin@swas.com`
**Password**: `123456`
**Role**: `admin`

**Important**: Use EMAIL for login, not username.

## Still Not Working?

1. Check server logs: `pm2 logs svasa-backend`
2. Check MongoDB is running: `sudo systemctl status mongod`
3. Check port 5000 is listening: `lsof -i :5000`
4. Verify `.env` file has correct values
5. Run `npm install` to ensure dependencies are installed

## Quick Checklist
- [ ] Backend is running and responding to `/api/health`
- [ ] MongoDB is running and accessible
- [ ] Admin user exists in database
- [ ] Password is exactly `123456`
- [ ] Email is exactly `admin@swas.com`
- [ ] Database is `svasa-metric`
- [ ] Firewall allows port 5000
