const db = require('../config/db');

const subscriptionService = require('../services/subscriptionService');

// @desc    Get Current Clinic Subscription
// @route   GET /api/subscriptions/current
// @access  Private
const getCurrentSubscription = async (req, res) => {
    try {
        const clinicId = req.user?.clinicId || req.user?.clinic_id || req.clinicId;
        if (!clinicId) {
            return res.status(401).json({ status: 'error', message: 'No clinic context found' });
        }

        const entitlements = await subscriptionService.getAdminEntitlements(clinicId);

        res.json({
            status: 'success',
            data: entitlements
        });
    } catch (error) {
        console.error('Error fetching current subscription:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch subscription' });
    }
};

// @desc    Get All Active Plans
// @route   GET /api/subscriptions/plans
// @access  Public / Private
const getActivePlans = async (req, res) => {
    try {
        const [plans] = await db.query('SELECT * FROM saas_plans WHERE is_active = 1 ORDER BY price ASC');
        const formatted = plans.map(p => ({
            ...p,
            features: p.features ? JSON.parse(p.features) : []
        }));
        res.json({ status: 'success', data: formatted });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch plans' });
    }
};

module.exports = {
    getCurrentSubscription,
    getActivePlans
};
