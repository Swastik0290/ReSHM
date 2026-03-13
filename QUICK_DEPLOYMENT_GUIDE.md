# Quick VPS Deployment Checklist

## Current Status
- ❌ VPS Backend: Not running (timeout at http://103.86.177.125:5000)
- ✅ Local Backend: Running on http://localhost:5000
- ✅ Local Client: Configured to use VPS backend
- ✅ Admin User: Created (email: admin@swas.com, password: 123456)

## What You Need to Do

### Option 1: Automated Deployment (Recommended)
1. SSH into your VPS:
   ```bash
   ssh root@103.86.177.125
   ```

2. Clone your repository:
   ```bash
   cd /home
   git clone <your-repo-url>
   cd Svasa-Metric
   ```

3. Run the deployment script:
   ```bash
   chmod +x server/deploy.sh
   ./server/deploy.sh
   ```

This script will:
- ✓ Install Node.js (if needed)
- ✓ Install MongoDB (if needed)
- ✓ Start MongoDB service
- ✓ Install npm dependencies
- ✓ Create `.env` configuration
- ✓ Create admin user
- ✓ Configure firewall
- ✓ Setup PM2 process manager
- ✓ Start the backend

### Option 2: Manual Deployment
See `VPS_BACKEND_DEPLOYMENT.md` for step-by-step instructions.

## Testing

Once the backend is running on the VPS, test it locally:

```powershell
# From your Windows machine
.\test-vps-login.ps1
```

This will:
1. Check if backend is healthy
2. Test login with admin credentials
3. Verify authentication

## Expected Output
If successful, you should see:
```
✓ Backend is running
✓ Login successful
✓ Authentication verified
```

## Admin Credentials
- Email: `admin@swas.com`
- Password: `123456`
- Role: `admin`

## Files Created for Deployment
- `VPS_BACKEND_DEPLOYMENT.md` - Detailed deployment guide
- `server/deploy.sh` - Automated deployment script
- `test-vps-login.ps1` - Login test script
- `client/.env` - Client already configured for VPS
- `server/.env` - Server configuration template

## Next Steps After Backend Deployment
1. Run the test script to verify backend is working
2. Deploy the frontend (client build) to the VPS
3. Configure a reverse proxy (nginx) for better performance
4. Set up SSL/HTTPS for production
5. Configure PM2 to auto-start on server reboot

## Troubleshooting

### Backend won't start
1. Check logs: `pm2 logs svasa-backend`
2. Ensure MongoDB is running: `sudo systemctl status mongod`
3. Check port 5000 is not in use: `lsof -i :5000`

### Port 5000 not accessible
1. Check firewall: `sudo ufw allow 5000`
2. Ensure backend is listening on all interfaces
3. Edit server `.env`: `NODE_ENV=production`

### MongoDB connection failed
1. Start MongoDB: `sudo systemctl start mongod`
2. Check status: `sudo systemctl status mongod`
3. For remote MongoDB, update `MONGODB_URI` in `.env`

## Contact Support
If you encounter issues, check the logs on the VPS:
```bash
pm2 logs svasa-backend
```
