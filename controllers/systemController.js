const backupService = require('../services/backupService');
const storageService = require('../services/storageService');
const { sendManualEmailReport, ensureTables } = require('../cron/weeklyReportCron');
const db = require('../config/db');

// 1. Download Instant Full Database Dump (.sql)
exports.downloadDatabaseBackup = async (req, res) => {
    try {
        const { filename, sizeKb, tablesCount, totalRows, sqlDump } = await backupService.generateSqlDump();
        
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('X-Backup-Size-KB', sizeKb);
        res.setHeader('X-Backup-Tables', tablesCount);
        res.setHeader('X-Backup-Rows', totalRows);

        return res.status(200).send(sqlDump);
    } catch (error) {
        console.error('[SystemController] Error generating database backup:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to generate database dump', error: error.message });
    }
};

// 2. Get Database Backup History
exports.getBackupHistory = async (req, res) => {
    try {
        const history = await backupService.getBackupHistory();
        return res.json({ status: 'success', data: history });
    } catch (error) {
        console.error('[SystemController] Error fetching backup history:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch backup history' });
    }
};

// 3. Get Storage Settings
exports.getStorageSettings = async (req, res) => {
    try {
        const settings = await storageService.getSettings();
        return res.json({ status: 'success', data: settings });
    } catch (error) {
        console.error('[SystemController] Error fetching storage settings:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch storage settings' });
    }
};

// 4. Update Storage Settings
exports.updateStorageSettings = async (req, res) => {
    try {
        const updated = await storageService.updateSettings(req.body);
        return res.json({ status: 'success', message: 'Storage settings updated successfully', data: updated });
    } catch (error) {
        console.error('[SystemController] Error updating storage settings:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to update storage settings' });
    }
};

// 5. Send 7-Day Report to Email (Manual Trigger)
exports.sendReportEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ status: 'error', message: 'Valid email address is required.' });
        }

        const clinic_id = req.user.clinic_id;
        if (!clinic_id) {
            return res.status(400).json({ status: 'error', message: 'Clinic ID not found for this user.' });
        }

        const result = await sendManualEmailReport(clinic_id, email);
        return res.json({
            status: 'success',
            message: `7-day report sent successfully to ${email}`,
            data: {
                reportId: result.reportId,
                messageId: result.messageId,
                summary: result.reportData
            }
        });
    } catch (error) {
        console.error('[SystemController] Error sending report email:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to send report email: ' + error.message });
    }
};

// 6. Get Scheduled Report History / Status
exports.getReportHistory = async (req, res) => {
    try {
        await ensureTables();
        const clinic_id = req.user.clinic_id;
        const [rows] = await db.query(`
            SELECT id, report_type, recipient_email, period_start, period_end, 
                   status, attempt_count, max_retries, last_error, 
                   email_message_id, file_size_kb, created_at, sent_at, next_retry_at
            FROM scheduled_reports 
            WHERE clinic_id = ?
            ORDER BY created_at DESC 
            LIMIT 50
        `, [clinic_id]);
        return res.json({ status: 'success', data: rows });
    } catch (error) {
        console.error('[SystemController] Error fetching report history:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch report history' });
    }
};

// 7. Subscribe email for weekly auto-reports
exports.subscribeReportEmail = async (req, res) => {
    try {
        await ensureTables();
        const { email } = req.body;
        const clinic_id = req.user.clinic_id;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ status: 'error', message: 'Valid email address is required.' });
        }

        await db.query(`
            INSERT INTO report_email_subscriptions (clinic_id, email, frequency, is_active)
            VALUES (?, ?, 'WEEKLY', 1)
            ON DUPLICATE KEY UPDATE is_active = 1, frequency = 'WEEKLY', updated_at = NOW()
        `, [clinic_id, email]);

        return res.json({ status: 'success', message: `${email} subscribed to weekly reports.` });
    } catch (error) {
        console.error('[SystemController] Error subscribing email:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to subscribe email' });
    }
};

// 8. Unsubscribe email from weekly auto-reports
exports.unsubscribeReportEmail = async (req, res) => {
    try {
        await ensureTables();
        const { email } = req.body;
        const clinic_id = req.user.clinic_id;

        await db.query(`
            UPDATE report_email_subscriptions 
            SET is_active = 0, frequency = 'DISABLED', updated_at = NOW()
            WHERE clinic_id = ? AND email = ?
        `, [clinic_id, email]);

        return res.json({ status: 'success', message: `${email} unsubscribed from weekly reports.` });
    } catch (error) {
        console.error('[SystemController] Error unsubscribing email:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to unsubscribe email' });
    }
};

// 9. Get all report email subscriptions for this clinic
exports.getReportSubscriptions = async (req, res) => {
    try {
        await ensureTables();
        const clinic_id = req.user.clinic_id;
        const [rows] = await db.query(`
            SELECT id, email, frequency, is_active, created_at, updated_at
            FROM report_email_subscriptions 
            WHERE clinic_id = ?
            ORDER BY created_at DESC
        `, [clinic_id]);
        return res.json({ status: 'success', data: rows });
    } catch (error) {
        console.error('[SystemController] Error fetching subscriptions:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to fetch subscriptions' });
    }
};
