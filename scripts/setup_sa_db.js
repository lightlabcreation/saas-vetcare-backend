const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function setupSuperAdmin() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3307,
            database: process.env.DB_NAME || 'veterinary_db',
            multipleStatements: true
        });

        console.log('Connected to MySQL server. Applying Super Admin Schema...');

        const schemaSql = fs.readFileSync(path.join(__dirname, '../database/super_admin_schema.sql'), 'utf8');
        await connection.query(schemaSql);
        
        console.log('Inserting default Super Admin...');
        
        const hash = await bcrypt.hash('password123', 10);
        const saId = 'sa-1';
        const email = 'superadmin@vetcarepro.com';

        // Check if exists
        const [rows] = await connection.query('SELECT * FROM super_admins WHERE email = ?', [email]);
        if (rows.length === 0) {
            await connection.query(
                `INSERT INTO super_admins (id, email, password_hash) VALUES (?, ?, ?)`,
                [saId, email, hash]
            );
            console.log('Default super admin created (superadmin@vetcarepro.com / password123)');
        } else {
            console.log('Super admin already exists.');
        }

        console.log('Super Admin Setup complete!');
        await connection.end();
    } catch (err) {
        console.error('Error during setup:', err);
    }
}

setupSuperAdmin();
