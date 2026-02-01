const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for login attempts
 * Prevents brute force attacks
 */
const loginLimiter = rateLimit({
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: 50, // Increased for development
    message: {
        error: 'Too many login attempts',
        message: 'Please try again after 15 minutes',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Use email + IP for more granular limiting
        return `${req.body.email || 'unknown'}-${req.ip}`;
    },
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many login attempts',
            message: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again after 15 minutes.',
            retryAfter: 900 // seconds
        });
    }
});

/**
 * Rate limiter for OTP verification
 * Prevents OTP brute force
 */
const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // 3 attempts per window
    message: {
        error: 'Too many OTP attempts',
        message: 'Please request a new OTP',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * General API rate limiter
 * Prevents DoS attacks
 */
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: {
        error: 'Too many requests',
        message: 'Please slow down',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Registration rate limiter
 * Prevents spam registrations
 */
const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 registration attempts per hour
    message: {
        error: 'Registration limit reached',
        message: 'Too many registration attempts. Please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    loginLimiter,
    otpLimiter,
    apiLimiter,
    registrationLimiter
};
