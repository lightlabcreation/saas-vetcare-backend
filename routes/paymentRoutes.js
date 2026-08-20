const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify', protect, paymentController.verifyPayment);
router.get('/history', protect, paymentController.getPaymentHistory);

router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
