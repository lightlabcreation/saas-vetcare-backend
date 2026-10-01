const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { protect } = require('../middlewares/authMiddleware');

// Backup Endpoints (Protected)
router.get('/backup/download', protect, systemController.downloadDatabaseBackup);
router.get('/backup/history', protect, systemController.getBackupHistory);

// Storage Settings Endpoints (Protected)
router.get('/storage/settings', protect, systemController.getStorageSettings);
router.post('/storage/settings', protect, systemController.updateStorageSettings);

// 7-Day Email Report Endpoints (Protected)
router.post('/report/send-email', protect, systemController.sendReportEmail);
router.get('/report/history', protect, systemController.getReportHistory);
router.post('/report/subscribe', protect, systemController.subscribeReportEmail);
router.post('/report/unsubscribe', protect, systemController.unsubscribeReportEmail);
router.get('/report/subscriptions', protect, systemController.getReportSubscriptions);

module.exports = router;
