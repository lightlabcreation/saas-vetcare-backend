const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// Verify Google reCAPTCHA token helper
const verifyRecaptcha = async (recaptchaToken) => {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
        // If developer hasn't set RECAPTCHA_SECRET_KEY in .env, permit in local dev mode
        return true;
    }
    if (!recaptchaToken) {
        return false;
    }
    try {
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
        const response = await fetch(verifyUrl, { method: 'POST' });
        const data = await response.json();
        return !!data.success;
    } catch (e) {
        console.error('reCAPTCHA verification error:', e);
        return false;
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password, recaptchaToken } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Please provide email and password' });
        }

        // Validate reCAPTCHA if configured
        if (process.env.RECAPTCHA_SECRET_KEY) {
            const isCaptchaValid = await verifyRecaptcha(recaptchaToken);
            if (!isCaptchaValid) {
                return res.status(400).json({ status: 'error', message: 'reCAPTCHA verification failed. Please try again.' });
            }
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

        // Generate unique Session ID for single active device tracking
        const sessionId = crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

        // Update active session in DB (invalidates any previous logins)
        await db.query(
            'UPDATE users SET current_session_token = ?, last_login_ip = ?, last_login_at = NOW() WHERE id = ?',
            [sessionId, String(clientIp).slice(0, 50), user.id]
        );

        // Generate JWT Token with embedded sessionId
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email, clinic_id: user.clinic_id, sessionId },
            process.env.JWT_SECRET || 'secretkey123',
            { expiresIn: '8h' }
        );

        // Fetch subscription info
        let subscription_status = 'trial';
        let trial_end_date = null;
        let trial_start_date = null;
        let trial_days_left = 7;
        let trial_current_day = 1;
        let plan_id = 'plan-free-trial';
        let clinic_name = null;
        if (user.clinic_id) {
            const [clinics] = await db.query('SELECT clinic_name, status, created_at FROM clinics WHERE id = ? LIMIT 1', [user.clinic_id]);
            let clinicCreatedAt = null;
            if (clinics.length > 0) {
                clinic_name = clinics[0].clinic_name;
                clinicCreatedAt = clinics[0].created_at;
                if ((clinics[0].status || '').toUpperCase() === 'ACTIVE') {
                    subscription_status = 'active';
                    plan_id = 'plan-starter';
                }
            }

            const [subs] = await db.query('SELECT * FROM saas_subscriptions WHERE clinic_id = ? ORDER BY created_at DESC LIMIT 1', [user.clinic_id]);
            if (subs.length > 0) {
                const sub = subs[0];
                plan_id = sub.plan_id || 'plan-free-trial';
                const subStatus = (sub.status || '').toLowerCase();
                const subPlan = (sub.plan_id || '').toLowerCase();

                if (subStatus === 'expired') {
                    subscription_status = 'expired';
                } else if (subStatus === 'trial' || subPlan === 'plan-free-trial' || subPlan === 'free-trial') {
                    if (sub.end_date && new Date(sub.end_date) < new Date()) {
                        subscription_status = 'expired';
                    } else {
                        subscription_status = 'trial';
                    }
                } else if (subStatus === 'active') {
                    if (sub.end_date && new Date(sub.end_date) < new Date()) {
                        subscription_status = 'expired';
                    } else {
                        subscription_status = 'active';
                    }
                } else {
                    subscription_status = 'trial';
                }
                trial_start_date = sub.start_date || sub.created_at || clinicCreatedAt;
                trial_end_date = sub.end_date;
            } else {
                // If no subscription record found, compute trial from clinic/user created_at
                const baseDate = new Date(clinicCreatedAt || user.created_at || Date.now());
                trial_start_date = baseDate.toISOString().slice(0, 10);
                const expDate = new Date(baseDate);
                expDate.setDate(expDate.getDate() + 7);
                trial_end_date = expDate.toISOString().slice(0, 10);
            }

            if (subscription_status === 'trial' && trial_end_date) {
                const today = new Date();
                const parseMid = (val) => {
                    if (!val) return null;
                    if (val instanceof Date) {
                        return new Date(val.getFullYear(), val.getMonth(), val.getDate());
                    }
                    if (typeof val === 'string') {
                        const trimmed = val.trim();
                        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                            const [y, m, d] = trimmed.split('-').map(Number);
                            return new Date(y, m - 1, d);
                        }
                        const dt = new Date(val);
                        if (!isNaN(dt.getTime())) {
                            return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
                        }
                    }
                    return null;
                };
                const startMid = parseMid(trial_start_date) || new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const endMid = parseMid(trial_end_date);
                const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                const totalDays = Math.max(1, Math.round((endMid - startMid) / (1000 * 60 * 60 * 24))) || 7;
                const daysPassed = Math.max(0, Math.round((todayMid - startMid) / (1000 * 60 * 60 * 24)));
                trial_days_left = Math.max(0, Math.round((endMid - todayMid) / (1000 * 60 * 60 * 24)));
                trial_current_day = Math.min(totalDays, daysPassed + 1);
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
                    clinic_name,
                    plan_id,
                    subscription_status,
                    trial_start_date,
                    trial_end_date,
                    trial_days_left,
                    trial_current_day,
                    created_at: user.created_at
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
            selectedPlan = 'free-trial',
            recaptchaToken
        } = req.body;

        // Validate reCAPTCHA if configured
        if (process.env.RECAPTCHA_SECRET_KEY) {
            const isCaptchaValid = await verifyRecaptcha(recaptchaToken);
            if (!isCaptchaValid) {
                return res.status(400).json({ status: 'error', message: 'reCAPTCHA verification failed. Please try again.' });
            }
        }

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
        const startDateStr = trialStartDate.toISOString().slice(0, 10);
        const expiryDateStr = trialExpiryDate.toISOString().slice(0, 10);

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
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [subscriptionId, tenantId, userId, planId, 'Trial', startDateStr, expiryDateStr]
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

