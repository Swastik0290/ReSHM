# ReSHM — VPS Deployment Reference Guide

> This is a reference document for the current live deployment and a step-by-step guide to replicate it on any future VPS.

---

## 🖥️ Current Live Deployment Info

| Item | Value |
|------|-------|
| **VPS IP** | `103.86.177.125` |
| **Backend Port (internal)** | `5005` |
| **Public API Base URL** | `http://103.86.177.125` |
| **Backend Process** | Managed by PM2 — name: `reshm-backend` |
| **Database** | MongoDB local — db: `reshm_iot_production` |
| **App Directory** | `/var/www/reshm-iot-backend/server` |
| **Nginx Config** | `/etc/nginx/sites-available/reshm-api` |

---

## 📡 Is the Backend Running?

SSH into the VPS and run:
```bash
pm2 status
```
You should see `reshm-backend` listed with status `online`.

To see live logs:
```bash
pm2 logs reshm-backend
```

To quick-check from anywhere (no login required):
```bash
curl http://103.86.177.125/api/health
```
Expected response: `{"status":"OK","message":"Server is running"}`

---

## 🌐 How to Access the Frontend

The current deployment only includes the **backend API**. The React frontend is **not yet served from the VPS**.

To access the frontend, you have two options:

### Option 1 — Run Locally (current setup)
On your local machine, run:
```bash
npm run dev
```
This starts the frontend on `http://localhost:3000` and the backend on `http://localhost:5000`. This is for local development only.

### Option 2 — Deploy Frontend to VPS (future step)
To make the frontend accessible publicly on the VPS:
1. Build the React app from your local machine:
   ```bash
   cd client && npm run build
   ```
2. Copy the `client/build` folder to the VPS:
   ```bash
   scp -r client/build root@103.86.177.125:/var/www/reshm-frontend
   ```
3. Add a new Nginx block on the VPS to serve the static files:
   ```nginx
   server {
       listen 80;
       server_name YOUR_DOMAIN_OR_IP;
       root /var/www/reshm-frontend;
       index index.html;
   
       location / {
           try_files $uri /index.html;
       }
   
       # Forward API calls to the Node backend
       location /api/ {
           proxy_pass http://localhost:5005;
       }
   }
   ```

---

## 📬 How to Test API Using Postman

### Step 1 — Health Check
- **Method:** `GET`
- **URL:** `http://103.86.177.125/api/health`

### Step 2 — Create an Account (First Time)
- **Method:** `POST`
- **URL:** `http://103.86.177.125/api/auth/register`
- **Body (JSON):**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "yourpassword",
  "role": "admin"
}
```

### Step 3 — Login to Get Token
- **Method:** `POST`
- **URL:** `http://103.86.177.125/api/auth/login`
- **Body (JSON):**
```json
{
  "email": "admin@example.com",
  "password": "yourpassword"
}
```
Copy the `"token"` from the response. You will use it in the `Authorization: Bearer <token>` header for all protected requests.

### Step 4 — POST Sensor Data (Simulating Hardware / Raspberry Pi)

> ⚠️ This endpoint is **public** — no token required. This is how your IoT hardware sends data.

- **Method:** `POST`
- **URL:** `http://103.86.177.125/api/sensor/ingest`
- **Body (JSON):**
```json
{
  "deviceId": "esp32-room-101",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "temperature": 27.5,
  "humidity": 65.0,
  "co2": 520,
  "coSensor1": 12,
  "coSensor2": 10,
  "oxygen": 20.9,
  "pulse": 75,
  "smokeDetected": false,
  "fireDetected": false,
  "altitude": 150.5,
  "source": "Modem"
}
```

### Step 5 — GET Sensor Dashboard Data
- **Method:** `GET`
- **URL:** `http://103.86.177.125/api/sensor/dashboard/{roomId}`
- **Header:** `Authorization: Bearer <your_token>`

---

## 🔄 How to Update the App in Future

SSH into the VPS and run:
```bash
cd /var/www/reshm-iot-backend
git pull origin main
cd server
npm install
pm2 restart reshm-backend
```

---

## 🛠️ How to Deploy on a NEW VPS (Repeat Steps)

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# 2. Install PM2
npm install -g pm2

# 3. Install MongoDB
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update && apt-get install -y mongodb-org
systemctl enable mongod --now

# 4. Install Nginx
apt-get install -y nginx

# 5. Clone Repo
git clone https://github.com/Swastik0290/ReSHM.git /var/www/reshm-iot-backend
cd /var/www/reshm-iot-backend/server

# 6. Create .env
cat <<EOF > .env
PORT=5005
MONGODB_URI=mongodb://localhost:27017/reshm_iot_production
JWT_SECRET=YOUR_SECURE_RANDOM_SECRET
EOF

# 7. Install & Start
npm install
pm2 start index.js --name "reshm-backend"
pm2 save && pm2 startup

# 8. Configure Nginx (create /etc/nginx/sites-available/reshm-api and enable it)
```
