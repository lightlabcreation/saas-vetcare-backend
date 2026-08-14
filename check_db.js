require('dotenv').config();
const db = require('./config/db');

async function check() {
    try {
        const [rows] = await db.query('DESCRIBE clinics;');
        console.log("Clinics Table Schema:");
        console.table(rows);

        const [subRows] = await db.query('DESCRIBE saas_subscriptions;');
        console.log("SaaS Subscriptions Schema:");
        console.table(subRows);

        const [plans] = await db.query('SELECT * FROM saas_plans;');
        console.log("SaaS Plans:");
        console.table(plans);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
check();
