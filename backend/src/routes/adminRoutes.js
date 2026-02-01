const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { validatePolicy } = require('../middleware/validators');

/**
 * Admin Routes
 * All routes require admin role
 */

// Apply authentication and admin authorization to all routes
router.use(authenticate, authorize('admin'));

// Get dashboard data
// GET /api/admin/dashboard
router.get('/dashboard', adminController.getDashboard);

// Get all users
// GET /api/admin/users
router.get('/users', adminController.getUsers);

// Update user status
// PUT /api/admin/users/:userId/status
router.put('/users/:userId/status', adminController.updateUserStatus);

// Get all policy settings
// GET /api/admin/policies
router.get('/policies', adminController.getPolicies);

// Update policy setting
// PUT /api/admin/policies
router.put('/policies', validatePolicy, adminController.updatePolicy);

// Get audit logs
// GET /api/admin/audit-logs
router.get('/audit-logs', adminController.getAuditLogs);

// Verify audit log integrity
// GET /api/admin/audit-logs/:logId/verify
router.get('/audit-logs/:logId/verify', adminController.verifyAuditLog);

module.exports = router;
