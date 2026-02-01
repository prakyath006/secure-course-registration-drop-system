/**
 * Registration Model (MongoDB/Mongoose)
 * Handles course registrations with encryption and integrity hashing
 */
const mongoose = require('mongoose');
const { encryptionUtils, integrityUtils, encodingUtils } = require('../utils/crypto');
const Course = require('./Course');
const AuditLog = require('./AuditLog');

const registrationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    encryptedData: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['registered', 'dropped'],
        default: 'registered'
    },
    integrityHash: {
        type: String,
        required: true
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
    droppedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate registrations
registrationSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
registrationSchema.index({ studentId: 1, status: 1 });
registrationSchema.index({ courseId: 1, status: 1 });

// Static method: Register for a course
registrationSchema.statics.registerForCourse = async function (studentId, courseId, ipAddress = null) {
    // Check if already registered
    const existing = await this.findOne({
        studentId,
        courseId,
        status: 'registered'
    });

    if (existing) {
        throw new Error('Already registered for this course');
    }

    // Get the course
    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    // Check if course has available seats
    if (course.currentEnrollment >= course.maxSeats) {
        throw new Error('Course is full');
    }

    // Prepare registration data
    const registrationData = {
        studentId: studentId.toString(),
        courseId: courseId.toString(),
        timestamp: new Date().toISOString(),
        action: 'REGISTER'
    };

    // Encrypt sensitive data
    const encryptedData = encryptionUtils.encrypt(JSON.stringify(registrationData));

    // Generate integrity hash
    const integrityHash = integrityUtils.generateActionHash(
        'COURSE_REGISTER',
        studentId.toString(),
        registrationData
    );

    // Check if there's a dropped registration to reactivate
    const droppedReg = await this.findOne({
        studentId,
        courseId,
        status: 'dropped'
    });

    let registration;
    if (droppedReg) {
        droppedReg.status = 'registered';
        droppedReg.encryptedData = encryptedData;
        droppedReg.integrityHash = integrityHash;
        droppedReg.registeredAt = new Date();
        droppedReg.droppedAt = null;
        await droppedReg.save();
        registration = droppedReg;
    } else {
        registration = new this({
            studentId,
            courseId,
            encryptedData,
            integrityHash,
            status: 'registered'
        });
        await registration.save();
    }

    // Increment course enrollment
    await course.incrementEnrollment();

    // Log the action
    await AuditLog.log({
        action: 'COURSE_REGISTER',
        userId: studentId,
        resourceType: 'registration',
        resourceId: registration._id,
        details: { courseId: courseId.toString(), courseCode: course.courseCode },
        ipAddress
    });

    return {
        reg_id: registration._id,
        student_id: registration.studentId,
        course_id: registration.courseId,
        status: registration.status,
        registered_at: registration.registeredAt
    };
};

// Static method: Drop a course
registrationSchema.statics.dropCourse = async function (studentId, courseId, ipAddress = null) {
    const registration = await this.findOne({
        studentId,
        courseId,
        status: 'registered'
    });

    if (!registration) {
        throw new Error('Registration not found');
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }

    // Update registration
    const dropData = {
        studentId: studentId.toString(),
        courseId: courseId.toString(),
        timestamp: new Date().toISOString(),
        action: 'DROP'
    };

    registration.status = 'dropped';
    registration.droppedAt = new Date();
    registration.encryptedData = encryptionUtils.encrypt(JSON.stringify(dropData));
    registration.integrityHash = integrityUtils.generateActionHash(
        'COURSE_DROP',
        studentId.toString(),
        dropData
    );

    await registration.save();

    // Decrement course enrollment
    await course.decrementEnrollment();

    // Log the action
    await AuditLog.log({
        action: 'COURSE_DROP',
        userId: studentId,
        resourceType: 'registration',
        resourceId: registration._id,
        details: { courseId: courseId.toString(), courseCode: course.courseCode },
        ipAddress
    });

    return {
        reg_id: registration._id,
        status: registration.status,
        dropped_at: registration.droppedAt
    };
};

// Static method: Get student registrations
registrationSchema.statics.getStudentRegistrations = async function (studentId, status = null) {
    const query = { studentId };
    if (status) query.status = status;

    const registrations = await this.find(query)
        .populate({
            path: 'courseId',
            populate: {
                path: 'facultyId',
                select: 'username'
            }
        })
        .sort({ registeredAt: -1 });

    return registrations.map(reg => {
        if (!reg.courseId) {
            console.warn(`Found orphan registration ${reg._id} pointing to missing course`);
            return null;
        }
        return {
            reg_id: reg._id,
            course_id: reg.courseId._id,
            course_name: reg.courseId.courseName,
            course_code: reg.courseId.courseCode,
            faculty_name: reg.courseId.facultyId?.username || null,
            status: reg.status,
            registered_at: reg.registeredAt,
            dropped_at: reg.droppedAt,
            encoded_course_id: encodingUtils.encodeBase64Url(reg.courseId._id.toString())
        };
    }).filter(Boolean);
};

// Static method: Get enrolled students for a course
registrationSchema.statics.getEnrolledStudents = async function (courseId) {
    const registrations = await this.find({
        courseId,
        status: 'registered'
    })
        .populate('studentId', 'username email')
        .sort({ registeredAt: 1 });

    return registrations.map(reg => ({
        user_id: reg.studentId._id,
        username: reg.studentId.username,
        email: reg.studentId.email,
        registered_at: reg.registeredAt
    }));
};

// Static method: Check registration ownership
registrationSchema.statics.checkOwnership = async function (studentId, courseId) {
    const reg = await this.findOne({
        studentId,
        courseId,
        status: 'registered'
    });
    return !!reg;
};

// Static method: Verify registration integrity
registrationSchema.statics.verifyIntegrity = async function (regId) {
    const reg = await this.findById(regId);
    if (!reg) {
        return { valid: false, message: 'Registration not found' };
    }

    try {
        const decryptedData = JSON.parse(encryptionUtils.decrypt(reg.encryptedData));
        const action = reg.status === 'registered' ? 'COURSE_REGISTER' : 'COURSE_DROP';

        const expectedHash = integrityUtils.generateActionHash(
            action,
            reg.studentId.toString(),
            decryptedData
        );

        const isValid = reg.integrityHash === expectedHash;

        return {
            valid: isValid,
            message: isValid ? 'Integrity verified' : 'Integrity check failed - possible tampering'
        };
    } catch (error) {
        return { valid: false, message: 'Failed to verify integrity' };
    }
};

// Static method: Get registration statistics
registrationSchema.statics.getStats = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const topCourses = await this.aggregate([
        { $match: { status: 'registered' } },
        {
            $group: {
                _id: '$courseId',
                enrollment_count: { $sum: 1 }
            }
        },
        { $sort: { enrollment_count: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: 'courses',
                localField: '_id',
                foreignField: '_id',
                as: 'course'
            }
        },
        { $unwind: '$course' },
        {
            $project: {
                course_id: '$_id',
                course_name: '$course.courseName',
                course_code: '$course.courseCode',
                enrollment_count: 1
            }
        }
    ]);

    const result = {
        active_registrations: 0,
        dropped_registrations: 0,
        topCourses
    };

    stats.forEach(s => {
        if (s._id === 'registered') result.active_registrations = s.count;
        if (s._id === 'dropped') result.dropped_registrations = s.count;
    });

    return result;
};

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
