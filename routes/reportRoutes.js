const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

// Route protection
router.use(protect);

// Report sub-endpoints
router.get('/my-revenue', reportController.getMyRevenue);
router.get('/revenue', reportController.getRevenue);
router.get('/appointments', reportController.getAppointments);
router.get('/doctors', reportController.getDoctors);
router.get('/patients', reportController.getPatients);
router.get('/inventory', reportController.getInventory);

module.exports = router;
