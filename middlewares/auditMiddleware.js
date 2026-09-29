const { createAuditLog } = require('../services/auditService');

// Map endpoints to readable Entities and Actions
function getActionAndEntity(method, path) {
    const cleanPath = path.split('?')[0];
    
    if (cleanPath.includes('/auth/login')) return { entity: 'Auth', action: 'USER_LOGIN' };
    if (cleanPath.includes('/auth/register')) return { entity: 'Auth', action: 'USER_REGISTER' };
    if (cleanPath.includes('/auth/forgot-password')) return { entity: 'Auth', action: 'FORGOT_PASSWORD' };
    
    if (cleanPath.includes('/appointments')) {
        if (method === 'POST') return { entity: 'Appointment', action: 'CREATE_APPOINTMENT' };
        if (method === 'PUT' || method === 'PATCH') return { entity: 'Appointment', action: 'UPDATE_APPOINTMENT' };
        if (method === 'DELETE') return { entity: 'Appointment', action: 'DELETE_APPOINTMENT' };
        return { entity: 'Appointment', action: 'VIEW_APPOINTMENTS' };
    }
    
    if (cleanPath.includes('/invoices')) {
        if (method === 'POST') return { entity: 'Billing', action: 'CREATE_INVOICE' };
        if (method === 'PUT' || method === 'PATCH') return { entity: 'Billing', action: 'UPDATE_INVOICE' };
        if (method === 'DELETE') return { entity: 'Billing', action: 'DELETE_INVOICE' };
        return { entity: 'Billing', action: 'VIEW_INVOICES' };
    }

    if (cleanPath.includes('/pets')) {
        if (method === 'POST') return { entity: 'Pet', action: 'REGISTER_PET' };
        if (method === 'PUT' || method === 'PATCH') return { entity: 'Pet', action: 'UPDATE_PET' };
        if (method === 'DELETE') return { entity: 'Pet', action: 'DELETE_PET' };
        return { entity: 'Pet', action: 'VIEW_PETS' };
    }

    if (cleanPath.includes('/owners')) {
        if (method === 'POST') return { entity: 'Owner', action: 'REGISTER_OWNER' };
        if (method === 'PUT' || method === 'PATCH') return { entity: 'Owner', action: 'UPDATE_OWNER' };
        return { entity: 'Owner', action: 'VIEW_OWNERS' };
    }

    if (cleanPath.includes('/treatment-notes') || cleanPath.includes('/encounters')) {
        if (method === 'POST') return { entity: 'Medical', action: 'CREATE_CLINICAL_ENCOUNTER' };
        if (method === 'PUT' || method === 'PATCH') return { entity: 'Medical', action: 'UPDATE_CLINICAL_ENCOUNTER' };
        return { entity: 'Medical', action: 'VIEW_MEDICAL_RECORDS' };
    }

    if (cleanPath.includes('/inventory')) {
        if (method === 'POST') return { entity: 'Inventory', action: 'ADD_STOCK' };
        if (method === 'PUT' || method === 'PATCH') return { entity: 'Inventory', action: 'UPDATE_STOCK' };
        return { entity: 'Inventory', action: 'VIEW_INVENTORY' };
    }

    if (cleanPath.includes('/hospitalization')) {
        if (method === 'POST') return { entity: 'Hospitalization', action: 'ADMIT_PATIENT' };
        if (method === 'PUT' || method === 'PATCH') return { entity: 'Hospitalization', action: 'UPDATE_CAGE' };
        return { entity: 'Hospitalization', action: 'VIEW_HOSPITALIZATION' };
    }

    if (cleanPath.includes('/payment')) {
        return { entity: 'Payment', action: method === 'POST' ? 'PROCESS_PAYMENT' : 'CHECK_PAYMENT' };
    }

    if (cleanPath.includes('/users') || cleanPath.includes('/staff')) {
        if (method === 'POST') return { entity: 'Staff', action: 'ADD_STAFF' };
        if (method === 'PUT' || method === 'PATCH') return { entity: 'Staff', action: 'UPDATE_STAFF' };
        return { entity: 'Staff', action: 'VIEW_STAFF' };
    }

    if (cleanPath.includes('/settings')) {
        return { entity: 'Settings', action: 'UPDATE_SETTINGS' };
    }

    return { 
        entity: cleanPath.split('/')[3] || 'System', 
        action: `${method}_${(cleanPath.split('/')[3] || 'API').toUpperCase()}` 
    };
}

const auditPerformanceMiddleware = (req, res, next) => {
    // Skip noisy static assets, audit-log polling itself, and health check
    const path = req.originalUrl || req.url;
    if (
        path.startsWith('/uploads') || 
        path.includes('/favicon.ico') || 
        path === '/api/health' || 
        path.startsWith('/api/v1/audit-logs')
    ) {
        return next();
    }

    const startHrTime = process.hrtime();

    res.on('finish', () => {
        try {
            const elapsedHrTime = process.hrtime(startHrTime);
            const responseTimeMs = Math.round((elapsedHrTime[0] * 1000) + (elapsedHrTime[1] / 1e6));
            const statusCode = res.statusCode;

            let status = 'SUCCESS';
            if (statusCode >= 500) status = 'FAILED';
            else if (statusCode >= 400) status = 'WARNING';

            const { entity, action } = getActionAndEntity(req.method, path);

            // Do not log read requests that are simple polling unless they failed, to keep DB lean and fast
            const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
            const isError = statusCode >= 400;
            const isAuthOrKeyRead = path.includes('/auth') || path.includes('/reports') || path.includes('/dashboard');

            if (isMutation || isError || isAuthOrKeyRead || responseTimeMs > 200) {
                createAuditLog({
                    userId: req.user?.id || null,
                    clinicId: req.clinicId || req.user?.clinic_id || null,
                    action,
                    entity,
                    method: req.method,
                    endpoint: path,
                    statusCode,
                    responseTimeMs,
                    status,
                    oldValues: req.body ? { summary: `${req.method} request with ${Object.keys(req.body).length} params` } : null,
                    newValues: isError ? { errorStatus: statusCode } : null,
                    req
                });
            }
        } catch (e) {
            console.error('[AuditPerformanceMiddleware] Error logging performance:', e.message);
        }
    });

    next();
};

module.exports = { auditPerformanceMiddleware };
