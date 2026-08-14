const db = require('../config/db');

class HospitalizationService {
    async getCages(clinic_id) {
        const [rows] = await db.query(`
            SELECT 
                hc.id,
                hc.name,
                hc.type,
                hc.status,
                hc.pet_id,
                p.name AS petName,
                p.breed,
                COALESCE(p.photo_url, '') AS photo,
                hc.reason,
                hc.check_in AS checkIn,
                hc.flowsheet
            FROM hospitalization_cages hc
            LEFT JOIN pets p ON hc.pet_id = p.id
            WHERE hc.clinic_id = ?
        `, [clinic_id]);

        return rows.map(r => {
            let flowsheet = r.flowsheet;
            if (typeof flowsheet === 'string') {
                try {
                    flowsheet = JSON.parse(flowsheet);
                } catch (e) {
                    flowsheet = null;
                }
            }
            return {
                ...r,
                flowsheet
            };
        });
    }

    async addCage(clinic_id, cage) {
        const query = `
            INSERT INTO hospitalization_cages (id, clinic_id, name, type, status, pet_id, reason, check_in, flowsheet)
            VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NULL)
        `;
        await db.query(query, [cage.id, clinic_id, cage.name, cage.type, cage.status || 'Vacant']);
        return cage;
    }

    async removeCage(clinic_id, id) {
        await db.query(`
            DELETE FROM hospitalization_cages 
            WHERE id = ? AND clinic_id = ?
        `, [id, clinic_id]);
        return { id };
    }

    async admitPet(clinic_id, id, petId, reason) {
        const checkInStr = new Date().toLocaleString();
        const flowsheetDefault = { fed: false, meds: false, walk: false, eveningFed: false };
        
        await db.query(`
            UPDATE hospitalization_cages
            SET status = 'Occupied',
                pet_id = ?,
                reason = ?,
                check_in = ?,
                flowsheet = ?
            WHERE id = ? AND clinic_id = ?
        `, [petId, reason, checkInStr, JSON.stringify(flowsheetDefault), id, clinic_id]);
        
        return { id, petId, reason, checkIn: checkInStr, flowsheet: flowsheetDefault };
    }

    async dischargePet(clinic_id, id) {
        await db.query(`
            UPDATE hospitalization_cages
            SET status = 'Cleaning Needed',
                pet_id = NULL,
                reason = NULL,
                check_in = NULL,
                flowsheet = NULL
            WHERE id = ? AND clinic_id = ?
        `, [id, clinic_id]);
        return { id, status: 'Cleaning Needed' };
    }

    async cleanCage(clinic_id, id) {
        await db.query(`
            UPDATE hospitalization_cages
            SET status = 'Vacant'
            WHERE id = ? AND clinic_id = ?
        `, [id, clinic_id]);
        return { id, status: 'Vacant' };
    }

    async updateFlowsheet(clinic_id, id, flowsheet) {
        await db.query(`
            UPDATE hospitalization_cages
            SET flowsheet = ?
            WHERE id = ? AND clinic_id = ?
        `, [JSON.stringify(flowsheet), id, clinic_id]);
        return { id, flowsheet };
    }
}

module.exports = new HospitalizationService();
