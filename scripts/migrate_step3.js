const db = require('../config/db');

async function migrateStep3() {
  try {
    // 1. System Settings table for Storage & System Configuration
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NULL,
        setting_group VARCHAR(50) DEFAULT 'general',
        description VARCHAR(255) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('system_settings table verified/created');

    // 2. Database Backups Log Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS database_backups (
        id VARCHAR(36) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        file_size_kb INT DEFAULT 0,
        tables_count INT DEFAULT 0,
        total_rows INT DEFAULT 0,
        backup_type ENUM('MANUAL', 'AUTOMATED_DAILY') DEFAULT 'MANUAL',
        storage_location ENUM('LOCAL', 'AWS_S3', 'CLOUDINARY') DEFAULT 'LOCAL',
        status ENUM('SUCCESS', 'FAILED') DEFAULT 'SUCCESS',
        created_by VARCHAR(255) DEFAULT 'Super Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('database_backups table verified/created');

    // 3. Insert default storage settings if not present
    const defaultSettings = [
      ['storage_provider', 'local', 'storage', 'Active storage provider (local, s3, cloudinary)'],
      ['s3_bucket_name', '', 'storage', 'AWS S3 Bucket Name'],
      ['s3_region', 'us-east-1', 'storage', 'AWS S3 Region'],
      ['s3_access_key', '', 'storage', 'AWS Access Key ID'],
      ['s3_secret_key', '', 'storage', 'AWS Secret Access Key'],
      ['s3_endpoint', '', 'storage', 'Custom S3 Endpoint (e.g. DigitalOcean Spaces / MinIO)'],
      ['auto_backup_enabled', 'true', 'backup', 'Enable automated daily backups'],
      ['auto_backup_retention_days', '30', 'backup', 'Keep backups for N days']
    ];

    for (const [key, val, grp, desc] of defaultSettings) {
      await db.query(`
        INSERT INTO system_settings (setting_key, setting_value, setting_group, description)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE description = VALUES(description);
      `, [key, val, grp, desc]);
    }
    console.log('Default system & storage settings initialized');
    console.log('Step 3 Database Migration Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Step 3 Migration Error:', err);
    process.exit(1);
  }
}

migrateStep3();
