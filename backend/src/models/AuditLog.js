/**
 * Audit Log Model (MongoDB/Mongoose)
 * Logs all critical actions with integrity hash protection
 */
const mongoose = require('mongoose');
const { integrityUtils } = require('../utils/crypto');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    resourceType: {
        type: String,
        default: null
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String,
        default: null
    },
    integrityHash: {
        type: String,
        required: true
    }
}, {
    timestamps: { createdAt: 'timestamp', updatedAt: false }
});

// Indexes
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// Static method: Log an action
auditLogSchema.statics.log = async function (logData) {
    const { action, userId, resourceType, resourceId, details, ipAddress } = logData;

    // Generate integrity hash
    const hashData = {
        action,
        userId: userId?.toString() || null,
        resourceType,
        resourceId: resourceId?.toString() || null,
        details,
        ipAddress,
        timestamp: new Date().toISOString()
    };

    const integrityHash = integrityUtils.generateActionHash(
        action,
        userId?.toString() || 'system',
        hashData
    );

    const log = new this({
        action,
        userId,
        resourceType,
        resourceId,
        details,
        ipAddress,
        integrityHash
    });

    await log.save();
    return log;
};

// Static method: Get logs with filters
auditLogSchema.statics.getLogs = async function (filters = {}) {
    const { action, userId, limit = 50, offset = 0 } = filters;

    const query = {};
    if (action) query.action = action;
    if (userId) query.userId = userId;

    const logs = await this.find(query)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit);

    return logs.map(log => ({
        log_id: log._id,
        action: log.action,
        user_id: log.userId,
        resource_type: log.resourceType,
        resource_id: log.resourceId,
        details: JSON.stringify(log.details),
        ip_address: log.ipAddress,
        integrity_hash: log.integrityHash,
        timestamp: log.timestamp
    }));
};

// Static method: Verify log integrity
auditLogSchema.statics.verifyLogIntegrity = async function (logId) {
    const log = await this.findById(logId);

    if (!log) {
        return { valid: false, message: 'Log not found' };
    }

    // Recreate the hash
    const hashData = {
        action: log.action,
        userId: log.userId?.toString() || null,
        resourceType: log.resourceType,
        resourceId: log.resourceId?.toString() || null,
        details: log.details,
        ipAddress: log.ipAddress,
        timestamp: log.timestamp.toISOString()
    };

    const expectedHash = integrityUtils.generateActionHash(
        log.action,
        log.userId?.toString() || 'system',
        hashData
    );

    const isValid = log.integrityHash === expectedHash;

    return {
        valid: isValid,
        message: isValid ? 'Log integrity verified' : 'Log integrity check failed - possible tampering'
    };
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
