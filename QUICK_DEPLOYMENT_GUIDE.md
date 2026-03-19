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

Viewed HealthMonitoring.js:1-247

To change the limits and thresholds for the sensors, you'll need to update a few specific files depending on whether you want to change the visual indicators on the frontend dashboard, the real-time alert triggers, or the database-level alerts in the backend. 

Here is your complete guide to updating all the sensor limits:

### 1. Visual Indicators & Gauges (Frontend UI)
These files control the colors (Safe/Green, Warning/Yellow, Danger/Red) and the progress bars in the dashboard cards.

**For Environmental Sensors (CO, CO₂, Temp, Humidity):**
Open [client/src/components/dashboard/EnvironmentalSafety.js](cci:7://file:///C:/Users/swast/OneDrive/Desktop/Svasa%20Metric/client/src/components/dashboard/EnvironmentalSafety.js:0:0-0:0) and edit the constants at the top of the file (lines 12-15):
```javascript
const CO_WARN = 30; const CO_CRIT = 50; const CO_MAX = 100;
const CO2_WARN = 800; const CO2_CRIT = 1000; const CO2_MAX = 2000;
const TEMP_WARN = 30; const TEMP_CRIT = 35; const TEMP_MAX = 50;
const HUM_WARN = 60; const HUM_CRIT = 80; const HUM_MAX = 100;
```
*(Note: Be sure to also update the hardcoded legend text at the bottom of the file to match your new limits).*

**For Health Sensors (SpO₂ and Pulse):**
Open [client/src/components/dashboard/HealthMonitoring.js](cci:7://file:///C:/Users/swast/OneDrive/Desktop/Svasa%20Metric/client/src/components/dashboard/HealthMonitoring.js:0:0-0:0) and edit the [getSpo2Status](cci:1://file:///C:/Users/swast/OneDrive/Desktop/Svasa%20Metric/client/src/components/dashboard/HealthMonitoring.js:4:0-12:2) and [getPulseStatus](cci:1://file:///C:/Users/swast/OneDrive/Desktop/Svasa%20Metric/client/src/components/dashboard/HealthMonitoring.js:14:0-19:2) functions at the top of the file:
```javascript
const getSpo2Status = (v) => {
    if (v < 90) return { level: 'danger', label: 'CRITICAL LOW' };
    if (v < 95) return { level: 'warning', label: 'LOW' };
    ...
```
*(Note: Also adjust the hardcoded reference bands at the bottom of the component).*

---

### 2. The Red "SOS / Alert" Dashboard Banner (Frontend Alerts)
When values go beyond a certain point, a red alert banner and SOS chip show up at the top of the dashboard. 

Open [client/src/pages/Dashboard.js](cci:7://file:///C:/Users/swast/OneDrive/Desktop/Svasa%20Metric/client/src/pages/Dashboard.js:0:0-0:0) and edit the [hasRoomAlert](cci:1://file:///C:/Users/swast/OneDrive/Desktop/Svasa%20Metric/client/src/pages/Dashboard.js:13:0-27:2) function at the top (around line 12):
```javascript
const CO_WARN = 30;
const CO2_WARN = 800;
const hasRoomAlert = (reading) => {
  ...
  return (
    co1 >= CO_WARN || co2s >= CO_WARN ||
    co2 >= CO2_WARN || 
    // Add/modify your exact trigger points here:
    Number(reading.oxygen ?? 99) < 90 ||
    Number(reading.pulse ?? 75) >= 120 || 
    Number(reading.pulse ?? 75) <= 40
  );
};
```

---

### 3. Backend Database Alerts (API)
Your backend VPS evaluates incoming sensor readings and attaches permanent `alert` strings (like `"CRITICAL: High temperature!"`) directly to the database records.

Open [server/models/SensorReading.js](cci:7://file:///c:/Users/swast/OneDrive/Desktop/Svasa%20Metric/server/models/SensorReading.js:0:0-0:0) and modify the `thresholds` object (around line 104):
```javascript
  const thresholds = {
    co: { critical: 50, warning: 30 }, // ppm
    co2: { critical: 1000, warning: 800 }, // ppm
    oxygen: { critical_low: 90, warning_low: 95 }, // percentage
    pulse: { critical_high: 120, critical_low: 40, warning_high: 100, warning_low: 50 }, // bpm
    temperature: { critical: 35, warning: 30 }, // Celsius
    ...
  };
```

### Steps to Apply:
1. Make the variable changes in the files mentioned above.
2. Run `git add .`, `git commit -m "update limits"`, and `git push` to redeploy the frontend to Vercel.
3. For the backend file [SensorReading.js](cci:7://file:///C:/Users/swast/OneDrive/Desktop/Svasa%20Metric/server/models/SensorReading.js:0:0-0:0), you will need to push that to your VPS and restart the node server (`pm2 restart <app-name>`).