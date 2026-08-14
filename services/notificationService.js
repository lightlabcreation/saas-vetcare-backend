const db = require('../config/db');
const crypto = require('crypto');

/**
 * Creates an in-app notification for a specific user or a broadcast (user_id = NULL).
 * @param {string} clinic_id - The ID of the clinic.
 * @param {string|null} userId - The target user's ID. Pass null for a broadcast to everyone.
 * @param {string} title - Short title of the notification.
 * @param {string} message - Detailed message.
 * @param {string} type - One of: 'appointment', 'pet_registered', 'low_stock', 'expiry', 'system'
 */
async function createNotification(clinic_id, userId, title, message, type = 'system') {
    try {
        const id = 'notif-' + crypto.randomUUID().slice(0, 10);
        await db.query(
            `INSERT INTO notifications (id, clinic_id, user_id, title, message, type, is_read, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())`,
            [id, clinic_id, userId, title, message, type]
        );
    } catch (err) {
        // Notifications are non-critical — log the error but don't crash the request
        console.error('[NotificationService] Failed to create notification:', err.message);
    }
}

module.exports = { createNotification };
