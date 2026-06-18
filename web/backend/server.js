require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import routes
const applicationRoutes = require('./routes/applications');
const projectRoutes = require('./routes/projects');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const dashboardRoutes = require('./routes/dashboard');

// Import file upload middleware
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, JPG, PNG, and PDF files are allowed.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection - MongoDB Atlas
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/housing_system';

// Connect to MongoDB with proper error handling
mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000, // Timeout after 10s
})
.then(async () => {
    console.log('Connected to MongoDB database');
    console.log(` Database: ${mongoose.connection.name}`);
    try {
        const { cleanupOrphanApplications } = require('./controllers/applicationController');
        await cleanupOrphanApplications();
        const User = require('./models/User');
        const citizenDept = await User.updateMany(
            { role: 'citizen' },
            { $unset: { department: '' } }
        );
        if (citizenDept.modifiedCount > 0) {
            console.log(`Cleared department on ${citizenDept.modifiedCount} citizen account(s)`);
        }
    } catch (err) {
        console.error('Startup data cleanup skipped:', err.message);
    }
})
.catch((error) => {
    console.error(' MongoDB connection failed:', error.message);
    console.error(' Please ensure MongoDB is running and accessible');
    process.exit(1); // Exit if MongoDB connection fails
});

// Handle MongoDB connection events
mongoose.connection.on('error', (error) => {
    console.error(' MongoDB connection error:', error);
    process.exit(1);
});

mongoose.connection.on('disconnected', () => {
    console.log(' MongoDB disconnected - attempting to reconnect...');
    // Don't exit, let mongoose handle reconnection
});

mongoose.connection.on('reconnected', () => {
    console.log(' MongoDB reconnected');
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React build (production fallback — dev uses Vite at :5173)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

// Attach userId/userRole from JWT to every request (non-blocking)
app.use(require('./middleware/optionalAuth'));

// Routes - Using MongoDB controllers
app.use('/api/applications', applicationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', require('./routes/users-new')); // MongoDB users route
app.use('/api/auditLogs', require('./routes/auditLogs-mongodb')); // MongoDB audit logs
app.use('/api/notifications', require('./routes/notifications-mongodb')); // MongoDB notifications
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai',  require('./routes/ai'));
app.use('/api/ocr', require('./routes/ocr'));

// MongoDB Test Routes (for testing without removing originals)
const applicationRoutesMongo = require('./routes/applications-mongodb');
const projectRoutesMongo = require('./routes/projects-mongodb');
const userRoutesMongo = require('./routes/users-mongodb');
const auditLogRoutesMongo = require('./routes/auditLogs-mongodb');
const notificationRoutesMongo = require('./routes/notifications-mongodb');

app.use('/api/applications-mongodb', applicationRoutesMongo);
app.use('/api/projects-mongodb', projectRoutesMongo);
app.use('/api/users-mongodb', userRoutesMongo);
app.use('/api/auditLogs-mongodb', auditLogRoutesMongo);
app.use('/api/notifications-mongodb', notificationRoutesMongo);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Findoor Backend API is running',
        timestamp: new Date().toISOString()
    });
});

// Root route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Findoor Backend API is running',
        version: '1.0.0',
        endpoints: {
            applications: '/api/applications',
            projects: '/api/projects',
            auth: '/api/auth',
            upload: '/api/upload',
            users: '/api/users',
            auditLogs: '/api/auditLogs',
            notifications: '/api/notifications',
            health: '/api/health',
            api: '/api'
        },
        timestamp: new Date().toISOString()
    });
});

// Root API endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Findoor Backend API is running',
        version: '1.0.0',
        endpoints: {
            applications: '/api/applications',
            projects: '/api/projects',
            auth: '/api/auth',
            upload: '/api/upload',
            users: '/api/users',
            auditLogs: '/api/auditLogs',
            notifications: '/api/notifications',
            health: '/api/health'
        },
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// SPA fallback — serve index.html for any non-API route so React Router handles it
app.use('*', (req, res) => {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    if (!req.originalUrl.startsWith('/api') && fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({ success: false, message: 'Route not found' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(` Findoor Backend Server running on port ${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
    console.log(` Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
