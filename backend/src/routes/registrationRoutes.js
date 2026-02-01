const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Registration Routes
 */

// Get my registrations (students only)
// GET /api/registrations/my
router.get('/my', authenticate, authorize('student'), registrationController.getMyRegistrations);

// Get registration statistics (admin only)
// GET /api/registrations/stats
router.get('/stats', authenticate, authorize('admin'), registrationController.getStats);

// Register for a course (students only)
// POST /api/registrations
router.post('/', authenticate, authorize('student'), registrationController.register);

// Drop a course (students only)
// DELETE /api/registrations/:courseId
router.delete('/:courseId', authenticate, authorize('student'), registrationController.drop);

// Get enrolled students for a course (faculty/admin)
// GET /api/registrations/course/:courseId/students
router.get(
    '/course/:courseId/students',
    authenticate,
    authorize('faculty', 'admin'),
    registrationController.getEnrolledStudents
);

// Verify registration integrity (admin only)
// GET /api/registrations/:regId/verify
router.get('/:regId/verify', authenticate, authorize('admin'), registrationController.verifyIntegrity);

module.exports = router;
