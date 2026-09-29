const db = require('../config/db');
const crypto = require('crypto');

const createAuditLog = async ({
    userId = null,
    clinicId = null,
    action,
    entity,
    entityId = null,
    method = null,
    endpoint = null,
    statusCode = null,
    responseTimeMs = null,
    status = 'SUCCESS',
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
        let resolvedMethod = method;
        let resolvedEndpoint = endpoint;

        if (req) {
            if (!resolvedUserId && req.user && req.user.id) {
                resolvedUserId = req.user.id;
            }
            if (!resolvedClinicId && (req.clinicId || (req.user && req.user.clinic_id))) {
                resolvedClinicId = req.clinicId || req.user.clinic_id;
            }
            if (!resolvedIp) {
                resolvedIp = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || null;
                if (typeof resolvedIp === 'string' && resolvedIp.includes(',')) {
                    resolvedIp = resolvedIp.split(',')[0].trim();
                }
            }
            if (!resolvedUserAgent) {
                resolvedUserAgent = req.get('user-agent') || null;
            }
            if (!resolvedMethod) {
                resolvedMethod = req.method;
            }
            if (!resolvedEndpoint) {
                resolvedEndpoint = req.originalUrl || req.url;
            }
        }

        if (resolvedUserId) {
            try {
                const [userRows] = await db.query('SELECT id FROM users WHERE id = ?', [resolvedUserId]);
                if (!userRows || userRows.length === 0) {
                    resolvedUserId = null;
                }
            } catch (err) {
                resolvedUserId = null;
            }
        }

        const safeOldValues = oldValues ? (typeof oldValues === 'object' ? JSON.stringify(oldValues) : String(oldValues)) : null;
        const safeNewValues = newValues ? (typeof newValues === 'object' ? JSON.stringify(newValues) : String(newValues)) : null;

        await db.query(
            `INSERT INTO audit_logs 
             (id, user_id, clinic_id, action, entity, entity_id, method, endpoint, status_code, response_time_ms, status, old_values, new_values, ip_address, user_agent, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                id,
                resolvedUserId,
                resolvedClinicId,
                action || 'API_CALL',
                entity || 'System',
                entityId,
                resolvedMethod,
                resolvedEndpoint,
                statusCode,
                responseTimeMs,
                status,
                safeOldValues,
                safeNewValues,
                resolvedIp,
                resolvedUserAgent
            ]
        );
        return id;
    } catch (err) {
        console.error('[AuditService] Failed to create audit log:', err.message);
        return null;
    }
};

module.exports = { createAuditLog };
