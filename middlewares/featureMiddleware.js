const subscriptionService = require('../services/subscriptionService');

/**
 * Middleware to check if the current clinic's active subscription includes a specific feature.
 * Must be used AFTER an authentication middleware that sets req.user.clinicId (or similar).
 * @param {string} featureKey - The feature required (e.g. 'PATIENT_RECORDS')
 */
const requireFeature = (featureKey) => {
    return async (req, res, next) => {
        try {
            // Assume auth middleware populates req.user.clinic_id or req.clinicId
            const clinicId = req.user?.clinicId || req.user?.clinic_id || req.clinicId;
            if (!clinicId) {
                // If it's a superadmin, they might bypass
                if (req.user?.role === 'SUPER_ADMIN') {
                    return next();
                }
                return res.status(401).json({ status: 'error', message: 'Unauthorized: No clinic context' });
            }

            const entitlements = await subscriptionService.getAdminEntitlements(clinicId);

            // If subscription is expired, block all feature-gated endpoints
            if (entitlements.subscriptionStatus === 'EXPIRED') {
                return res.status(403).json({
                    status: 'error',
                    code: 'SUBSCRIPTION_EXPIRED',
                    message: 'Your subscription has expired. Please renew to access this feature.'
                });
            }

            // Check if feature is included in the plan
            if (!entitlements.features.includes(featureKey)) {
                return res.status(403).json({
                    status: 'error',
                    code: 'FEATURE_NOT_INCLUDED',
                    message: `Your current plan (${entitlements.currentPlan || 'None'}) does not include access to ${featureKey}. Please upgrade.`
                });
            }

            // Pass entitlements down the pipeline for potential further use
            req.entitlements = entitlements;
            next();
        } catch (error) {
            console.error('[FeatureMiddleware] Error:', error);
            res.status(500).json({ status: 'error', message: 'Internal server error while verifying features' });
        }
    };
};

module.exports = {
    requireFeature
};
