const pool = require('./config/db');

(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id VARCHAR(100) PRIMARY KEY,
                user_id VARCHAR(100) NOT NULL,
                token VARCHAR(255) NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                used TINYINT(1) DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('password_reset_tokens table created successfully!');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        process.exit(0);
    }
})();
