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
            LEFT JOIN saas_subscriptions s ON s.id = (
                SELECT s2.id FROM saas_subscriptions s2 
                WHERE s2.clinic_id = c.id 
                ORDER BY s2.created_at DESC 
                LIMIT 1
            )
            LEFT JOIN saas_plans p ON p.id = s.plan_id
            GROUP BY c.id
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

        const [upcomingRenewals] = await db.query(`
            SELECT 
                s.id,
                c.clinic_name as clinic,
                u.name as owner,
                s.end_date as expiry,
                p.name as plan,
                p.id as planType
            FROM clinics c
            INNER JOIN saas_subscriptions s ON s.id = (
                SELECT s2.id FROM saas_subscriptions s2 
                WHERE s2.clinic_id = c.id 
                ORDER BY s2.created_at DESC 
                LIMIT 1
            )
            LEFT JOIN users u ON u.clinic_id = c.id AND u.role = 'Admin'
            LEFT JOIN saas_plans p ON p.id = s.plan_id
            WHERE s.end_date IS NOT NULL
            GROUP BY c.id
            ORDER BY s.end_date ASC
            LIMIT 10
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
            openSupportTickets: ticketStats[0]?.open_tickets || 0,
            upcomingRenewals: upcomingRenewals || []
        };

        res.json({ status: 'success', data: stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch stats' });
    }
};

// @desc    Get All SaaS Payments
// @route   GET /api/super-admin/payments
// @access  Private (SUPER_ADMIN)
const getPayments = async (req, res) => {
    try {
        const [payments] = await db.query(`
            SELECT 
                p.id,
                p.razorpay_order_id as orderId,
                p.razorpay_payment_id as paymentId,
                c.clinic_name as clinic,
                p.payment_date as date,
                p.amount,
                p.payment_method as method,
                p.status,
                p.invoice_number as invoice
            FROM saas_payments p
            LEFT JOIN clinics c ON c.id = p.clinic_id
            ORDER BY p.payment_date DESC
        `);

        res.json({ status: 'success', data: payments });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch payments' });
    }
};

// @desc    Get All SaaS Subscriptions
// @route   GET /api/super-admin/subscriptions
// @access  Private (SUPER_ADMIN)
const getSubscriptions = async (req, res) => {
    try {
        const [subs] = await db.query(`
            SELECT 
                s.id,
                c.clinic_name as clinicName,
                c.email,
                p.name as plan,
                s.status,
                'Monthly' as billingCycle,
                s.end_date as nextBilling,
                p.price as amount
            FROM saas_subscriptions s
            LEFT JOIN clinics c ON c.id = s.clinic_id
            LEFT JOIN saas_plans p ON p.id = s.plan_id
            ORDER BY s.created_at DESC
        `);

        res.json({ status: 'success', data: subs });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch subscriptions' });
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

        try {
            await createAuditLog({
                userId: null,
                clinicId: id,
                action: 'CLINIC_SUSPENDED',
                entity: 'clinic',
                entityId: id,
                newValues: { status: 'SUSPENDED', reason },
                req
            });
        } catch (auditErr) {
            // ignore
        }

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

        try {
            await createAuditLog({
                userId: null,
                clinicId: id,
                action: 'CLINIC_ACTIVATED',
                entity: 'clinic',
                entityId: id,
                newValues: { status: 'ACTIVE' },
                req
            });
        } catch (auditErr) {
            // ignore
        }

        res.json({ status: 'success', message: 'Clinic activated successfully' });
    } catch (error) {
        console.error('Error activating clinic:', error);
        res.status(500).json({ status: 'error', message: 'Failed to activate clinic' });
    }
};

// @desc    Delete Clinic & Associated Data
// @route   DELETE /api/super-admin/clinics/:id
// @access  Private (SUPER_ADMIN)
const deleteClinic = async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Temporarily disable foreign key checks to allow clean cascade deletion
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // All tables that may contain clinic_id references
        const tables = [
            'invoice_line_items',
            'invoices',
            'billing_invoice_items',
            'billing_invoices',
            'prescriptions',
            'treatment_notes',
            'diagnostic_reports',
            'clinical_encounters',
            'home_visits',
            'hospitalization_cages',
            'hospitalizations',
            'inpatient_treatments',
            'inpatient_vitals',
            'email_reminders',
            'reminders',
            'notification_logs',
            'notifications',
            'staff_attendance',
            'inventory_items',
            'inventory',
            'appointments',
            'pets',
            'pet_owners',
            'saas_payments',
            'saas_support_tickets',
            'saas_subscriptions',
            'clinic_settings',
            'system_settings',
            'audit_logs',
            'users'
        ];

        for (const tbl of tables) {
            try {
                await connection.query(`DELETE FROM ${tbl} WHERE clinic_id = ?`, [id]);
            } catch (tblErr) {
                // Ignore if table/column does not exist in schema
            }
        }

        // Delete clinic master row
        await connection.query('DELETE FROM clinics WHERE id = ?', [id]);

        // Re-enable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        await connection.commit();

        try {
            await createAuditLog({
                userId: null,
                clinicId: id,
                action: 'CLINIC_DELETED',
                entity: 'clinic',
                entityId: id,
                req
            });
        } catch (auditErr) {
            // Ignore audit log write failure
        }

        res.json({ status: 'success', message: 'Clinic and all associated records deleted successfully' });
    } catch (error) {
        if (connection) {
            try {
                await connection.query('SET FOREIGN_KEY_CHECKS = 1');
                await connection.rollback();
            } catch (rbErr) {}
        }
        console.error('Error deleting clinic:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete clinic', error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// @desc    Update Clinic Details
// @route   PUT /api/super-admin/clinics/:id
// @access  Private (SUPER_ADMIN)
const updateClinic = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, city, state, country, status, adminName } = req.body;

        await db.query(
            `UPDATE clinics SET clinic_name = COALESCE(?, clinic_name), email = COALESCE(?, email), phone = COALESCE(?, phone), address = COALESCE(?, address), city = COALESCE(?, city), state = COALESCE(?, state), country = COALESCE(?, country), status = COALESCE(?, status), updated_at = NOW() WHERE id = ?`,
            [name, email, phone, address, city, state, country, status, id]
        );

        if (adminName) {
            await db.query(`UPDATE users SET name = ? WHERE clinic_id = ? AND role = 'Admin'`, [adminName, id]);
        }

        res.json({ status: 'success', message: 'Clinic details updated successfully' });
    } catch (error) {
        console.error('Error updating clinic:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update clinic', error: error.message });
    }
};

module.exports = {
    loginSuperAdmin,
    getClinics,
    getStats,
    getPayments,
    getSubscriptions,
    suspendClinic,
    activateClinic,
    deleteClinic,
    updateClinic
};
