const db = require('../config/db');

// All system configurable navigation menus
const ALL_MENUS = [
  { id: 'dashboard', label: 'Dashboard', category: 'Overview', description: 'Main analytics overview, live patient counters, revenue metrics' },
  { id: 'appointments', label: 'Appointments', category: 'Clinical', description: 'Clinic appointment bookings, doctor queues, slot calendar' },
  { id: 'home-visits', label: 'Home Visits', category: 'Clinical', description: 'On-site home veterinary appointment bookings and tracking' },
  { id: 'hospitalization', label: 'Hospitalization & IPD', category: 'Clinical', description: 'In-patient ward beds, admission monitoring, daily vitals' },
  { id: 'owners', label: 'Pet Owners', category: 'Records', description: 'Client profiles, contact details, balance history' },
  { id: 'pets', label: 'Patients / Pets', category: 'Records', description: 'Patient animal profiles, breed, microchip, vaccination' },
  { id: 'medical', label: 'Medical Records (EMR)', category: 'Clinical', description: 'Full clinical history, diagnostic files, vaccination timeline' },
  { id: 'treatment', label: 'Treatment Notes', category: 'Clinical', description: 'Doctor diagnostic findings, treatment plans, clinical notes' },
  { id: 'assistance-tasks', label: 'Assistance Tasks', category: 'Clinical', description: 'Clinical assistance checklists and daily assigned tasks' },
  { id: 'prescriptions', label: 'Prescriptions', category: 'Clinical', description: 'Digital e-prescriptions, dosage instructions, RX printing' },
  { id: 'my-revenue', label: 'Doctor Revenue', category: 'Financial', description: 'Doctor earnings, consultation commission calculations' },
  { id: 'billing', label: 'Billing & POS', category: 'Financial', description: 'Point of sale billing, invoices, payment receipt generator' },
  { id: 'inventory', label: 'Pharmacy & Inventory', category: 'Management', description: 'Medicine inventory, stock levels, batch/expiry alerts' },
  { id: 'reminders', label: 'Email Reminders', category: 'Communication', description: 'Automated client reminders for vaccines and follow-ups' },
  { id: 'staff', label: 'Staff Management', category: 'Administration', description: 'Add/manage employees, roles, and RBAC permission toggles' },
  { id: 'attendance', label: 'Staff Attendance', category: 'Administration', description: 'Clock-in/Clock-out logs, working hours, attendance history' },
  { id: 'reports', label: 'Reports & Analytics', category: 'Administration', description: 'Executive sales summaries, patient growth statistics' },
  { id: 'settings', label: 'Clinic Settings', category: 'Administration', description: 'Clinic profile, billing rates, branding, tax configuration' },
  { id: 'audit-logs', label: 'Audit Logs', category: 'Security', description: 'Detailed security logs, login records, system activity audit' },
  { id: 'support', label: 'Support Helpdesk', category: 'Help', description: 'Submit tickets and get platform assistance' },
];

const DEFAULT_ROLE_PERMISSIONS = {
  Admin: ALL_MENUS.map(m => m.id),
  Manager: ['dashboard', 'appointments', 'home-visits', 'hospitalization', 'owners', 'pets', 'medical', 'billing', 'inventory', 'reminders', 'attendance', 'reports', 'settings', 'support'],
  Doctor: ['dashboard', 'appointments', 'home-visits', 'hospitalization', 'pets', 'medical', 'treatment', 'prescriptions', 'my-revenue', 'billing', 'settings', 'support'],
  Receptionist: ['dashboard', 'appointments', 'home-visits', 'hospitalization', 'owners', 'pets', 'billing', 'inventory', 'reminders', 'settings', 'support'],
  'Vet Assistant': ['dashboard', 'appointments', 'home-visits', 'hospitalization', 'pets', 'medical', 'assistance-tasks', 'settings', 'support']
};

/**
 * Initialize DB table if not exists
 */
const initPermissionTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinic_id VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        menu_id VARCHAR(50) NOT NULL,
        is_allowed TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_clinic_role_menu (clinic_id, role, menu_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (err) {
    console.warn('[RBAC init warning]:', err.message);
  }
};

// Run table creation
initPermissionTable();

/**
 * GET /api/v1/permissions
 * Fetch all roles permission matrix for the current clinic
 */
