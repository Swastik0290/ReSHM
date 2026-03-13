# VPS Deployment Guide - Backend Setup

## Prerequisites
- VPS IP: `103.86.177.125`
- SSH access to the VPS
- Node.js and npm installed on VPS
- MongoDB installed on VPS (or remote MongoDB URI)

## Step 1: SSH into VPS
```bash
ssh root@103.86.177.125
# or
ssh user@103.86.177.125
```

## Step 2: Navigate to Project Directory
```bash
cd /home/your-user/
# or wherever you want to deploy
```

## Step 3: Clone Repository (if not already done)
```bash
git clone <your-repo-url>
cd Svasa-Metric/server
```

## Step 4: Install Dependencies
```bash
npm install
```

## Step 5: Create `.env` File
```bash
nano .env
```

Add the following configuration:
```
MONGODB_URI=mongodb://localhost:27017/svasa-metric
JWT_SECRET=supersecretkey123
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
PORT=5000
NODE_ENV=production
CLIENT_ORIGIN=http://103.86.177.125,http://103.86.177.125:3000,http://localhost:3000
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

Press `Ctrl+O` to save, then `Ctrl+X` to exit.

## Step 6: Start MongoDB (if local)
```bash
# Start MongoDB service
sudo systemctl start mongodb
# or
sudo service mongod start

# Verify it's running
sudo systemctl status mongodb
```

## Step 7: Run Initial Setup Scripts
Create the admin user:
```bash
node scripts/create-admin.js
```

## Step 8: Start Backend Server
For development:
```bash
npm start
```

For production (using pm2):
```bash
npm install -g pm2
pm2 start index.js --name "svasa-backend"
pm2 save
pm2 startup
```

## Step 9: Verify Backend is Running
From your local machine:
```bash
curl http://103.86.177.125:5000/api/health
```

Should return:
```json
{"status":"OK","message":"Server is running"}
```

## Step 10: Test Login Endpoint
```bash
curl -X POST http://103.86.177.125:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swas.com","password":"123456"}'
```

## Troubleshooting

### Port 5000 Not Accessible
Check firewall:
```bash
sudo ufw enable
sudo ufw allow 5000
sudo ufw allow 3000
sudo ufw status
```

### MongoDB Connection Failed
- Check MongoDB is running: `sudo systemctl status mongod`
- For remote MongoDB, update `MONGODB_URI` in `.env`

### Node Modules Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### Check Backend Logs
If using pm2:
```bash
pm2 logs svasa-backend
```

If running directly:
```bash
node index.js
```

---

**After completing these steps, test the login with the admin credentials:**
- Email: `admin@swas.com`
- Password: `123456`
