const encounterService = require('../services/encounterService');

exports.createEncounter = async (req, res) => {
    try {
        const { pet_id, complaint, diagnosis } = req.body;
        
        if (!pet_id || !complaint || !diagnosis) {
            return res.status(400).json({ message: 'Missing required fields (pet_id, complaint, diagnosis)' });
        }

        // Only Doctor, Admin, Vet Assistant can create encounters
        if (!['Admin', 'Doctor', 'Vet Assistant'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to create clinical encounters' });
        }

        // Vet Assistant cannot prescribe
        if (req.user.role === 'Vet Assistant' && req.body.prescriptions && req.body.prescriptions.length > 0) {
            return res.status(403).json({ message: 'Vet Assistants are restricted from writing prescriptions' });
        }

        const encounter = await encounterService.createEncounter(req.user.clinic_id, req.body, req.user.id);
        res.status(201).json({ message: 'Encounter created successfully', id: encounter.id });
    } catch (error) {
        console.error('Error creating encounter:', error);
        res.status(500).json({ message: 'Server error while creating encounter' });
    }
};

exports.getEncounters = async (req, res) => {
    try {
        const { petId } = req.query;
        let encounters;
        
        if (petId) {
            encounters = await encounterService.getEncountersByPet(req.user.clinic_id, petId);
        } else {
            encounters = await encounterService.getAllEncounters(req.user.clinic_id);
        }
        
        res.json(encounters);
    } catch (error) {
        console.error('Error fetching encounters:', error);
        res.status(500).json({ message: 'Server error while fetching encounters' });
    }
};

exports.uploadReport = async (req, res) => {
    try {
        const result = await encounterService.uploadReport(req.user.clinic_id, req.body, req.user ? req.user.id : null);
        res.status(200).json({ status: 'success', ...result });
    } catch (error) {
        console.error('Error uploading report:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Server error uploading report' });
    }
};

