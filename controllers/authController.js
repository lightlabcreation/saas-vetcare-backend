const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

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
        if (user.clinic_id) {
            const [subs] = await db.query('SELECT * FROM saas_subscriptions WHERE clinic_id = ? ORDER BY created_at DESC LIMIT 1', [user.clinic_id]);
            if (subs.length > 0) {
                const sub = subs[0];
                if (sub.plan_id === 'plan-free-trial') {
                    subscription_status = 'trial';
                } else {
                    subscription_status = sub.status === 'Active' ? 'active' : 'expired';
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
                    trial_end_date
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

        // 5. Calculate Trial Dates
        const trialStartDate = new Date();
        const trialExpiryDate = new Date();
        trialExpiryDate.setDate(trialStartDate.getDate() + 7);
        // 6. Insert Clinic, Admin User, and Subscription records into Database (using transaction for consistency)
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Insert Clinic
            await connection.query(
                `INSERT INTO clinics (id, clinic_name, email, phone, status) VALUES (?, ?, ?, ?, 'TRIAL')`,
                [tenantId, businessName.trim(), email.trim().toLowerCase(), mobileClean]
            );

            // Insert Admin User
            const username = email.split('@')[0].toLowerCase() + Math.floor(Math.random() * 100);
            await connection.query(
                `INSERT INTO users (id, name, email, phone, role, username, password_hash, status, clinic_id) 
                 VALUES (?, ?, ?, ?, 'Admin', ?, ?, 'Active', ?)`,
                [userId, adminName.trim(), email.trim().toLowerCase(), mobileClean, username, passwordHash, tenantId]
            );

            // Map selectedPlan key to plan_id in DB
            const planId = selectedPlan.startsWith('plan-') ? selectedPlan : `plan-${selectedPlan}`;
            const subscriptionId = crypto.randomUUID ? crypto.randomUUID() : `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Insert SaaS Subscription
            await connection.query(
                `INSERT INTO saas_subscriptions (id, clinic_id, clinic_admin_id, plan_id, status, start_date, end_date) 
                 VALUES (?, ?, ?, ?, 'Trial', ?, ?)`,
                [subscriptionId, tenantId, userId, planId, 'Trial', trialStartDate, trialExpiryDate]
            );

            await connection.commit();
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

        // Send Welcome email with credentials + plan details
        try {
            const formattedExpiry = trialExpiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
            const loginUrl = (process.env.FRONTEND_URL || 'http://localhost:5174') + '/login';
            const saNotifyEmail = process.env.SUPERADMIN_NOTIFY_EMAIL || 'info@kiaantechnology.com';

            const welcomeHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #f8fafc;">
                  <div style="background-color: #0d9488; padding: 1.5rem; color: #ffffff;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 1.5rem;">🐾</span>
                      <strong style="font-size: 1.25rem;">Kiaan Veterinary</strong>
                    </div>
                    <div style="font-size: 0.75rem; opacity: 0.9; margin-top: 4px;">Official Notification</div>
                  </div>
                  <div style="padding: 2rem; background-color: #ffffff;">
                    <h3 style="color: #1e293b; font-size: 1.15rem; margin-top: 0; margin-bottom: 1.5rem;">Welcome to Kiaan Veterinary - Your Account is Ready</h3>
                    
                    <p style="color: #334155; margin-bottom: 1.25rem; font-size: 0.9rem;">Hello ${adminName.trim()},</p>
                    <p style="color: #334155; margin-bottom: 1.25rem; font-size: 0.9rem;">Welcome to Kiaan Veterinary.</p>
                    <p style="color: #334155; margin-bottom: 2rem; font-size: 0.9rem;">Your account and plan subscription have been successfully activated.</p>
                    
                    <div style="margin-bottom: 1.5rem;">
                      <p style="color: #475569; font-size: 0.9rem; margin-bottom: 0.75rem;">Account Details:</p>
                      <p style="color: #334155; font-size: 0.9rem; margin: 0.4rem 0;">Name: ${adminName.trim()}</p>
                      <p style="color: #334155; font-size: 0.9rem; margin: 0.4rem 0;">Email / Login ID: <a href="mailto:${email.trim().toLowerCase()}" style="color: #3b82f6; text-decoration: none;">${email.trim().toLowerCase()}</a></p>
                      <p style="color: #334155; font-size: 0.9rem; margin: 0.4rem 0;">Password: ${password}</p>
                      <p style="color: #334155; font-size: 0.9rem; margin: 0.4rem 0;">Software: Kiaan Veterinary</p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                      <p style="color: #475569; font-size: 0.9rem; margin-bottom: 0.75rem;">Plan Details:</p>
                      <p style="color: #334155; font-size: 0.9rem; margin: 0.4rem 0;">Plan: 7-Day Free Trial</p>
                      <p style="color: #334155; font-size: 0.9rem; margin: 0.4rem 0;">Price: ₹0.00</p>
                      <p style="color: #334155; font-size: 0.9rem; margin: 0.4rem 0;">Duration: 7 Days</p>
                      <p style="color: #334155; font-size: 0.9rem; margin: 0.4rem 0;">Start Date: ${trialStartDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p style="color: #334155; font-size: 0.9rem; margin: 0.4rem 0;">Expiry Date: ${trialExpiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                      <p style="color: #475569; font-size: 0.9rem; margin-bottom: 0.75rem;">Login:</p>
                      <p style="margin: 0.4rem 0; font-size: 0.9rem;"><a href="${loginUrl}" style="color: #3b82f6; text-decoration: none;">${loginUrl}</a></p>
                    </div>

                    <p style="color: #334155; margin-bottom: 1.5rem; font-size: 0.9rem;">Please keep your login credentials secure.</p>
                    
                    <p style="color: #334155; font-size: 0.9rem; margin: 0;">Thank you,</p>
                    <p style="color: #334155; font-size: 0.9rem; margin: 0.2rem 0 0 0;">Kiaan Technology Pvt Ltd</p>
                  </div>
                  <div style="background-color: #f1f5f9; padding: 1rem; color: #94a3b8; font-size: 0.75rem; text-align: left;">
                    This is an automated message from Kiaan Veterinary. Please do not reply.
                  </div>
                </div>
            `;

            // 1. Welcome email to new admin
            await emailService.sendEmail({
                to: email.trim().toLowerCase(),
                bcc: saNotifyEmail,
                subject: `Welcome to Kiaan Veterinary - Your Account is Ready`,
                text: `Welcome ${adminName.trim()}! Your account is ready.\nEmail: ${email.trim().toLowerCase()}\nPassword: ${password}\nTrial Expires: ${formattedExpiry}\nLogin at: ${loginUrl}`,
                html: welcomeHtml
            });

            // 2. Notify super admin about new registration
            const saNotifyHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                  <div style="background: #0f172a; padding: 1.25rem; text-align: center;">
                    <span style="color: #fff; font-weight: 800; font-size: 1.1rem;">KIAAN <span style="color: #2dd4bf;">VETERINARY</span> — Admin Panel</span>
                  </div>
                  <div style="padding: 1.5rem;">
                    <h2 style="color: #0f172a; font-size: 1.1rem; margin-top: 0;">🆕 New Clinic Registration Alert</h2>
                    <p style="color: #475569; font-size: 0.9rem;">A new clinic admin has registered on the platform:</p>
                    <table style="width: 100%; font-size: 0.9rem; border-collapse: collapse; background: #f8fafc; border-radius: 8px;">
                      <tr><td style="padding: 8px 12px; color: #64748b;">Admin Name:</td><td style="padding: 8px 12px; font-weight: 700; color: #0f172a;">${adminName.trim()}</td></tr>
                      <tr style="background:#fff;"><td style="padding: 8px 12px; color: #64748b;">Email:</td><td style="padding: 8px 12px; color: #0f172a;">${email.trim().toLowerCase()}</td></tr>
                      <tr><td style="padding: 8px 12px; color: #64748b;">Clinic Name:</td><td style="padding: 8px 12px; font-weight: 700; color: #0f172a;">${businessName.trim()}</td></tr>
                      <tr style="background:#fff;"><td style="padding: 8px 12px; color: #64748b;">Mobile:</td><td style="padding: 8px 12px; color: #0f172a;">${mobileClean}</td></tr>
                      <tr><td style="padding: 8px 12px; color: #64748b;">Plan:</td><td style="padding: 8px 12px; color: #b45309; font-weight: 700;">7-Day Free Trial</td></tr>
                      <tr style="background:#fff;"><td style="padding: 8px 12px; color: #64748b;">Trial Expires:</td><td style="padding: 8px 12px; color: #dc2626; font-weight: 700;">${formattedExpiry}</td></tr>
                      <tr><td style="padding: 8px 12px; color: #64748b;">Admin ID:</td><td style="padding: 8px 12px; font-family: monospace; color: #334155;">${adminId}</td></tr>
                      <tr style="background:#fff;"><td style="padding: 8px 12px; color: #64748b;">Registered At:</td><td style="padding: 8px 12px; color: #0f172a;">${new Date().toLocaleString('en-IN')}</td></tr>
                    </table>
                  </div>
                  <div style="background: #f8fafc; padding: 0.75rem; text-align: center; color: #94a3b8; font-size: 0.75rem;">
                    Kiaan Veterinary SaaS Platform — Super Admin Notification
                  </div>
                </div>
            `;
            await emailService.sendEmail({
                to: saNotifyEmail,
                subject: `🆕 New Clinic Registered: ${businessName.trim()} — ${new Date().toLocaleDateString('en-IN')}`,
                text: `New clinic registered: ${businessName.trim()} by ${adminName.trim()} (${email.trim().toLowerCase()}). Trial expires: ${formattedExpiry}`,
                html: saNotifyHtml
            });

        } catch (emailErr) {
            console.error('Failed to send registration emails:', emailErr);
        }

        // 7. Return Structured Response
        res.status(201).json({
            status: 'success',
            message: 'Clinic registered successfully',
            data: {
                adminId,
                tenantId,
                email: email.trim().toLowerCase(),
                adminName: adminName.trim(),
                businessName: businessName.trim(),
                selectedPlan,
                trialStartDate,
                trialExpiryDate
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
