const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { SUPERADMIN_EMAIL } = require('../config/emailConfig');

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Please provide email and password' });
        }

        // Check if user exists by email or username
        const [users] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, email]);

        if (users.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        // Check if account is active
        if (user.status !== 'Active') {
            return res.status(403).json({ status: 'error', message: 'User account is suspended or inactive' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email, clinic_id: user.clinic_id },
            process.env.JWT_SECRET || 'secretkey123',
            { expiresIn: '8h' }
        );

        // Fetch subscription info
        let subscription_status = 'active';
        let trial_end_date = null;
        let isPaidPlan = false;
        if (user.clinic_id) {
            const [subs] = await db.query('SELECT * FROM saas_subscriptions WHERE clinic_id = ? ORDER BY created_at DESC LIMIT 1', [user.clinic_id]);
            if (subs.length > 0) {
                const sub = subs[0];
                if (sub.plan_id === 'plan-free-trial') {
                    subscription_status = 'trial';
                } else {
                    subscription_status = sub.status === 'Active' ? 'active' : 'expired';
                    isPaidPlan = true;
                }
                trial_end_date = sub.end_date;
            }
        }

        // Send response
        res.json({
            status: 'success',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    profile_image: user.profile_image,
                    clinic_id: user.clinic_id,
                    subscription_status,
                    trial_end_date,
                    isPaidPlan
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ status: 'error', message: 'Server error during login', error: error.message });
    }
};

