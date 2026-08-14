const db = require('../config/db');
const crypto = require('crypto');

class PetService {
    async getAllPets(clinic_id) {
        const query = `
            SELECT p.*, o.name as ownerName
            FROM pets p
            JOIN pet_owners o ON p.owner_id = o.id
            WHERE p.clinic_id = ?
            ORDER BY p.created_at DESC
        `;
        const [rows] = await db.query(query, [clinic_id]);
        return rows;
    }

    async getPetById(clinic_id, id) {
        const query = `
            SELECT p.*, o.name as ownerName
            FROM pets p
            JOIN pet_owners o ON p.owner_id = o.id
            WHERE p.id = ? AND p.clinic_id = ?
        `;
        const [rows] = await db.query(query, [id, clinic_id]);
        return rows[0];
    }

    async createPet(clinic_id, data) {
        const id = `PET-2026-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        const { 
            ownerId, microchip, name, species, breed, gender, 
            neuteredStatus, age, weight, prevHistory, 
            lastVaccination, lastDeworming, photo 
        } = data;
        
        const query = `
            INSERT INTO pets (
                id, clinic_id, owner_id, microchip_number, name, species, breed, gender, 
                neutered_status, age, weight, previous_medical_history, 
                last_vaccination, last_deworming, photo_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [
            id, clinic_id, ownerId, microchip || null, name, species, breed || null, 
            gender || 'Male', neuteredStatus === 'Yes' ? true : false, 
            age || null, weight || null, prevHistory || null, 
            lastVaccination || null, lastDeworming || null, photo || null
        ]);
        
        return await this.getPetById(clinic_id, id);
    }

    async updatePet(clinic_id, id, data) {
        const { 
            ownerId, microchip, name, species, breed, gender, 
            neuteredStatus, age, weight, prevHistory, 
            lastVaccination, lastDeworming, photo 
        } = data;
        
        const query = `
            UPDATE pets SET 
                owner_id = ?, microchip_number = ?, name = ?, species = ?, 
                breed = ?, gender = ?, neutered_status = ?, age = ?, weight = ?, 
                previous_medical_history = ?, last_vaccination = ?, 
                last_deworming = ?, photo_url = ?
            WHERE id = ? AND clinic_id = ?
        `;
        
        const [result] = await db.query(query, [
            ownerId, microchip || null, name, species, breed || null, 
            gender || 'Male', neuteredStatus === 'Yes' ? true : false, 
            age || null, weight || null, prevHistory || null, 
            lastVaccination || null, lastDeworming || null, photo || null, id, clinic_id
        ]);
        
        if (result.affectedRows === 0) return null;
        return await this.getPetById(clinic_id, id);
    }

    async deletePet(clinic_id, id) {
        const [result] = await db.query('DELETE FROM pets WHERE id = ? AND clinic_id = ?', [id, clinic_id]);
        return result.affectedRows > 0;
    }
}

module.exports = new PetService();
