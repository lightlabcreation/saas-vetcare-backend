const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);
const port = 5002;

// Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "checkout.razorpay.com", "cdn.jsdelivr.net"],
            frameSrc: ["'self'", "checkout.razorpay.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "http://localhost:*"],
            styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
            fontSrc: ["'self'", "data:"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
}));

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { status: 'error', message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Rate limiting for payment verification routes
const paymentLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    message: { status: 'error', message: 'Too many payment attempts, please try again after 5 minutes' }
});

// CORS Configuration
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5174', 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean);
app.use(cors({
    origin: function (origin, callback) {
        // Allow mobile app requests (no origin or exp:// or any local IP)
        callback(null, true);
    },
    credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const path = require('path');
const { protect } = require('./middlewares/authMiddleware');
const { errorHandler } = require('./middlewares/errorHandler');
const { subscriptionMiddleware } = require('./middlewares/subscriptionMiddleware');

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const petOwnerRoutes = require('./routes/petOwnerRoutes');
const petRoutes = require('./routes/petRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const userRoutes = require('./routes/userRoutes');
const homeVisitRoutes = require('./routes/homeVisitRoutes');
const encounterRoutes = require('./routes/encounterRoutes');
const treatmentNoteRoutes = require('./routes/treatmentNoteRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const assistanceTaskRoutes = require('./routes/assistanceTaskRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const supportTicketRoutes = require('./routes/supportTicketRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const hospitalizationRoutes = require('./routes/hospitalizationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/v1/auth', authLimiter, authRoutes);
// Apply subscription middleware to all protected API routes
app.use('/api/v1/inventory', protect, subscriptionMiddleware, inventoryRoutes);
app.use('/api/v1/owners', protect, subscriptionMiddleware, petOwnerRoutes);
app.use('/api/v1/pets', protect, subscriptionMiddleware, petRoutes);
app.use('/api/v1/appointments', protect, subscriptionMiddleware, appointmentRoutes);
app.use('/api/v1/users', protect, subscriptionMiddleware, userRoutes);
app.use('/api/v1/home-visits', protect, subscriptionMiddleware, homeVisitRoutes);
app.use('/api/v1/encounters', protect, subscriptionMiddleware, encounterRoutes);
app.use('/api/v1/treatment-notes', protect, subscriptionMiddleware, treatmentNoteRoutes);
app.use('/api/v1/invoices', protect, subscriptionMiddleware, invoiceRoutes);
app.use('/api/v1/attendance', protect, subscriptionMiddleware, attendanceRoutes);
app.use('/api/v1/reports', protect, subscriptionMiddleware, reportRoutes);
app.use('/api/v1/notifications', protect, subscriptionMiddleware, notificationRoutes);
app.use('/api/v1/settings', protect, subscriptionMiddleware, settingsRoutes);
app.use('/api/v1/assistance-tasks', protect, subscriptionMiddleware, assistanceTaskRoutes);
app.use('/api/v1/support-tickets', protect, subscriptionMiddleware, supportTicketRoutes);
app.use('/api/v1/dashboard', protect, subscriptionMiddleware, dashboardRoutes);
app.use('/api/v1/hospitalization', protect, subscriptionMiddleware, hospitalizationRoutes);
app.use('/api/subscriptions', protect, subscriptionRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/payment', paymentLimiter, paymentRoutes);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        const db = require('./config/db');
        const [rows] = await db.query('SELECT 1 + 1 AS solution');
        res.json({ status: 'Database connected successfully!', data: rows[0] });
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({ status: 'Database connection failed', error: error.message });
    }
});

const cron = require('node-cron');
const { checkAndNotifyExpiries } = require('./services/subscriptionService');

// Global Error Handler
app.use(errorHandler);

// Schedule Daily Expiry Check at 12:01 AM with configured timezone (defaults to Asia/Kolkata / Server Local)
const cronTimezone = process.env.CRON_TIMEZONE || 'Asia/Kolkata';
cron.schedule('1 0 * * *', () => {
    console.log(`[Cron] Triggered daily expiry check at 12:01 AM (${cronTimezone})`);
    checkAndNotifyExpiries();
}, {
    timezone: cronTimezone
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
