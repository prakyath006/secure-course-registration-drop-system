/**
 * Session Model (MongoDB/Mongoose)
 * Manages user sessions for JWT token tracking
 */
const mongoose = require('mongoose');
const crypto = require('crypto');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tokenHash: {
        type: String,
        required: true
    },
    isTemp: {
        type: Boolean,
        default: false
    },
    isValid: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Indexes
sessionSchema.index({ userId: 1, isValid: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Static method: Create session
sessionSchema.statics.createSession = async function (userId, token, isTemp = false, expiryHours = 24) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    const session = new this({
        userId,
        tokenHash,
        isTemp,
        expiresAt
    });

    await session.save();
    return session._id.toString();
};

// Static method: Validate session
sessionSchema.statics.validateSession = async function (sessionId, token) {
    const session = await this.findById(sessionId);

    if (!session) {
        return { valid: false, message: 'Session not found' };
    }

    if (!session.isValid) {
        return { valid: false, message: 'Session has been invalidated' };
    }

    if (new Date() > session.expiresAt) {
        return { valid: false, message: 'Session has expired' };
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (session.tokenHash !== tokenHash) {
        return { valid: false, message: 'Invalid session token' };
    }

    return { valid: true, userId: session.userId, isTemp: session.isTemp };
};

// Static method: Invalidate session
sessionSchema.statics.invalidateSession = async function (sessionId) {
    await this.findByIdAndUpdate(sessionId, { isValid: false });
};

// Static method: Invalidate all user sessions
sessionSchema.statics.invalidateAllUserSessions = async function (userId) {
    await this.updateMany({ userId, isValid: true }, { isValid: false });
};

// Static method: Upgrade temp session to full session
sessionSchema.statics.upgradeSession = async function (sessionId) {
    await this.findByIdAndUpdate(sessionId, { isTemp: false });
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
