const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDatabase, initializeDefaultData } = require('./database');
const dataAccess = require('./dataAccess');
const { authenticateToken } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'https://herb-order-server.onrender.com'];

app.use(cors({
    origin: function (origin, callback) {
        // EMERGENCY FIX: Allow all origins for presentation demo
        return callback(null, true);
    },
    credentials: true
}));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Too many requests. Please slow down.' }
});
app.use('/api/', apiLimiter);

// ==================== ROUTES ====================

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date(), db: dataAccess.getMongoStatus() });
});

// Import Modular Routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const orderRoutes = require('./routes/orders');
const analyticsRoutes = require('./routes/analytics');
const locationRoutes = require('./routes/locations');
const shiprocketRoutes = require('./routes/shiprocket');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const leaderboardRoutes = require('./routes/leaderboard');
const searchRoutes = require('./routes/search');

// Mount Routes
app.use('/api/auth', authRoutes); // /api/auth/login, etc.
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/shiprocket', shiprocketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/search', searchRoutes);

// Compatibility Mounts (Legacy URLs)
app.use('/api', authRoutes);
app.use('/api', locationRoutes);

// Page Routing (MPA)
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/admin.html')));
app.get('/employee', (req, res) => res.sendFile(path.join(__dirname, 'public/employee.html')));
app.get('/dispatch', (req, res) => res.sendFile(path.join(__dirname, 'public/dispatch.html')));
app.get('/verification', (req, res) => res.sendFile(path.join(__dirname, 'public/verification.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));

// Support for old .html paths
app.get('/*.html', (req, res) => {
    const page = req.path.split('/').pop().replace('.html', '');
    if (['admin', 'employee', 'dispatch', 'verification', 'login'].includes(page)) {
        return res.redirect(`/${page}`);
    }
    res.sendFile(path.join(__dirname, 'public', req.path));
});

// Catch-all
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

// ==================== START SERVER ====================
async function startServer() {
    const dbConnected = await connectDatabase();
    if (dbConnected) {
        await initializeDefaultData();
        console.log('✅ Database initialized!');
    } else {
        console.warn('⚠️ Running without MongoDB - Data will not persist!');
    }

    app.listen(PORT, '0.0.0.0', () => {
        console.log('╔═══════════════════════════════════════════════════════════╗');
        console.log('║       🌿 HERB ON NATURALS MODULAR SERVER STARTED 🌿       ║');
        console.log(`║  Port:     ${PORT}                                            ║`);
        console.log(`║  Status:   ${dbConnected ? '🟢 MongoDB Connected' : '🔴 JSON Mode'}           ║`);
        console.log('╚═══════════════════════════════════════════════════════════╝');
    });
}

startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});
