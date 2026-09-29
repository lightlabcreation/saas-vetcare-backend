const pool = require('../config/db');

async function migrateStep5() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('🚀 Running Step 5 Database Migrations: WhatsApp, SMS & Notification System...');

        // 1. Create notification_logs table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS notification_logs (
                id VARCHAR(36) PRIMARY KEY,
                clinic_id VARCHAR(36) NULL,
                channel VARCHAR(20) NOT NULL, -- 'whatsapp', 'sms', 'email'
                recipient_name VARCHAR(255) NULL,
                recipient_contact VARCHAR(255) NOT NULL, -- Phone or Email
                template_type VARCHAR(100) NOT NULL,
                message_content TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'Sent', -- 'Sent', 'Failed', 'Delivered', 'Simulated'
                gateway_response TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_clinic (clinic_id),
                INDEX idx_channel (channel),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Table notification_logs verified/created');

        // 2. Create notification_templates table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS notification_templates (
                id VARCHAR(36) PRIMARY KEY,
                clinic_id VARCHAR(36) NULL,
                template_type VARCHAR(100) NOT NULL,
                channel VARCHAR(20) NOT NULL, -- 'whatsapp', 'sms', 'email'
                title VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NULL,
                body_template TEXT NOT NULL,
                is_active TINYINT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_template_lookup (clinic_id, template_type, channel)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Table notification_templates verified/created');

        // 3. Seed Default Notification Templates
        const defaultTemplates = [
            {
                id: 'tmpl-apt-confirm-wa',
                clinic_id: null,
                template_type: 'appointment_confirmation',
                channel: 'whatsapp',
                title: 'WhatsApp Appointment Confirmation',
                subject: null,
                body_template: '🐾 *Appointment Confirmed!*\n\nDear {{owner_name}},\nYour appointment for *{{pet_name}}* at *{{clinic_name}}* is scheduled for *{{appointment_date}}* at *{{appointment_time}}* with *Dr. {{doctor_name}}*.\n\n📍 Clinic Address: {{clinic_address}}\n📞 Helpline: {{clinic_phone}}\n\nReply CANCEL if you wish to reschedule.'
            },
            {
                id: 'tmpl-apt-confirm-sms',
                clinic_id: null,
                template_type: 'appointment_confirmation',
                channel: 'sms',
                title: 'SMS Appointment Confirmation',
                subject: null,
                body_template: 'PetCare: Appointment confirmed for {{pet_name}} on {{appointment_date}} at {{appointment_time}} at {{clinic_name}}. Ph: {{clinic_phone}}'
            },
            {
                id: 'tmpl-apt-remind-wa',
                clinic_id: null,
                template_type: 'appointment_reminder',
                channel: 'whatsapp',
                title: 'WhatsApp 24h Appointment Reminder',
                subject: null,
                body_template: '⏰ *Reminder: Upcoming Vet Visit Tomorrow*\n\nHello {{owner_name}},\nThis is a gentle reminder that *{{pet_name}}* has an appointment tomorrow (*{{appointment_date}}*) at *{{appointment_time}}* at {{clinic_name}}.\n\nLooking forward to seeing you and {{pet_name}}!'
            },
            {
                id: 'tmpl-apt-remind-sms',
                clinic_id: null,
                template_type: 'appointment_reminder',
                channel: 'sms',
                title: 'SMS 24h Appointment Reminder',
                subject: null,
                body_template: 'Reminder: {{pet_name}} has an appointment tomorrow {{appointment_date}} at {{appointment_time}} with Dr. {{doctor_name}} at {{clinic_name}}.'
            },
            {
                id: 'tmpl-vax-due-wa',
                clinic_id: null,
                template_type: 'vaccination_due',
                channel: 'whatsapp',
                title: 'WhatsApp Vaccination Due Alert',
                subject: null,
                body_template: '💉 *Vaccination Due for {{pet_name}}*\n\nDear {{owner_name}},\nOur records show that *{{pet_name}}* is due for their *{{vaccine_name}}* vaccination on *{{due_date}}*.\n\nTimely immunization protects {{pet_name}} against serious health conditions.\n\n📞 Call us at {{clinic_phone}} or reply here to book your vaccination slot.'
            },
            {
                id: 'tmpl-vax-due-sms',
                clinic_id: null,
                template_type: 'vaccination_due',
                channel: 'sms',
                title: 'SMS Vaccination Due Alert',
                subject: null,
                body_template: 'Alert: {{pet_name}} is due for {{vaccine_name}} on {{due_date}}. Contact {{clinic_name}} at {{clinic_phone}} to book a vaccination slot.'
            },
            {
                id: 'tmpl-rx-ready-wa',
                clinic_id: null,
                template_type: 'prescription_ready',
                channel: 'whatsapp',
                title: 'WhatsApp Prescription Ready Notification',
                subject: null,
                body_template: '📋 *Prescription & Medication Ready*\n\nHello {{owner_name}},\nThe prescription and medicines for *{{pet_name}}* from your recent visit with *Dr. {{doctor_name}}* are ready for pickup at *{{clinic_name}}*.\n\nThank you for trusting us with {{pet_name}}\'s care!'
            }
        ];

        for (const t of defaultTemplates) {
            await conn.query(`
                INSERT INTO notification_templates (id, clinic_id, template_type, channel, title, subject, body_template, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
                ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    body_template = VALUES(body_template),
                    is_active = 1
            `, [t.id, t.clinic_id, t.template_type, t.channel, t.title, t.subject, t.body_template]);
        }
        console.log('✅ Default Notification Templates seeded successfully');

        // 4. Populate default messaging settings in system_settings
        const defaultMessagingSettings = [
            { key: 'whatsapp_gateway_provider', value: 'simulator' }, // 'meta_cloud' | 'twilio' | 'fast2sms' | 'simulator'
            { key: 'sms_gateway_provider', value: 'simulator' }, // 'twilio' | 'fast2sms' | 'simulator'
            { key: 'whatsapp_api_token', value: '' },
            { key: 'whatsapp_phone_number_id', value: '' },
            { key: 'twilio_account_sid', value: '' },
            { key: 'twilio_auth_token', value: '' },
            { key: 'twilio_phone_number', value: '' },
            { key: 'fast2sms_api_key', value: '' },
            { key: 'auto_appointment_reminders_enabled', value: 'true' },
            { key: 'auto_vaccination_alerts_enabled', value: 'true' }
        ];

        for (const s of defaultMessagingSettings) {
            await conn.query(`
                INSERT INTO system_settings (setting_key, setting_value)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE setting_value = IF(setting_value IS NULL OR setting_value = '', VALUES(setting_value), setting_value)
            `, [s.key, s.value]);
        }
        console.log('✅ Default Messaging Gateway Settings populated in system_settings');

        console.log('🎉 Step 5 database migration completed successfully!');
    } catch (err) {
        console.error('❌ Step 5 Migration Error:', err);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

migrateStep5();
