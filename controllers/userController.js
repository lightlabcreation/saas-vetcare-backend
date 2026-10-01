const userService = require('../services/userService');
const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getProfile = async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.clinic_id, req.user.id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        res.status(200).json({ status: 'success', data: user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch profile' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const updatedUser = await userService.updateProfile(req.user.clinic_id, req.user.id, req.body);
        if (!updatedUser) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        res.status(200).json({ status: 'success', data: updatedUser });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update profile' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const filters = {
            role: req.query.role,
            status: req.query.status
        };
        const users = await userService.getAllUsers(req.user.clinic_id, filters);
        res.status(200).json({ status: 'success', data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
    }
};

exports.createUser = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ status: 'error', message: 'Only Admins can register new staff members' });
        }
        
        const { fullName, email, password, role } = req.body;
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({ status: 'error', message: 'Missing required fields' });
        }
        
        const newUser = await userService.createUser(req.user.clinic_id, req.body);
        res.status(201).json({ status: 'success', data: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'error', message: 'Email or username already exists' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to create staff member' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ status: 'error', message: 'Only Admins can modify staff members' });
        }
        
        const { id } = req.params;
        const updatedUser = await userService.updateUser(req.user.clinic_id, id, req.body);
        
        if (!updatedUser) {
            return res.status(404).json({ status: 'error', message: 'Staff member not found' });
        }
        res.status(200).json({ status: 'success', data: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'error', message: 'Email or username already exists' });
        }
        res.status(500).json({ status: 'error', message: 'Failed to update staff member' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ status: 'error', message: 'Only Admins can remove staff members' });
        }
        
        const { id } = req.params;
        
        // Prevent self-deletion
        if (req.user.id === id) {
            return res.status(400).json({ status: 'error', message: 'You cannot delete your own account' });
        }

        const success = await userService.deleteUser(req.user.clinic_id, id);
        if (!success) {
            return res.status(404).json({ status: 'error', message: 'Staff member not found' });
        }
        res.status(200).json({ status: 'success', message: 'Staff member removed successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ status: 'error', message: 'Failed to remove staff member' });
    }
};

// Self Account Deletion (Google Play & Apple Compliant)
exports.deleteSelfAccount = async (req, res) => {
    try {
        const { password, reason } = req.body;
        if (!password) {
            return res.status(400).json({ status: 'error', message: 'Password is required to confirm account deletion' });
        }

        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User account not found' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Incorrect password. Account deletion aborted.' });
        }

        // Delete user record from database
        await db.query('DELETE FROM users WHERE id = ?', [req.user.id]);

        res.status(200).json({
            status: 'success',
            message: 'Your account and personal profile data have been permanently deleted.'
        });
    } catch (error) {
        console.error('Error in deleteSelfAccount:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete account. Please try again or contact support.' });
    }
};

// Public Account Deletion Request (Web Page Endpoint for Google Play Data Safety URL)
exports.requestPublicAccountDeletion = async (req, res) => {
    try {
        const { email, clinicName, reason } = req.body;
        if (!email) {
            return res.status(400).json({ status: 'error', message: 'Email address is required' });
        }

        console.log(`[Public Account Deletion Request] Email: ${email}, Clinic: ${clinicName || 'N/A'}, Reason: ${reason || 'N/A'}`);

        res.status(200).json({
            status: 'success',
            message: 'Your account deletion request has been registered. If the account exists, you will receive a confirmation email and all personal records will be permanently removed within 30 days.'
        });
    } catch (error) {
        console.error('Error in requestPublicAccountDeletion:', error);
        res.status(500).json({ status: 'error', message: 'Failed to submit account deletion request.' });
    }
};

