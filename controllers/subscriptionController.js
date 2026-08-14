const db = require('../config/db');

// @desc    Get Current Clinic Subscription
// @route   GET /api/subscriptions/current
// @access  Private
const getCurrentSubscription = async (req, res) => {
    try {
        const clinicId = req.user.clinicId;

        // Fetch subscription and plan info
        const [subs] = await db.query(`
            SELECT 
                s.id, s.status as subStatus, s.start_date as startDate, s.end_date as endDate,
                p.id as planId, p.name as planName, p.price, p.features,
                c.status as clinicStatus
            FROM saas_subscriptions s
            JOIN saas_plans p ON s.plan_id = p.id
            JOIN clinics c ON s.clinic_id = c.id
            WHERE s.clinic_id = ?
            ORDER BY s.created_at DESC
            LIMIT 1
        `, [clinicId]);

        if (subs.length === 0) {
            return res.status(404).json({ status: 'error', message: 'No subscription found' });
        }

        const sub = subs[0];
        // Calculate days left
        const end = new Date(sub.endDate);
        const now = new Date();
        const diffTime = end - now;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        res.json({
            status: 'success',
            data: {
                ...sub,
                features: sub.features ? JSON.parse(sub.features) : [],
                daysLeft: daysLeft > 0 ? daysLeft : 0,
                isExpired: daysLeft <= 0 || sub.subStatus === 'Expired' || sub.clinicStatus === 'EXPIRED'
            }
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
