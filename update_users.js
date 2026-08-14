const db = require('./config/db');

async function updateUsers() {
    const hash = '$2b$10$l4lSVlr8arXCtyQgVTNMKehWkjIrJNQfzN3NFAx4bMVdVzt/cWi2y'; // password123
    try {
        await db.query(`UPDATE users SET password_hash = ?`, [hash]);
        await db.query(`UPDATE users SET email = 'admin@vetcarepro.com' WHERE id = 'u1-admin'`);
        await db.query(`UPDATE users SET email = 'manager@vetcarepro.com' WHERE id = 'u2-manager'`);
        await db.query(`UPDATE users SET email = 'demodoctor@gmail.com' WHERE id = 'u3-doctor1'`);
        await db.query(`UPDATE users SET email = 'demoR@gmail.com' WHERE id = 'u5-recept'`);
        await db.query(`UPDATE users SET email = 'assistant@vetcarepro.com' WHERE id = 'u6-vetasst'`);
        console.log('Users updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
updateUsers();
