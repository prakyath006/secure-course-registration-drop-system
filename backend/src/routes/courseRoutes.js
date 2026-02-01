const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateCourse, validateCourseId } = require('../middleware/validators');

/**
 * Course Routes
 */

// Get all courses (authenticated users)
// GET /api/courses
router.get('/', authenticate, courseController.getAll);

// Get available courses for registration (students)
// GET /api/courses/available
router.get('/available', authenticate, authorize('student'), courseController.getAvailable);

// Get my courses (faculty only)
// GET /api/courses/my-courses
router.get('/my-courses', authenticate, authorize('faculty'), courseController.getMyCourses);

// Get course by ID (authenticated users)
// GET /api/courses/:courseId
router.get('/:courseId', authenticate, validateCourseId, courseController.getById);

// Create a new course (admin only)
// POST /api/courses
router.post('/', authenticate, authorize('admin'), validateCourse, courseController.create);

// Update a course (admin only)
// PUT /api/courses/:courseId
router.put('/:courseId', authenticate, authorize('admin'), validateCourseId, courseController.update);

// Delete a course (admin only)
// DELETE /api/courses/:courseId
router.delete('/:courseId', authenticate, authorize('admin'), validateCourseId, courseController.delete);

module.exports = router;
