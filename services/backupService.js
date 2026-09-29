const db = require('../config/db');
const crypto = require('crypto');

class BackupService {
    /**
     * Generates a complete SQL dump of the entire MySQL database.
     * Compatible with Railway, Docker, Localhost and any cloud container.
     */
    async generateSqlDump() {
        const [tablesResult] = await db.query('SHOW TABLES');
        const dbNameKey = Object.keys(tablesResult[0] || {})[0];
        const tableNames = tablesResult.map(row => row[dbNameKey]);

        let sqlDump = `-- ========================================================\n`;
        sqlDump += `-- PetCare Pro Veterinary SaaS - Full Database Dump\n`;
        sqlDump += `-- Generated At: ${new Date().toISOString()}\n`;
        sqlDump += `-- Tables Count: ${tableNames.length}\n`;
        sqlDump += `-- ========================================================\n\n`;
        sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n`;
        sqlDump += `SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n`;
        sqlDump += `SET NAMES utf8mb4;\n\n`;

        let totalRowsCount = 0;

        for (const tableName of tableNames) {
            // 1. Get Table Structure
            const [createTableResult] = await db.query(`SHOW CREATE TABLE \`${tableName}\``);
            const createSql = createTableResult[0]['Create Table'];

            sqlDump += `-- --------------------------------------------------------\n`;
            sqlDump += `-- Table structure for table \`${tableName}\`\n`;
            sqlDump += `-- --------------------------------------------------------\n`;
            sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            sqlDump += `${createSql};\n\n`;

            // 2. Get Table Data
            const [rows] = await db.query(`SELECT * FROM \`${tableName}\``);
            totalRowsCount += rows.length;

            if (rows.length > 0) {
                sqlDump += `-- Dumping data for table \`${tableName}\` (${rows.length} rows)\n`;
                const columns = Object.keys(rows[0]).map(col => `\`${col}\``).join(', ');

                // Chunk inserts in batches of 50 for optimal restore performance
                const chunkSize = 50;
                for (let i = 0; i < rows.length; i += chunkSize) {
                    const chunk = rows.slice(i, i + chunkSize);
                    const valuesSql = chunk.map(row => {
                        const vals = Object.values(row).map(val => {
                            if (val === null || val === undefined) return 'NULL';
                            if (typeof val === 'number') return val;
                            if (typeof val === 'boolean') return val ? 1 : 0;
                            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
                            // Escape single quotes and backslashes
                            const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
                            return `'${str}'`;
                        }).join(', ');
                        return `(${vals})`;
                    }).join(',\n');

                    sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES\n${valuesSql};\n`;
                }
                sqlDump += `\n`;
            }
        }

        sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
        sqlDump += `-- Dump completed at: ${new Date().toISOString()}\n`;

        const filename = `petcare-backup-${new Date().toISOString().slice(0, 10)}-${Date.now().toString().slice(-4)}.sql`;
        const sizeKb = Math.round(Buffer.byteLength(sqlDump, 'utf8') / 1024);

        // Record in database_backups log table
        try {
            const backupId = crypto.randomUUID ? crypto.randomUUID() : `bkp-${Date.now()}`;
            await db.query(`
                INSERT INTO database_backups (id, filename, file_size_kb, tables_count, total_rows, backup_type, storage_location, status)
                VALUES (?, ?, ?, ?, ?, 'MANUAL', 'LOCAL', 'SUCCESS')
            `, [backupId, filename, sizeKb, tableNames.length, totalRowsCount]);
        } catch (logErr) {
            console.error('Failed to log backup history:', logErr);
        }

        return {
            filename,
            sizeKb,
            tablesCount: tableNames.length,
            totalRows: totalRowsCount,
            sqlDump
        };
    }

    /**
     * Get backup history logs
     */
    async getBackupHistory(limit = 20) {
        const [rows] = await db.query(`
            SELECT * FROM database_backups 
            ORDER BY created_at DESC 
            LIMIT ?
        `, [limit]);
        return rows;
    }
}

module.exports = new BackupService();
