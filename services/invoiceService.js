const db = require('../config/db');
const crypto = require('crypto');

exports.getAllInvoices = async (clinic_id) => {
    const [rows] = await db.query(`
        SELECT i.*, po.name as ownerName, p.name as petName, u.name as doctorName
        FROM invoices i
        LEFT JOIN pet_owners po ON i.owner_id = po.id
        LEFT JOIN pets p ON i.pet_id = p.id
        LEFT JOIN users u ON i.doctor_id = u.id
        WHERE i.clinic_id = ?
        ORDER BY i.invoice_date DESC, i.id DESC
    `, [clinic_id]);
    return rows;
};

exports.getInvoicesByPetId = async (clinic_id, pet_id) => {
    const [rows] = await db.query(`
        SELECT i.*, po.name as ownerName, p.name as petName, u.name as doctorName
        FROM invoices i
        LEFT JOIN pet_owners po ON i.owner_id = po.id
        LEFT JOIN pets p ON i.pet_id = p.id
        LEFT JOIN users u ON i.doctor_id = u.id
        WHERE i.clinic_id = ? AND i.pet_id = ?
        ORDER BY i.invoice_date DESC, i.id DESC
    `, [clinic_id, pet_id]);
    return rows;
};

exports.getInvoiceById = async (clinic_id, id) => {
    const [invoices] = await db.query(`
        SELECT i.*, po.name as ownerName, p.name as petName, u.name as doctorName
        FROM invoices i
        LEFT JOIN pet_owners po ON i.owner_id = po.id
        LEFT JOIN pets p ON i.pet_id = p.id
        LEFT JOIN users u ON i.doctor_id = u.id
        WHERE i.id = ? AND i.clinic_id = ?
    `, [id, clinic_id]);
    
    if (invoices.length === 0) return null;
    
    const invoice = invoices[0];
    const [lineItems] = await db.query(`
        SELECT ili.*, inv.name, inv.category
        FROM invoice_line_items ili
        LEFT JOIN inventory inv ON ili.inventory_id = inv.id
        WHERE ili.invoice_id = ?
    `, [id]);
    
    invoice.lineItems = lineItems;
    return invoice;
};

exports.getUnbilledRecords = async (clinic_id) => {
    // 1. Clinical Encounters not billed
    const [encounters] = await db.query(`
        SELECT ce.*, p.name as petName, p.breed as petBreed, po.name as ownerName, po.id as ownerId, u.name as doctorName
        FROM clinical_encounters ce
        JOIN pets p ON ce.pet_id = p.id
        JOIN pet_owners po ON p.owner_id = po.id
        LEFT JOIN users u ON ce.doctor_id = u.id
        LEFT JOIN invoices i ON ce.id = i.encounter_id AND i.status != 'Cancelled'
        WHERE ce.clinic_id = ? AND i.id IS NULL
        ORDER BY ce.encounter_date DESC
    `, [clinic_id]);

    // Populate prescriptions and diagnostic reports
    for (const enc of encounters) {
        const [prescriptions] = await db.query(`
            SELECT p.*, inv.sku, inv.selling_price
            FROM prescriptions p
            LEFT JOIN inventory inv ON p.inventory_id = inv.id
            WHERE p.encounter_id = ?
        `, [enc.id]);
        enc.prescriptions = prescriptions;

        const [reports] = await db.query(`
            SELECT * FROM diagnostic_reports WHERE encounter_id = ?
        `, [enc.id]);
        enc.reports = reports;
    }

    // 2. Completed Home Visits not billed
    const [homeVisits] = await db.query(`
        SELECT hv.*, p.name as petName, p.breed as petBreed, po.name as ownerName, po.id as ownerId, u.name as doctorName
        FROM home_visits hv
        JOIN pets p ON hv.pet_id = p.id
        JOIN pet_owners po ON hv.owner_id = po.id
        LEFT JOIN users u ON hv.doctor_id = u.id
        LEFT JOIN invoices i ON hv.id = i.home_visit_id AND i.status != 'Cancelled'
        WHERE hv.clinic_id = ? AND hv.visit_status = 'Completed' AND i.id IS NULL
        ORDER BY hv.id DESC
    `, [clinic_id]);

    return { encounters, homeVisits };
};

