const pool = require('../config/db');

async function migrateStep4() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('🚀 Running Step 4 Database Migrations: Payment Gateway & Subscription Engine...');

        // 1. Alter saas_payments table to support Stripe and enhanced invoice metadata
        const columnsToAdd = [
            { name: 'stripe_session_id', type: 'VARCHAR(255) NULL' },
            { name: 'stripe_payment_intent', type: 'VARCHAR(255) NULL' },
            { name: 'billing_cycle', type: "VARCHAR(50) DEFAULT 'monthly'" },
            { name: 'subtotal_amount', type: 'DECIMAL(10, 2) DEFAULT 0.00' },
            { name: 'tax_amount', type: 'DECIMAL(10, 2) DEFAULT 0.00' },
            { name: 'customer_name', type: 'VARCHAR(255) NULL' },
            { name: 'customer_email', type: 'VARCHAR(255) NULL' },
            { name: 'invoice_pdf_url', type: 'TEXT NULL' },
            { name: 'notes', type: 'TEXT NULL' }
        ];

        const [existingCols] = await conn.query('DESCRIBE saas_payments');
        const existingColNames = existingCols.map(c => c.Field);

        for (const col of columnsToAdd) {
            if (!existingColNames.includes(col.name)) {
                await conn.query(`ALTER TABLE saas_payments ADD COLUMN ${col.name} ${col.type}`);
                console.log(`✅ Added column ${col.name} to saas_payments`);
            }
        }

        // 2. Ensure saas_plans table has standard plans
        const defaultPlans = [
            {
                id: 'plan-starter',
                name: 'Starter Plan',
                price: 599.00,
                duration_days: 30,
                features: JSON.stringify([
                    'Patient Medical Records & History',
                    'Basic Appointment Scheduling',
                    'Single Doctor Account',
                    'Standard Email Notifications'
                ]),
                is_active: 1
            },
            {
                id: 'plan-standard',
                name: 'Standard Growth',
                price: 999.00,
                duration_days: 30,
                features: JSON.stringify([
                    'Everything in Starter Plan',
                    'Up to 5 Doctors / Staff Accounts',
                    'Billing, POS & Invoicing System',
                    'Pharmacy & Inventory Management',
                    'WhatsApp / SMS Appointment Alerts'
                ]),
                is_active: 1
            },
            {
                id: 'plan-pro',
                name: 'Pro Enterprise Clinic',
                price: 1999.00,
                duration_days: 30,
                features: JSON.stringify([
                    'Everything in Standard Growth',
                    'Unlimited Doctors & Staff',
                    'AI Diagnostic Assistant & Clinical Insights',
                    'Automated Database Backup & Restore',
                    'Custom Clinic Branding & PDF Prescriptions',
                    '24/7 Dedicated Priority Support'
                ]),
                is_active: 1
            }
        ];

        for (const plan of defaultPlans) {
            await conn.query(`
                INSERT INTO saas_plans (id, name, price, duration_days, features, is_active)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name),
                    price = VALUES(price),
                    duration_days = VALUES(duration_days),
                    features = VALUES(features),
                    is_active = VALUES(is_active)
            `, [plan.id, plan.name, plan.price, plan.duration_days, plan.features, plan.is_active]);
        }
        console.log('✅ Standard SaaS Plans initialized/updated in database');

        // 3. Populate default gateway configuration in system_settings
        const defaultSettings = [
            { key: 'payment_gateway_active', value: 'razorpay' }, // 'razorpay' | 'stripe' | 'both'
            { key: 'payment_currency_default', value: 'INR' },
            { key: 'tax_percentage_gst', value: '18' },
            { key: 'company_name', value: 'Kiaan Veterinary SaaS Technologies' },
            { key: 'company_tax_id', value: 'GSTIN27AABCU9603R1ZM' },
            { key: 'company_address', value: 'Tech Innovation Park, Sector 4, Silicon Valley' },
            { key: 'company_email', value: 'billing@kiaantechnology.com' }
        ];

        for (const s of defaultSettings) {
            await conn.query(`
                INSERT INTO system_settings (setting_key, setting_value)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE setting_value = IF(setting_value IS NULL OR setting_value = '', VALUES(setting_value), setting_value)
            `, [s.key, s.value]);
        }
        console.log('✅ Default Payment & Invoicing Settings initialized in system_settings');

        console.log('🎉 Step 4 database migration completed successfully!');
    } catch (err) {
        console.error('❌ Step 4 Migration Error:', err);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

migrateStep4();
