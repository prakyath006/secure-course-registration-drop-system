/**
 * User Model (MongoDB/Mongoose)
 * Handles user data with secure password hashing
 */
const mongoose = require('mongoose');
const { passwordUtils, otpUtils } = require('../utils/crypto');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'faculty', 'admin'],
        default: 'student'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // OTP fields for MFA
    otpHash: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    },
    otpUsed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Static method: Create new user
userSchema.statics.createUser = async function (userData) {
    const { username, email, password, role = 'student' } = userData;

    const salt = passwordUtils.generateSalt();
    const passwordHash = passwordUtils.hashPassword(password, salt);

    const user = new this({
        username,
        email,
        passwordHash,
        salt,
        role
    });

    await user.save();
    return user.toSafeObject();
};

// Static method: Find by username
userSchema.statics.findByUsername = async function (username) {
    return await this.findOne({ username });
};

// Static method: Find by email
userSchema.statics.findByEmail = async function (email) {
    return await this.findOne({ email: email.toLowerCase() });
};

// Static method: Find by ID
userSchema.statics.findByUserId = async function (userId) {
    return await this.findById(userId);
};

// Static method: Get all users with optional role filter
userSchema.statics.getAllUsers = async function (role = null) {
    const query = role ? { role } : {};
    const users = await this.find(query).select('-passwordHash -salt -otpHash');
    return users.map(user => ({
        user_id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.isActive,
        created_at: user.createdAt
    }));
};

// Instance method: Verify password
userSchema.methods.verifyPassword = function (password) {
    return passwordUtils.verifyPassword(password, this.passwordHash, this.salt);
};

// Instance method: Store OTP
userSchema.methods.storeOTP = async function (otp) {
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
    const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

    this.otpHash = otpUtils.hashOTP(otp);
    this.otpExpiry = expiry;
    this.otpUsed = false;

    await this.save();
};

// Instance method: Verify OTP
userSchema.methods.verifyOTP = async function (otp) {
    if (!this.otpHash || this.otpUsed) {
        return { valid: false, message: 'No valid OTP found' };
    }

    if (new Date() > this.otpExpiry) {
        return { valid: false, message: 'OTP has expired' };
    }

    const isValid = otpUtils.verifyOTP(otp, this.otpHash);

    if (isValid) {
        this.otpUsed = true;
        await this.save();
        return { valid: true };
    }

    return { valid: false, message: 'Invalid OTP' };
};

// Instance method: Update status
userSchema.methods.updateStatus = async function (isActive) {
    this.isActive = isActive;
    await this.save();
    return this;
};

// Instance method: Convert to safe object (no sensitive data)
userSchema.methods.toSafeObject = function () {
    return {
        user_id: this._id,
        username: this.username,
        email: this.email,
        role: this.role,
        is_active: this.isActive,
        created_at: this.createdAt
    };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
