const db = require('../config/db');

// @desc    Get Current Clinic Subscription
// @route   GET /api/subscriptions/current
// @access  Private
const getCurrentSubscription = async (req, res) => {
    try {
        let clinicId = req.user.clinic_id || req.user.clinicId;
        if (!clinicId && req.user.id) {
            const [uRows] = await db.query('SELECT clinic_id FROM users WHERE id = ? LIMIT 1', [req.user.id]);
            if (uRows.length > 0) {
                clinicId = uRows[0].clinic_id;
            }
        }

        // Fetch subscription and plan info
        const [subs] = await db.query(`
            SELECT 
                s.id, s.status as subStatus, s.start_date as startDate, s.end_date as endDate,
                s.plan_id as subPlanId,
                COALESCE(p.id, s.plan_id, 'plan-free-trial') as planId,
                COALESCE(p.name, '7-Day Free Trial') as planName,
                COALESCE(p.price, 0) as price,
                p.features,
                COALESCE(c.status, 'ACTIVE') as clinicStatus,
                c.created_at as clinicCreatedAt
            FROM saas_subscriptions s
            LEFT JOIN saas_plans p ON s.plan_id = p.id
            LEFT JOIN clinics c ON s.clinic_id = c.id
            WHERE s.clinic_id = ?
            ORDER BY s.created_at DESC
            LIMIT 1
        `, [clinicId]);

        if (subs.length === 0) {
            let clinicName = 'Your Clinic';
            let clinicStatus = 'ACTIVE';
            let clinicCreatedAt = new Date();
            if (clinicId) {
                const [cRows] = await db.query('SELECT clinic_name, status, created_at FROM clinics WHERE id = ? LIMIT 1', [clinicId]);
                if (cRows.length > 0) {
                    clinicName = cRows[0].clinic_name;
                    clinicStatus = cRows[0].status;
                    clinicCreatedAt = cRows[0].created_at || new Date();
                }
            }
            const trialEnd = new Date(clinicCreatedAt);
            trialEnd.setDate(trialEnd.getDate() + 7);
            const now = new Date();
            const daysLeft = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));

            return res.json({
                status: 'success',
                data: {
                    id: `trial_${clinicId || 'default'}`,
                    subStatus: daysLeft > 0 ? 'Trial' : 'Expired',
                    startDate: clinicCreatedAt,
                    endDate: trialEnd,
                    planId: 'plan-free-trial',
                    planName: '7-Day Free Trial',
                    price: 0,
                    features: ['Patient Records', 'Appointments', 'Staff Management'],
                    clinicStatus: clinicStatus,
                    daysLeft: daysLeft,
                    isExpired: daysLeft <= 0 || clinicStatus === 'SUSPENDED'
                }
            });
        }

        const sub = subs[0];
        // Calculate days left
        const end = new Date(sub.endDate || Date.now());
        const now = new Date();
        const diffTime = end - now;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let featuresArr = [];
        if (sub.features) {
            try {
                featuresArr = typeof sub.features === 'string' ? JSON.parse(sub.features) : sub.features;
            } catch (e) {
                featuresArr = [sub.features];
            }
        }

        res.json({
            status: 'success',
            data: {
                ...sub,
                features: featuresArr,
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