const getPermissionsMatrix = async (req, res) => {
  try {
    const clinicId = req.user.clinic_id || 'default_clinic';
    await initPermissionTable();

    const [rows] = await db.query(
      'SELECT role, menu_id, is_allowed FROM role_permissions WHERE clinic_id = ?',
      [clinicId]
    );

    // Build map from DB
    const dbPermissionsMap = {};
    rows.forEach(r => {
      if (!dbPermissionsMap[r.role]) dbPermissionsMap[r.role] = {};
      dbPermissionsMap[r.role][r.menu_id] = Boolean(r.is_allowed);
    });

    // Assemble full matrix combining defaults
    const rolesList = ['Admin', 'Manager', 'Doctor', 'Receptionist', 'Vet Assistant'];
    const matrix = {};

    rolesList.forEach(role => {
      matrix[role] = {};
      const defaultAllowed = DEFAULT_ROLE_PERMISSIONS[role] || [];
      
      ALL_MENUS.forEach(menu => {
        if (role === 'Admin') {
          // Admin always has full access
          matrix[role][menu.id] = true;
        } else if (dbPermissionsMap[role] && dbPermissionsMap[role][menu.id] !== undefined) {
          matrix[role][menu.id] = dbPermissionsMap[role][menu.id];
        } else {
          matrix[role][menu.id] = defaultAllowed.includes(menu.id);
        }
      });
    });

    return res.status(200).json({
      status: 'success',
      data: {
        menus: ALL_MENUS,
        matrix
      }
    });
  } catch (error) {
    console.error('Error fetching permissions matrix:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /api/v1/permissions/update
 * Update permissions for specific roles in clinic
 */
const updateRolePermissions = async (req, res) => {
  try {
    const clinicId = req.user.clinic_id || 'default_clinic';
    const { role, permissions } = req.body;

    if (!role || !permissions || typeof permissions !== 'object') {
      return res.status(400).json({ status: 'error', message: 'Role and permissions object are required' });
    }

    if (role === 'Admin') {
      return res.status(400).json({ status: 'error', message: 'Admin permissions cannot be restricted.' });
    }

    await initPermissionTable();

    const entries = Object.entries(permissions);
    for (const [menuId, isAllowed] of entries) {
      await db.query(
        `INSERT INTO role_permissions (clinic_id, role, menu_id, is_allowed)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed), updated_at = NOW()`,
        [clinicId, role, menuId, isAllowed ? 1 : 0]
      );
    }

    // Optional: Log Audit entry
    try {
      await db.query(
        `INSERT INTO audit_logs (clinic_id, actor_name, action, description, created_at)
         VALUES (?, ?, 'ROLE_PERMISSIONS_UPDATED', ?, NOW())`,
        [clinicId, req.user.name || 'Admin', `Updated menu access permissions for role: ${role}`]
      );
    } catch (_) {}

    return res.status(200).json({
      status: 'success',
      message: `Access permissions for ${role} updated successfully.`
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * POST /api/v1/permissions/reset
 * Reset role permissions to factory defaults
 */
const resetRolePermissions = async (req, res) => {
  try {
    const clinicId = req.user.clinic_id || 'default_clinic';
    const { role } = req.body;

    if (role) {
      await db.query('DELETE FROM role_permissions WHERE clinic_id = ? AND role = ?', [clinicId, role]);
    } else {
      await db.query('DELETE FROM role_permissions WHERE clinic_id = ?', [clinicId]);
    }

    return res.status(200).json({
      status: 'success',
      message: role ? `Permissions for ${role} reset to default.` : 'All role permissions reset to default.'
    });
  } catch (error) {
    console.error('Error resetting permissions:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * GET /api/v1/permissions/my-permissions
 * Get allowed menu list for current authenticated user
 */
const getMyPermissions = async (req, res) => {
  try {
    const role = req.user.role || 'Staff';
    const clinicId = req.user.clinic_id || 'default_clinic';

    if (role.toLowerCase() === 'admin' || role.toLowerCase() === 'super_admin' || role.toLowerCase() === 'master_admin') {
      return res.status(200).json({
        status: 'success',
        data: {
          role,
          allowedMenus: ALL_MENUS.map(m => m.id)
        }
      });
    }

    await initPermissionTable();

    const [rows] = await db.query(
      'SELECT menu_id, is_allowed FROM role_permissions WHERE clinic_id = ? AND role = ?',
      [clinicId, role]
    );

    const defaultAllowed = DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS['Vet Assistant'];
    let allowedMenus = [];

    if (rows.length === 0) {
      allowedMenus = defaultAllowed;
    } else {
      const permMap = {};
      rows.forEach(r => { permMap[r.menu_id] = Boolean(r.is_allowed); });
      
      ALL_MENUS.forEach(m => {
        if (permMap[m.id] !== undefined) {
          if (permMap[m.id]) allowedMenus.push(m.id);
        } else if (defaultAllowed.includes(m.id)) {
          allowedMenus.push(m.id);
        }
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        role,
        allowedMenus
      }
    });
  } catch (error) {
    console.error('Error in getMyPermissions:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  ALL_MENUS,
  DEFAULT_ROLE_PERMISSIONS,
  getPermissionsMatrix,
  updateRolePermissions,
  resetRolePermissions,
  getMyPermissions
};
