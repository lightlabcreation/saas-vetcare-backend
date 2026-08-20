const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middlewares/authMiddleware');
const { requireFeature } = require('../middlewares/featureMiddleware');

const userController = require('../controllers/userController');

router.use(protect);

// Profile endpoints - accessible to all authenticated users
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Staff management - requires STAFF_MANAGEMENT feature
router.get('/', requireFeature('STAFF_MANAGEMENT'), userController.getAllUsers);
router.post('/', requireFeature('STAFF_MANAGEMENT'), userController.createUser);
router.put('/:id', requireFeature('STAFF_MANAGEMENT'), userController.updateUser);
router.delete('/:id', requireFeature('STAFF_MANAGEMENT'), userController.deleteUser);

module.exports = router;
