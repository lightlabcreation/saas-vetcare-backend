const express = require('express');
const router = express.Router();
const hospitalizationController = require('../controllers/hospitalizationController');

// All endpoints in this file are already protected and tenant-isolated by the mounting middleware in server.js
router.get('/cages', hospitalizationController.getCages);
router.post('/cages', hospitalizationController.addCage);
router.delete('/cages/:id', hospitalizationController.removeCage);
router.post('/cages/:id/admit', hospitalizationController.admitPet);
router.post('/cages/:id/discharge', hospitalizationController.dischargePet);
router.post('/cages/:id/clean', hospitalizationController.cleanCage);
router.put('/cages/:id/flowsheet', hospitalizationController.updateFlowsheet);

module.exports = router;
