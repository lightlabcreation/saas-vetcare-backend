const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class UserService {
    async getAllUsers(clinic_id, filters = {}) {
        let query = 'SELECT id, name, role, email, phone, username, department, status, profile_image, created_at FROM users';
        let params = [];
        
        let conditions = ['clinic_id = ?'];
        params.push(clinic_id);
        
        if (filters.role && filters.role !== 'All') {
            conditions.push('role = ?');
            params.push(filters.role);
        }
        if (filters.status && filters.status !== 'All') {
            conditions.push('status = ?');
            params.push(filters.status);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY name ASC';
        
        const [users] = await db.query(query, params);
        return users;
    }

    async getUserById(clinic_id, id) {
        const [users] = await db.query('SELECT id, name, role, email, phone, username, department, status, profile_image, created_at FROM users WHERE id = ? AND clinic_id = ?', [id, clinic_id]);
        return users.length > 0 ? users[0] : null;
    }

    async createUser(clinic_id, userData) {
        const { fullName, email, phone, username, password, role, department, status, photoUrl } = userData;
        
        const id = 'usr-' + crypto.randomUUID().slice(0, 8);
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        const finalStatus = status || 'Active';
        
        const query = `
            INSERT INTO users (id, clinic_id, name, email, password_hash, role, phone, username, department, profile_image, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [id, clinic_id, fullName, email, password_hash, role, phone, username, department, photoUrl || null, finalStatus]);
        return this.getUserById(clinic_id, id);
    }

    async updateUser(clinic_id, id, userData) {
        const { fullName, email, phone, username, password, role, department, status, photoUrl } = userData;
        
        let query = 'UPDATE users SET name=?, email=?, role=?, phone=?, username=?, department=?, status=?, profile_image=?';
        let params = [fullName, email, role, phone, username, department, status, photoUrl || null];
        
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            query += ', password_hash=?';
            params.push(password_hash);
        }
        
        query += ' WHERE id = ? AND clinic_id = ?';
        params.push(id, clinic_id);
        
        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) return null;
        
        return this.getUserById(clinic_id, id);
    }

    async updateProfile(clinic_id, id, profileData) {
        const { fullName, email, phone, password } = profileData;
        
        let query = 'UPDATE users SET name=?, email=?, phone=?';
        let params = [fullName, email, phone];
        
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            query += ', password_hash=?';
            params.push(password_hash);
        }
        
        query += ' WHERE id = ? AND clinic_id = ?';
        params.push(id, clinic_id);
        
        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) return null;
        
        return this.getUserById(clinic_id, id);
    }

    async deleteUser(clinic_id, id) {
        // Hard delete implementation
        const [result] = await db.query("DELETE FROM users WHERE id = ? AND clinic_id = ?", [id, clinic_id]);
        return result.affectedRows > 0;
    }
}

module.exports = new UserService();
