const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../middlewares/authMiddleware');
const { requireFeature } = require('../middlewares/featureMiddleware');

router.use(protect);

// Admin attendance view requires SHIFT_MANAGEMENT
router.get('/', requireFeature('SHIFT_MANAGEMENT'), attendanceController.getDailyAttendance);
// Personal attendance is accessible to all roles
router.get('/me', attendanceController.getPersonalHistory);
router.post('/checkin', attendanceController.checkIn);
router.post('/checkout', attendanceController.checkOut);

module.exports = router;
