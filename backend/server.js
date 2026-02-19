require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./models/User');
const History = require('./models/History');

const Blog = require('./models/Blog');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET; // Use environment variables in production

// Middleware
app.use(cors());
app.use(express.json());

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.Cloud_name,
    api_key: process.env.API_key,
    api_secret: process.env.API_secret
});

// Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'crop_wizard_blogs',
        resource_type: 'auto', // Allow images and videos
        allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mov', 'avi', 'webp'],
    },
});

const upload = multer({ storage: storage });

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
        res.json({ token, role: user.role, username: user.username });
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

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admins only.' });
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
    const { nitrogen, phosphorus, potassium, ph, rainfall, temperature, humidity, predictions } = req.body;

    // Check prediction limit
    if (req.user.role !== 'admin' && req.user.predictionCount >= req.user.predictionLimit) {
        return res.status(403).json({ message: 'Prediction limit reached. Please contact an admin to increase your limit.' });
    }

    // Basic validation
    if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
        return res.status(400).json({ message: 'Predictions array is required.' });
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
            humidity,
            predictions,
        });
        await historyEntry.save();

        // Increment prediction count
        req.user.predictionCount += 1;
        await req.user.save();

        res.status(201).json(historyEntry);
    } catch (error) {
        res.status(500).json({ message: 'Failed to save prediction.', error: error.message });
    }
});

// --- Admin User Management Routes ---

// Get all users (Admin only)
app.get('/api/admin/users', authenticate, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 }); // Exclude password
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users.', error: error.message });
    }
});

// Update user prediction limit (Admin only)
app.put('/api/admin/users/:id/limit', authenticate, isAdmin, async (req, res) => {
    const { limit } = req.body;
    if (typeof limit !== 'number' || limit < 0) {
        return res.status(400).json({ message: 'Invalid limit value.' });
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        user.predictionLimit = limit;
        await user.save();
        res.json({ message: 'User prediction limit updated.', user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user limit.', error: error.message });
    }
});

// Reset user prediction count (Admin only)
app.put('/api/admin/users/:id/reset-count', authenticate, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        user.predictionCount = 0;
        await user.save();
        res.json({ message: 'User prediction count reset.', user });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reset user count.', error: error.message });
    }
});

// Get specific user's history (Admin only)
app.get('/api/admin/users/:id/history', authenticate, isAdmin, async (req, res) => {
    try {
        const history = await History.find({ user: req.params.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch user history.', error: error.message });
    }
});



// --- Upload Route ---
app.post('/api/upload', authenticate, isAdmin, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    res.json({ url: req.file.path });
});

// --- Blog Routes ---

// Get all blogs (Public)
app.get('/api/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find().populate('author', 'username').sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch blogs.', error: error.message });
    }
});

// Get single blog (Public)
app.get('/api/blogs/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author', 'username');
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found.' });
        }
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch blog.', error: error.message });
    }
});

// Create a blog (Admin only)
app.post('/api/blogs', authenticate, isAdmin, async (req, res) => {
    const { title, content, imageUrl, tags } = req.body;
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required.' });
    }
    try {
        const blog = new Blog({
            title,
            content,
            imageUrl,
            tags,
            author: req.user._id
        });
        await blog.save();
        res.status(201).json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create blog.', error: error.message });
    }
});

// Update a blog (Admin only)
app.put('/api/blogs/:id', authenticate, isAdmin, async (req, res) => {
    const { title, content, imageUrl, tags } = req.body;
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found.' });
        }
        
        blog.title = title || blog.title;
        blog.content = content || blog.content;
        blog.imageUrl = imageUrl || blog.imageUrl;
        blog.tags = tags || blog.tags;

        await blog.save();
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update blog.', error: error.message });
    }
});

// Delete a blog (Admin only)
app.delete('/api/blogs/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found.' });
        }
        await blog.deleteOne(); // or blog.remove() depending on mongoose version
        res.json({ message: 'Blog deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete blog.', error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});