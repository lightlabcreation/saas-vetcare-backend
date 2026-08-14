const db = require('./config/db');

async function run() {
    try {
        console.log("Checking and recreating saas_support_tickets table...");
        
        // Drop existing table first
        await db.query("DROP TABLE IF EXISTS saas_support_tickets");
        console.log("Dropped old saas_support_tickets table.");

        const createTableSql = `
            CREATE TABLE saas_support_tickets (
                id VARCHAR(50) PRIMARY KEY,
                clinic_admin_id VARCHAR(36) NULL,
                clinic VARCHAR(255) NOT NULL,
                adminName VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(255) NOT NULL,
                priority VARCHAR(50) NOT NULL,
                category VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'Open',
                updated VARCHAR(100) NOT NULL,
                messages JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await db.query(createTableSql);
        console.log("Table saas_support_tickets created successfully.");

        console.log("Seeding initial tickets...");
        const initialTickets = [
            {
                id: "TKT-1786006334931-390",
                clinic_admin_id: null,
                clinic: "Anytime Fitness Vet",
                adminName: "Rahul Sharma",
                email: "anytimefitness@gmail.com",
                subject: "Payment Issue",
                priority: "Medium",
                category: "Billing",
                status: "Replied",
                updated: "8 Aug 2026",
                messages: JSON.stringify([
                    { sender: "Admin", text: "There is an issue with the payment gateway. It shows error on checkout.", time: "06/08/26, 2:22 pm", isUser: true },
                    { sender: "Superadmin", text: "We have identified the issue. It will be resolved within 24 hours.", time: "06/08/26, 2:27 pm", isUser: false }
                ])
            },
            {
                id: "TKT-1892017382103-512",
                clinic_admin_id: null,
                clinic: "Paws & Claws Care",
                adminName: "Dr. John Doe",
                email: "john.doe@pawsclaws.com",
                subject: "Login Issue",
                priority: "High",
                category: "Technical",
                status: "Open",
                updated: "7 Aug 2026",
                messages: JSON.stringify([
                    { sender: "Admin", text: "Dashboard is loading slow today and showing connection timeout errors repeatedly.", time: "07/08/26, 10:15 am", isUser: true }
                ])
            },
            {
                id: "TKT-1634891290342-108",
                clinic_admin_id: null,
                clinic: "Happy Pets Clinic",
                adminName: "Dr. Sarah Connor",
                email: "sarah.connor@happypets.com",
                subject: "Invoice Download",
                priority: "Low",
                category: "Billing",
                status: "Closed",
                updated: "5 Aug 2026",
                messages: JSON.stringify([
                    { sender: "Admin", text: "How do I download duplicate copies of receipts from the billing section?", time: "05/08/26, 11:30 am", isUser: true },
                    { sender: "Superadmin", text: "You can go to Billing & POS and click the download icon next to any invoice.", time: "05/08/26, 11:45 am", isUser: false }
                ])
            }
        ];

        for (const t of initialTickets) {
            await db.query(
                `INSERT INTO saas_support_tickets 
                (id, clinic_admin_id, clinic, adminName, email, subject, priority, category, status, updated, messages) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [t.id, t.clinic_admin_id, t.clinic, t.adminName, t.email, t.subject, t.priority, t.category, t.status, t.updated, t.messages]
            );
        }
        console.log("Seeding complete successfully!");
        process.exit(0);
    } catch (e) {
        console.error("Migration error:", e);
        process.exit(1);
    }
}

run();
