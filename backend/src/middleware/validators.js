const { body, param, validationResult } = require('express-validator');

/**
 * Validation error handler middleware
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg,
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * User registration validation rules
 */
const validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    body('role')
        .isIn(['student', 'faculty', 'admin'])
        .withMessage('Role must be student, faculty, or admin'),
    handleValidationErrors
];

/**
 * Login validation rules
 */
const validateLogin = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

/**
 * OTP validation rules
 */
const validateOTP = [
    body('otp')
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
        .isNumeric()
        .withMessage('OTP must contain only numbers'),
    handleValidationErrors
];

/**
 * Course creation validation rules
 */
const validateCourse = [
    body('courseName')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Course name must be between 3 and 100 characters'),
    body('courseCode')
        .trim()
        .isLength({ min: 2, max: 20 })
        .withMessage('Course code must be between 2 and 20 characters')
        .matches(/^[A-Z0-9-]+$/i)
        .withMessage('Course code can only contain letters, numbers, and hyphens'),
    body('maxSeats')
        .optional()
        .isInt({ min: 1, max: 500 })
        .withMessage('Max seats must be between 1 and 500'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
    handleValidationErrors
];

/**
 * Course ID parameter validation
 */
const validateCourseId = [
    param('courseId')
        .exists()
        .withMessage('Course ID is required'),
    handleValidationErrors
];

/**
 * Policy update validation
 */
const validatePolicy = [
    body('key')
        .trim()
        .isIn(['registration_start', 'registration_end', 'drop_deadline'])
        .withMessage('Invalid policy key'),
    body('value')
        .trim()
        .isISO8601()
        .withMessage('Value must be a valid ISO 8601 date'),
    handleValidationErrors
];

module.exports = {
    validateRegistration,
    validateLogin,
    validateOTP,
    validateCourse,
    validateCourseId,
    validatePolicy,
    handleValidationErrors
};
