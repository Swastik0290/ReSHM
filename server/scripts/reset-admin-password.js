/**
 * reset-admin-password.js — sets admin password to admin123456
 * Usage: node scripts/reset-admin-password.js
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');

(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reshm');
    console.log('MongoDB connected');

    const newPassword = 'admin123';
    const hash = await bcrypt.hash(newPassword, 10);

    const result = await User.findOneAndUpdate(
        { $or: [{ username: 'admin' }, { email: 'admin@reshm.com' }] },
        { password: hash, role: 'admin' },
        { new: true }
    );

    if (result) {
        console.log('✅ Admin password reset successfully!');
        console.log('   Username :', result.username);
        console.log('   Email    :', result.email);
        console.log('   Role     :', result.role);
        console.log('   Password : admin123');
    } else {
        console.log('❌ No admin user found. Run create-admin.js first.');
    }

    await mongoose.disconnect();
    process.exit(0);
})();
