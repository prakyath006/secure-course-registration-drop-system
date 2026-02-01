const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginLimiter, otpLimiter, registrationLimiter } = require('../middleware/rateLimiter');
const { validateRegistration, validateLogin, validateOTP } = require('../middleware/validators');

/**
 * Authentication Routes
 */

// Register a new user
// POST /api/auth/register
router.post('/register', registrationLimiter, validateRegistration, authController.register);

// Login - Step 1: Verify credentials
// POST /api/auth/login
router.post('/login', validateLogin, authController.login);

// Verify OTP - Step 2: Complete MFA
// POST /api/auth/verify-otp
router.post('/verify-otp', otpLimiter, validateOTP, authController.verifyOTP);

// Resend OTP
// POST /api/auth/resend-otp
router.post('/resend-otp', otpLimiter, authController.resendOTP);

// Logout (requires authentication)
// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

// Get current user profile (requires authentication)
// GET /api/auth/me
router.get('/me', authenticate, authController.getProfile);

module.exports = router;
