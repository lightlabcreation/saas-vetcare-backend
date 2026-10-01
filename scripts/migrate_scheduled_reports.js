/**
 * Migration: Create scheduled_reports table for 7-day automatic email reports
 * Run: node scripts/migrate_scheduled_reports.js
 */
const db = require('../config/db');

async function migrate() {
    console.log('Creating scheduled_reports table...');
    await db.query(`
        CREATE TABLE IF NOT EXISTS scheduled_reports (
            id VARCHAR(64) PRIMARY KEY,
            clinic_id INT NOT NULL,
            report_type ENUM('WEEKLY_7DAY', 'MANUAL_EMAIL') NOT NULL DEFAULT 'WEEKLY_7DAY',
            recipient_email VARCHAR(255) NOT NULL,
            period_start DATE NOT NULL,
            period_end DATE NOT NULL,
            status ENUM('PENDING', 'SENT', 'FAILED', 'RETRYING') NOT NULL DEFAULT 'PENDING',
            attempt_count INT NOT NULL DEFAULT 0,
            max_retries INT NOT NULL DEFAULT 3,
            last_error TEXT NULL,
            email_message_id VARCHAR(255) NULL,
            report_summary JSON NULL,
            file_size_kb INT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sent_at TIMESTAMP NULL,
            next_retry_at TIMESTAMP NULL,
            INDEX idx_clinic_period (clinic_id, period_start, period_end),
            INDEX idx_status (status),
            INDEX idx_report_type (report_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create report_email_subscriptions table for per-clinic email configuration
    await db.query(`
        CREATE TABLE IF NOT EXISTS report_email_subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            clinic_id INT NOT NULL,
            email VARCHAR(255) NOT NULL,
            frequency ENUM('WEEKLY', 'DISABLED') NOT NULL DEFAULT 'WEEKLY',
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_clinic_email (clinic_id, email),
            INDEX idx_active (is_active, frequency)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('✅ scheduled_reports and report_email_subscriptions tables created successfully.');
    process.exit(0);
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