// @desc    Forgot Password - Send secure reset link via email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ status: 'error', message: 'Please provide your registered email address' });
        }

        const [users] = await db.query('SELECT id, name, email FROM users WHERE email = ?', [email.trim().toLowerCase()]);

        if (users.length === 0) {
            // For security, return standard success message to avoid email enumeration
            return res.json({ 
                status: 'success', 
                message: 'If an account exists with that email, a password reset link has been sent.' 
            });
        }

        const user = users[0];

        // Generate a cryptographically secure 32-byte token
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

        // Set token expiration to 15 minutes from now
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await db.query(
            'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
            [tokenHash, expiresAt, user.id]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
        const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

        // Send Email
        try {
            await emailService.sendPasswordResetEmail({
                email: user.email,
                name: user.name,
                resetUrl
            });
        } catch (mailErr) {
            console.error('Error sending reset email:', mailErr);
        }

        res.json({
            status: 'success',
            message: 'If an account exists with that email, a password reset link has been sent.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ status: 'error', message: 'Server error processing password reset request' });
    }
};

// @desc    Reset Password - Set new password with valid token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ status: 'error', message: 'Token and new password are required' });
        }

        if (confirmPassword && newPassword !== confirmPassword) {
            return res.status(400).json({ status: 'error', message: 'Passwords do not match' });
        }

        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passRegex.test(newPassword)) {
            return res.status(400).json({
                status: 'error',
                message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character'
            });
        }

        // Hash token to compare with DB
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Find user by token and valid expiration
        const [users] = await db.query(
            'SELECT id, email, name FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
            [tokenHash]
        );

        if (users.length === 0) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Password reset link is invalid or has expired (15-min limit). Please request a new link.' 
            });
        }

        const user = users[0];
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password, clear reset token & invalidate all active sessions
        await db.query(
            'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL, current_session_token = NULL WHERE id = ?',
            [newPasswordHash, user.id]
        );

        res.json({
            status: 'success',
            message: 'Password has been reset successfully. You can now log in with your new password.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ status: 'error', message: 'Server error resetting password' });
    }
};

module.exports = { loginUser, registerUser, forgotPassword, resetPassword };

