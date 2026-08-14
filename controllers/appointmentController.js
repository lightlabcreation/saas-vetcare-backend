const appointmentService = require('../services/appointmentService');

exports.getAllAppointments = async (req, res) => {
    try {
        const filters = {
            ownerId: req.query.ownerId,
            petId: req.query.petId,
            doctorId: req.query.doctorId
        };
        const appointments = await appointmentService.getAllAppointments(req.user.clinic_id, filters);
        res.status(200).json({
            status: 'success',
            results: appointments.length,
            data: appointments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch appointments' });
    }
};

exports.getAppointmentById = async (req, res) => {
    try {
        const appointment = await appointmentService.getAppointmentById(req.user.clinic_id, req.params.id);
        if (!appointment) {
            return res.status(404).json({ status: 'error', message: 'Appointment not found' });
        }
        res.status(200).json({
            status: 'success',
            data: appointment
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch appointment' });
    }
};

exports.createAppointment = async (req, res) => {
    try {
        const newAppointment = await appointmentService.createAppointment(req.user.clinic_id, req.body);

        // ── In-App Notifications ──────────────────────────────────────────
        try {
            const { createNotification } = require('../services/notificationService');
            const apt = newAppointment;
            const dateStr = apt.appointment_date ? apt.appointment_date.split('T')[0] : '';
            const timeStr = apt.appointment_time || '';

            // 1. Notify the assigned doctor (targeted)
            if (apt.doctor_id) {
                await createNotification(
                    req.user.clinic_id,
                    apt.doctor_id,
                    '📅 New Appointment Scheduled',
                    `Patient: ${apt.petName || 'Unknown'} (Owner: ${apt.ownerName || 'Unknown'}) — on ${dateStr} at ${timeStr}. Please review your schedule.`,
                    'appointment'
                );
            }

            // 2. Broadcast to Admin/Manager (user_id = NULL means all admins see it)
            await createNotification(
                req.user.clinic_id,
                null,
                '📅 New Appointment Booked',
                `${apt.petName || 'Unknown'} with Dr. ${apt.doctorName || 'Unassigned'} on ${dateStr} at ${timeStr}.`,
                'appointment'
            );
        } catch (notifErr) {
            console.error('[AppointmentController] Notification error (non-fatal):', notifErr.message);
        }
        // ─────────────────────────────────────────────────────────────────

        res.status(201).json({
            status: 'success',
            data: newAppointment
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ 
            status: 'error', 
            message: error.message || 'Failed to create appointment' 
        });
    }
};

exports.updateAppointment = async (req, res) => {
    try {
        const updatedAppointment = await appointmentService.updateAppointment(req.user.clinic_id, req.params.id, req.body);
        if (!updatedAppointment) {
            return res.status(404).json({ status: 'error', message: 'Appointment not found' });
        }
        res.status(200).json({
            status: 'success',
            data: updatedAppointment
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ 
            status: 'error', 
            message: error.message || 'Failed to update appointment' 
        });
    }
};

exports.deleteAppointment = async (req, res) => {
    try {
        const success = await appointmentService.deleteAppointment(req.user.clinic_id, req.params.id);
        if (!success) {
            return res.status(404).json({ status: 'error', message: 'Appointment not found' });
        }
        res.status(200).json({
            status: 'success',
            message: 'Appointment cancelled successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Failed to cancel appointment' });
    }
};

exports.getUpcomingReminders = async (req, res) => {
    try {
        const reminders = await appointmentService.getUpcomingReminders(req.user.clinic_id);
        res.status(200).json({
            status: 'success',
            data: reminders
        });
    } catch (error) {
        console.error('Error fetching upcoming reminders:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch upcoming reminders' });
    }
};

exports.sendReminderEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const { messageBody, customRecipientEmail } = req.body;
        if (!messageBody || messageBody.trim() === '') {
            return res.status(400).json({ status: 'error', message: 'Message body cannot be empty.' });
        }
        await appointmentService.sendReminder(req.user.clinic_id, id, messageBody, customRecipientEmail);
        res.status(200).json({
            status: 'success',
            message: 'Reminder email sent successfully.'
        });
    } catch (error) {
        console.error('Error sending reminder email:', error);
        res.status(400).json({ status: 'error', message: error.message || 'Failed to send reminder email.' });
    }
};
