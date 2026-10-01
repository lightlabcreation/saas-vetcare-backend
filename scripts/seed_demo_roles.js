const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function seedDemoRoles() {
  let pool;
  const portsToTry = [process.env.DB_PORT || 3306, 3306, 3307];
  
  for (const p of portsToTry) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'veterinary',
        port: Number(p),
        waitForConnections: true,
        connectionLimit: 5
      });
      await pool.getConnection();
      console.log(`Successfully connected to MySQL database on port ${p}`);
      break;
    } catch (err) {
      console.log(`Port ${p} connection failed, trying next...`);
    }
  }

  try {
    // Find or create a demo clinic
    let clinicId = 'demo-clinic-001';
    const [clinics] = await pool.query('SELECT * FROM clinics LIMIT 1');
    if (clinics.length > 0) {
      clinicId = clinics[0].id;
      console.log(`Using existing clinic: ${clinics[0].name} (${clinicId})`);
    } else {
      await pool.query(
        `INSERT INTO clinics (id, name, email, phone, status, subscription_plan) VALUES (?, ?, ?, ?, ?, ?)`,
        [clinicId, 'PetCare Pro Demo Clinic', 'demo.admin@petcare.com', '9876543210', 'Active', 'Pro']
      );
      console.log('Created Demo Clinic');
    }

    const passwordHash = await bcrypt.hash('Password123!', 10);

    const demoUsers = [
      {
        id: 'user-demo-admin-01',
        name: 'Alex Admin (Admin)',
        email: 'demo.admin@petcare.com',
        role: 'Admin',
        phone: '+19876543210',
        department: 'Administration'
      },
      {
        id: 'user-demo-doctor-01',
        name: 'Dr. Sarah Connor (Doctor)',
        email: 'demo.doctor@petcare.com',
        role: 'Doctor',
        phone: '+19876543211',
        department: 'Veterinary Surgery'
      },
      {
        id: 'user-demo-manager-01',
        name: 'Michael Scott (Manager)',
        email: 'demo.manager@petcare.com',
        role: 'Manager',
        phone: '+19876543212',
        department: 'Operations'
      },
      {
        id: 'user-demo-reception-01',
        name: 'Pam Beesly (Receptionist)',
        email: 'demo.receptionist@petcare.com',
        role: 'Receptionist',
        phone: '+19876543213',
        department: 'Front Desk'
      },
      {
        id: 'user-demo-assistant-01',
        name: 'Dwight Schrute (Vet Assistant)',
        email: 'demo.assistant@petcare.com',
        role: 'Vet Assistant',
        phone: '+19876543214',
        department: 'Clinical Support'
      }
    ];

    for (const u of demoUsers) {
      const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [u.email]);
      if (existing.length > 0) {
        await pool.query(
          `UPDATE users SET name = ?, password_hash = ?, role = ?, status = 'Active', clinic_id = ? WHERE email = ?`,
          [u.name, passwordHash, u.role, clinicId, u.email]
        );
        console.log(`✅ Updated demo account: ${u.role} -> ${u.email}`);
      } else {
        await pool.query(
          `INSERT INTO users (id, clinic_id, name, email, password_hash, role, phone, department, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
          [u.id, clinicId, u.name, u.email, passwordHash, u.role, u.phone, u.department]
        );
        console.log(`✅ Created demo account: ${u.role} -> ${u.email}`);
      }
    }

    console.log('🎉 ALL 5 DEMO ROLE ACCOUNTS CREATED SUCCESSFULLY!');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding demo roles:', err);
    process.exit(1);
  }
}

seedDemoRoles();
