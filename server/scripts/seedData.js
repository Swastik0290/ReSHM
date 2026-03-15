/**
 * Seed script to create initial admin user and sample room
 * Run with: node scripts/seedData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Room = require('../models/Room');
const SensorReading = require('../models/SensorReading');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reshm');
    console.log('Connected to MongoDB');

    // Remove seed users so they can be recreated with correct password hashing
    await User.deleteMany({ email: { $in: ['admin@svasa.com', 'user@svasa.com'] } });

    // Create admin user (use plain password - User model pre-save hashes it)
    {
      const admin = new User({
        username: 'admin',
        email: 'admin@svasa.com',
        password: 'admin123',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created:');
      console.log('   Email: admin@svasa.com');
      console.log('   Password: admin123');
    }

    // Create or find sample room
    let room = await Room.findOne({ name: 'Sample Room' });
    if (!room) {
      room = new Room({
        name: 'Sample Room',
        description: 'A sample room for testing',
        location: {
          latitude: 22.5726,
          longitude: 88.3639
        },
        deviceId: 'DEVICE-001'
      });
      await room.save();
      console.log('✅ Sample room created:', room._id);

      // Create sample sensor readings
      const sampleReadings = [];
      const now = new Date();
      for (let i = 0; i < 20; i++) {
        const timestamp = new Date(now.getTime() - i * 60000);
        const reading = new SensorReading({
          roomId: room._id,
          timestamp,
          location: {
            latitude: 22.5726 + (Math.random() - 0.5) * 0.001,
            longitude: 88.3639 + (Math.random() - 0.5) * 0.001
          },
          temperature: 20 + Math.random() * 10,
          humidity: 40 + Math.random() * 20,
          coSensor1: Math.random() * 100,
          coSensor2: Math.random() * 50,
          co2: 400 + Math.random() * 600,
          oxygen: 19 + Math.random() * 2,
          smokeDetected: Math.random() > 0.9
        });
        reading.checkThresholds();
        sampleReadings.push(reading);
      }
      await SensorReading.insertMany(sampleReadings);
      console.log('✅ Created 20 sample sensor readings');
    } else {
      console.log('ℹ️  Sample room already exists');
    }

    // Create limited user assigned to sample room
    const limitedUser = new User({
      username: 'limiteduser',
      email: 'user@svasa.com',
      password: 'user123',
      role: 'limited',
      assignedRoom: room._id
    });
    await limitedUser.save();
    console.log('✅ Limited user created:');
    console.log('   Email: user@svasa.com');
    console.log('   Password: user123');

    console.log('\n✨ Seeding completed!');
    console.log('\nYou can now login with:');
    console.log('   Admin: admin@svasa.com / admin123');
    console.log('   User:  user@svasa.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
