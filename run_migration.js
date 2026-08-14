const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, '../database/migration_multitenancy.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
        
        for (let stmt of statements) {
            console.log('Executing:', stmt.trim().substring(0, 50) + '...');
            await db.query(stmt);
        }
        
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } process.exit(0);
}

runMigration();
