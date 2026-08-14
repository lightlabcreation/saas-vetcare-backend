const db = require('./config/db');

async function check() {
    try {
        const clinicId = '347e7a3f-0910-425a-937d-877df4a89303';
        
        // Insert subscription row
        await db.query(
            "INSERT INTO saas_subscriptions (id, clinic_id, plan_id, status, start_date, end_date) VALUES (UUID(), ?, 'plan-free-trial', 'Trial', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY))", 
            [clinicId]
        );
        console.log('Inserted subscription row');
        process.exit(0);
    } catch(e) { 
        console.error(e); 
        process.exit(1); 
    }
}

check();
