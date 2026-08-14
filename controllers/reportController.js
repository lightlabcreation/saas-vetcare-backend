const reportService = require('../services/reportService');

exports.getRevenue = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { startDate, endDate } = req.query;
        const data = await reportService.getRevenueAnalytics(clinicId, startDate, endDate);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching revenue reports:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch revenue analytics' });
    }
};

exports.getAppointments = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const data = await reportService.getAppointmentAnalytics(clinicId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching appointment reports:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch appointment analytics' });
    }
};

exports.getDoctors = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const data = await reportService.getDoctorAudit(clinicId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching doctor performance reports:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch doctor performance audit' });
    }
};

exports.getPatients = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const data = await reportService.getPatientDemographics(clinicId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching patient demographics reports:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch patient demographics' });
    }
};

exports.getInventory = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const data = await reportService.getInventoryResourceAlerts(clinicId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching inventory reports:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch inventory reports' });
    }
};

exports.getMyRevenue = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const clinicId = req.user.clinic_id;
        const data = await reportService.getPersonalDoctorRevenue(clinicId, doctorId);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching doctor personal revenue:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch personal revenue analytics' });
    }
};
