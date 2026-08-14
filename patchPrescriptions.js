const db = require('./config/db');

async function patchPrescriptions() {
    try {
        console.log("Adding inventory_id column to Prescriptions table...");
        await db.query(`
            ALTER TABLE Prescriptions
            ADD COLUMN inventory_id VARCHAR(36) NULL,
            ADD CONSTRAINT fk_prescriptions_inventory
              FOREIGN KEY (inventory_id) REFERENCES Inventory(id) ON DELETE SET NULL;
        `);
        console.log("Column and foreign key added successfully!");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column inventory_id already exists.");
        } else {
            console.error("Error updating schema:", e);
        }
    } finally {
        process.exit();
    }
}

patchPrescriptions();
