const db = require('../config/db');

const ensureTableExists = async () => {
    // Check if Clinic_Settings exists and migrate it to use clinic_id
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM Clinic_Settings LIKE 'clinic_id'");
        if (columns.length === 0) {
            // Add clinic_id, drop id, make clinic_id primary key
            await db.query(`ALTER TABLE Clinic_Settings ADD COLUMN clinic_id VARCHAR(36)`);
            await db.query(`UPDATE Clinic_Settings SET clinic_id = 'd0b5e28a-7e18-472a-bf3b-5517f8a7e0f2' WHERE clinic_id IS NULL`);
            await db.query(`ALTER TABLE Clinic_Settings MODIFY COLUMN clinic_id VARCHAR(36) NOT NULL`);
            await db.query(`ALTER TABLE Clinic_Settings DROP PRIMARY KEY, DROP COLUMN id`);
            await db.query(`ALTER TABLE Clinic_Settings ADD PRIMARY KEY (clinic_id)`);
            await db.query(`ALTER TABLE Clinic_Settings ADD CONSTRAINT fk_clinic_settings_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id)`);
        }
    } catch (e) {
        // Table doesn't exist, create it
        await db.query(`
            CREATE TABLE IF NOT EXISTS Clinic_Settings (
                clinic_id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(255) NOT NULL,
                address TEXT NOT NULL,
                primaryThemeColor VARCHAR(50) NOT NULL,
                logo VARCHAR(255),
                autoEmail BOOLEAN DEFAULT TRUE,
                reminderTime VARCHAR(10) DEFAULT '24h',
                FOREIGN KEY (clinic_id) REFERENCES clinics(id)
            )
        `);
    }
};

let tableChecked = false;
const checkTable = async () => {
    if (tableChecked) return;
    try {
        await ensureTableExists();
        tableChecked = true;
    } catch (err) {
        console.error('Failed to initialize Clinic_Settings table:', err);
    }
};

const seedSettings = async (clinic_id) => {
    await db.query(`
        INSERT IGNORE INTO Clinic_Settings (clinic_id, name, email, phone, address, primaryThemeColor, logo, autoEmail, reminderTime)
        VALUES (?, 'VetCare Pro Animal Hospital', 'info@vetcarepro.com', '+94 11 234 5678', 'No. 45, Temple Road, Colombo 07, Sri Lanka', '#14b8a6', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=150', TRUE, '24h')
    `, [clinic_id]);
}

exports.getSettings = async (req, res) => {
    try {
        await checkTable();
        const clinic_id = req.user.clinic_id;
        let [rows] = await db.query('SELECT * FROM Clinic_Settings WHERE clinic_id = ?', [clinic_id]);
        
        if (rows.length === 0) {
            await seedSettings(clinic_id);
            [rows] = await db.query('SELECT * FROM Clinic_Settings WHERE clinic_id = ?', [clinic_id]);
        }
        
        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch settings' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        await checkTable();
        const clinic_id = req.user.clinic_id;
        let [current] = await db.query('SELECT * FROM Clinic_Settings WHERE clinic_id = ?', [clinic_id]);
        
        if (current.length === 0) {
            await seedSettings(clinic_id);
            [current] = await db.query('SELECT * FROM Clinic_Settings WHERE clinic_id = ?', [clinic_id]);
        }
        
        const currentSettings = current[0];

        const name = req.body.name !== undefined ? req.body.name : currentSettings.name;
        const email = req.body.email !== undefined ? req.body.email : currentSettings.email;
        const phone = req.body.phone !== undefined ? req.body.phone : currentSettings.phone;
        const address = req.body.address !== undefined ? req.body.address : currentSettings.address;
        const primaryThemeColor = req.body.primaryThemeColor !== undefined ? req.body.primaryThemeColor : currentSettings.primaryThemeColor;
        const logo = req.body.logo !== undefined ? req.body.logo : currentSettings.logo;
        const autoEmail = req.body.autoEmail !== undefined ? req.body.autoEmail : currentSettings.autoEmail;
        const reminderTime = req.body.reminderTime !== undefined ? req.body.reminderTime : currentSettings.reminderTime;

        await db.query(
            `UPDATE Clinic_Settings 
             SET name = ?, email = ?, phone = ?, address = ?, primaryThemeColor = ?, logo = ?, autoEmail = ?, reminderTime = ? 
             WHERE clinic_id = ?`,
            [name, email, phone, address, primaryThemeColor, logo, autoEmail, reminderTime, clinic_id]
        );

        const [rows] = await db.query('SELECT * FROM Clinic_Settings WHERE clinic_id = ?', [clinic_id]);
        res.status(200).json({ status: 'success', message: 'Settings updated successfully', data: rows[0] });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update settings' });
    }
};
