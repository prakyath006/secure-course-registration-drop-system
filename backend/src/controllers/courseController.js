/**
 * Course Controller
 * Handles course CRUD operations
 */
const Course = require('../models/Course');
const AuditLog = require('../models/AuditLog');

/**
 * Get all courses
 */
const getAll = async (req, res) => {
    try {
        const courses = await Course.getAllCourses();

        res.json({
            success: true,
            count: courses.length,
            courses
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch courses',
            error: error.message
        });
    }
};

/**
 * Get available courses (with seats)
 */
const getAvailable = async (req, res) => {
    try {
        const courses = await Course.getAvailableCourses();

        res.json({
            success: true,
            count: courses.length,
            courses
        });
    } catch (error) {
        console.error('Get available courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available courses',
            error: error.message
        });
    }
};

/**
 * Get courses assigned to faculty
 */
const getMyCourses = async (req, res) => {
    try {
        const courses = await Course.getCoursesByFaculty(req.user.userId);

        res.json({
            success: true,
            count: courses.length,
            courses
        });
    } catch (error) {
        console.error('Get my courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your courses',
            error: error.message
        });
    }
};

/**
 * Get course by ID
 */
const getById = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Course.findByCourseId(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.json({
            success: true,
            course
        });
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course',
            error: error.message
        });
    }
};

/**
 * Create new course (Admin only)
 */
const create = async (req, res) => {
    try {
        const { courseName, courseCode, description, facultyId, maxSeats } = req.body;

        // Check if course code already exists
        const existingCourse = await Course.findOne({ courseCode: courseCode.toUpperCase() });
        if (existingCourse) {
            return res.status(400).json({
                success: false,
                message: 'Course code already exists'
            });
        }

        const course = await Course.createCourse({
            courseName,
            courseCode,
            description,
            facultyId,
            maxSeats
        });

        await AuditLog.log({
            action: 'COURSE_CREATE',
            userId: req.user.userId,
            resourceType: 'course',
            resourceId: course._id,
            details: { courseName, courseCode },
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create course',
            error: error.message
        });
    }
};

/**
 * Update course (Admin only)
 */
const update = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { courseName, description, facultyId, maxSeats } = req.body;

        console.log('Update course request:', { courseId, courseName, description, facultyId, maxSeats });

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        await course.updateCourse({ courseName, description, facultyId, maxSeats });

        await AuditLog.log({
            action: 'COURSE_UPDATE',
            userId: req.user.userId,
            resourceType: 'course',
            resourceId: course._id,
            details: { courseName, courseCode: course.courseCode },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Course updated successfully'
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update course',
            error: error.message
        });
    }
};

/**
 * Delete course (Admin only)
 */
const deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if there are active registrations
        if (course.currentEnrollment > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete course with active enrollments'
            });
        }

        await Course.findByIdAndDelete(courseId);

        await AuditLog.log({
            action: 'COURSE_DELETE',
            userId: req.user.userId,
            resourceType: 'course',
            resourceId: id,
            details: { courseName: course.courseName, courseCode: course.courseCode },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete course',
            error: error.message
        });
    }
};

module.exports = {
    getAll,
    getAvailable,
    getMyCourses,
    getById,
    create,
    update,
    delete: deleteCourse
};
