const pool = require('./config/db');

async function alterTables() {
  try {
    await pool.query('ALTER TABLE saas_payments ADD COLUMN razorpay_order_id VARCHAR(255)');
    await pool.query('ALTER TABLE saas_payments ADD COLUMN razorpay_payment_id VARCHAR(255)');
    await pool.query('ALTER TABLE saas_payments ADD COLUMN razorpay_signature VARCHAR(255)');
    await pool.query('ALTER TABLE saas_payments ADD COLUMN currency VARCHAR(10) DEFAULT "INR"');
    await pool.query('ALTER TABLE saas_payments ADD COLUMN invoice_number VARCHAR(100)');
    await pool.query('ALTER TABLE saas_payments ADD COLUMN payment_method VARCHAR(50)');
    await pool.query('ALTER TABLE saas_payments ADD COLUMN plan_id VARCHAR(36)');
    
    await pool.query('ALTER TABLE saas_subscriptions ADD COLUMN razorpay_payment_id VARCHAR(255)');
    
    console.log("Tables altered successfully");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Columns already exist");
    } else {
      console.error(err);
    }
  } finally {
    process.exit();
  }
}

alterTables();
