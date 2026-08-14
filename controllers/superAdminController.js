const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createAuditLog } = require('../services/auditService');

// @desc    Super Admin Login
// @route   POST /api/super-admin/login
// @access  Public
const loginSuperAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Please provide email and password' });
        }

        const [users] = await db.query('SELECT * FROM super_admins WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET || 'secretkey123',
            { expiresIn: '8h' }
        );

        await createAuditLog({
            userId: user.id,
            action: 'SUPER_ADMIN_LOGIN',
            entity: 'super_admin',
            entityId: user.id,
            req
        });

        res.json({
            status: 'success',
            data: {
                token,
                user: { id: user.id, email: user.email, role: user.role }
            }
        });
    } catch (error) {
        console.error('Super Admin Login error:', error);
        res.status(500).json({ status: 'error', message: 'Server error during login', error: error.message });
    }
};

// @desc    Get All Clinics
// @route   GET /api/super-admin/clinics
// @access  Private (SUPER_ADMIN)
const getClinics = async (req, res) => {
    try {
        const [clinics] = await db.query(`
            SELECT 
                c.id,
                c.clinic_name,
                c.email,
                c.phone,
                c.address,
                c.city,
                c.state,
                c.country,
                c.status as clinic_status,
                c.created_at,
                u.name as admin_name,
                u.email as admin_email,
                s.status as subscription_status,
                s.start_date as subscription_start,
                s.end_date as subscription_end,
                p.name as plan_name,
                p.price as plan_price
            FROM clinics c
            LEFT JOIN users u ON u.clinic_id = c.id AND u.role = 'Admin'
            LEFT JOIN saas_subscriptions s ON s.clinic_id = c.id
            LEFT JOIN saas_plans p ON p.id = s.plan_id
            ORDER BY c.created_at DESC
        `);

        const formatted = clinics.map(clinic => ({
            id: clinic.id,
            name: clinic.clinic_name,
            email: clinic.email,
            phone: clinic.phone,
            address: clinic.address,
            city: clinic.city,
            state: clinic.state,
            country: clinic.country,
            status: clinic.clinic_status,
            adminName: clinic.admin_name,
            adminEmail: clinic.admin_email,
            subscriptionStatus: clinic.subscription_status,
            subscriptionStart: clinic.subscription_start,
            subscriptionEnd: clinic.subscription_end,
            planName: clinic.plan_name,
            planPrice: clinic.plan_price,
            createdDate: clinic.created_at
        }));

        res.json({ status: 'success', data: formatted });
    } catch (error) {
        console.error('Error fetching clinics:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch clinics' });
    }
};

// @desc    Get Stats
// @route   GET /api/super-admin/stats
// @access  Private (SUPER_ADMIN)
const getStats = async (req, res) => {
    try {
        const [clinicStats] = await db.query(`
            SELECT 
                COUNT(*) as total_clinics,
                SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_clinics,
                SUM(CASE WHEN status = 'TRIAL' THEN 1 ELSE 0 END) as trial_clinics,
                SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) as expired_clinics,
                SUM(CASE WHEN status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended_clinics
            FROM clinics
        `);

        const [userStats] = await db.query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(CASE WHEN role = 'Doctor' THEN 1 ELSE 0 END) as total_doctors
            FROM users
        `);

        const [petStats] = await db.query(`SELECT COUNT(*) as total_pets FROM pets`);
        const [paymentStats] = await db.query(`
            SELECT 
                COALESCE(SUM(amount), 0) as total_revenue,
                COUNT(*) as total_payments
            FROM saas_payments 
            WHERE status = 'Successful'
        `);
        const [ticketStats] = await db.query(`
            SELECT COUNT(*) as open_tickets 
            FROM saas_support_tickets 
            WHERE status = 'Open'
        `);

        const stats = {
            totalClinics: clinicStats[0]?.total_clinics || 0,
            activeClinics: clinicStats[0]?.active_clinics || 0,
            trialClinics: clinicStats[0]?.trial_clinics || 0,
            expiredClinics: clinicStats[0]?.expired_clinics || 0,
            suspendedClinics: clinicStats[0]?.suspended_clinics || 0,
            totalUsers: userStats[0]?.total_users || 0,
            totalDoctors: userStats[0]?.total_doctors || 0,
            totalPatients: petStats[0]?.total_pets || 0,
            totalRevenue: paymentStats[0]?.total_revenue || 0,
            totalPayments: paymentStats[0]?.total_payments || 0,
            openSupportTickets: ticketStats[0]?.open_tickets || 0
        };

        res.json({ status: 'success', data: stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch stats' });
    }
};

// @desc    Suspend Clinic
// @route   POST /api/super-admin/clinics/:id/suspend
// @access  Private (SUPER_ADMIN)
const suspendClinic = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        await db.query(
            "UPDATE clinics SET status = 'SUSPENDED', updated_at = NOW() WHERE id = ?",
            [id]
        );

        await createAuditLog({
            userId: req.user.id,
            clinicId: id,
            action: 'CLINIC_SUSPENDED',
            entity: 'clinic',
            entityId: id,
            newValues: { status: 'SUSPENDED', reason },
            req
        });

        res.json({ status: 'success', message: 'Clinic suspended successfully' });
    } catch (error) {
        console.error('Error suspending clinic:', error);
        res.status(500).json({ status: 'error', message: 'Failed to suspend clinic' });
    }
};

// @desc    Activate Clinic
// @route   POST /api/super-admin/clinics/:id/activate
// @access  Private (SUPER_ADMIN)
const activateClinic = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(
            "UPDATE clinics SET status = 'ACTIVE', updated_at = NOW() WHERE id = ?",
            [id]
        );

        await createAuditLog({
            userId: req.user.id,
            clinicId: id,
            action: 'CLINIC_ACTIVATED',
            entity: 'clinic',
            entityId: id,
            newValues: { status: 'ACTIVE' },
            req
        });

        res.json({ status: 'success', message: 'Clinic activated successfully' });
    } catch (error) {
        console.error('Error activating clinic:', error);
        res.status(500).json({ status: 'error', message: 'Failed to activate clinic' });
    }
};

module.exports = {
    loginSuperAdmin,
    getClinics,
    getStats,
    suspendClinic,
    activateClinic
};
