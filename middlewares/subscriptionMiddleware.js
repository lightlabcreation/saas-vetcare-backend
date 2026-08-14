const db = require('../config/db');

const SUBSCRIPTION_ERROR_CODES = {
    TRIAL_EXPIRED: 'TRIAL_EXPIRED',
    SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
    ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
    SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED'
};

const EXEMPT_PATHS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/payment',
    '/api/super-admin',
    '/api/health',
    '/uploads'
];

const isExempt = (reqPath) => {
    if (!reqPath) return true;
    return EXEMPT_PATHS.some(path => reqPath === path || reqPath.startsWith(path + '/'));
};

const checkClinicStatus = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            return next();
        }

        const reqPath = req.path || req.originalUrl || '';
        if (isExempt(reqPath)) {
            return next();
        }

        if (user.role === 'SUPER_ADMIN') {
            return next();
        }

        const [users] = await db.query(
            'SELECT clinic_id FROM users WHERE id = ? LIMIT 1',
            [user.id]
        );

        const userRow = users && users.length > 0 ? users[0] : null;
        if (!userRow || !userRow.clinic_id) {
            return next();
        }

        const clinicId = userRow.clinic_id;
        req.clinicId = clinicId;

        const [clinics] = await db.query(
            'SELECT id, clinic_name, status, created_at FROM clinics WHERE id = ? LIMIT 1',
            [clinicId]
        );

        const clinic = clinics && clinics.length > 0 ? clinics[0] : null;
        if (!clinic) {
            return next();
        }

        req.clinic = clinic;

        if (clinic.status === 'SUSPENDED') {
            return res.status(403).json({
                status: 'error',
                code: SUBSCRIPTION_ERROR_CODES.ACCOUNT_SUSPENDED,
                message: 'Your account has been suspended. Please contact support for assistance.',
                data: {
                    clinicId: clinic.id,
                    clinicName: clinic.clinic_name
                }
            });
        }

        if (clinic.status === 'EXPIRED' || clinic.status === 'INACTIVE') {
            return res.status(403).json({
                status: 'error',
                code: SUBSCRIPTION_ERROR_CODES.SUBSCRIPTION_EXPIRED,
                message: 'Your subscription has expired. Please renew to continue accessing the platform.',
                data: {
                    clinicId: clinic.id,
                    clinicName: clinic.clinic_name
                }
            });
        }

        if (clinic.status === 'TRIAL') {
            const [subscriptions] = await db.query(
                `SELECT id, status, start_date, end_date 
                 FROM saas_subscriptions 
                 WHERE clinic_id = ? AND status = 'Trial' 
                 ORDER BY end_date DESC 
                 LIMIT 1`,
                [clinicId]
            );

            const trialSub = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
            if (!trialSub) {
                return res.status(403).json({
                    status: 'error',
                    code: SUBSCRIPTION_ERROR_CODES.SUBSCRIPTION_REQUIRED,
                    message: 'No active trial found. Please subscribe to a plan.',
                    data: {
                        clinicId: clinic.id,
                        clinicName: clinic.clinic_name
                    }
                });
            }

            const now = new Date();
            const endDate = trialSub.end_date ? new Date(trialSub.end_date) : null;
            if (endDate && now > endDate) {
                await db.query(
                    "UPDATE clinics SET status = 'EXPIRED', updated_at = NOW() WHERE id = ?",
                    [clinicId]
                );
                return res.status(403).json({
                    status: 'error',
                    code: SUBSCRIPTION_ERROR_CODES.TRIAL_EXPIRED,
                    message: 'Your free trial has expired. Please subscribe to a plan to continue.',
                    data: {
                        clinicId: clinic.id,
                        clinicName: clinic.clinic_name,
                        trialEndDate: trialSub.end_date
                    }
                });
            }

            return next();
        }

        if (clinic.status === 'ACTIVE') {
            const [subscriptions] = await db.query(
                `SELECT id, status, start_date, end_date, plan_id 
                 FROM saas_subscriptions 
                 WHERE clinic_id = ? AND status IN ('Active', 'Trial', 'Pending') 
                 ORDER BY start_date DESC 
                 LIMIT 1`,
                [clinicId]
            );

            const activeSub = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
            if (!activeSub) {
                return res.status(403).json({
                    status: 'error',
                    code: SUBSCRIPTION_ERROR_CODES.SUBSCRIPTION_REQUIRED,
                    message: 'No active subscription found. Please subscribe to a plan.',
                    data: {
                        clinicId: clinic.id,
                        clinicName: clinic.clinic_name
                    }
                });
            }

            if (activeSub.status === 'Pending') {
                return res.status(403).json({
                    status: 'error',
                    code: SUBSCRIPTION_ERROR_CODES.SUBSCRIPTION_REQUIRED,
                    message: 'Your subscription is pending verification. Please complete the payment.',
                    data: {
                        clinicId: clinic.id,
                        clinicName: clinic.clinic_name
                    }
                });
            }

            const now = new Date();
            const endDate = activeSub.end_date ? new Date(activeSub.end_date) : null;
            if (endDate && now > endDate) {
                await db.query(
                    `UPDATE saas_subscriptions 
                     SET status = 'Expired', updated_at = NOW() 
                     WHERE id = ? AND clinic_id = ?`,
                    [activeSub.id, clinicId]
                );
                await db.query(
                    "UPDATE clinics SET status = 'EXPIRED', updated_at = NOW() WHERE id = ?",
                    [clinicId]
                );
                return res.status(403).json({
                    status: 'error',
                    code: SUBSCRIPTION_ERROR_CODES.SUBSCRIPTION_EXPIRED,
                    message: 'Your subscription has expired. Please renew to continue accessing the platform.',
                    data: {
                        clinicId: clinic.id,
                        clinicName: clinic.clinic_name,
                        subscriptionEndDate: activeSub.end_date
                    }
                });
            }

            return next();
        }

        return next();
    } catch (error) {
        console.error('[SubscriptionMiddleware] Error checking clinic status:', error);
        return next();
    }
};

const subscriptionMiddleware = (req, res, next) => {
    checkClinicStatus(req, res, next);
};

module.exports = { subscriptionMiddleware, SUBSCRIPTION_ERROR_CODES };
