/**
 * Admin Controller
 * Handles admin-specific operations
 */
const User = require('../models/User');
const Course = require('../models/Course');
const Registration = require('../models/Registration');
const Policy = require('../models/Policy');
const AuditLog = require('../models/AuditLog');

/**
 * Get dashboard data
 */
const getDashboard = async (req, res) => {
    try {
        // Get user stats
        const users = await User.getAllUsers();
        const userStats = {
            total: users.length,
            active: users.filter(u => u.is_active).length,
            students: users.filter(u => u.role === 'student').length,
            faculty: users.filter(u => u.role === 'faculty').length,
            admins: users.filter(u => u.role === 'admin').length
        };

        // Get course stats
        const courses = await Course.getAllCourses();
        const courseStats = {
            total: courses.length,
            totalSeats: courses.reduce((sum, c) => sum + c.max_seats, 0),
            totalEnrollment: courses.reduce((sum, c) => sum + c.current_enrollment, 0)
        };

        // Get registration stats
        const registrationStats = await Registration.getStats();

        // Get policy status
        const registrationStatus = await Policy.isRegistrationOpen();

        res.json({
            success: true,
            dashboard: {
                users: userStats,
                courses: courseStats,
                registrations: registrationStats,
                registrationStatus
            }
        });

    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
};

/**
 * Get all users
 */
const getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const users = await User.getAllUsers(role);

        res.json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

/**
 * Update user status (activate/deactivate)
 */
const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        const user = await User.findByUserId(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent self-deactivation
        if (userId === req.user.userId.toString() && !isActive) {
            return res.status(400).json({
                success: false,
                message: 'Cannot deactivate your own account'
            });
        }

        await user.updateStatus(isActive);

        await AuditLog.log({
            action: isActive ? 'USER_ACTIVATE' : 'USER_DEACTIVATE',
            userId: req.user.userId,
            resourceType: 'user',
            resourceId: userId,
            details: { targetUser: user.username },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
        });

    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status',
            error: error.message
        });
    }
};

/**
 * Get all policies
 */
const getPolicies = async (req, res) => {
    try {
        const policies = await Policy.getAllPolicies();
        const status = await Policy.getStatus();

        res.json({
            success: true,
            policies: policies.map(p => ({
                setting_key: p.settingKey,
                setting_value: p.settingValue
            })),
            status
        });

    } catch (error) {
        console.error('Get policies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch policies',
            error: error.message
        });
    }
};

/**
 * Update policy
 */
const updatePolicy = async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!['registration_start', 'registration_end', 'drop_deadline'].includes(key)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid policy key'
            });
        }

        await Policy.setPolicy(key, value);

        await AuditLog.log({
            action: 'POLICY_UPDATE',
            userId: req.user.userId,
            resourceType: 'policy',
            details: { key, value },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Policy updated successfully'
        });

    } catch (error) {
        console.error('Update policy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update policy',
            error: error.message
        });
    }
};

/**
 * Get audit logs
 */
const getAuditLogs = async (req, res) => {
    try {
        const { action, userId, limit, offset } = req.query;

        const logs = await AuditLog.getLogs({
            action,
            userId,
            limit: parseInt(limit) || 50,
            offset: parseInt(offset) || 0
        });

        res.json({
            success: true,
            count: logs.length,
            logs
        });

    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs',
            error: error.message
        });
    }
};

/**
 * Verify audit log integrity
 */
const verifyAuditLog = async (req, res) => {
    try {
        const { logId } = req.params;

        const result = await AuditLog.verifyLogIntegrity(logId);

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Verify audit log error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify audit log',
            error: error.message
        });
    }
};

module.exports = {
    getDashboard,
    getUsers,
    updateUserStatus,
    getPolicies,
    updatePolicy,
    getAuditLogs,
    verifyAuditLog
};
