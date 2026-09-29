const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

// Public gateway configuration (which gateway is enabled, public keys, currencies)
router.get('/config', paymentController.getConfig);

// Razorpay Order Creation & Verification
router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);

// Stripe Checkout Session Creation & Verification
router.post('/stripe/create-session', paymentController.createStripeSession);
router.post('/stripe/verify', paymentController.verifyStripePayment);

// Transaction History
router.get('/my-history', protect, paymentController.getMyPaymentHistory);
router.get('/history', protect, paymentController.getPaymentHistory);

// Invoicing & Printable PDF Receipts
router.get('/invoice/:invoiceNumber/html', paymentController.getInvoiceHtml);
router.get('/invoice/:invoiceNumber', paymentController.getInvoiceData);

// Universal Webhooks (Razorpay / Stripe)
router.post('/webhook', paymentController.handleWebhook);
router.post('/webhook/razorpay', paymentController.handleWebhook);
router.post('/webhook/stripe', paymentController.handleWebhook);

module.exports = router;
