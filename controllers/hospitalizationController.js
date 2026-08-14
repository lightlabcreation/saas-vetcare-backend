const hospitalizationService = require('../services/hospitalizationService');

exports.getCages = async (req, res) => {
    try {
        const data = await hospitalizationService.getCages(req.user.clinic_id);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error fetching cages:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch hospitalization cages' });
    }
};

exports.addCage = async (req, res) => {
    try {
        const data = await hospitalizationService.addCage(req.user.clinic_id, req.body);
        res.status(201).json({ status: 'success', data });
    } catch (error) {
        console.error('Error adding cage:', error);
        res.status(500).json({ status: 'error', message: 'Failed to add cage to the board' });
    }
};

exports.removeCage = async (req, res) => {
    try {
        const data = await hospitalizationService.removeCage(req.user.clinic_id, req.params.id);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error removing cage:', error);
        res.status(500).json({ status: 'error', message: 'Failed to remove cage from the board' });
    }
};

exports.admitPet = async (req, res) => {
    try {
        const { petId, reason } = req.body;
        const data = await hospitalizationService.admitPet(req.user.clinic_id, req.params.id, petId, reason);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error admitting pet:', error);
        res.status(500).json({ status: 'error', message: 'Failed to admit patient to the cage' });
    }
};

exports.dischargePet = async (req, res) => {
    try {
        const data = await hospitalizationService.dischargePet(req.user.clinic_id, req.params.id);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error discharging pet:', error);
        res.status(500).json({ status: 'error', message: 'Failed to discharge patient' });
    }
};

exports.cleanCage = async (req, res) => {
    try {
        const data = await hospitalizationService.cleanCage(req.user.clinic_id, req.params.id);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error cleaning cage:', error);
        res.status(500).json({ status: 'error', message: 'Failed to mark cage as cleaned' });
    }
};

exports.updateFlowsheet = async (req, res) => {
    try {
        const { flowsheet } = req.body;
        const data = await hospitalizationService.updateFlowsheet(req.user.clinic_id, req.params.id, flowsheet);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error('Error updating flowsheet:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update flowsheet task checklist' });
    }
};
