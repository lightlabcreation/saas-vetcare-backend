const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function setup() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: parseInt(process.env.DB_PORT || '3306'),
            multipleStatements: true
        });

        console.log('Connected to MySQL server.');

        // Create database if not exists
        console.log('Ensuring database exists...');
        await connection.query('CREATE DATABASE IF NOT EXISTS veterinary_db');

        const schemaSql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
        console.log('Running schema.sql...');
        await connection.query(schemaSql);
        
        console.log('Switching to database...');
        await connection.query('USE veterinary_db');

        const seedSql = fs.readFileSync(path.join(__dirname, '../database/seed.sql'), 'utf8');
        console.log('Running seed.sql...');
        await connection.query(seedSql);

        console.log('Database setup complete!');
        await connection.end();
    } catch (err) {
        console.error('Error during setup:', err);
    }
}

setup();
