const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// @desc   Send password reset / set password link
// @route  POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ status: 'error', message: 'Email is required.' });

        const [users] = await db.query('SELECT id, name, email FROM users WHERE email = ?', [email.trim().toLowerCase()]);
        // Always respond success to prevent email enumeration
        if (users.length === 0) {
            return res.json({ status: 'success', message: 'If this email is registered, a reset link has been sent.' });
        }

        const user = users[0];
        const token = crypto.randomBytes(32).toString('hex');
        const tokenId = 'prt-' + Date.now();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Invalidate old tokens for this user
        await db.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);

        await db.query(
            'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [tokenId, user.id, token, expiresAt]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
        const resetLink = `${frontendUrl}/set-password?token=${token}`;

        await emailService.sendEmail({
            to: user.email,
            subject: 'Reset Your VetCare Pro Password',
            html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #0f172a; padding: 1.5rem; text-align: center;">
                    <span style="color: #ffffff; font-weight: 800; font-size: 1.25rem;">VetCare</span>
                    <span style="color: #6366f1; font-weight: 800; font-size: 1.25rem;"> Pro</span>
                </div>
                <div style="padding: 2rem; background-color: #ffffff;">
                    <h2 style="color: #0f172a; font-size: 1.25rem; margin-top: 0;">Reset Your Password</h2>
                    <p style="color: #475569;">Hello <strong>${user.name}</strong>,</p>
                    <p style="color: #475569;">We received a request to reset your VetCare Pro password. Click the button below to set a new password.</p>
                    <div style="text-align: center; margin: 2rem 0;">
                        <a href="${resetLink}" style="background-color: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 700; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #94a3b8; font-size: 0.85rem;">This link will expire in <strong>1 hour</strong>. If you did not request this, please ignore this email.</p>
                    <p style="color: #94a3b8; font-size: 0.8rem; word-break: break-all;">Or copy this link: ${resetLink}</p>
                </div>
                <div style="background-color: #f1f5f9; padding: 1rem; text-align: center; color: #64748b; font-size: 0.8rem;">
                    © ${new Date().getFullYear()} Kiaan Technology Pvt Ltd · VetCare Pro
                </div>
            </div>`,
            text: `Reset your VetCare Pro password: ${resetLink} (expires in 1 hour)`
        });

        res.json({ status: 'success', message: 'If this email is registered, a reset link has been sent.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ status: 'error', message: 'Server error.' });
    }
};

// @desc   Validate reset token
// @route  GET /api/auth/reset-password/validate?token=xxx
const validateResetToken = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ status: 'error', message: 'Token is required.' });

        const [rows] = await db.query(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > NOW()',
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid or expired token.' });
        }

        res.json({ status: 'success', message: 'Token is valid.' });
    } catch (err) {
        console.error('Token validation error:', err);
        res.status(500).json({ status: 'error', message: 'Server error.' });
    }
};

// @desc   Reset/Set password using token
// @route  POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ status: 'error', message: 'Token and new password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters.' });
        }

        const [rows] = await db.query(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > NOW()',
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Invalid or expired token.' });
        }

        const resetRecord = rows[0];
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, resetRecord.user_id]);
        await db.query('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [resetRecord.id]);

        res.json({ status: 'success', message: 'Password has been updated successfully. Please login.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ status: 'error', message: 'Server error.' });
    }
};

// @desc   Super Admin sends reset link to admin
// @route  POST /api/super-admin/admins/:id/send-reset-link
const sendResetLinkByAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ status: 'error', message: 'User not found.' });

        const user = users[0];
        const token = crypto.randomBytes(32).toString('hex');
        const tokenId = 'prt-' + Date.now();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await db.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);
        await db.query(
            'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [tokenId, user.id, token, expiresAt]
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
        const resetLink = `${frontendUrl}/set-password?token=${token}`;

        await emailService.sendEmail({
            to: user.email,
            subject: 'Set Your VetCare Pro Password',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #0f172a; padding: 1.5rem; text-align: center;">
                    <span style="color: #ffffff; font-weight: 800; font-size: 1.25rem;">VetCare</span>
                    <span style="color: #6366f1; font-weight: 800; font-size: 1.25rem;"> Pro</span>
                </div>
                <div style="padding: 2rem; background-color: #ffffff;">
                    <h2 style="color: #0f172a;">Set Your Password</h2>
                    <p>Hello <strong>${user.name}</strong>,</p>
                    <p>Your Super Admin has sent you a link to set your VetCare Pro account password.</p>
                    <div style="text-align: center; margin: 2rem 0;">
                        <a href="${resetLink}" style="background-color: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 700; display: inline-block;">
                            Set My Password
                        </a>
                    </div>
                    <p style="color: #94a3b8; font-size: 0.85rem;">This link will expire in <strong>1 hour</strong>.</p>
                </div>
                <div style="background-color: #f1f5f9; padding: 1rem; text-align: center; color: #64748b; font-size: 0.8rem;">
                    © ${new Date().getFullYear()} Kiaan Technology Pvt Ltd · VetCare Pro
                </div>
            </div>`,
            text: `Set your VetCare Pro password: ${resetLink}`
        });

        res.json({ status: 'success', message: `Password reset link sent to ${user.email}` });
    } catch (err) {
        console.error('Send reset link error:', err);
        res.status(500).json({ status: 'error', message: 'Server error.' });
    }
};

module.exports = { forgotPassword, validateResetToken, resetPassword, sendResetLinkByAdmin };
