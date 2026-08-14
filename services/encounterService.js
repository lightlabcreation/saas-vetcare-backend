const db = require('../config/db');
const crypto = require('crypto');
const { createNotification } = require('./notificationService');

const ensureStatusColumn = async (conn) => {
    try {
        await conn.query(`ALTER TABLE diagnostic_reports ADD COLUMN status VARCHAR(50) DEFAULT 'Pending'`);
    } catch (e) {
        // Column may already exist
    }
    try {
        await conn.query(`ALTER TABLE diagnostic_reports MODIFY COLUMN file_url LONGTEXT`);
    } catch (e) {
        // Column type may already be modified
    }
};


exports.createEncounter = async (clinic_id, encounterData, doctorId) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await ensureStatusColumn(conn);

        const encounterId = crypto.randomUUID();
        const date = new Date().toISOString().split('T')[0];

        // Fetch pet & doctor names for task and notification context
        let petName = 'Patient';
        const [pets] = await conn.query(`SELECT name FROM pets WHERE id = ? AND clinic_id = ?`, [encounterData.pet_id, clinic_id]);
        if (pets.length > 0) petName = pets[0].name;

        let doctorName = 'Doctor';
        const [docs] = await conn.query(`SELECT name FROM users WHERE id = ? AND clinic_id = ?`, [doctorId, clinic_id]);
        if (docs.length > 0) doctorName = docs[0].name;

        // Insert Encounter
        await conn.query(
            `INSERT INTO clinical_encounters 
            (id, clinic_id, pet_id, doctor_id, encounter_date, complaint, duration, symptoms, diagnosis, treatment, follow_up) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                encounterId,
                clinic_id,
                encounterData.pet_id,
                doctorId,
                date,
                encounterData.complaint,
                encounterData.duration || null,
                encounterData.symptoms || null,
                encounterData.diagnosis,
                encounterData.treatment || null,
                encounterData.follow_up || null
            ]
        );

        // Insert Prescriptions if any
        if (encounterData.prescriptions && encounterData.prescriptions.length > 0) {
            for (const rx of encounterData.prescriptions) {
                const rxId = crypto.randomUUID();
                
                let inventoryId = null;
                const [inv] = await conn.query(
                    `SELECT id FROM inventory WHERE category = 'Medicine' AND clinic_id = ? AND ? LIKE CONCAT('%', name, '%') LIMIT 1`,
                    [clinic_id, rx.medicine_name]
                );
                if (inv.length > 0) {
                    inventoryId = inv[0].id;
                }

                await conn.query(
                    `INSERT INTO prescriptions 
                    (id, encounter_id, medicine_name, dosage, frequency, duration, instructions, inventory_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        rxId,
                        encounterId,
                        rx.medicine_name,
                        rx.dosage || null,
                        rx.frequency || null,
                        rx.duration || null,
                        rx.instructions || null,
                        inventoryId
                    ]
                );
            }
        }

        // Insert Diagnostic Reports & create Assistant Tasks
        if (encounterData.reports && encounterData.reports.length > 0) {
            for (const rep of encounterData.reports) {
                const repId = crypto.randomUUID();
                const isUploaded = rep.file_url && (rep.file_url.startsWith('http') || rep.file_url.startsWith('data:') || rep.file_url.startsWith('blob:'));
                const reportStatus = isUploaded ? 'Completed' : 'Pending';

                await conn.query(
                    `INSERT INTO diagnostic_reports 
                    (id, encounter_id, report_type, file_url, uploaded_by, status) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        repId,
                        encounterId,
                        rep.report_type,
                        rep.file_url || `${rep.report_type} (Pending)`,
                        doctorId,
                        reportStatus
                    ]
                );

                // Auto-create task for Vet Assistant if test is pending
                if (!isUploaded) {
                    await conn.query(
                        `INSERT INTO assistance_tasks (title, clinic_id, doctor_id, doctor_name, patient_id, patient_name, task_type, priority, scheduled_time, status, notes)
                         VALUES (?, ?, ?, ?, ?, ?, 'Lab Test', 'High', 'ASAP', 'Pending', ?)`,
                        [
                            `Perform ${rep.report_type}: ${rep.file_url || 'Lab Test'}`,
                            clinic_id,
                            doctorId,
                            doctorName,
                            encounterData.pet_id,
                            petName,
                            `Diagnostic order for ${petName}. Encounter ID: ${encounterId}`
                        ]
                    );

                    // Broadcast notification for Vet Assistants
                    await createNotification(
                        clinic_id,
                        null,
                        `🧪 Lab Test Ordered: ${petName}`,
                        `${doctorName} ordered ${rep.report_type} for patient ${petName}. Task pending in Assistant queue.`,
                        'system'
                    );
                }
            }
        }

        await conn.commit();
        return { id: encounterId };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

const cleanDuplicateEncounters = async (conn, clinic_id) => {
    try {
        const [dupes] = await conn.query(`
            SELECT id, pet_id, complaint, diagnosis, encounter_date
            FROM clinical_encounters
            WHERE clinic_id = ?
            ORDER BY id ASC
        `, [clinic_id]);

        const seen = new Set();
        const duplicateIds = [];

        for (const enc of dupes) {
            const key = `${enc.pet_id}_${enc.complaint}_${enc.diagnosis}_${enc.encounter_date}`;
            if (seen.has(key)) {
                duplicateIds.push(enc.id);
            } else {
                seen.add(key);
            }
        }

        if (duplicateIds.length > 0) {
            for (const dupId of duplicateIds) {
                await conn.query(`DELETE FROM prescriptions WHERE encounter_id = ?`, [dupId]);
                await conn.query(`DELETE FROM diagnostic_reports WHERE encounter_id = ?`, [dupId]);
                await conn.query(`DELETE FROM clinical_encounters WHERE id = ?`, [dupId]);
            }
        }

        const [taskDupes] = await conn.query(`
            SELECT id, patient_name, title, task_type
            FROM assistance_tasks
            WHERE clinic_id = ?
            ORDER BY id ASC
        `, [clinic_id]);
        const taskSeen = new Set();
        for (const t of taskDupes) {
            const tKey = `${t.patient_name}_${t.title}_${t.task_type}`;
            if (taskSeen.has(tKey)) {
                await conn.query(`DELETE FROM assistance_tasks WHERE id = ?`, [t.id]);
            } else {
                taskSeen.add(tKey);
            }
        }
    } catch (e) {
        // Log deduplication error without breaking request
        console.error('Deduplication error:', e.message);
    }
};

const syncTasksWithReports = async (conn, clinic_id) => {
    try {
        const [tasks] = await conn.query(`SELECT * FROM assistance_tasks WHERE task_type = 'Lab Test' AND clinic_id = ?`, [clinic_id]);
        for (const t of tasks) {
            if (!t.patient_id) continue;
            const [encs] = await conn.query(`SELECT id FROM clinical_encounters WHERE pet_id = ? AND clinic_id = ? ORDER BY encounter_date DESC LIMIT 1`, [t.patient_id, clinic_id]);
            if (encs.length > 0) {
                const encId = encs[0].id;
                const repType = t.title.includes('Ultrasound') ? 'Ultrasound' : t.title.includes('X-Ray') ? 'X-Ray' : 'Blood Test';
                const testName = t.title.includes(':') ? t.title.split(':')[1].trim() : t.title;
                const [existing] = await conn.query(`SELECT id FROM diagnostic_reports WHERE encounter_id = ? AND (report_type = ? OR file_url = ?)`, [encId, repType, testName]);
                if (existing.length === 0) {
                    const repId = crypto.randomUUID();
                    await conn.query(
                        `INSERT INTO diagnostic_reports (id, encounter_id, report_type, file_url, uploaded_by, status) VALUES (?, ?, ?, ?, ?, ?)`,
                        [repId, encId, repType, testName, t.doctor_id, t.status === 'Completed' ? 'Completed' : 'Pending']
                    );
                }
            }
        }
    } catch (e) {
        console.error('Sync error:', e.message);
    }
};

exports.getEncountersByPet = async (clinic_id, petId) => {
    await ensureStatusColumn(db);
    await cleanDuplicateEncounters(db, clinic_id);
    await syncTasksWithReports(db, clinic_id);

    const [encounters] = await db.query(
        `SELECT ce.*, u.name as doctor_name 
         FROM clinical_encounters ce 
         LEFT JOIN users u ON ce.doctor_id = u.id 
         WHERE ce.pet_id = ? AND ce.clinic_id = ?
         ORDER BY ce.encounter_date DESC`,
        [petId, clinic_id]
    );

    for (const enc of encounters) {
        const [prescriptions] = await db.query(
            `SELECT * FROM prescriptions WHERE encounter_id = ?`,
            [enc.id]
        );
        enc.prescriptions = prescriptions;

        const [reports] = await db.query(
            `SELECT * FROM diagnostic_reports WHERE encounter_id = ?`,
            [enc.id]
        );
        enc.reports = reports;
    }

    return encounters;
};



exports.getAllEncounters = async (clinic_id) => {
    const [encounters] = await db.query(
        `SELECT ce.*, p.name as pet_name, po.name as owner_name, u.name as doctor_name 
         FROM clinical_encounters ce 
         JOIN pets p ON ce.pet_id = p.id
         JOIN pet_owners po ON p.owner_id = po.id
         LEFT JOIN users u ON ce.doctor_id = u.id 
         WHERE ce.clinic_id = ?
         ORDER BY ce.encounter_date DESC`,
        [clinic_id]
    );
    return encounters;
};

exports.uploadReport = async (clinic_id, data, userId) => {
    const { pet_id, encounter_id, report_id, report_type, file_name, file_url } = data;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await ensureStatusColumn(conn);

        let targetEncounterId = encounter_id;

        if (!targetEncounterId && pet_id) {
            const [encs] = await conn.query(
                `SELECT id FROM clinical_encounters WHERE pet_id = ? AND clinic_id = ? ORDER BY encounter_date DESC LIMIT 1`,
                [pet_id, clinic_id]
            );
            if (encs.length > 0) {
                targetEncounterId = encs[0].id;
            } else {
                targetEncounterId = crypto.randomUUID();
                const date = new Date().toISOString().split('T')[0];
                await conn.query(
                    `INSERT INTO clinical_encounters (id, clinic_id, pet_id, doctor_id, encounter_date, complaint, diagnosis) VALUES (?, ?, ?, ?, ?, 'Diagnostic File Upload', 'Lab Evaluation')`,
                    [targetEncounterId, clinic_id, pet_id, userId, date]
                );
            }
        }

        const fileName = file_name || file_url || 'Diagnostic_Report.pdf';
        const targetType = report_type || 'Blood Test';

        if (report_id) {
            await conn.query(
                `UPDATE diagnostic_reports SET file_url = ?, report_type = ?, status = 'Completed', uploaded_by = ? WHERE id = ?`,
                [fileName, targetType, userId, report_id]
            );
        } else {
            // Find existing pending report for this specific report_type and pet to update
            const [pendingReps] = await conn.query(
                `SELECT dr.id FROM diagnostic_reports dr 
                 JOIN clinical_encounters ce ON dr.encounter_id = ce.id 
                 WHERE ce.pet_id = ? AND dr.report_type = ? AND dr.status = 'Pending' AND ce.clinic_id = ?
                 ORDER BY dr.uploaded_at DESC LIMIT 1`,
                [pet_id, targetType, clinic_id]
            );

            if (pendingReps.length > 0) {
                await conn.query(
                    `UPDATE diagnostic_reports SET file_url = ?, status = 'Completed', uploaded_by = ? WHERE id = ?`,
                    [fileName, userId, pendingReps[0].id]
                );
            } else {
                const newRepId = crypto.randomUUID();
                await conn.query(
                    `INSERT INTO diagnostic_reports (id, encounter_id, report_type, file_url, uploaded_by, status) VALUES (?, ?, ?, ?, ?, 'Completed')`,
                    [newRepId, targetEncounterId, targetType, fileName, userId]
                );
            }
        }

        // Complete ONLY the matching assistance task for this specific pet and report_type!
        if (pet_id && targetType) {
            await conn.query(
                `UPDATE assistance_tasks 
                 SET status = 'Completed' 
                 WHERE patient_id = ? AND clinic_id = ? AND task_type = 'Lab Test' AND status != 'Completed' AND (
                    (BINARY ? = 'Ultrasound' AND title LIKE '%Ultrasound%') OR
                    (BINARY ? = 'Blood Test' AND (title LIKE '%Blood Test%' OR title LIKE '%CBC%')) OR
                    (BINARY ? = 'X-Ray' AND title LIKE '%X-Ray%') OR
                    (title LIKE CONCAT('%', ?, '%'))
                 )`,
                [pet_id, clinic_id, targetType, targetType, targetType, targetType]
            );
        }



        await conn.commit();
        return { success: true, message: 'Diagnostic report uploaded and task completed successfully' };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

