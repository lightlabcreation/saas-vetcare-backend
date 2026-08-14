const db = require('../config/db');
const crypto = require('crypto');

const createAuditLog = async ({
    userId = null,
    clinicId = null,
    action,
    entity,
    entityId = null,
    oldValues = null,
    newValues = null,
    ipAddress = null,
    userAgent = null,
    req = null
}) => {
    try {
        const id = 'audit-' + crypto.randomUUID().slice(0, 10);
        
        let resolvedUserId = userId;
        let resolvedClinicId = clinicId;
        let resolvedIp = ipAddress;
        let resolvedUserAgent = userAgent;

        if (req) {
            if (!resolvedUserId && req.user && req.user.id) {
                resolvedUserId = req.user.id;
            }
            if (!resolvedClinicId && req.clinicId) {
                resolvedClinicId = req.clinicId;
            }
            if (!resolvedIp) {
                resolvedIp = req.ip || req.connection?.remoteAddress || null;
            }
            if (!resolvedUserAgent) {
                resolvedUserAgent = req.get('user-agent') || null;
            }
        }

        const safeOldValues = oldValues ? JSON.stringify(oldValues) : null;
        const safeNewValues = newValues ? JSON.stringify(newValues) : null;

        await db.query(
            `INSERT INTO audit_logs 
             (id, user_id, clinic_id, action, entity, entity_id, old_values, new_values, ip_address, user_agent, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                id,
                resolvedUserId,
                resolvedClinicId,
                action,
                entity,
                entityId,
                safeOldValues,
                safeNewValues,
                resolvedIp,
                resolvedUserAgent
            ]
        );
    } catch (err) {
        console.error('[AuditService] Failed to create audit log:', err.message);
    }
};

module.exports = { createAuditLog };
