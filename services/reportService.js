const db = require('../config/db');

class ReportService {
    async getRevenueAnalytics(clinic_id, startDate, endDate) {
        // Daily revenue trend (defaults to last 30 days)
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        // 1. Line chart monthly revenue trend
        const [monthlyRows] = await db.query(`
            SELECT 
                DATE_FORMAT(invoice_date, '%b') as month,
                DATE_FORMAT(invoice_date, '%Y-%m') as sortKey,
                SUM(grand_total) as revenue
            FROM invoices
            WHERE status = 'Paid' AND clinic_id = ?
            GROUP BY DATE_FORMAT(invoice_date, '%b'), DATE_FORMAT(invoice_date, '%Y-%m')
            ORDER BY sortKey ASC
            LIMIT 12
        `, [clinic_id]);

        // If no records, return a minimal fallback structure
        const revenueTrend = monthlyRows.length > 0 ? monthlyRows.map(r => ({
            month: r.month,
            revenue: parseFloat(r.revenue) || 0
        })) : [
            { month: 'Current', revenue: 0 }
        ];

        // 2. Summary KPI calculation
        const [kpiRows] = await db.query(`
            SELECT 
                COALESCE(SUM(grand_total), 0) as grossYield,
                COALESCE(SUM(grand_total) / NULLIF(COUNT(id), 0), 0) as averageTicket,
                COUNT(id) as totalInvoices
            FROM invoices
            WHERE status = 'Paid' AND clinic_id = ?
        `, [clinic_id]);

        const [activePatientsRows] = await db.query(`
            SELECT COUNT(*) as count FROM pets WHERE clinic_id = ?
        `, [clinic_id]);

        return {
            revenueTrend,
            grossYield: parseFloat(kpiRows[0].grossYield),
            averageTicket: parseFloat(kpiRows[0].averageTicket),
            totalInvoices: kpiRows[0].totalInvoices,
            activePatients: activePatientsRows[0].count
        };
    }

    async getAppointmentAnalytics(clinic_id) {
        const [rows] = await db.query(`
            SELECT 
                WEEKDAY(appointment_date) as weekdayIdx,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status IN ('Upcoming', 'Confirmed', 'Pending') THEN 1 ELSE 0 END) as upcoming,
                SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
            FROM appointments
            WHERE appointment_date IS NOT NULL AND clinic_id = ?
            GROUP BY WEEKDAY(appointment_date)
            ORDER BY weekdayIdx ASC
        `, [clinic_id]);

        const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weekdayMap = {};
        weekdays.forEach(day => {
            weekdayMap[day] = { day, completed: 0, upcoming: 0, cancelled: 0 };
        });

        if (rows && rows.length > 0) {
            rows.forEach(r => {
                const dayName = weekdays[r.weekdayIdx];
                if (dayName && weekdayMap[dayName]) {
                    weekdayMap[dayName].completed = parseInt(r.completed) || 0;
                    weekdayMap[dayName].upcoming = parseInt(r.upcoming) || 0;
                    weekdayMap[dayName].cancelled = parseInt(r.cancelled) || 0;
                }
            });
        }

        return weekdays.map(day => weekdayMap[day]).slice(0, 6);
    }


    async getPatientDemographics(clinic_id) {
        const [totalRows] = await db.query('SELECT COUNT(*) as total FROM pets WHERE clinic_id = ?', [clinic_id]);
        const total = totalRows[0].total || 1;

        const [rows] = await db.query(`
            SELECT species, COUNT(*) as count 
            FROM pets 
            WHERE clinic_id = ?
            GROUP BY species 
            ORDER BY count DESC
        `, [clinic_id]);

        const colors = {
            'Dog': '#3b82f6',
            'Cat': '#14b8a6',
            'Bird': '#f59e0b',
            'Other': '#6366f1'
        };

        let mapped = rows.map(r => {
            const name = r.species ? r.species.charAt(0).toUpperCase() + r.species.slice(1) : 'Other';
            const value = Math.round((r.count / total) * 100);
            const color = colors[name] || '#6366f1';
            return { name, value, color };
        });

        if (mapped.length === 0) {
            mapped = [{ name: 'No Pets', value: 100, color: '#cbd5e1' }];
        }

        return mapped;
    }

