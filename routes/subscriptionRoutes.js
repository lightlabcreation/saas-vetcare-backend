const express = require('express');
const router = express.Router();
const { getCurrentSubscription, getActivePlans } = require('../controllers/subscriptionController');
const { protect } = require('../middlewares/authMiddleware');

// Get current subscription for logged in clinic
router.get('/current', protect, getCurrentSubscription);

// Get all active plans (Public for pricing/checkout)
router.get('/plans', getActivePlans);

module.exports = router;
