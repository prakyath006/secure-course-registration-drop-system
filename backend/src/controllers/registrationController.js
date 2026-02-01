/**
 * Registration Controller
 * Handles course registration and dropping
 */
const Registration = require('../models/Registration');
const Course = require('../models/Course');
const Policy = require('../models/Policy');
const { sendRegistrationConfirmation } = require('../utils/email');
const User = require('../models/User');

/**
 * Register for a course
 */
const register = async (req, res) => {
    try {
        const { courseId } = req.body;
        const studentId = req.user.userId;

        // Check registration window
        const regStatus = await Policy.isRegistrationOpen();
        if (!regStatus.isOpen) {
            return res.status(400).json({
                success: false,
                message: regStatus.message
            });
        }

        // Get course details for confirmation email
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Register
        const registration = await Registration.registerForCourse(studentId, courseId, req.ip);

        // Send confirmation email
        try {
            const user = await User.findByUserId(studentId);
            if (user) {
                await sendRegistrationConfirmation(user.email, {
                    courseName: course.courseName,
                    courseCode: course.courseCode,
                    studentName: user.username
                });
            }
        } catch (emailError) {
            console.error('Confirmation email failed:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Successfully registered for course',
            registration
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Registration failed'
        });
    }
};

/**
 * Drop a course
 */
const drop = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.userId;

        // Check drop deadline
        const dropStatus = await Policy.isDropAllowed();
        if (!dropStatus.isAllowed) {
            return res.status(400).json({
                success: false,
                message: dropStatus.message
            });
        }

        // Drop course
        const result = await Registration.dropCourse(studentId, courseId, req.ip);

        res.json({
            success: true,
            message: 'Course dropped successfully',
            result
        });

    } catch (error) {
        console.error('Drop error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to drop course'
        });
    }
};

/**
 * Get student's registrations
 */
const getMyRegistrations = async (req, res) => {
    try {
        const studentId = req.user.userId;
        const { status } = req.query;

        const registrations = await Registration.getStudentRegistrations(studentId, status);

        res.json({
            success: true,
            count: registrations.length,
            registrations
        });

    } catch (error) {
        console.error('Get registrations error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch registrations',
            error: error.message
        });
    }
};

/**
 * Get enrolled students for a course (Faculty/Admin)
 */
const getEnrolledStudents = async (req, res) => {
    try {
        const { courseId } = req.params;

        // If faculty, verify they own the course
        if (req.user.role === 'faculty') {
            const course = await Course.findById(courseId);
            if (!course || course.facultyId?.toString() !== req.user.userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied - not your course'
                });
            }
        }

        const students = await Registration.getEnrolledStudents(courseId);

        res.json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {
        console.error('Get enrolled students error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch enrolled students',
            error: error.message
        });
    }
};

/**
 * Verify registration integrity (Admin only)
 */
const verifyIntegrity = async (req, res) => {
    try {
        const { regId } = req.params;

        const result = await Registration.verifyIntegrity(regId);

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Verify integrity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify integrity',
            error: error.message
        });
    }
};

/**
 * Get registration statistics (Admin only)
 */
const getStats = async (req, res) => {
    try {
        const stats = await Registration.getStats();

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
};

module.exports = {
    register,
    drop,
    getMyRegistrations,
    getEnrolledStudents,
    verifyIntegrity,
    getStats
};
