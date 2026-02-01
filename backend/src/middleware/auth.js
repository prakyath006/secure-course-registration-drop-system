/**
 * Authentication & Authorization Middleware
 * Handles JWT verification, role-based access, and resource ownership
 */
const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');

/**
 * Authenticate user via JWT token
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get session ID from token or header
        const sessionId = req.headers['x-session-id'] || decoded.sessionId;

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            sessionId
        };

        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

/**
 * Authorize user based on roles
 */
const authorize = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Not authenticated'
                });
            }

            if (!allowedRoles.includes(req.user.role)) {
                // Log unauthorized access attempt
                await AuditLog.log({
                    action: 'UNAUTHORIZED_ACCESS',
                    userId: req.user.userId,
                    details: {
                        attemptedRole: req.user.role,
                        requiredRoles: allowedRoles,
                        path: req.path,
                        method: req.method
                    },
                    ipAddress: req.ip
                });

                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.'
                });
            }

            next();

        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization failed'
            });
        }
    };
};

/**
 * Verify resource ownership
 * Used to check if a user owns a resource (e.g., student owns their registration)
 */
const verifyOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            const { userId, role } = req.user;

            // Admins can access all resources
            if (role === 'admin') {
                return next();
            }

            const resourceId = req.params.id || req.params.courseId || req.params.regId;

            switch (resourceType) {
                case 'registration':
                    // Students can only access their own registrations
                    if (role === 'student') {
                        const Registration = require('../models/Registration');
                        const reg = await Registration.findById(resourceId);

                        if (!reg || reg.studentId.toString() !== userId.toString()) {
                            return res.status(403).json({
                                success: false,
                                message: 'Access denied. Not your registration.'
                            });
                        }
                    }
                    break;

                case 'course':
                    // Faculty can only access their assigned courses
                    if (role === 'faculty') {
                        const Course = require('../models/Course');
                        const course = await Course.findById(resourceId);

                        if (!course || course.facultyId?.toString() !== userId.toString()) {
                            return res.status(403).json({
                                success: false,
                                message: 'Access denied. Not your course.'
                            });
                        }
                    }
                    break;

                default:
                    break;
            }

            next();

        } catch (error) {
            console.error('Ownership verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify ownership'
            });
        }
    };
};

/**
 * Require MFA verification
 * Checks if user has completed MFA for the session
 */
const requireMFA = async (req, res, next) => {
    try {
        if (!req.user || !req.user.sessionId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        // Session validation (MFA is completed when session is created after OTP verification)
        const session = await Session.findById(req.user.sessionId);

        if (!session || session.isTemp) {
            return res.status(401).json({
                success: false,
                message: 'MFA verification required'
            });
        }

        next();

    } catch (error) {
        console.error('MFA check error:', error);
        res.status(500).json({
            success: false,
            message: 'MFA verification failed'
        });
    }
};

module.exports = {
    authenticate,
    authorize,
    verifyOwnership,
    requireMFA
};
