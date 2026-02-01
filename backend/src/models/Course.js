/**
 * Course Model (MongoDB/Mongoose)
 * Handles course data and enrollment tracking
 */
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true,
        trim: true
    },
    courseCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    maxSeats: {
        type: Number,
        required: true,
        min: 1,
        max: 500
    },
    currentEnrollment: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// Indexes
courseSchema.index({ courseCode: 1 });
courseSchema.index({ facultyId: 1 });

// Virtual for available seats
courseSchema.virtual('availableSeats').get(function () {
    return this.maxSeats - this.currentEnrollment;
});

// Virtual for checking if course is available
courseSchema.virtual('isAvailable').get(function () {
    return this.currentEnrollment < this.maxSeats;
});

// Static method: Create new course
courseSchema.statics.createCourse = async function (courseData) {
    const { courseName, courseCode, description, facultyId, maxSeats } = courseData;

    const course = new this({
        courseName,
        courseCode: courseCode.toUpperCase(),
        description: description || '',
        // Handle empty string by converting to null
        facultyId: facultyId && facultyId.trim() !== '' ? facultyId : null,
        maxSeats
    });

    await course.save();
    return course.toObject();
};

// Static method: Get all courses with faculty info
courseSchema.statics.getAllCourses = async function () {
    const courses = await this.find()
        .populate('facultyId', 'username email')
        .sort({ courseCode: 1 });

    return courses.map(course => ({
        course_id: course._id,
        course_name: course.courseName,
        course_code: course.courseCode,
        description: course.description,
        faculty_id: course.facultyId?._id || null,
        faculty_name: course.facultyId?.username || null,
        max_seats: course.maxSeats,
        current_enrollment: course.currentEnrollment,
        available_seats: course.maxSeats - course.currentEnrollment
    }));
};

// Static method: Get available courses (with seats)
courseSchema.statics.getAvailableCourses = async function () {
    const courses = await this.find({
        $expr: { $lt: ['$currentEnrollment', '$maxSeats'] }
    })
        .populate('facultyId', 'username email')
        .sort({ courseCode: 1 });

    return courses.map(course => ({
        course_id: course._id,
        course_name: course.courseName,
        course_code: course.courseCode,
        description: course.description,
        faculty_id: course.facultyId?._id || null,
        faculty_name: course.facultyId?.username || null,
        max_seats: course.maxSeats,
        current_enrollment: course.currentEnrollment,
        available_seats: course.maxSeats - course.currentEnrollment
    }));
};

// Static method: Get courses by faculty
courseSchema.statics.getCoursesByFaculty = async function (facultyId) {
    const courses = await this.find({ facultyId })
        .sort({ courseCode: 1 });

    return courses.map(course => ({
        course_id: course._id,
        course_name: course.courseName,
        course_code: course.courseCode,
        description: course.description,
        max_seats: course.maxSeats,
        current_enrollment: course.currentEnrollment
    }));
};

// Static method: Find by ID
courseSchema.statics.findByCourseId = async function (courseId) {
    const course = await this.findById(courseId)
        .populate('facultyId', 'username email');

    if (!course) return null;

    return {
        course_id: course._id,
        course_name: course.courseName,
        course_code: course.courseCode,
        description: course.description,
        faculty_id: course.facultyId?._id || null,
        faculty_name: course.facultyId?.username || null,
        max_seats: course.maxSeats,
        current_enrollment: course.currentEnrollment
    };
};

// Instance method: Increment enrollment
courseSchema.methods.incrementEnrollment = async function () {
    if (this.currentEnrollment >= this.maxSeats) {
        throw new Error('Course is full');
    }
    this.currentEnrollment += 1;
    await this.save();
    return this;
};

// Instance method: Decrement enrollment
courseSchema.methods.decrementEnrollment = async function () {
    if (this.currentEnrollment > 0) {
        this.currentEnrollment -= 1;
        await this.save();
    }
    return this;
};

// Instance method: Update course
courseSchema.methods.updateCourse = async function (updateData) {
    const { courseName, description, facultyId, maxSeats } = updateData;

    if (courseName) this.courseName = courseName;
    if (description !== undefined) this.description = description;
    // Handle empty string by converting to null
    if (facultyId !== undefined) {
        if (facultyId && facultyId.toString().trim() !== '') {
            this.facultyId = facultyId;
        } else {
            this.facultyId = null;
        }
    }
    if (maxSeats !== undefined) this.maxSeats = maxSeats;

    await this.save();
    return this;
};

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