// @desc    Register new clinic & admin account
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const {
            businessName,
            adminName,
            email,
            mobile,
            password,
            confirmPassword,
            selectedPlan = 'free-trial'
        } = req.body;

        // 1. Basic Field Presence Check
        if (!businessName || !adminName || !email || !mobile || !password) {
            return res.status(400).json({ status: 'error', message: 'All registration fields are required' });
        }

        // 2. Length & Format Validations
        if (businessName.trim().length < 3) {
            return res.status(400).json({ status: 'error', message: 'Clinic name must be at least 3 characters long' });
        }

        if (adminName.trim().length < 3) {
            return res.status(400).json({ status: 'error', message: 'Admin full name must be at least 3 characters long' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ status: 'error', message: 'Please provide a valid email address' });
        }

        const mobileClean = mobile.replace(/[^0-9]/g, '');
        if (mobileClean.length < 10) {
            return res.status(400).json({ status: 'error', message: 'Mobile number must contain at least 10 digits' });
        }

        // Password matching check
        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({ status: 'error', message: 'Password and Confirm Password do not match' });
        }

        // Password Strength Check
        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passRegex.test(password)) {
            return res.status(400).json({
                status: 'error',
                message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character'
            });
        }

        // 3. Uniqueness Check in Database
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ? OR phone = ?',
            [email.trim().toLowerCase(), mobileClean]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'This email or mobile number is already registered'
            });
        }

        // 4. Generate Security IDs & Pass Hash
        const userId = crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const tenantId = crypto.randomUUID ? crypto.randomUUID() : `TEN-${Date.now()}`;
        const adminId = `ADM-${Math.floor(100000 + Math.random() * 900000)}`;
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 5. Fetch Plan Details & Features from Database
        const planId = selectedPlan.startsWith('plan-') ? selectedPlan : `plan-${selectedPlan}`;
        const [planRows] = await db.query('SELECT * FROM saas_plans WHERE id = ?', [planId]);
        const planRecord = planRows && planRows.length > 0 ? planRows[0] : null;

        const isTrial = planId === 'plan-free-trial' || selectedPlan === 'free-trial';
        const durationDays = planRecord && planRecord.duration_days ? planRecord.duration_days : (isTrial ? 7 : 30);
        const planName = planRecord && planRecord.name ? planRecord.name : (isTrial ? '7-Day Free Trial' : 'Pro Plan');
        const planPrice = planRecord && planRecord.price !== undefined ? planRecord.price : (isTrial ? 0 : 1499);

        const { parseFeatures } = require('../services/subscriptionService');
        const planFeatures = parseFeatures(planRecord ? planRecord.features : null);

        // 6. Calculate Subscription Start & End Dates
        const subscriptionStartDate = new Date();
        const subscriptionEndDate = new Date();
        subscriptionEndDate.setDate(subscriptionStartDate.getDate() + durationDays);

        // 7. Insert Clinic, Admin User, and Subscription records into Database (using transaction for consistency)
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Insert Clinic
            await connection.query(
                `INSERT INTO clinics (id, clinic_name, email, phone, status) VALUES (?, ?, ?, ?, ?)`,
                [tenantId, businessName.trim(), email.trim().toLowerCase(), mobileClean, isTrial ? 'TRIAL' : 'ACTIVE']
            );

            // Insert Admin User
            const username = email.split('@')[0].toLowerCase() + Math.floor(Math.random() * 100);
            await connection.query(
                `INSERT INTO users (id, name, email, phone, role, username, password_hash, status, clinic_id) 
                 VALUES (?, ?, ?, ?, 'Admin', ?, ?, 'Active', ?)`,
                [userId, adminName.trim(), email.trim().toLowerCase(), mobileClean, username, passwordHash, tenantId]
            );

            const subscriptionId = crypto.randomUUID ? crypto.randomUUID() : `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Insert SaaS Subscription
            await connection.query(
                `INSERT INTO saas_subscriptions (id, clinic_id, clinic_admin_id, plan_id, status, start_date, end_date) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [subscriptionId, tenantId, userId, planId, isTrial ? 'Trial' : 'Active', subscriptionStartDate, subscriptionEndDate]
            );

            await connection.commit();
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

        // 8. Send Welcome email with real database account + subscription details
        try {
            const frontendBase = (process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5174').trim().replace(/\/+$/, '');
            const loginUrl = `${frontendBase}/login`;
            const saNotifyEmail = SUPERADMIN_EMAIL;

            // Send standardized Welcome Email to new Admin
            await emailService.sendWelcomeEmail({
                adminName: adminName.trim(),
                email: email.trim().toLowerCase(),
                clinicName: businessName.trim(),
                planName,
                price: planPrice,
                durationDays,
                startDate: subscriptionStartDate,
                endDate: subscriptionEndDate,
                isTrial,
                features: planFeatures,
                loginUrl
            });
            console.log(`[Registration] Welcome email dispatched successfully for: ${email.trim().toLowerCase()}`);

            // Send notification to SuperAdmin
            const formattedExpiry = subscriptionEndDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
            const saNotifyHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                  <div style="background: #0f172a; padding: 1.25rem; text-align: center;">
                    <span style="color: #fff; font-weight: 800; font-size: 1.1rem;">PETCARE <span style="color: #2dd4bf;">PRO</span> — Admin Alert</span>
                  </div>
                  <div style="padding: 1.5rem;">
                    <h2 style="color: #0f172a; font-size: 1.1rem; margin-top: 0;">🆕 New Clinic Registration Alert</h2>
                    <p style="color: #475569; font-size: 0.9rem;">A new clinic admin has registered on the PetCare Pro platform:</p>
                    <table style="width: 100%; font-size: 0.9rem; border-collapse: collapse; background: #f8fafc; border-radius: 8px;">
                      <tr><td style="padding: 8px 12px; color: #64748b;">Admin Name:</td><td style="padding: 8px 12px; font-weight: 700; color: #0f172a;">${adminName.trim()}</td></tr>
                      <tr style="background:#fff;"><td style="padding: 8px 12px; color: #64748b;">Email:</td><td style="padding: 8px 12px; color: #0f172a;">${email.trim().toLowerCase()}</td></tr>
                      <tr><td style="padding: 8px 12px; color: #64748b;">Clinic Name:</td><td style="padding: 8px 12px; font-weight: 700; color: #0f172a;">${businessName.trim()}</td></tr>
                      <tr style="background:#fff;"><td style="padding: 8px 12px; color: #64748b;">Mobile:</td><td style="padding: 8px 12px; color: #0f172a;">${mobileClean}</td></tr>
                      <tr><td style="padding: 8px 12px; color: #64748b;">Plan:</td><td style="padding: 8px 12px; color: #0d9488; font-weight: 700;">${planName}</td></tr>
                      <tr style="background:#fff;"><td style="padding: 8px 12px; color: #64748b;">Duration / Expiry:</td><td style="padding: 8px 12px; color: #dc2626; font-weight: 700;">${formattedExpiry} (${durationDays} Days)</td></tr>
                      <tr><td style="padding: 8px 12px; color: #64748b;">Admin ID:</td><td style="padding: 8px 12px; font-family: monospace; color: #334155;">${adminId}</td></tr>
                      <tr style="background:#fff;"><td style="padding: 8px 12px; color: #64748b;">Registered At:</td><td style="padding: 8px 12px; color: #0f172a;">${new Date().toLocaleString('en-IN')}</td></tr>
                    </table>
                  </div>
                  <div style="background: #f8fafc; padding: 0.75rem; text-align: center; color: #94a3b8; font-size: 0.75rem;">
                    PetCare Pro SaaS Platform — Super Admin Notification
                  </div>
                </div>
            `;
            await emailService.sendEmail({
                to: saNotifyEmail,
                subject: `🆕 New Clinic Registered: ${businessName.trim()} — ${new Date().toLocaleDateString('en-IN')}`,
                text: `New clinic registered: ${businessName.trim()} by ${adminName.trim()} (${email.trim().toLowerCase()}). Plan: ${planName}. Expires: ${formattedExpiry}`,
                html: saNotifyHtml
            });

        } catch (emailErr) {
            console.error(`[Email] Welcome email failed for: ${email.trim().toLowerCase()}:`, emailErr.message);
        }

        // 9. Return Structured Response
        res.status(201).json({
            status: 'success',
            message: 'Clinic registered successfully',
            data: {
                adminId,
                tenantId,
                userId,
                email: email.trim().toLowerCase(),
                adminName: adminName.trim(),
                businessName: businessName.trim(),
                selectedPlan,
                isPaidPlan: !isTrial,
                trialStartDate: subscriptionStartDate,
                trialExpiryDate: subscriptionEndDate
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error during registration',
            error: error.message
        });
    }
};

module.exports = { loginUser, registerUser };