exports.createInvoice = async (clinic_id, invoiceData) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Generate sequential human-readable invoice ID: INV-YYYY-XXXX
        const year = new Date().getFullYear();
        const [countRows] = await conn.query(
            `SELECT COUNT(*) as count FROM invoices WHERE invoice_date >= ? AND clinic_id = ?`,
            [`${year}-01-01`, clinic_id]
        );
        const sequence = countRows[0].count + 1;
        const invoiceId = `INV-${year}-${String(sequence).padStart(4, '0')}`;

        const invoiceDate = invoiceData.invoice_date || new Date().toISOString().split('T')[0];
        const status = invoiceData.status || 'Pending';

        // 2. Insert Invoices Row
        await conn.query(
            `INSERT INTO invoices (
                id, clinic_id, owner_id, pet_id, doctor_id, invoice_date, 
                subtotal, tax_amount, discount_amount, grand_total, status,
                encounter_id, home_visit_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                invoiceId,
                clinic_id,
                invoiceData.owner_id,
                invoiceData.pet_id,
                invoiceData.doctor_id || null,
                invoiceDate,
                invoiceData.subtotal,
                invoiceData.tax_amount || 0.00,
                invoiceData.discount_amount || 0.00,
                invoiceData.grand_total,
                status,
                invoiceData.encounter_id || null,
                invoiceData.home_visit_id || null
            ]
        );

        // 3. Insert Invoice Line Items with pricing snapshots
        if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
            for (const item of invoiceData.lineItems) {
                const itemId = crypto.randomUUID();
                await conn.query(
                    `INSERT INTO invoice_line_items (id, invoice_id, inventory_id, quantity, unit_price, total) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        itemId,
                        invoiceId,
                        item.inventory_id || null,
                        item.quantity,
                        item.unit_price,
                        item.total
                    ]
                );
            }
        }

        // 4. If immediately paid, deduct stock and check thresholds
        if (status === 'Paid') {
            await deductStock(conn, clinic_id, invoiceData.lineItems);
        }

        await conn.commit();
        return { id: invoiceId };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.updateInvoiceStatus = async (clinic_id, id, newStatus) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Get current invoice status
        const [invoices] = await conn.query('SELECT status FROM invoices WHERE id = ? AND clinic_id = ?', [id, clinic_id]);
        if (invoices.length === 0) {
            throw new Error('Invoice not found');
        }

        const currentStatus = invoices[0].status;

        // 2. Enforce immutable transitions: Pending -> Paid / Pending -> Cancelled
        if (currentStatus === 'Paid' || currentStatus === 'Cancelled') {
            throw new Error('Paid or Cancelled invoices cannot be modified');
        }
        if (newStatus !== 'Paid' && newStatus !== 'Cancelled') {
            throw new Error('Invalid invoice status transition');
        }

        // 3. Update Invoice status
        await conn.query('UPDATE invoices SET status = ? WHERE id = ? AND clinic_id = ?', [newStatus, id, clinic_id]);

        // 4. If transition to Paid, deduct stock
        if (newStatus === 'Paid') {
            const [lineItems] = await conn.query('SELECT * FROM invoice_line_items WHERE invoice_id = ?', [id]);
            await deductStock(conn, clinic_id, lineItems);
        }

        await conn.commit();
        return { id, status: newStatus };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

// Helper function to deduct inventory levels and trigger notifications
async function deductStock(conn, clinic_id, lineItems) {
    if (!lineItems || lineItems.length === 0) return;

    for (const item of lineItems) {
        if (!item.inventory_id) continue;

        // Retrieve current quantity and low stock threshold
        const [invRows] = await conn.query(
            'SELECT name, quantity, low_stock_threshold FROM inventory WHERE id = ? AND clinic_id = ?', 
            [item.inventory_id, clinic_id]
        );
        if (invRows.length === 0) continue;

        const invItem = invRows[0];
        // Only deduct stock if it has a tracking quantity (e.g. not services/untracked items)
        if (invItem.quantity === null) continue;

        const newQty = invItem.quantity - item.quantity;

        // Update Inventory level
        await conn.query('UPDATE inventory SET quantity = ? WHERE id = ? AND clinic_id = ?', [newQty, item.inventory_id, clinic_id]);

        // Check low-stock threshold alert
        if (newQty <= invItem.low_stock_threshold) {
            const notifId = crypto.randomUUID();
            const title = 'Low Stock Alert';
            const message = `Inventory item "${invItem.name}" has run low. Current: ${newQty}, Threshold: ${invItem.low_stock_threshold}.`;
            
            // Insert notification for Admins
            await conn.query(
                `INSERT INTO notifications (id, clinic_id, user_id, title, message, type, is_read) 
                 VALUES (?, ?, NULL, ?, ?, 'Inventory', FALSE)`,
                [notifId, clinic_id, title, message]
            );
        }
    }
}
