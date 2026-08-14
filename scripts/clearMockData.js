const pool = require('../config/db');

async function clearMockData() {
  console.log('[Mock Data Purge] Starting safe business mock data cleanup...');

  const connection = await pool.getConnection();
  const dbName = process.env.DB_NAME || 'veterinary_db';

  try {
    // 1. Get all existing table names in database
    const [existingTableRows] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [dbName]
    );
    const existingTables = new Set(existingTableRows.map(r => r.TABLE_NAME.toLowerCase()));

    await connection.beginTransaction();
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    const businessTables = [
      'inventory',
      'pet_owners',
      'pets',
      'appointments',
      'invoices',
      'invoice_items',
      'clinical_encounters',
      'diagnostic_reports',
      'email_reminders',
      'home_visits'
    ];

    for (const table of businessTables) {
      if (existingTables.has(table.toLowerCase())) {
        try {
          await connection.query(`TRUNCATE TABLE \`${table}\``);
          console.log(`[Mock Data Purge] Cleared table: ${table}`);
        } catch (err) {
          await connection.query(`DELETE FROM \`${table}\``);
          console.log(`[Mock Data Purge] Deleted rows from table: ${table}`);
        }
      } else {
        console.log(`[Mock Data Purge] Table '${table}' does not exist in schema. Skipping.`);
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();

    // Verify 'users' table remains intact
    const [userRows] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`[Mock Data Purge] Verification: 'users' table preserved with ${userRows[0].count} staff/demo accounts.`);

    return { success: true };
  } catch (error) {
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.rollback();
    console.error('[Mock Data Purge Error] Rollback executed:', error);
    throw error;
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  clearMockData().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = clearMockData;
