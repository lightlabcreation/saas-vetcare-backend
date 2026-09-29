const pool = require('../config/db');
const messagingService = require('../services/messagingService');

// @desc    Get all notification templates
// @route   GET /api/v1/messaging/templates
// @access  Private
exports.getTemplates = async (req, res) => {
    try {
        const clinicId = req.user?.clinic_id || req.user?.clinicId;
        const [rows] = await pool.query(
            `SELECT * FROM notification_templates 
             WHERE clinic_id = ? OR clinic_id IS NULL 
             ORDER BY channel ASC, template_type ASC`,
            [clinicId]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (err) {
        console.error('Error fetching templates:', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch templates' });
    }
};

// @desc    Update a notification template
// @route   PUT /api/v1/messaging/templates/:id
// @access  Private
exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, body_template, is_active } = req.body;

        await pool.query(
            `UPDATE notification_templates 
             SET title = ?, body_template = ?, is_active = ? 
             WHERE id = ?`,
            [title, body_template, is_active ? 1 : 0, id]
        );

        res.status(200).json({ status: 'success', message: 'Template updated successfully' });
    } catch (err) {
        console.error('Error updating template:', err);
        res.status(500).json({ status: 'error', message: 'Failed to update template' });
    }
};

// @desc    Get Outgoing Notification Logs
// @route   GET /api/v1/messaging/logs
// @access  Private
exports.getLogs = async (req, res) => {
    try {
        const clinicId = req.user?.clinic_id || req.user?.clinicId;
        const [rows] = await pool.query(
            `SELECT * FROM notification_logs 
             WHERE clinic_id = ? OR clinic_id IS NULL 
             ORDER BY created_at DESC 
             LIMIT 100`,
            [clinicId]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (err) {
        console.error('Error fetching logs:', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch messaging logs' });
    }
};

// @desc    Send Direct WhatsApp or SMS Message
// @route   POST /api/v1/messaging/send-direct
// @access  Private
exports.sendDirect = async (req, res) => {
    try {
        const { channel, phone, message, recipientName, templateType } = req.body;
        const clinicId = req.user?.clinic_id || req.user?.clinicId;

        if (!phone || !message) {
            return res.status(400).json({ status: 'error', message: 'Phone and message are required' });
        }

        let result;
        if (channel === 'sms') {
            result = await messagingService.sendSMS({
                to: phone,
                message,
                templateType: templateType || 'manual_sms',
                clinicId,
                recipientName: recipientName || 'Pet Owner'
            });
        } else {
            result = await messagingService.sendWhatsApp({
                to: phone,
                message,
                templateType: templateType || 'manual_whatsapp',
                clinicId,
                recipientName: recipientName || 'Pet Owner'
            });
        }

        res.status(200).json({
            status: 'success',
            message: `${channel === 'sms' ? 'SMS' : 'WhatsApp'} message dispatched successfully`,
            data: result
        });
    } catch (err) {
        console.error('Error sending direct message:', err);
        res.status(500).json({ status: 'error', message: err.message || 'Failed to send message' });
    }
};

// @desc    Get Messaging Settings & Gateways
// @route   GET /api/v1/messaging/settings
// @access  Private
exports.getSettings = async (req, res) => {
    try {
        const config = await messagingService.getMessagingConfig();
        res.status(200).json({ status: 'success', data: config });
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch gateway settings' });
    }
};

// @desc    Update Messaging Settings & Gateway Keys
// @route   PUT /api/v1/messaging/settings
// @access  Private
exports.updateSettings = async (req, res) => {
    try {
        const {
            whatsappProvider,
            whatsappToken,
            whatsappPhoneId,
            smsProvider,
            twilioSid,
            twilioAuthToken,
            twilioPhone,
            fast2smsApiKey
        } = req.body;

        const updates = [
            { key: 'whatsapp_gateway_provider', value: whatsappProvider },
            { key: 'whatsapp_api_token', value: whatsappToken },
            { key: 'whatsapp_phone_number_id', value: whatsappPhoneId },
            { key: 'sms_gateway_provider', value: smsProvider },
            { key: 'twilio_account_sid', value: twilioSid },
            { key: 'twilio_auth_token', value: twilioAuthToken },
            { key: 'twilio_phone_number', value: twilioPhone },
            { key: 'fast2sms_api_key', value: fast2smsApiKey }
        ];

        for (const item of updates) {
            if (item.value !== undefined) {
                await pool.query(
                    `INSERT INTO system_settings (setting_key, setting_value)
                     VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
                    [item.key, item.value]
                );
            }
        }

        res.status(200).json({ status: 'success', message: 'Messaging gateway settings saved successfully' });
    } catch (err) {
        console.error('Error updating messaging settings:', err);
        res.status(500).json({ status: 'error', message: 'Failed to save gateway settings' });
    }
};
