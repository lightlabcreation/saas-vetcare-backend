const express = require('express');
const router = express.Router();
const assistanceTaskController = require('../controllers/assistanceTaskController');
const { protect } = require('../middlewares/authMiddleware');
const { requireFeature } = require('../middlewares/featureMiddleware');

router.use(protect);
router.use(requireFeature('AI_ASSISTANT'));

router.get('/', assistanceTaskController.getAssistanceTasks);
router.post('/', protect, assistanceTaskController.createAssistanceTask);
router.patch('/:id/status', protect, assistanceTaskController.updateTaskStatus);
router.put('/:id/status', protect, assistanceTaskController.updateTaskStatus);

module.exports = router;
