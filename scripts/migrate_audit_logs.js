require('dotenv').config();
const pool = require('../config/db');

async function migrate() {
  try {
    const [cols] = await pool.query('DESCRIBE audit_logs');
    const existing = cols.map(c => c.Field);
    
    const columnsToAdd = [
      { name: 'clinic_id', type: 'VARCHAR(100) NULL' },
      { name: 'entity', type: 'VARCHAR(100) NULL' },
      { name: 'entity_id', type: 'VARCHAR(100) NULL' },
      { name: 'method', type: 'VARCHAR(10) NULL' },
      { name: 'endpoint', type: 'VARCHAR(255) NULL' },
      { name: 'status_code', type: 'INT NULL' },
      { name: 'response_time_ms', type: 'INT NULL' },
      { name: 'status', type: "VARCHAR(20) DEFAULT 'SUCCESS'" },
      { name: 'old_values', type: 'TEXT NULL' },
      { name: 'new_values', type: 'TEXT NULL' },
      { name: 'user_agent', type: 'TEXT NULL' }
    ];

    for (const col of columnsToAdd) {
      if (!existing.includes(col.name)) {
        await pool.query(`ALTER TABLE audit_logs ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Added ${col.name} column`);
      }
    }
    
    // Add indexes for high-speed log filtering & performance dashboard analytics
    try {
      await pool.query('CREATE INDEX idx_audit_clinic_created ON audit_logs(clinic_id, created_at)');
    } catch (e) {}
    try {
      await pool.query('CREATE INDEX idx_audit_status ON audit_logs(status)');
    } catch (e) {}
    try {
      await pool.query('CREATE INDEX idx_audit_response_time ON audit_logs(response_time_ms)');
    } catch (e) {}

    console.log('Audit logs migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
