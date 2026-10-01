const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middlewares/authMiddleware');

const userController = require('../controllers/userController');

// Public endpoint for web account deletion request (Google Play requirement)
router.post('/request-deletion', userController.requestPublicAccountDeletion);

router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.delete('/delete-my-account', userController.deleteSelfAccount);

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
