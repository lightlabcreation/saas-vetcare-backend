require('dotenv').config();
const pool = require('../config/db');

async function activate() {
  try {
    await pool.query("UPDATE clinics SET status = 'ACTIVE' WHERE id = 'clinic-1'");
    await pool.query("UPDATE saas_subscriptions SET status = 'Active', end_date = '2027-12-31 23:59:59' WHERE clinic_id = 'clinic-1'");
    console.log('Clinic-1 activated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to activate clinic:', err);
    process.exit(1);
  }
}

activate();
