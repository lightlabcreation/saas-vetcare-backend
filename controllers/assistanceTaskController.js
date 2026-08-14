const db = require('../config/db');

// Ensure table exists & initial seed data
const initTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS assistance_tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                doctor_id VARCHAR(100) DEFAULT NULL,
                doctor_name VARCHAR(100) NOT NULL,
                patient_id VARCHAR(100) DEFAULT NULL,
                patient_name VARCHAR(100) NOT NULL,
                task_type ENUM('Surgery Prep', 'Lab Test', 'Treatment', 'Emergency') DEFAULT 'Treatment',
                priority ENUM('Critical', 'High', 'Medium', 'Low') DEFAULT 'Medium',
                scheduled_time VARCHAR(50) DEFAULT 'ASAP',
                status ENUM('Pending', 'In Progress', 'Completed') DEFAULT 'Pending',
                notes TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

    } catch (err) {
        console.error('Error initializing assistance_tasks table:', err.message);
    }
};

initTable();


// @desc Get all assistance tasks
// @route GET /api/v1/assistance-tasks
exports.getAssistanceTasks = async (req, res) => {
    try {
        const [tasks] = await db.query('SELECT * FROM assistance_tasks ORDER BY created_at DESC');
        res.status(200).json({ status: 'success', data: tasks });
    } catch (error) {
        console.error('Error fetching assistance tasks:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch assistance tasks' });
    }
};

// @desc Create a new assistance task (assigned by Doctor)
// @route POST /api/v1/assistance-tasks
exports.createAssistanceTask = async (req, res) => {
    try {
        const { title, doctor_name, patient_name, task_type, priority, scheduled_time, notes } = req.body;

        if (!title || !patient_name) {
            return res.status(400).json({ status: 'error', message: 'Task title and patient name are required' });
        }

        const docName = doctor_name || (req.user ? req.user.name : 'Dr. Sarah Connor');
        const type = task_type || 'Treatment';
        const prio = priority || 'Medium';
        const timeStr = scheduled_time || 'ASAP';

        const [result] = await db.query(
            `INSERT INTO assistance_tasks (title, doctor_name, patient_name, task_type, priority, scheduled_time, notes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [title, docName, patient_name, type, prio, timeStr, notes || '']
        );

        res.status(201).json({
            status: 'success',
            message: 'Assistance task created successfully',
            data: { id: result.insertId, title, doctor_name: docName, patient_name, task_type: type, priority: prio, scheduled_time: timeStr, status: 'Pending' }
        });
    } catch (error) {
        console.error('Error creating assistance task:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create assistance task' });
    }
};

// @desc Update assistance task status (e.g. Completed)
// @route PATCH /api/v1/assistance-tasks/:id/status
exports.updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Pending', 'In Progress', 'Completed'

        const newStatus = status || 'Completed';

        const [result] = await db.query(
            'UPDATE assistance_tasks SET status = ? WHERE id = ?',
            [newStatus, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Task not found' });
        }

        res.status(200).json({ status: 'success', message: `Task status updated to ${newStatus}` });
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update task status' });
    }
};
