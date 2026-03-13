# CORS Configuration for VPS Backend

## Problem
Frontend running on `http://localhost:3000` cannot connect to VPS backend at `http://103.86.177.125` due to CORS restrictions.

## Solution: Update VPS Backend's .env

SSH into your VPS and update `/var/www/reshm-iot-backend/server/.env`:

```bash
ssh root@103.86.177.125
nano /var/www/reshm-iot-backend/server/.env
```

Add/Update the `CLIENT_ORIGIN` line to include your local development URL:

```env
PORT=5005
MONGODB_URI=mongodb://localhost:27017/reshm_iot_production
JWT_SECRET=YOUR_SECURE_RANDOM_SECRET
CLIENT_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
```

Then restart the backend:

```bash
pm2 restart reshm-backend
pm2 logs reshm-backend
```

Verify it shows `[APP INIT] Using API Base URL: http://103.86.177.125` in the logs.

## Local Frontend Setup

Your local frontend is already configured:

1. ✅ `.env` file created with `REACT_APP_API_BASE_URL=http://103.86.177.125`
2. ✅ `App.js` configured to use this URL
3. ✅ Debug logging added to help diagnose connection issues
4. ✅ `AuthContext.js` shows helpful error messages with the actual backend URL

## Testing

After updating the VPS backend, restart your frontend:

```bash
cd client
npm start
```

Open browser console (F12) and look for:
```
[APP INIT] Using API Base URL: http://103.86.177.125
```

Try logging in. If there's still an error, the console will show the exact URL being called and the error details.

## Common Issues

| Issue | Solution |
|-------|----------|
| `ERR_NETWORK` Error | Ensure VPS backend is running: `pm2 status` |
| CORS Error | Verify `CLIENT_ORIGIN` includes `http://localhost:3000` |
| Wrong API URL in logs | Restart npm dev server: `npm start` |
| MongoDB connection error on VPS | Check: `systemctl status mongod` on VPS |

