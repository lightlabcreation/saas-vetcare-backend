require('dotenv').config();
const db = require('./config/db');

async function check() {
    try {
        const [rows] = await db.query('SELECT id, name, email, role, clinic_id FROM users LIMIT 10;');
        console.log("Users List:");
        console.table(rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
check();
