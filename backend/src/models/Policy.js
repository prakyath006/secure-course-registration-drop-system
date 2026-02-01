/**
 * Policy Model (MongoDB/Mongoose)
 * Manages system policies for registration windows and deadlines
 */
const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    settingKey: {
        type: String,
        required: true,
        unique: true,
        enum: ['registration_start', 'registration_end', 'drop_deadline']
    },
    settingValue: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Static method: Get all policies
policySchema.statics.getAllPolicies = async function () {
    return await this.find();
};

// Static method: Get policy by key
policySchema.statics.getPolicy = async function (key) {
    const policy = await this.findOne({ settingKey: key });
    return policy?.settingValue || null;
};

// Static method: Set policy
policySchema.statics.setPolicy = async function (key, value) {
    const policy = await this.findOneAndUpdate(
        { settingKey: key },
        { settingValue: value },
        { upsert: true, new: true }
    );
    return policy;
};

// Static method: Check if registration is open
policySchema.statics.isRegistrationOpen = async function () {
    const now = new Date();

    const startPolicy = await this.findOne({ settingKey: 'registration_start' });
    const endPolicy = await this.findOne({ settingKey: 'registration_end' });

    if (!startPolicy || !endPolicy) {
        return { isOpen: true, message: 'No registration window configured' };
    }

    const startDate = new Date(startPolicy.settingValue);
    const endDate = new Date(endPolicy.settingValue);

    if (now < startDate) {
        return {
            isOpen: false,
            message: `Registration opens on ${startDate.toLocaleDateString()}`,
            startDate: startPolicy.settingValue,
            endDate: endPolicy.settingValue
        };
    }

    if (now > endDate) {
        return {
            isOpen: false,
            message: `Registration closed on ${endDate.toLocaleDateString()}`,
            startDate: startPolicy.settingValue,
            endDate: endPolicy.settingValue
        };
    }

    return {
        isOpen: true,
        message: 'Registration is open',
        startDate: startPolicy.settingValue,
        endDate: endPolicy.settingValue
    };
};

// Static method: Check if dropping is allowed
policySchema.statics.isDropAllowed = async function () {
    const now = new Date();

    const deadlinePolicy = await this.findOne({ settingKey: 'drop_deadline' });

    if (!deadlinePolicy) {
        return { isAllowed: true, message: 'No drop deadline configured' };
    }

    const deadline = new Date(deadlinePolicy.settingValue);

    if (now > deadline) {
        return {
            isAllowed: false,
            message: `Drop deadline passed on ${deadline.toLocaleDateString()}`,
            deadline: deadlinePolicy.settingValue
        };
    }

    return {
        isAllowed: true,
        message: `Drop allowed until ${deadline.toLocaleDateString()}`,
        deadline: deadlinePolicy.settingValue
    };
};

// Static method: Initialize default policies
policySchema.statics.initDefaults = async function () {
    const defaults = {
        registration_start: process.env.REGISTRATION_START || new Date().toISOString(),
        registration_end: process.env.REGISTRATION_END || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        drop_deadline: process.env.DROP_DEADLINE || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };

    for (const [key, value] of Object.entries(defaults)) {
        const existing = await this.findOne({ settingKey: key });
        if (!existing) {
            await this.create({ settingKey: key, settingValue: value });
        }
    }
};

// Static method: Get status
policySchema.statics.getStatus = async function () {
    const registration = await this.isRegistrationOpen();
    const drop = await this.isDropAllowed();

    return { registration, drop };
};

const Policy = mongoose.model('Policy', policySchema);

module.exports = Policy;
