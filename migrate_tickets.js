require('dotenv').config();
const db = require('./config/db');

async function migrate() {
    try {
        console.log("Adding columns to saas_support_tickets...");
        
        await db.query(`ALTER TABLE saas_support_tickets ADD COLUMN priority VARCHAR(50) DEFAULT 'Medium'`);
        await db.query(`ALTER TABLE saas_support_tickets ADD COLUMN category VARCHAR(100) DEFAULT 'General'`);
        
        console.log("Migration successful!");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Columns already exist, skipping.");
        } else {
            console.error("Migration failed:", e);
        }
    }
    process.exit(0);
}
migrate();
