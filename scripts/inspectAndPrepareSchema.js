const pool = require('../config/db');

async function inspectAndPrepareSchema() {
  console.log('[Schema Inspector] Inspecting database tables...');
  const dbName = process.env.DB_NAME || 'veterinary_db';
  const alterations = [];

  try {
    // 1. Inspect 'inventory' table columns
    const [invColumns] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'inventory'`,
      [dbName]
    );
    const existingInvCols = new Set(invColumns.map(col => col.COLUMN_NAME.toLowerCase()));

    // Target columns for inventory
    const targetInvCols = [
      { name: 'unit', type: "VARCHAR(50) DEFAULT 'Pieces'" },
      { name: 'barcode', type: "VARCHAR(100) DEFAULT NULL" },
      { name: 'batch_number', type: "VARCHAR(100) DEFAULT NULL" },
      { name: 'status', type: "ENUM('Active', 'Inactive') DEFAULT 'Active'" }
    ];

    for (const target of targetInvCols) {
      if (!existingInvCols.has(target.name.toLowerCase())) {
        console.log(`[Schema Inspector] Adding missing column 'inventory.${target.name}'...`);
        await pool.query(`ALTER TABLE \`inventory\` ADD COLUMN \`${target.name}\` ${target.type}`);
        alterations.push(`Added inventory.${target.name}`);
      } else {
        console.log(`[Schema Inspector] Column 'inventory.${target.name}' already exists.`);
      }
    }

    // 2. Inspect 'pet_owners' table columns
    const [ownerColumns] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pet_owners'`,
      [dbName]
    );
    const existingOwnerCols = new Set(ownerColumns.map(col => col.COLUMN_NAME.toLowerCase()));

    const targetOwnerCols = [
      { name: 'customer_number', type: "VARCHAR(100) DEFAULT NULL" }
    ];

    for (const target of targetOwnerCols) {
      if (!existingOwnerCols.has(target.name.toLowerCase())) {
        console.log(`[Schema Inspector] Adding missing column 'pet_owners.${target.name}'...`);
        await pool.query(`ALTER TABLE \`pet_owners\` ADD COLUMN \`${target.name}\` ${target.type}`);
        alterations.push(`Added pet_owners.${target.name}`);
      } else {
        console.log(`[Schema Inspector] Column 'pet_owners.${target.name}' already exists.`);
      }
    }

    console.log(`[Schema Inspector] Schema preparation complete. Total modifications: ${alterations.length}`);
    return { success: true, alterations };
  } catch (error) {
    console.error('[Schema Inspector Error] Failed to inspect or update database schema:', error);
    throw error;
  }
}

if (require.main === module) {
  inspectAndPrepareSchema().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = inspectAndPrepareSchema;
