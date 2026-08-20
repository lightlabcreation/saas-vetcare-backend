const db = require('../config/db');
const emailService = require('../services/emailService');
const { SUPERADMIN_EMAIL } = require('../config/emailConfig');

async function checkExpiries() {
    console.log('Running daily subscription cron job...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(today.getDate() + 2);

    try {
        // 1. Find trials/subscriptions expiring in EXACTLY 2 days (warning email)
        const [expiringSoon] = await db.query(`
            SELECT c.id as clinic_id, c.clinic_name, s.end_date, s.status, u.email, u.name as admin_name
            FROM clinics c
            JOIN saas_subscriptions s ON c.id = s.clinic_id
            JOIN users u ON c.id = u.clinic_id
            WHERE u.role = 'Admin' 
              AND DATE(s.end_date) = DATE(?)
              AND (s.status = 'Trial' OR s.status = 'Active')
        `, [twoDaysFromNow]);

        for (const record of expiringSoon) {
            const isTrial = record.status === 'Trial';
            const subject = isTrial ? 'Your Free Trial is Expiring Soon' : 'Your Subscription is Expiring Soon';
            const html = `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>${subject}</h2>
                    <p>Hello ${record.admin_name},</p>
                    <p>This is a friendly reminder that your VetCare Pro ${isTrial ? 'Free Trial' : 'Subscription'} for <strong>${record.clinic_name}</strong> will expire in 2 days on ${new Date(record.end_date).toLocaleDateString()}.</p>
                    <p>To avoid any interruption in service, please log in to your account and upgrade/renew your plan.</p>
                    <a href="${(process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5174').trim().replace(/\/+$/, '')}/login" style="display:inline-block; padding: 10px 20px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;">Login to Renew</a>
                    <p style="margin-top: 30px;">Thank you,<br/>Kiaan Technology Pvt Ltd</p>
                </div>
            `;
            await emailService.sendEmail({
                to: record.email,
                subject,
                html,
                text: `Your ${isTrial ? 'Trial' : 'Subscription'} expires in 2 days on ${new Date(record.end_date).toLocaleDateString()}. Please login to renew.`,
                fromEmail: 'info@kiaantechnology.com',
                fromName: 'Kiaan Technology Pvt Ltd'
            });
            console.log(`Sent expiry warning to ${record.email} for clinic ${record.clinic_id}`);
            
            // Notify SuperAdmin
            try {
                await emailService.sendEmail({
                    to: SUPERADMIN_EMAIL,
                    subject: `Alert: ${record.clinic_name} ${isTrial ? 'Trial' : 'Subscription'} Expiring Soon`,
                    text: `Clinic: ${record.clinic_name}\nAdmin: ${record.admin_name} (${record.email})\nStatus: Expiring in 2 days (on ${new Date(record.end_date).toLocaleDateString()})`
                });
            } catch (err) {
                console.error('Failed to notify superadmin for expiry warning:', err);
            }
        }

        // 2. Find trials/subscriptions PAST end_date - mark Expired and send expiry email
        const [expiredAccounts] = await db.query(`
            SELECT c.id as clinic_id, c.clinic_name, s.id as sub_id, s.end_date, s.status, u.email, u.name as admin_name
            FROM clinics c
            JOIN saas_subscriptions s ON c.id = s.clinic_id
            JOIN users u ON c.id = u.clinic_id
            WHERE u.role = 'Admin' 
              AND DATE(s.end_date) < DATE(?)
              AND (s.status = 'Trial' OR s.status = 'Active')
        `, [today]);

        for (const record of expiredAccounts) {
            const isTrial = record.status === 'Trial';
            const expiryDate = new Date(record.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
            const loginUrl = `${(process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5174').trim().replace(/\/+$/, '')}/login`;

            // Update subscription status to Expired in DB
            await db.query(
                `UPDATE saas_subscriptions SET status = 'Expired' WHERE id = ?`,
                [record.sub_id]
            );
            console.log(`Marked subscription as Expired for clinic ${record.clinic_id}`);

            // Send professional Expired email to Admin
            const html = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #0f172a; padding: 1.5rem; text-align: center;">
                    <span style="color: #ffffff; font-weight: 800; font-size: 1.3rem; letter-spacing: 1px;">VetCare</span>
                    <span style="color: #ef4444; font-weight: 800; font-size: 1.3rem; letter-spacing: 1px;"> Pro</span>
                </div>
                <div style="padding: 2rem; background-color: #ffffff; text-align: center;">
                    <div style="width: 70px; height: 70px; background: #fee2e2; border-radius: 50%; margin: 0 auto 1rem; line-height: 70px;">
                        <span style="font-size: 2rem;">🔒</span>
                    </div>
                    <h2 style="color: #0f172a; font-size: 1.4rem; margin-bottom: 0.5rem;">Your Free Trial Has Expired</h2>
                    <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 1.5rem;">
                        Hello <strong>${record.admin_name}</strong>, your 7-day free trial for <strong>${record.clinic_name}</strong> expired on <strong>${expiryDate}</strong>.
                    </p>
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; text-align: left;">
                        <p style="color: #b91c1c; font-weight: 600; margin: 0 0 0.5rem;">⚠️ Access Blocked</p>
                        <p style="color: #64748b; font-size: 0.9rem; margin: 0;">Dashboard, Patients, Staff, Reports, Payments and all other modules will remain restricted until an active subscription plan is purchased.</p>
                    </div>
                    <a href="${loginUrl}" style="display: inline-block; width: 80%; padding: 14px 0; background-color: #ef4444; color: white; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 1rem; text-align: center; margin-bottom: 10px;">
                        🛒 Buy Plan Now
                    </a>
                    <br/>
                    <a href="${loginUrl}" style="display: inline-block; width: 80%; padding: 12px 0; background-color: #f1f5f9; color: #0f172a; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.95rem; text-align: center;">
                        📋 View Plans
                    </a>
                </div>
                <div style="background-color: #f1f5f9; padding: 1rem; text-align: center; color: #64748b; font-size: 0.8rem;">
                    © ${new Date().getFullYear()} Kiaan Technology Pvt Ltd · VetCare Pro
                </div>
            </div>`;

            await emailService.sendEmail({
                to: record.email,
                subject: `Your Free Trial Has Expired – Upgrade to Continue`,
                html,
                text: `Your VetCare Pro free trial for ${record.clinic_name} has expired on ${expiryDate}. Please upgrade your plan to restore access. Login: ${loginUrl}`,
                fromEmail: 'info@kiaantechnology.com',
                fromName: 'Kiaan Technology Pvt Ltd'
            });
            console.log(`Sent expired notice to ${record.email} for clinic ${record.clinic_id}`);

            // Notify SuperAdmin
            try {
                await emailService.sendEmail({
                    to: SUPERADMIN_EMAIL,
                    subject: `Alert: ${record.clinic_name} ${isTrial ? 'Trial' : 'Subscription'} EXPIRED`,
                    text: `Clinic: ${record.clinic_name}\nAdmin: ${record.admin_name} (${record.email})\nStatus: EXPIRED on ${expiryDate}`
                });
            } catch (err) {
                console.error('Failed to notify superadmin for expired notice:', err);
            }
        }
        
    } catch (err) {
        console.error('Error in subscription cron job:', err);
    }
}

// Start the cron interval (runs every 24 hours)
function startCron() {
    // Run immediately on start, then every 24h
    checkExpiries();
    setInterval(checkExpiries, 24 * 60 * 60 * 1000);
}

module.exports = { startCron, checkExpiries };
