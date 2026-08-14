const db = require('../config/db');

async function updatePlans() {
  await db.query("UPDATE saas_plans SET price = 999.00, duration_days = 30 WHERE id = 'plan-starter'");
  await db.query("UPDATE saas_plans SET price = 1999.00, duration_days = 30 WHERE id = 'plan-standard'");
  await db.query("UPDATE saas_plans SET price = 3999.00, duration_days = 30 WHERE id = 'plan-pro'");
  await db.query("UPDATE saas_plans SET price = 1.00 WHERE id = 'plan-testing'");
  console.log('All plan prices updated!');
  process.exit(0);
}

updatePlans().catch(e => { console.error(e.message); process.exit(1); });
