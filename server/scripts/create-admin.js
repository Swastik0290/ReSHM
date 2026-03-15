/**
 * create-admin.js
 * Run once to create an admin account in the database.
 * Usage: node scripts/create-admin.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');

const ADMIN = {
    username: 'Admin User',
    email: 'admin@swas.com',
    password: '123456',
    role: 'admin',
};

(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reshm');
    console.log('MongoDB connected');

    const existing = await User.findOne({ $or: [{ email: ADMIN.email }, { username: ADMIN.username }] });
    if (existing) {
        // Ensure the existing account is admin role
        if (existing.role !== 'admin') {
            existing.role = 'admin';
            await existing.save();
            console.log(`Updated existing user "${existing.username}" to admin role.`);
        } else {
            console.log(`Admin user "${existing.username}" already exists with correct role.`);
        }
    } else {
        const user = new User(ADMIN);
        await user.save();
        console.log(`✅ Admin user created:`);
        console.log(`   Username : ${ADMIN.username}`);
        console.log(`   Email    : ${ADMIN.email}`);
        console.log(`   Password : ${ADMIN.password}`);
    }

    await mongoose.disconnect();
    process.exit(0);
})();