    async getDoctorAudit(clinic_id) {
        const [rows] = await db.query(`
            SELECT 
                u.name,
                COALESCE((SELECT COUNT(DISTINCT pet_id) FROM clinical_encounters WHERE doctor_id = u.id AND clinic_id = ?), 0) as patients,
                COALESCE((SELECT COUNT(*) FROM clinical_encounters WHERE doctor_id = u.id AND clinic_id = ?), 0) as consultations,
                COALESCE((SELECT COUNT(*) FROM home_visits WHERE doctor_id = u.id AND visit_status = 'Completed' AND clinic_id = ?), 0) as home_visits,
                COALESCE((SELECT SUM(grand_total) FROM invoices WHERE doctor_id = u.id AND status = 'Paid' AND clinic_id = ?), 0) as revenue,
                COALESCE((SELECT SUM(working_hours) FROM attendance WHERE user_id = u.id AND status = 'Present' AND clinic_id = ?), 0) as hours
            FROM users u
            WHERE u.role = 'Doctor' AND u.status = 'Active' AND u.clinic_id = ?
            ORDER BY consultations DESC, home_visits DESC
        `, [clinic_id, clinic_id, clinic_id, clinic_id, clinic_id, clinic_id]);

        return rows.map(r => ({
            name: r.name,
            patients: parseInt(r.patients) || 0,
            consultations: parseInt(r.consultations) || 0,
            home_visits: parseInt(r.home_visits) || 0,
            revenue: parseFloat(r.revenue) || 0,
            hours: parseFloat(r.hours) ? parseFloat(r.hours).toFixed(0) : '0',
            rating: 4.8 // Default static rating since it is not database tracked
        }));
    }

    async getInventoryResourceAlerts(clinic_id) {
        const [rows] = await db.query(`
            SELECT 
                id as sku,
                name,
                category,
                quantity as qty,
                selling_price as price,
                DATE_FORMAT(expiry_date, '%Y-%m-%d') as expiry,
                CASE 
                    WHEN quantity <= 0 THEN 'Out of Stock'
                    ELSE 'Low Stock'
                END as status
            FROM inventory
            WHERE (quantity <= low_stock_threshold OR expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)) AND clinic_id = ?
            ORDER BY quantity ASC
        `, [clinic_id]);
        return rows;
    }

    async getPersonalDoctorRevenue(clinic_id, doctor_id) {
        // 1. Calculate metrics:
        // Revenue (paid invoices where this doctor is assigned)
        const [revenueRows] = await db.query(`
            SELECT COALESCE(SUM(grand_total), 0) as totalRevenue 
            FROM invoices 
            WHERE doctor_id = ? AND clinic_id = ? AND status = 'Paid'
        `, [doctor_id, clinic_id]);
        
        // Consultations completed (total encounters by this doctor)
        const [consultationsRows] = await db.query(`
            SELECT COUNT(*) as totalConsultations 
            FROM clinical_encounters 
            WHERE doctor_id = ? AND clinic_id = ?
        `, [doctor_id, clinic_id]);
        
        // Treatments performed (encounters where treatment is non-empty)
        const [treatmentsRows] = await db.query(`
            SELECT COUNT(*) as totalTreatments 
            FROM clinical_encounters 
            WHERE doctor_id = ? AND clinic_id = ? AND treatment IS NOT NULL AND treatment != ''
        `, [doctor_id, clinic_id]);

        // Home visits completed
        const [homeVisitsRows] = await db.query(`
            SELECT COUNT(*) as totalHomeVisits 
            FROM home_visits 
            WHERE doctor_id = ? AND clinic_id = ? AND visit_status = 'Completed'
        `, [doctor_id, clinic_id]);

        // 2. Daily revenue trend (Past 30 days)
        const [trendRows] = await db.query(`
            SELECT 
                DATE_FORMAT(invoice_date, '%d %b') as day,
                SUM(grand_total) as revenue,
                COUNT(id) as consultations
            FROM invoices 
            WHERE doctor_id = ? AND clinic_id = ? AND status = 'Paid'
              AND invoice_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY invoice_date
            ORDER BY invoice_date ASC
        `, [doctor_id, clinic_id]);

        // 3. Income breakdown by item category
        const [breakdownRows] = await db.query(`
            SELECT 
                COALESCE(inv.category, 'Service') as name,
                SUM(ili.total) as value
            FROM invoice_line_items ili
            JOIN invoices i ON ili.invoice_id = i.id
            LEFT JOIN inventory inv ON ili.inventory_id = inv.id
            WHERE i.doctor_id = ? AND i.clinic_id = ? AND i.status = 'Paid'
            GROUP BY COALESCE(inv.category, 'Service')
        `, [doctor_id, clinic_id]);

        return {
            metrics: {
                revenue: parseFloat(revenueRows[0].totalRevenue) || 0,
                consultations: parseInt(consultationsRows[0].totalConsultations) || 0,
                treatments: parseInt(treatmentsRows[0].totalTreatments) || 0,
                homeVisits: parseInt(homeVisitsRows[0].totalHomeVisits) || 0
            },
            trend: trendRows.map(r => ({
                day: r.day,
                revenue: parseFloat(r.revenue) || 0,
                consultations: parseInt(r.consultations) || 0
            })),
            breakdown: breakdownRows.map(r => ({
                name: r.name,
                value: parseFloat(r.value) || 0
            }))
        };
    }
}

module.exports = new ReportService();
