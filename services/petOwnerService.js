const db = require('../config/db');
const crypto = require('crypto');

class PetOwnerService {
    async getAllOwners(clinic_id) {
        const query = `
            SELECT po.*, COUNT(p.id) as petsCount
            FROM pet_owners po
            LEFT JOIN pets p ON po.id = p.owner_id
            WHERE po.clinic_id = ?
            GROUP BY po.id
            ORDER BY po.created_at DESC
        `;
        const [rows] = await db.query(query, [clinic_id]);
        return rows;
    }

    async getOwnerById(clinic_id, id) {
        const query = `
            SELECT po.*, COUNT(p.id) as petsCount
            FROM pet_owners po
            LEFT JOIN pets p ON po.id = p.owner_id
            WHERE po.id = ? AND po.clinic_id = ?
            GROUP BY po.id
        `;
        const [rows] = await db.query(query, [id, clinic_id]);
        return rows[0];
    }

    async createOwner(clinic_id, data) {
        const id = 'own-' + crypto.randomUUID().slice(0, 8);
        const { name, nic, email, telephone, mobile, address } = data;
        
        const query = `
            INSERT INTO pet_owners (id, clinic_id, name, nic, email, telephone, mobile, address) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [id, clinic_id, name, nic, email || null, telephone || null, mobile, address || null]);
        return await this.getOwnerById(clinic_id, id);
    }

    async updateOwner(clinic_id, id, data) {
        const { name, nic, email, telephone, mobile, address } = data;
        const query = `
            UPDATE pet_owners 
            SET name = ?, nic = ?, email = ?, telephone = ?, mobile = ?, address = ?
            WHERE id = ? AND clinic_id = ?
        `;
        const [result] = await db.query(query, [name, nic, email || null, telephone || null, mobile, address || null, id, clinic_id]);
        if (result.affectedRows === 0) return null;
        return await this.getOwnerById(clinic_id, id);
    }

    async deleteOwner(clinic_id, id) {
        const [result] = await db.query('DELETE FROM pet_owners WHERE id = ? AND clinic_id = ?', [id, clinic_id]);
        return result.affectedRows > 0;
    }
}

module.exports = new PetOwnerService();
