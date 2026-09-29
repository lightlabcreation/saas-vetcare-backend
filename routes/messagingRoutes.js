const express = require('express');
const router = express.Router();
const messagingController = require('../controllers/messagingController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/templates', messagingController.getTemplates);
router.put('/templates/:id', messagingController.updateTemplate);

router.get('/logs', messagingController.getLogs);
router.post('/send-direct', messagingController.sendDirect);

router.get('/settings', messagingController.getSettings);
router.put('/settings', messagingController.updateSettings);

module.exports = router;
