const express = require('express');
const router = express.Router();
const { 
    loginSuperAdmin, 
    getClinics, 
    getStats, 
    getPayments,
    getSubscriptions,
    suspendClinic, 
    activateClinic,
    deleteClinic,
    updateClinic
} = require('../controllers/superAdminController');
const { getAllTicketsForSuperAdmin, replyTicketAsSuperAdmin, updateTicketStatus } = require('../controllers/supportTicketController');
const superAdminAuth = require('../middleware/superAdminAuth');

router.post('/login', loginSuperAdmin);

router.get('/stats', superAdminAuth, getStats);
router.get('/clinics', superAdminAuth, getClinics);
router.get('/payments', superAdminAuth, getPayments);
router.get('/subscriptions', superAdminAuth, getSubscriptions);
router.put('/clinics/:id', superAdminAuth, updateClinic);
router.delete('/clinics/:id', superAdminAuth, deleteClinic);
router.post('/clinics/:id/suspend', superAdminAuth, suspendClinic);
router.post('/clinics/:id/activate', superAdminAuth, activateClinic);

// Ticket routes for SuperAdmin
router.get('/tickets', superAdminAuth, getAllTicketsForSuperAdmin);
router.post('/tickets/:id/reply', superAdminAuth, replyTicketAsSuperAdmin);
router.patch('/tickets/:id/status', superAdminAuth, updateTicketStatus);

module.exports = router;
