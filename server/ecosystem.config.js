// PM2 Ecosystem Config
// This file stores production env vars so the server never crashes due to missing .env
// On VPS: pm2 start ecosystem.config.js --env production
// To update env vars: pm2 restart reshm-backend --update-env

module.exports = {
  apps: [
    {
      name: 'reshm-backend',
      script: 'index.js',
      cwd: '/var/www/reshm-iot-backend/server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      // PM2 will NOT exit on crash — it restarts up to 10 times, then stops to prevent loops
      max_restarts: 10,
      min_uptime: '5s',
      env_production: {
        NODE_ENV: 'production',
        PORT: '5000',
        MONGODB_URI: 'mongodb://localhost:27017/reshm',
        // CRITICAL: JWT_SECRET is hardcoded here so it NEVER gets lost even if .env is deleted
        JWT_SECRET: 'reshm_super_secret_jwt_key_2024_production',
        CLIENT_ORIGIN: 'https://re-shm.vercel.app',
        GOOGLE_CLIENT_ID: ''
      }
    }
  ]
};
