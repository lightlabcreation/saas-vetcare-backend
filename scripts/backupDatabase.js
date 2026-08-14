const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../database/backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFilePath = path.join(backupDir, `veterinary_db_backup_${timestamp}.sql`);
  console.log(`[Backup] Creating database backup at: ${backupFilePath}`);

  try {
    const [tables] = await pool.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    const dbName = process.env.DB_NAME || 'veterinary_db';
    const tableKey = `Tables_in_${dbName}`;

    let sqlDump = `-- VETERINARY DB BACKUP GENERATED AT ${new Date().toISOString()}\n`;
    sqlDump += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

    for (const tableObj of tables) {
      const tableName = tableObj[tableKey] || Object.values(tableObj)[0];
      
      // Get CREATE TABLE statement
      const [createResult] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
      sqlDump += `-- Structure for table \`${tableName}\` --\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlDump += `${createResult[0]['Create Table']};\n\n`;

      // Get Table Rows
      const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        sqlDump += `-- Data for table \`${tableName}\` --\n`;
        const columns = Object.keys(rows[0]).map(col => `\`${col}\``).join(', ');
        
        for (const row of rows) {
          const values = Object.values(row).map(val => {
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val;
            if (typeof val === 'boolean') return val ? 1 : 0;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return `'${String(val).replace(/'/g, "''").replace(/\\/g, "\\\\")}'`;
          }).join(', ');
          
          sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
        }
        sqlDump += `\n`;
      }
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;
    fs.writeFileSync(backupFilePath, sqlDump, 'utf8');

    const stats = fs.statSync(backupFilePath);
    console.log(`[Backup] Database backup completed successfully. File size: ${(stats.size / 1024).toFixed(2)} KB`);
    return { success: true, filePath: backupFilePath, size: stats.size };
  } catch (error) {
    console.error('[Backup Error] Failed to create database backup:', error);
    throw error;
  }
}

if (require.main === module) {
  backupDatabase().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = backupDatabase;
