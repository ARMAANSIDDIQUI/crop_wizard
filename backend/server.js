require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./models/User');
const History = require('./models/History');

const app = express();
const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET; // Use environment variables in production

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// --- Authentication Routes ---

// User Registration
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists.' });
        }
        const user = new User({ username, password });
        await user.save();
        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
});



// --- History Routes ---

// Middleware to authenticate and get user
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = await User.findById(decoded.userId);
        if (!req.user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// Get user's prediction history
app.get('/api/history', authenticate, async (req, res) => {
    try {
        const history = await History.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve history.', error: error.message });
    }
});

// Save a new prediction to history
app.post('/api/history', authenticate, async (req, res) => {
    const { nitrogen, phosphorus, potassium, ph, rainfall, temperature, predicted_crop } = req.body;
    
    // Basic validation
    if (predicted_crop == null) {
        return res.status(400).json({ message: 'Predicted crop is required.' });
    }
    
    try {
        const historyEntry = new History({
            user: req.user._id,
            nitrogen,
            phosphorus,
            potassium,
            ph,
            rainfall,
            temperature,
            predicted_crop,
        });
        await historyEntry.save();
        res.status(201).json(historyEntry);
    } catch (error) {
        res.status(500).json({ message: 'Failed to save prediction.', error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});