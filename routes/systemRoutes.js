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

module.exports = router;
