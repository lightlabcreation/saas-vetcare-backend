const reportService = require('../services/reportService');
const petService = require('../services/petService');
const db = require('../config/db');
const attendanceService = require('../services/attendanceService');

exports.getRevenue = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { startDate, endDate } = req.query;
        const data = await reportService.getRevenueAnalytics(clinicId, startDate, endDate);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching dashboard revenue:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard revenue analytics' });
    }
};

exports.getAppointments = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const data = await reportService.getAppointmentAnalytics(clinicId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching dashboard appointments:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard appointment analytics' });
    }
};

exports.getDoctors = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const data = await reportService.getDoctorAudit(clinicId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching dashboard doctors:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard doctor performance audit' });
    }
};

exports.getPatients = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const data = await reportService.getPatientDemographics(clinicId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching dashboard patients:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard patient demographics' });
    }
};

exports.getInventory = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const data = await reportService.getInventoryResourceAlerts(clinicId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching dashboard inventory:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard inventory reports' });
    }
};

exports.getRecentPets = async (req, res) => {
    try {
        const pets = await petService.getAllPets(req.user.clinic_id);
        res.status(200).json({ status: 'success', data: pets });
    } catch (error) {
        console.error('Error fetching dashboard recent pets:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard recent pets' });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(
            `SELECT id, user_id, title, message, type, is_read, created_at
             FROM notifications 
             WHERE (user_id = ? OR user_id IS NULL) AND clinic_id = ? 
             ORDER BY created_at DESC 
             LIMIT 15`,
            [userId, req.user.clinic_id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        console.error('Error fetching dashboard notifications:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard notifications' });
    }
};

exports.getAttendance = async (req, res) => {
    try {
        const date = req.query.date || new Date().toLocaleDateString('en-CA');
        const data = await attendanceService.getDailyAttendance(req.user.clinic_id, date);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching dashboard attendance:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard attendance' });
    }
};
