/**
 * Database Seeder for MongoDB
 * Creates initial data for testing
 */
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/database');
const User = require('./models/User');
const Course = require('./models/Course');
const Policy = require('./models/Policy');

const seed = async () => {
    console.log('🌱 Starting database seed...\n');

    try {
        // Connect to MongoDB
        await connectDB();

        // Clear existing data (optional - comment out if you want to keep data)
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Course.deleteMany({});
        await Policy.deleteMany({});
        console.log('✅ Existing data cleared\n');

        // Create admin user
        console.log('Creating admin user...');
        const admin = await User.createUser({
            username: 'admin',
            email: 'admin@university.edu',
            password: 'Admin@123',
            role: 'admin'
        });
        console.log(`✅ Admin created: ${admin.username}`);

        // Create faculty users
        console.log('\nCreating faculty users...');
        const faculty1 = await User.createUser({
            username: 'dr_smith',
            email: 'smith@university.edu',
            password: 'Faculty@123',
            role: 'faculty'
        });
        console.log(`✅ Faculty created: ${faculty1.username}`);

        const faculty2 = await User.createUser({
            username: 'dr_johnson',
            email: 'johnson@university.edu',
            password: 'Faculty@123',
            role: 'faculty'
        });
        console.log(`✅ Faculty created: ${faculty2.username}`);

        // Create student users
        console.log('\nCreating student users...');
        const student1 = await User.createUser({
            username: 'john_doe',
            email: 'john.doe@student.edu',
            password: 'Student@123',
            role: 'student'
        });
        console.log(`✅ Student created: ${student1.username}`);

        const student2 = await User.createUser({
            username: 'jane_smith',
            email: 'jane.smith@student.edu',
            password: 'Student@123',
            role: 'student'
        });
        console.log(`✅ Student created: ${student2.username}`);

        // Create courses
        console.log('\nCreating courses...');
        const course1 = await Course.createCourse({
            courseName: 'Introduction to Computer Science',
            courseCode: 'CS101',
            description: 'Fundamental concepts of programming and computer science',
            facultyId: faculty1.user_id,
            maxSeats: 30
        });
        console.log(`✅ Course created: ${course1.courseName}`);

        const course2 = await Course.createCourse({
            courseName: 'Data Structures and Algorithms',
            courseCode: 'CS201',
            description: 'Advanced data structures and algorithmic problem solving',
            facultyId: faculty1.user_id,
            maxSeats: 25
        });
        console.log(`✅ Course created: ${course2.courseName}`);

        const course3 = await Course.createCourse({
            courseName: 'Database Management Systems',
            courseCode: 'CS301',
            description: 'Design and implementation of database systems',
            facultyId: faculty2.user_id,
            maxSeats: 30
        });
        console.log(`✅ Course created: ${course3.courseName}`);

        const course4 = await Course.createCourse({
            courseName: 'Web Development',
            courseCode: 'CS401',
            description: 'Modern web application development with React and Node.js',
            facultyId: faculty2.user_id,
            maxSeats: 35
        });
        console.log(`✅ Course created: ${course4.courseName}`);

        const course5 = await Course.createCourse({
            courseName: 'Cybersecurity Fundamentals',
            courseCode: 'CS501',
            description: 'Introduction to cybersecurity principles and practices',
            facultyId: faculty1.user_id,
            maxSeats: 20
        });
        console.log(`✅ Course created: ${course5.courseName}`);

        // Initialize policies
        console.log('\nInitializing policies...');
        await Policy.initDefaults();
        console.log('✅ Policies initialized');

        console.log('\n════════════════════════════════════════════');
        console.log('🎉 Database seeded successfully!');
        console.log('════════════════════════════════════════════');
        console.log('\nTest Credentials:');
        console.log('────────────────────────────────────────────');
        console.log('Admin:   admin / Admin@123');
        console.log('Faculty: dr_smith / Faculty@123');
        console.log('Faculty: dr_johnson / Faculty@123');
        console.log('Student: john_doe / Student@123');
        console.log('Student: jane_smith / Student@123');
        console.log('────────────────────────────────────────────');

        // Close connection
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Seed error:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
};

seed();
