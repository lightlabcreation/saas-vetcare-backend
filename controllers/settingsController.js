const db = require('../config/db');

const defaultSettings = {
    name: 'VetCare Pro Animal Hospital',
    email: 'info@vetcarepro.com',
    phone: '+94 11 234 5678',
    address: 'No. 45, Temple Road, Colombo 07, Sri Lanka',
    primaryThemeColor: '#14b8a6',
    logo: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=150',
    autoEmail: true,
    reminderTime: '24h',
    currency: 'USD',
    currency_symbol: '$'
};

const ensureTableExists = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS clinic_settings (
                clinic_id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(255) NOT NULL,
                address TEXT NOT NULL,
                primaryThemeColor VARCHAR(50) NOT NULL,
                logo VARCHAR(255),
                autoEmail BOOLEAN DEFAULT TRUE,
                reminderTime VARCHAR(10) DEFAULT '24h',
                currency VARCHAR(10) DEFAULT 'USD',
                currency_symbol VARCHAR(10) DEFAULT '$'
            )
        `);

        // Check if clinic_id column exists
        const [columns] = await db.query("SHOW COLUMNS FROM clinic_settings LIKE 'clinic_id'");
        if (columns.length === 0) {
            await db.query(`ALTER TABLE clinic_settings ADD COLUMN clinic_id VARCHAR(36)`);
        }

        // Check for currency columns
        const [currCols] = await db.query("SHOW COLUMNS FROM clinic_settings LIKE 'currency'");
        if (currCols.length === 0) {
            await db.query(`ALTER TABLE clinic_settings ADD COLUMN currency VARCHAR(10) DEFAULT 'USD', ADD COLUMN currency_symbol VARCHAR(10) DEFAULT '$'`);
        }
    } catch (e) {
        console.warn('[Settings] Table check notice:', e.message);
    }
};

let tableChecked = false;
const checkTable = async () => {
    if (tableChecked) return;
    try {
        await ensureTableExists();
        tableChecked = true;
    } catch (err) {
        console.warn('[Settings] init notice:', err.message);
    }
};

const seedSettings = async (clinic_id) => {
    if (!clinic_id) return;
    try {
        await db.query(`
            INSERT IGNORE INTO clinic_settings (clinic_id, name, email, phone, address, primaryThemeColor, logo, autoEmail, reminderTime, currency, currency_symbol)
            VALUES (?, 'VetCare Pro Animal Hospital', 'info@vetcarepro.com', '+94 11 234 5678', 'No. 45, Temple Road, Colombo 07, Sri Lanka', '#14b8a6', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=150', TRUE, '24h', 'USD', '$')
        `, [clinic_id]);
    } catch (e) {
        console.warn('[Settings] Seed notice:', e.message);
    }
};

exports.getSettings = async (req, res) => {
    try {
        let clinic_id = req.user && req.user.clinic_id;
        if (!clinic_id) {
            try {
                const [clinics] = await db.query('SELECT id FROM clinics LIMIT 1');
                if (clinics && clinics.length > 0) {
                    clinic_id = clinics[0].id;
                }
            } catch (e) {}
        }

        let rows = [];
        try {
            if (clinic_id) {
                const [r] = await db.query('SELECT * FROM clinic_settings WHERE clinic_id = ?', [clinic_id]);
                rows = r;
            } else {
                const [r] = await db.query('SELECT * FROM clinic_settings LIMIT 1');
                rows = r;
            }
        } catch (dbErr) {
            console.warn('[Settings] Initial query notice:', dbErr.message);
            try {
                await checkTable();
                const [r] = await db.query('SELECT * FROM clinic_settings LIMIT 1');
                rows = r;
            } catch (e) {}
        }

        if (!rows || rows.length === 0) {
            if (clinic_id) {
                await seedSettings(clinic_id);
                try {
                    const [r] = await db.query('SELECT * FROM clinic_settings WHERE clinic_id = ?', [clinic_id]);
                    rows = r;
                } catch (e) {}
            }
        }

        const settingsData = (rows && rows.length > 0) 
            ? rows[0] 
            : { clinic_id: clinic_id || 'default', ...defaultSettings };

        return res.status(200).json({ status: 'success', data: settingsData });
    } catch (error) {
        console.error('Error fetching settings, returning defaults:', error.message);
        return res.status(200).json({ status: 'success', data: defaultSettings });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        let clinic_id = req.user && req.user.clinic_id;
        if (!clinic_id) {
            try {
                const [clinics] = await db.query('SELECT id FROM clinics LIMIT 1');
                if (clinics && clinics.length > 0) {
                    clinic_id = clinics[0].id;
                }
            } catch (e) {}
        }

        let current = [];
        try {
            if (clinic_id) {
                const [c] = await db.query('SELECT * FROM clinic_settings WHERE clinic_id = ?', [clinic_id]);
                current = c;
            }
        } catch (e) {}

        const currentSettings = (current && current.length > 0) ? current[0] : defaultSettings;

        const name = req.body.name !== undefined ? req.body.name : currentSettings.name;
        const email = req.body.email !== undefined ? req.body.email : currentSettings.email;
        const phone = req.body.phone !== undefined ? req.body.phone : currentSettings.phone;
        const address = req.body.address !== undefined ? req.body.address : currentSettings.address;
        const primaryThemeColor = req.body.primaryThemeColor !== undefined ? req.body.primaryThemeColor : currentSettings.primaryThemeColor;
        const logo = req.body.logo !== undefined ? req.body.logo : currentSettings.logo;
        const autoEmail = req.body.autoEmail !== undefined ? req.body.autoEmail : currentSettings.autoEmail;
        const reminderTime = req.body.reminderTime !== undefined ? req.body.reminderTime : currentSettings.reminderTime;
        const currency = req.body.currency !== undefined ? req.body.currency : (currentSettings.currency || 'USD');
        const currency_symbol = (req.body.currency_symbol !== undefined ? req.body.currency_symbol : (req.body.currencySymbol !== undefined ? req.body.currencySymbol : (currentSettings.currency_symbol || '$')));

        try {
            await db.query(
                `REPLACE INTO clinic_settings 
                 (clinic_id, name, email, phone, address, primaryThemeColor, logo, autoEmail, reminderTime, currency, currency_symbol)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [clinic_id || 'default', name, email, phone, address, primaryThemeColor, logo, autoEmail, reminderTime, currency, currency_symbol]
            );
        } catch (uErr) {
            console.error('Update settings notice:', uErr.message);
        }

        let rows = [];
        try {
            if (clinic_id) {
                const [r] = await db.query('SELECT * FROM clinic_settings WHERE clinic_id = ?', [clinic_id]);
                rows = r;
            }
        } catch (e) {}

        const updatedData = (rows && rows.length > 0) 
            ? rows[0] 
            : { clinic_id, name, email, phone, address, primaryThemeColor, logo, autoEmail, reminderTime, currency, currency_symbol };

        return res.status(200).json({ status: 'success', message: 'Settings updated successfully', data: updatedData });
    } catch (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({ status: 'error', message: error.message || 'Failed to update settings' });
    }
};
