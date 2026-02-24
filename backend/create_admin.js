const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            family: 4 // Force IPv4
        });
        console.log('MongoDB connected');

        const username = process.argv[2];
        const password = process.argv[3];

        if (!username || !password) {
            console.error('Usage: node create_admin.js <username> <password>');
            process.exit(1);
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('User already exists, updating role to admin...');
            existingUser.role = 'admin';
            existingUser.password = password; // Update password too
            await existingUser.save();
            console.log('User updated to admin successfully.');
        } else {
            const admin = new User({
                username,
                password,
                role: 'admin'
            });
            await admin.save();
            console.log('Admin created successfully.');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();