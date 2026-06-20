require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Crash-safe — log unhandled rejections instead of silently dying
process.on('unhandledRejection', (err) => {
    console.error('[UnhandledRejection]', err);
});
process.on('uncaughtException', (err) => {
    console.error('[UncaughtException]', err);
    process.exit(1);
});

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

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

app.use(cors({
    origin: (origin, cb) => {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return cb(null, true);
        // In development, allow any localhost/127.0.0.1 port (Flutter web uses random ports)
        if (process.env.NODE_ENV !== 'production') {
            if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
        }
        // Allow LAN IP for mobile dev
        if (/^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin)) return cb(null, true);
        // Check explicit whitelist
        if (allowedOrigins.length && allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));

// General API rate limit — 200 req / 15 min per IP
app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests — please slow down.' },
}));

// Stricter limits on auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many registrations from this IP.' },
});

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

// Serve project photos from the root projects_photo/ directory.
// Must come before the generic /uploads route so /uploads/projects hits here.
app.use('/uploads/projects', express.static(path.join(__dirname, '..', '..', 'projects_photo')));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve React build (production fallback — dev uses Vite at :5173)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

// Attach userId/userRole from JWT to every request (non-blocking)
app.use(require('./middleware/optionalAuth'));

// ── Routes ────────────────────────────────────────────────────────────────────
// Rate limiters must be registered before the route handlers they protect
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/v1/auth/login',    authLimiter);
app.use('/api/v1/auth/register', registerLimiter);

app.use('/api/applications', applicationRoutes);
app.use('/api/projects',     projectRoutes);
app.use('/api/auth',         authRoutes);
app.use('/api/upload',       uploadRoutes);
app.use('/api/users',        require('./routes/users-new'));
app.use('/api/auditLogs',    require('./routes/auditLogs-mongodb'));
app.use('/api/notifications', require('./routes/notifications-mongodb'));
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/ai',           require('./routes/ai'));
app.use('/api/ocr',          require('./routes/ocr'));

// /api/v1/* aliases — same handlers, versioned path for forward-compatibility
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/projects',     projectRoutes);
app.use('/api/v1/auth',         authRoutes);
app.use('/api/v1/users',        require('./routes/users-new'));
app.use('/api/v1/dashboard',    dashboardRoutes);

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

// Start server only when run directly (not when required by tests)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(` Findoor Backend Server running on port ${PORT}`);
        console.log(`API Base URL: http://localhost:${PORT}/api`);
        console.log(` Health Check: http://localhost:${PORT}/api/health`);
    });
}

module.exports = app;
