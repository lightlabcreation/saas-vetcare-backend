const db = require('../config/db');
const emailService = require('./emailService');
const { SUPERADMIN_EMAIL } = require('../config/emailConfig');

/**
 * Parse plan features stored as JSON array in DB.
 */
const parseFeatures = (featuresStr) => {
    try {
        if (!featuresStr) return [];
        const parsed = JSON.parse(featuresStr);
        if (Array.isArray(parsed)) return parsed;
        return featuresStr.split(',').map(f => f.trim());
    } catch (e) {
        return featuresStr.split(',').map(f => f.trim());
    }
};

/**
 * Centralized entitlement logic — single source of truth.
 * Returns plan, status, features, daysRemaining from the real DB.
 * @param {string} clinicId
 */
const getAdminEntitlements = async (clinicId) => {
    const [clinics] = await db.query(
        'SELECT status FROM clinics WHERE id = ? LIMIT 1',
        [clinicId]
    );
    if (clinics.length === 0) throw new Error('Clinic not found');
    const clinicStatus = clinics[0].status;

    // Prioritize Active or Trial sub over Expired
    const [subs] = await db.query(`
        SELECT 
            s.id, s.status AS subStatus, 
            s.start_date AS startDate, s.end_date AS endDate,
            p.id AS planId, p.name AS planName, p.features
        FROM saas_subscriptions s
        JOIN saas_plans p ON s.plan_id = p.id
        WHERE s.clinic_id = ?
        ORDER BY
            CASE WHEN s.status IN ('Active','Trial') THEN 1 ELSE 2 END,
            s.end_date DESC
        LIMIT 1
    `, [clinicId]);

    if (subs.length === 0) {
        return {
            currentPlan: null, planId: null,
            subscriptionStatus: 'NO_SUBSCRIPTION',
            isTrial: false, isExpired: true,
            daysRemaining: 0, isExpiringSoon: false,
            isExpiring10Days: false,
            subscriptionStartsAt: null, subscriptionEndsAt: null,
            features: []
        };
    }

    const sub = subs[0];
    const now = new Date();
    const endDate = new Date(sub.endDate);
    const diffMs = endDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const isTrial = sub.subStatus === 'Trial';
    // Consider expired if days <= 0 OR clinic status is EXPIRED OR sub is marked Expired
    const isExpired = daysRemaining <= 0 || clinicStatus === 'EXPIRED' || sub.subStatus === 'Expired';
    const isExpiringSoon = !isExpired && daysRemaining <= 5 && daysRemaining > 0;
    const isExpiring10Days = !isExpired && daysRemaining <= 10 && daysRemaining > 0;

    let subscriptionStatus = 'NO_SUBSCRIPTION';
    if (isExpired) subscriptionStatus = 'EXPIRED';
    else if (sub.subStatus === 'Active') subscriptionStatus = 'ACTIVE';
    else if (isTrial) subscriptionStatus = 'TRIAL';

    return {
        currentPlan: sub.planName,
        planId: sub.planId,
        subscriptionStatus,
        isTrial,
        subscriptionStartsAt: new Date(sub.startDate),
        subscriptionEndsAt: endDate,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        isExpiringSoon,
        isExpiring10Days,
        isExpired,
        features: parseFeatures(sub.features)
    };
};

/**
 * Daily cron: Process expiries and send reminder/expiry emails idempotently.
 * - 10-day reminder: uses window BETWEEN 9 and 11 to survive missed days, guarded by reminder_10d_sent flag
 * - Expiry: marks status and sends email, guarded by expiry_email_sent flag
 */
