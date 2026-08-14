const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

// Route protection
router.use(protect);

router.get('/revenue', dashboardController.getRevenue);
router.get('/appointments', dashboardController.getAppointments);
router.get('/doctors', dashboardController.getDoctors);
router.get('/patients', dashboardController.getPatients);
router.get('/inventory', dashboardController.getInventory);
router.get('/recent-pets', dashboardController.getRecentPets);
router.get('/notifications', dashboardController.getNotifications);
router.get('/attendance', dashboardController.getAttendance);

module.exports = router;
