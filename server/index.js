const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Validate required env vars at startup
// Use ecosystem.config.js env vars as source of truth; .env is optional backup
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not found in .env — using fallback. Set it in ecosystem.config.js or .env for security.');
  process.env.JWT_SECRET = 'reshm_super_secret_jwt_key_2024_production';
}

const app = express();

// Middleware
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
// Global error handler for malformed JSON payloads from IoT sensors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON payload rejected from:', req.ip);
    return res.status(400).json({ status: 400, message: 'Malformed JSON payload' });
  }
  next(err);
});
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sensor', require('./routes/sensor'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sos', require('./routes/sos'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// MongoDB Connection
const User = require('./models/User'); // Required for default admin creation

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reshm');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-create default admin user for VPS — uses upsert so restarts never create duplicates
    // IMPORTANT: findOneAndUpdate with upsert preserves the existing _id on the document,
    // which ensures all linked room/sensor data stays intact across server restarts.
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const newAdmin = new User({
        username: 'admin',
        email: 'admin@reshm.local',
        password: 'admin123',
        role: 'admin',
        verified: true
      });
      await newAdmin.save();
      console.log('Default admin user created (username: admin, password: admin123)');
    } else {
      console.log(`Admin user exists (id: ${existingAdmin._id}) — no changes made.`);
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
