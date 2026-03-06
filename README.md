# Svasa Metric - Room Sensor Monitoring Dashboard

A comprehensive Room Sensor Monitoring Dashboard built with the MERN stack (MongoDB, Express.js, React.js, Node.js). This system collects real-time sensor data via LAN or 4G connectivity and stores it in MongoDB with timestamps for every entry.

## Features

- **Real-time Sensor Monitoring**: Track temperature, humidity, CO sensors, CO₂, oxygen levels, and smoke detection
- **Role-based Access Control**: Admin users have full access, while Limited users are restricted to assigned rooms
- **Modern Bento Grid Dashboard**: Beautiful, responsive layout with multiple data visualization widgets
- **Data Export**: Export sensor readings as CSV or Excel files
- **Interactive Maps**: View room locations using latitude and longitude coordinates
- **Alert System**: Automated alerts when parameters exceed safety thresholds
- **Indian Standard Time**: Clock displays IST with analog and digital formats

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React.js 18
- React Router for navigation
- Axios for API calls
- Recharts for data visualization
- React Leaflet for maps
- XLSX for Excel export

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher) - [Download MongoDB](https://www.mongodb.com/try/download/community)
- npm or yarn package manager

## Installation & Setup

### Step 1: Clone or Navigate to Project Directory

```bash
cd "c:\Users\swast\OneDrive\Desktop\Svasa Metric"
```

### Step 2: Install Dependencies

Install dependencies for both server and client:

```bash
npm run install-all
```

Or install them separately:

```bash
# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

### Step 3: Set Up MongoDB

1. **Install MongoDB** if you haven't already
2. **Start MongoDB service**:
   - Windows: MongoDB should start automatically as a service, or run `mongod` from command prompt
   - Mac/Linux: `sudo systemctl start mongod` or `brew services start mongodb-community`

3. **Verify MongoDB is running**:
   ```bash
   mongosh
   ```
   If this connects successfully, MongoDB is running.

### Step 4: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cd server
   copy .env.example .env
   ```
   (On Mac/Linux: `cp .env.example .env`)

2. Edit `server/.env` and update the following:
   ```env
   MONGODB_URI=mongodb://localhost:27017/svasa-metric
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   NODE_ENV=development
   ```

   **Important**: Change `JWT_SECRET` to a random, secure string for production use.

   **Optional - Google Login**: To enable "Sign in with Google", add your Google OAuth Client ID:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
   And create `client/.env` with:
   ```env
   REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```
   Get your Client ID from [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.

### Step 5: Install Dependencies and Start the Application

Install the new packages (if not already done):
```bash
cd client
npm install
cd ../server
npm install
cd ..
```

From the root directory, run:

```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend React app (port 3000).

Alternatively, you can run them separately:

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### Step 6: Access the Application

Open your browser and navigate to:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Initial Setup - Creating Your First User

Since this is a new installation, you'll need to create an admin user. You can do this in two ways:

### Option 1: Using MongoDB Shell

1. Open MongoDB shell:
   ```bash
   mongosh
   ```

2. Switch to your database:
   ```javascript
   use svasa-metric
   ```

3. Create an admin user (replace with your desired credentials):
   ```javascript
   db.users.insertOne({
     username: "admin",
     email: "admin@example.com",
     password: "$2a$10$YourHashedPasswordHere", // Use bcrypt hash
     role: "admin",
     createdAt: new Date()
   })
   ```

### Option 2: Using the Registration API (Recommended)

1. Start the server
2. Use Postman, curl, or any API client to register:
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "email": "admin@example.com",
       "password": "admin123",
       "role": "admin"
     }'
   ```

**Note**: In production, you should disable public registration and only allow admin-created users.

## Creating Rooms and Devices

1. Log in as an admin user
2. Navigate to "Add Device" in the sidebar
3. Fill in the room details:
   - Room Name (required)
   - Description (optional)
   - Latitude (required)
   - Longitude (required)
   - Device ID (optional)

## Sending Sensor Data

To send sensor readings to the API, use the following endpoint:

```bash
POST http://localhost:5000/api/sensor/reading
Content-Type: application/json

{
  "roomId": "YOUR_ROOM_ID",
  "location": {
    "latitude": 22.5726,
    "longitude": 88.3639
  },
  "temperature": 22.5,
  "humidity": 48,
  "coSensor1": 120,
  "coSensor2": 8,
  "co2": 950,
  "oxygen": 98,
  "smokeDetected": false
}
```

## Project Structure

```
svasa-metric/
├── server/                 # Backend code
│   ├── models/            # MongoDB schemas
│   │   ├── User.js
│   │   ├── Room.js
│   │   └── SensorReading.js
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   ├── sensor.js
│   │   ├── rooms.js
│   │   └── users.js
│   ├── middleware/       # Custom middleware
│   │   └── auth.js
│   ├── index.js          # Server entry point
│   └── package.json
│
├── client/                # Frontend code
│   ├── public/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── dashboard/ # Dashboard widgets
│   │   │   ├── Sidebar.js
│   │   │   └── Layout.js
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context
│   │   └── App.js
│   └── package.json
│
└── package.json          # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
 
### Sensor Data
- `POST /api/sensor/reading` - Create sensor reading
- `GET /api/sensor/readings/:roomId` - Get readings for a room
- `GET /api/sensor/latest/:roomId` - Get latest reading
- `GET /api/sensor/dashboard/:roomId` - Get dashboard data
- `GET /api/sensor/alerts/:roomId` - Get alerts for a room

### Rooms
- `GET /api/rooms` - Get all rooms (or assigned room for limited users)
- `GET /api/rooms/:id` - Get specific room
- `POST /api/rooms` - Create room (admin only)
- `PUT /api/rooms/:id` - Update room (admin only)
- `DELETE /api/rooms/:id` - Delete room (admin only)

### Users
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## Safety Thresholds

The system uses the following thresholds (Indian safety standards):

- **CO Sensor 1 & 2**: 
  - Critical: ≥ 50 ppm
  - Warning: ≥ 30 ppm
- **CO₂**: 
  - Critical: ≥ 1000 ppm
  - Warning: ≥ 800 ppm
- **Oxygen**: 
  - Critical: ≤ 19.5%
  - Warning: ≤ 20.5%
- **Temperature**: 
  - Critical: ≥ 35°C
  - Warning: ≥ 30°C
- **Humidity**: 
  - Critical: ≥ 80%
  - Warning: ≥ 70%
- **Smoke**: Any detection triggers critical alert

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongosh` should connect
- Check `MONGODB_URI` in `.env` file
- Verify MongoDB is listening on port 27017

### Port Already in Use
- Change `PORT` in `server/.env` if port 5000 is taken
- Change React port: Create `client/.env` with `PORT=3001`

### CORS Issues
- Ensure backend is running on port 5000
- Check `proxy` setting in `client/package.json`

### Login/Registration Both Fail
- **Backend not running**: Run `npm run dev` from project root (starts both server and client), or run `cd server && npm run dev` in one terminal
- **MongoDB not running**: Start MongoDB service or run `mongod`. On Windows, ensure the data directory exists or MongoDB is installed as a service
- **No users exist**: Run `cd server && node scripts/seedData.js` to create admin (admin@svasa.com / admin123) and test user

### Authentication Issues
- Verify JWT_SECRET is set in `.env`
- Check token is being sent in Authorization header
- Clear browser localStorage and login again

## Production Deployment

Before deploying to production:

1. **Security**:
   - Change `JWT_SECRET` to a strong, random string
   - Use environment variables for all sensitive data
   - Enable HTTPS
   - Disable public user registration

2. **Database**:
   - Use MongoDB Atlas or a managed MongoDB service
   - Set up proper database backups
   - Use connection pooling

3. **Performance**:
   - Enable MongoDB indexes (already included in schemas)
   - Implement rate limiting
   - Add caching where appropriate

4. **Frontend**:
   - Build React app: `cd client && npm run build`
   - Serve build folder with a production server (nginx, Apache, etc.)

## Support

For issues or questions, please check:
- MongoDB logs
- Server console output
- Browser console for frontend errors

## License

This project is for educational and development purposes.

---

**Happy Monitoring!** 🎉