const checkAndNotifyExpiries = async () => {
    console.log('[Cron] Running daily subscription expiry check...');
    const loginUrl = `${(process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5174').trim().replace(/\/+$/, '')}/login`;
    const saEmail = SUPERADMIN_EMAIL;

    try {
        // ── 1. 10-Day Reminders ──
        // Use BETWEEN 9 AND 11 days window to survive 1 missed cron run. 
        // reminder_10d_sent flag prevents duplicates.
        const [expiring10] = await db.query(`
            SELECT s.id AS subId, s.clinic_id, s.plan_id, s.end_date,
                   c.clinic_name, u.name AS adminName, u.email AS adminEmail,
                   p.name AS planName
            FROM saas_subscriptions s
            JOIN clinics c ON s.clinic_id = c.id
            JOIN users u ON s.clinic_admin_id = u.id
            JOIN saas_plans p ON s.plan_id = p.id
            WHERE s.status IN ('Active', 'Trial')
              AND s.reminder_10d_sent = 0
              AND DATEDIFF(s.end_date, NOW()) BETWEEN 9 AND 11
        `);

        for (const sub of expiring10) {
            // ATOMIC CLAIM: Only the process that successfully flips reminder_10d_sent from 0 to 1 sends the email
            const [claimResult] = await db.query(
                'UPDATE saas_subscriptions SET reminder_10d_sent = 1, updated_at = NOW() WHERE id = ? AND reminder_10d_sent = 0',
                [sub.subId]
            );

            if (!claimResult || claimResult.affectedRows === 0) {
                // Another concurrent instance already claimed and processed this subscription
                continue;
            }

            const expiryStr = new Date(sub.end_date).toLocaleDateString('en-IN', {
                day: '2-digit', month: 'long', year: 'numeric'
            });
            const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / 86400000);

            const emailHtml = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
              <div style="background:#f59e0b;padding:1.5rem;text-align:center;color:white">
                <h2 style="margin:0">⏰ Subscription Expiring in ${daysLeft} Days</h2>
              </div>
              <div style="padding:2rem">
                <p>Hello ${sub.adminName},</p>
                <p>Your PetCare Pro <strong>${sub.planName}</strong> subscription is expiring soon.</p>
                <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:0.9rem">
                  <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b">Clinic</td><td style="padding:8px;font-weight:600">${sub.clinic_name}</td></tr>
                  <tr><td style="padding:8px;color:#64748b">Plan</td><td style="padding:8px;font-weight:600;color:#0d9488">${sub.planName}</td></tr>
                  <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b">Expiry Date</td><td style="padding:8px;font-weight:700;color:#ef4444">${expiryStr}</td></tr>
                  <tr><td style="padding:8px;color:#64748b">Days Remaining</td><td style="padding:8px;font-weight:700;color:#f59e0b">${daysLeft} days</td></tr>
                </table>
                <p>Renew now to avoid service interruption. All your data will be preserved.</p>
                <div style="text-align:center;margin:2rem 0">
                  <a href="${loginUrl}" style="background:#0f172a;color:white;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:1rem">Renew My Plan →</a>
                </div>
                <p style="color:#64748b;font-size:0.85rem">Need help? Contact us at support or call +91 97521 00980</p>
              </div>
            </div>`;

            try {
                await emailService.sendEmail({
                    to: sub.adminEmail,
                    subject: `⏰ Action Required: Your PetCare Pro Plan expires in ${daysLeft} days`,
                    text: `Your ${sub.planName} plan for ${sub.clinic_name} expires on ${expiryStr}. Renew at ${loginUrl}`,
                    html: emailHtml
                });
                console.log(`[Cron] Sent 10-day reminder to ${sub.adminEmail}`);
            } catch (mailErr) {
                console.error(`[Cron] Error sending 10-day reminder email to ${sub.adminEmail}:`, mailErr.message);
            }
        }

        // ── 2. Process Expired Subscriptions ──
        // Only process subscriptions whose end_date has passed but are still Active/Trial
        // expiry_email_sent flag + atomic update prevents duplicate expiry emails and duplicate state updates
        const [expiredSubs] = await db.query(`
            SELECT s.id AS subId, s.clinic_id, s.end_date,
                   c.clinic_name, u.name AS adminName, u.email AS adminEmail,
                   p.name AS planName, s.expiry_email_sent
            FROM saas_subscriptions s
            JOIN clinics c ON s.clinic_id = c.id
            JOIN users u ON s.clinic_admin_id = u.id
            JOIN saas_plans p ON s.plan_id = p.id
            WHERE s.status IN ('Active', 'Trial')
              AND s.end_date < NOW()
        `);

        for (const sub of expiredSubs) {
            // ATOMIC CLAIM: Flip status to 'Expired' and claim email sending in one atomic statement
            const [expireResult] = await db.query(
                "UPDATE saas_subscriptions SET status = 'Expired', expiry_email_sent = 1, updated_at = NOW() WHERE id = ? AND status IN ('Active', 'Trial')",
                [sub.subId]
            );

            if (!expireResult || expireResult.affectedRows === 0) {
                // Another instance already processed this expiry
                continue;
            }

            await db.query(
                "UPDATE clinics SET status = 'EXPIRED', updated_at = NOW() WHERE id = ?",
                [sub.clinic_id]
            );
            console.log(`[Cron] Marked EXPIRED: clinic ${sub.clinic_id}`);

            // Send expiry email once
            if (!sub.expiry_email_sent) {
                const expiryStr = new Date(sub.end_date).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'long', year: 'numeric'
                });
                const emailHtml = `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
                  <div style="background:#ef4444;padding:1.5rem;text-align:center;color:white">
                    <h2 style="margin:0">🔒 Subscription Expired</h2>
                  </div>
                  <div style="padding:2rem">
                    <p>Hello ${sub.adminName},</p>
                    <p>Your PetCare Pro <strong>${sub.planName}</strong> subscription for <strong>${sub.clinic_name}</strong> has expired.</p>
                    <table style="width:100%;border-collapse:collapse;margin:1rem 0;font-size:0.9rem">
                      <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b">Plan</td><td style="padding:8px;font-weight:600">${sub.planName}</td></tr>
                      <tr><td style="padding:8px;color:#64748b">Expired On</td><td style="padding:8px;font-weight:700;color:#ef4444">${expiryStr}</td></tr>
                      <tr style="background:#f8fafc"><td style="padding:8px;color:#64748b">Status</td><td style="padding:8px;font-weight:700;color:#ef4444">EXPIRED</td></tr>
                    </table>
                    <p>All your data is securely preserved. Renew or upgrade your plan to immediately restore full access.</p>
                    <div style="text-align:center;margin:2rem 0;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap">
                      <a href="${loginUrl}" style="background:#ef4444;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">Renew Now</a>
                      <a href="${loginUrl}" style="background:#0f172a;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">Upgrade Plan</a>
                    </div>
                    <p style="color:#64748b;font-size:0.85rem">Need help? Contact us at support or call +91 97521 00980</p>
                  </div>
                </div>`;

                try {
                    await emailService.sendEmail({
                        to: sub.adminEmail,
                        subject: `🔒 Your PetCare Pro Subscription Has Expired — Renew Now`,
                        text: `Your ${sub.planName} plan for ${sub.clinic_name} expired on ${expiryStr}. Renew at ${loginUrl}`,
                        html: emailHtml
                    });
                    console.log(`[Cron] Sent expiry email to ${sub.adminEmail}`);

                    // SuperAdmin expiry monitoring notification
                    await emailService.sendEmail({
                        to: saEmail,
                        subject: `🔒 Subscription Expired — ${sub.clinic_name} — ${sub.planName}`,
                        text: `Subscription expired.\nClinic: ${sub.clinic_name}\nAdmin: ${sub.adminName} (${sub.adminEmail})\nPlan: ${sub.planName}\nExpired: ${expiryStr}`
                    });
                    console.log(`[Cron] Sent expiry monitoring alert to ${saEmail} for clinic ${sub.clinic_id}`);
                } catch (mailErr) {
                    console.error(`[Cron] Error sending expiry email to ${sub.adminEmail}:`, mailErr.message);
                }
            }
        }

    } catch (err) {
        console.error('[Cron] Error in daily expiry check:', err);
    }
};

module.exports = {
    getAdminEntitlements,
    checkAndNotifyExpiries,
    parseFeatures
};
