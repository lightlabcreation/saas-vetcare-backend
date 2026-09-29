const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { protect } = require('../middlewares/authMiddleware');
const { subscriptionMiddleware } = require('../middlewares/subscriptionMiddleware');

// All audit routes are protected and for Admin / Manager
router.use(protect);
router.use(subscriptionMiddleware);

router.get('/stats', auditController.getAuditStats);
router.get('/export', auditController.exportAuditLogs);
router.get('/', auditController.getAuditLogs);

module.exports = router;
