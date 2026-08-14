const db = require('./config/db');

async function run() {
    try {
        console.log("Checking and creating hospitalization_cages table...");

        const createTableSql = `
            CREATE TABLE IF NOT EXISTS hospitalization_cages (
                id VARCHAR(50) NOT NULL,
                clinic_id VARCHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100) NOT NULL,
                status ENUM('Vacant', 'Occupied', 'Cleaning Needed') DEFAULT 'Vacant',
                pet_id VARCHAR(36) DEFAULT NULL,
                reason TEXT DEFAULT NULL,
                check_in VARCHAR(255) DEFAULT NULL,
                flowsheet JSON DEFAULT NULL,
                PRIMARY KEY (id, clinic_id),
                FOREIGN KEY (clinic_id) REFERENCES Clinics(id) ON DELETE CASCADE,
                FOREIGN KEY (pet_id) REFERENCES Pets(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `;
        
        await db.query(createTableSql);
        console.log("Table 'hospitalization_cages' created successfully or already exists.");
        
        process.exit(0);
    } catch (e) {
        console.error("Migration error creating hospitalization_cages:", e);
        process.exit(1);
    }
}

run();
