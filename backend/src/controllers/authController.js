/**
 * Authentication Controller
 * Handles user registration, login, OTP verification, and logout
 */
const User = require('../models/User');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');
const { otpUtils, tokenUtils } = require('../utils/crypto');
const { sendOTPEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');

/**
 * Register a new user
 */
const register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Check if username exists
        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        // Check if email exists
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Create user
        const user = await User.createUser({ username, email, password, role });

        // Log action
        await AuditLog.log({
            action: 'USER_REGISTER',
            userId: user.user_id,
            resourceType: 'user',
            resourceId: user.user_id,
            details: { username, email, role },
            ipAddress: req.ip
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
};

/**
 * Login - Step 1: Verify credentials and send OTP
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            await AuditLog.log({
                action: 'LOGIN_FAILED',
                userId: null,
                details: { email, reason: 'User not found' },
                ipAddress: req.ip
            });
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Verify password
        const isValidPassword = user.verifyPassword(password);
        if (!isValidPassword) {
            await AuditLog.log({
                action: 'LOGIN_FAILED',
                userId: user._id,
                details: { username: user.username, reason: 'Invalid password' },
                ipAddress: req.ip
            });
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate OTP
        const otp = otpUtils.generateOTP();

        // Store OTP
        await user.storeOTP(otp);

        // Create temporary session
        const tempToken = tokenUtils.generateToken();
        const tempSessionId = await Session.createSession(user._id, tempToken, true, 0.5); // 30 min temp session

        // Send OTP via email
        try {
            await sendOTPEmail(user.email, otp, user.username);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Continue anyway for development - log the OTP
            console.log(`[DEV] OTP for ${user.username}: ${otp}`);
        }

        await AuditLog.log({
            action: 'LOGIN_ATTEMPT',
            userId: user._id,
            details: { username: user.username, mfaRequired: true },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'OTP sent to your email',
            mfaRequired: true,
            userId: user._id,
            tempSessionId
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
};

/**
 * Login - Step 2: Verify OTP
 */
const verifyOTP = async (req, res) => {
    try {
        const { userId, otp, tempSessionId } = req.body;

        // Validate temp session
        const user = await User.findByUserId(userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request'
            });
        }

        // Verify OTP
        const otpResult = await user.verifyOTP(otp);
        if (!otpResult.valid) {
            await AuditLog.log({
                action: 'OTP_FAILED',
                userId: user._id,
                details: { reason: otpResult.message },
                ipAddress: req.ip
            });
            return res.status(400).json({
                success: false,
                message: otpResult.message
            });
        }

        // Invalidate temp session
        if (tempSessionId) {
            await Session.invalidateSession(tempSessionId);
        }

        // Generate JWT
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '24h' }
        );

        // Create persistent session
        const sessionId = await Session.createSession(user._id, token, false, 24);

        await AuditLog.log({
            action: 'LOGIN_SUCCESS',
            userId: user._id,
            resourceType: 'session',
            resourceId: sessionId,
            details: { username: user.username },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            sessionId,
            user: user.toSafeObject()
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'OTP verification failed',
            error: error.message
        });
    }
};

/**
 * Resend OTP
 */
const resendOTP = async (req, res) => {
    try {
        const { userId, tempSessionId } = req.body;

        const user = await User.findByUserId(userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request'
            });
        }

        // Generate new OTP
        const otp = otpUtils.generateOTP();
        await user.storeOTP(otp);

        // Send OTP via email
        try {
            await sendOTPEmail(user.email, otp, user.username);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            console.log(`[DEV] OTP for ${user.username}: ${otp}`);
        }

        res.json({
            success: true,
            message: 'New OTP sent to your email'
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP',
            error: error.message
        });
    }
};

/**
 * Logout
 */
const logout = async (req, res) => {
    try {
        const { sessionId, userId } = req.user;

        // Invalidate session
        if (sessionId) {
            await Session.invalidateSession(sessionId);
        }

        await AuditLog.log({
            action: 'LOGOUT',
            userId,
            details: { sessionId },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findByUserId(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user.toSafeObject()
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login,
    verifyOTP,
    resendOTP,
    logout,
    getProfile
};
