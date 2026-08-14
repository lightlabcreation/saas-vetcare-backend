const express = require('express');
const router = express.Router();
const { getCurrentSubscription, getActivePlans } = require('../controllers/subscriptionController');
const { protect } = require('../middlewares/authMiddleware');

// Get current subscription for logged in clinic
router.get('/current', protect, getCurrentSubscription);

// Get all active plans (can be public or protected, protecting it for now)
router.get('/plans', protect, getActivePlans);

module.exports = router;
