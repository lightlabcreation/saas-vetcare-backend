const db = require('./db');

/**
 * Log important security and system events
 * 
 * @param {string} userId - ID of the user performing the action (can be null for system actions)
 * @param {string} clinicId - ID of the clinic the action belongs to (can be null for super admin actions)
 * @param {string} action - Action identifier (e.g., 'LOGIN_SUCCESS', 'CLINIC_SUSPENDED')
 * @param {string} entity - Entity being acted upon (e.g., 'USER', 'CLINIC', 'SUBSCRIPTION')
 * @param {string} entityId - ID of the entity being acted upon
 * @param {object} details - Any additional metadata as a JSON object
 */
const auditLog = async (userId, clinicId, action, entity, entityId, details = {}) => {
    try {
        // Log to console for now, can be extended to an actual 'audit_logs' table in production.
        console.log(`[AUDIT] ${new Date().toISOString()} | Action: ${action} | User: ${userId || 'SYSTEM'} | Clinic: ${clinicId || 'NONE'} | Entity: ${entity}:${entityId} | Details:`, JSON.stringify(details));
    } catch (error) {
        console.error('Failed to write audit log:', error);
    }
};

module.exports = { auditLog };
