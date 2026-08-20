const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../config/db');
const emailService = require('../services/emailService');
const emailConfig = require('../config/emailConfig');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummyKeyId',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummyKeySecret',
});

exports.createOrder = async (req, res) => {
  try {
    const { planId, currency = 'INR', clinicAdminId } = req.body;

    const PLANS = {
      'starter': 999,
      'standard': 1299,
      'pro': 1499
    };
    
    const cleanPlanId = planId ? planId.replace(/^plan-/, '') : '';
    let amount = PLANS[cleanPlanId] || 1499;

    if (!amount) {
      return res.status(400).json({ status: 'error', message: 'Invalid plan or amount' });
    }

    const options = {
      amount: amount * 100,
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    const isRealUser = clinicAdminId && clinicAdminId !== 'temp_user_id';
    if (isRealUser) {
      const paymentId = crypto.randomUUID();
      let clinicId = null;
      
      try {
        const [userRows] = await pool.query('SELECT clinic_id FROM users WHERE id = ? LIMIT 1', [clinicAdminId]);
        if (userRows && userRows.length > 0) {
          clinicId = userRows[0].clinic_id;
        }
      } catch (err) {
        console.error('Error fetching user clinic for payment:', err.message);
      }

      await pool.query(
        `INSERT INTO saas_payments (id, clinic_id, clinic_admin_id, amount, status, currency, razorpay_order_id, plan_id) 
         VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?)`,
        [paymentId, clinicId, clinicAdminId, amount, currency, order.id, planId]
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
      }
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, amount } = req.body;
    // Prefer authenticated user id from req.user (via protect middleware) for security
    const clinicAdminId = req.user && req.user.id ? req.user.id : req.body.clinicAdminId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ status: 'error', message: 'Missing required payment verification parameters' });
    }

    // ── IDEMPOTENCY GUARD ──
    // Check if this payment or order has already been verified and processed
    const [existingPayments] = await pool.query(
      `SELECT id, status, invoice_number FROM saas_payments 
       WHERE razorpay_payment_id = ? OR (razorpay_order_id = ? AND status = 'Successful') 
       LIMIT 1`,
      [razorpay_payment_id, razorpay_order_id]
    );

    if (existingPayments.length > 0 && existingPayments[0].status === 'Successful') {
      console.log(`[Payment] Idempotent request: Payment ${razorpay_payment_id} was already processed.`);
      return res.status(200).json({
        status: 'success',
        message: 'Payment already verified and subscription is active',
        data: { invoiceNumber: existingPayments[0].invoice_number || 'INV-ALREADY-PROCESSED' }
      });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const invoiceNumber = `INV-${Date.now()}`;
      
      let clinicId = null;
      try {
        const [userRows] = await pool.query('SELECT clinic_id FROM users WHERE id = ? LIMIT 1', [clinicAdminId]);
        if (userRows && userRows.length > 0) {
          clinicId = userRows[0].clinic_id;
        }
      } catch (err) {
        console.error('Error fetching user clinic for payment verification:', err.message);
      }
      
      await pool.query(
        `UPDATE saas_payments SET 
          status = 'Successful', 
          razorpay_payment_id = ?, 
          razorpay_signature = ?, 
          invoice_number = ?, 
          payment_method = 'Razorpay' 
        WHERE razorpay_order_id = ?`,
        [razorpay_payment_id, razorpay_signature, invoiceNumber, razorpay_order_id]
      );

      const dbPlanId = planId.startsWith('plan-') ? planId : `plan-${planId}`;
      let durationDays = 30; // Default to 30 days
      try {
        const [planRows] = await pool.query('SELECT duration_days FROM saas_plans WHERE id = ?', [dbPlanId]);
        if (planRows && planRows.length > 0) {
          durationDays = planRows[0].duration_days || 30;
        }
      } catch (err) {
        console.error('Error fetching plan duration:', err.message);
      }

      const subId = crypto.randomUUID();
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
      
      await pool.query(
        `INSERT INTO saas_subscriptions (id, clinic_id, clinic_admin_id, plan_id, status, start_date, end_date, razorpay_payment_id) 
         VALUES (?, ?, ?, ?, 'Active', ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = 'Active', end_date = ?, razorpay_payment_id = ?, plan_id = ?`,
        [subId, clinicId, clinicAdminId, dbPlanId, startDate, endDate, razorpay_payment_id, endDate, razorpay_payment_id, dbPlanId]
      );

      await pool.query(
        "UPDATE clinics SET status = 'ACTIVE', updated_at = NOW() WHERE id = ?",
        [clinicId]
      );

      // Fetch full user + clinic details to send professional payment emails
      try {
        const [users] = await pool.query(
          `SELECT u.name, u.email, c.clinic_name
           FROM users u
           LEFT JOIN clinics c ON u.clinic_id = c.id
           WHERE u.id = ? LIMIT 1`,
          [clinicAdminId]
        );
        if (users.length > 0) {
          const user = users[0];
          const userName = user.name || 'Clinic Administrator';
          const userEmail = user.email;
          const clinicName = user.clinic_name || 'PetCare Pro Clinic';

          // Resolve plan name from DB (already queried above for durationDays)
          let planNameFinal = planId;
          try {
            const [planRows] = await pool.query('SELECT name FROM saas_plans WHERE id = ? LIMIT 1', [dbPlanId]);
            if (planRows && planRows.length > 0) planNameFinal = planRows[0].name || planId;
          } catch (e) { /* non-fatal */ }

          const purchasePayload = {
            adminName: userName,
            clinicName,
            email: userEmail,
            planName: planNameFinal,
            amount: amount || (durationDays === 30 ? 999 : 1499),
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            invoiceNumber,
            startDate,
            endDate,
            billingCycle: `${durationDays} Days`,
            purchasedAt: new Date()
          };

          // Admin receipt email
          await emailService.sendPlanPurchaseEmail(purchasePayload);

          // SuperAdmin notification email
          await emailService.sendSuperAdminPurchaseNotification(purchasePayload);
        }
      } catch (emailErr) {
        console.error('Failed to send payment receipt email:', emailErr.message);
      }

      res.status(200).json({
        status: 'success',
        message: 'Payment verified and subscription activated successfully',
        data: { invoiceNumber }
      });
    } else {
      // Payment failed/tampered
      await pool.query(
        `UPDATE saas_payments SET status = 'Failed' WHERE razorpay_order_id = ?`,
        [razorpay_order_id]
      );

      res.status(400).json({ status: 'error', message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error during verification' });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const [payments] = await pool.query(
      `SELECT p.*, u.email as user_email, u.first_name, u.last_name 
       FROM saas_payments p 
       JOIN users u ON p.clinic_admin_id = u.id 
       ORDER BY p.payment_date DESC`
    );
    res.status(200).json({ status: 'success', data: payments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch payment history' });
  }
};


exports.handleWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'fallback_secret_for_dev';
    
    // Validate signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
      return res.status(400).json({ status: 'error', message: 'Invalid signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.authorized' || event === 'payment.captured' || event === 'subscription.charged') {
      const paymentEntity = payload.payment.entity;
      // You can extract clinicId/adminId if you pass it in notes during order creation
      const clinicId = paymentEntity.notes ? paymentEntity.notes.clinic_id : null;
      
      if (clinicId) {
        // Extend subscription by 30 days
        const updateQuery = `
          UPDATE users 
          SET subscription_status = 'active', 
              trial_expiry_date = DATE_ADD(IFNULL(trial_expiry_date, NOW()), INTERVAL 30 DAY) 
          WHERE clinic_id = ? AND role = 'Doctor'
        `;
        await pool.query(updateQuery, [clinicId]);
      }
    }
    
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ status: 'error', message: 'Webhook processing failed' });
  }
};
