const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function migrate() {
    try {
        const sqlPath = path.join(__dirname, '../../database/migrations/phase2_multi_tenant.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Running migration...');
        
        // We might need to split by ';' since multipleStatements might not be enabled on the pool
        const queries = sql.split(';').map(q => q.trim()).filter(q => q.length > 0);
        
        for (const query of queries) {
            await pool.query(query);
        }
        
        console.log('Migration completed successfully.');

        // Verify
        const [rows] = await pool.query('SELECT * FROM clinics');
        console.log('Clinics in DB:', rows);
        
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
