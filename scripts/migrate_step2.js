const db = require('../config/db');

async function migrateStep2() {
  try {
    // 1. Check users table columns
    const [cols] = await db.query('DESCRIBE users');
    const colNames = cols.map(c => c.Field);
    
    if (!colNames.includes('reset_password_token')) {
      await db.query('ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255) NULL');
      console.log('Added reset_password_token column to users');
    }
    if (!colNames.includes('reset_password_expires')) {
      await db.query('ALTER TABLE users ADD COLUMN reset_password_expires DATETIME NULL');
      console.log('Added reset_password_expires column to users');
    }

    // 2. Audit logs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(36) PRIMARY KEY,
        clinic_id VARCHAR(36) NULL,
        user_id VARCHAR(36) NULL,
        user_name VARCHAR(255) NULL,
        user_role VARCHAR(50) NULL,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100) NULL,
        resource_id VARCHAR(255) NULL,
        details JSON NULL,
        ip_address VARCHAR(50) NULL,
        status ENUM('SUCCESS', 'FAILED') DEFAULT 'SUCCESS',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_clinic_created (clinic_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('audit_logs table verified/created');
    console.log('Step 2 Database Migration Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Step 2 Migration Error:', err);
    process.exit(1);
  }
}

migrateStep2();
