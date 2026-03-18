const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function reset() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const u = await User.findOne({ username: 'Ruchikasspssr@gmail.com' });
        if (u) {
            u.password = 'Admin@123#';
            u.role = 'admin';
            await u.save();
            console.log('Password successfully reset to Admin@123#');
        } else {
            const admin = new User({ 
                username: 'Ruchikasspssr@gmail.com', 
                password: 'Admin@123#', 
                role: 'admin' 
            });
            await admin.save();
            console.log('Admin account created with password Admin@123#');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}
reset();
