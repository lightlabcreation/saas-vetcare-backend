const express = require('express');
const router = express.Router();
const {
  getPermissionsMatrix,
  updateRolePermissions,
  resetRolePermissions,
  getMyPermissions
} = require('../controllers/permissionController');

// All endpoints inherit 'protect' from server.js

// 1. Get current logged-in user's permitted menus
router.get('/my-permissions', getMyPermissions);

// 2. Get full clinic matrix (For Admin)
router.get('/', getPermissionsMatrix);

// 3. Update permissions for a role (Admin only)
router.post('/update', updateRolePermissions);

// 4. Reset permissions to factory defaults
router.post('/reset', resetRolePermissions);

module.exports = router;
