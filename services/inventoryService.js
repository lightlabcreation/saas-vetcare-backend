const db = require('../config/db');
const crypto = require('crypto');

class InventoryService {
    async getAllItems(clinic_id) {
        const [rows] = await db.query('SELECT * FROM inventory WHERE clinic_id = ? ORDER BY created_at DESC', [clinic_id]);
        return rows;
    }

    async getItemById(clinic_id, id) {
        const [rows] = await db.query('SELECT * FROM inventory WHERE id = ? AND clinic_id = ?', [id, clinic_id]);
        return rows[0];
    }

    async createItem(clinic_id, data) {
        const id = crypto.randomUUID();
        const { sku, name, category, supplier, quantity, low_stock_threshold, cost_price, selling_price, is_taxable, expiry_date } = data;
        
        const query = `
            INSERT INTO inventory (id, clinic_id, sku, name, category, supplier, quantity, low_stock_threshold, cost_price, selling_price, is_taxable, expiry_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [
            id, clinic_id, sku, name, category, supplier, 
            quantity || 0, low_stock_threshold || 5, 
            cost_price || null, selling_price, 
            is_taxable !== undefined ? is_taxable : true, 
            expiry_date || null
        ]);
        
        return await this.getItemById(clinic_id, id);
    }

    async updateItem(clinic_id, id, data) {
        const { name, category, supplier, quantity, low_stock_threshold, cost_price, selling_price, is_taxable, expiry_date } = data;
        
        const query = `
            UPDATE inventory 
            SET name = ?, category = ?, supplier = ?, quantity = ?, low_stock_threshold = ?, cost_price = ?, selling_price = ?, is_taxable = ?, expiry_date = ?
            WHERE id = ? AND clinic_id = ?
        `;
        
        const [result] = await db.query(query, [name, category, supplier, quantity, low_stock_threshold, cost_price, selling_price, is_taxable, expiry_date, id, clinic_id]);
        if (result.affectedRows === 0) return null;
        
        return await this.getItemById(clinic_id, id);
    }

    async deleteItem(clinic_id, id) {
        const [result] = await db.query('DELETE FROM inventory WHERE id = ? AND clinic_id = ?', [id, clinic_id]);
        return result.affectedRows > 0;
    }
}

module.exports = new InventoryService();
