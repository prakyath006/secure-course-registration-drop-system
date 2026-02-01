import { useState, useEffect } from 'react';
import { coursesAPI, registrationsAPI } from '../services/api';
import {
    Search,
    BookOpen,
    Users,
    Clock,
    Plus,
    Check,
    Loader,
    User,
    Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Courses.css';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [registeringCourse, setRegisteringCourse] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [coursesRes, registrationsRes] = await Promise.all([
                coursesAPI.getAvailable(),
                registrationsAPI.getMyRegistrations('registered')
            ]);
            setCourses(coursesRes.courses);
            setRegistrations(registrationsRes.registrations);
        } catch (error) {
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (courseId) => {
        setRegisteringCourse(courseId);
        try {
            await registrationsAPI.register(courseId);
            toast.success('Successfully registered for course!');
            loadData(); // Refresh data
        } catch (error) {
            toast.error(error.message || 'Registration failed');
        } finally {
            setRegisteringCourse(null);
        }
    };

    const isRegistered = (courseId) => {
        return registrations.some(r => r.course_id === courseId);
    };

    const filteredCourses = courses.filter(course =>
        course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner" style={{ width: 48, height: 48 }}></div>
            </div>
        );
    }

    return (
        <div className="courses-page">
            <div className="page-header animate-slideUp">
                <div>
                    <h1>Available Courses</h1>
                    <p>Browse and register for courses</p>
                </div>
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input"
                    />
                </div>
            </div>

            <div className="courses-stats animate-slideUp stagger-1">
                <div className="stat-pill">
                    <BookOpen size={16} />
                    <span>{courses.length} Available</span>
                </div>
                <div className="stat-pill">
                    <Check size={16} />
                    <span>{registrations.length} Registered</span>
                </div>
            </div>

            {filteredCourses.length > 0 ? (
                <div className="courses-grid animate-slideUp stagger-2">
                    {filteredCourses.map((course) => (
                        <CourseCard
                            key={course.course_id}
                            course={course}
                            isRegistered={isRegistered(course.course_id)}
                            onRegister={() => handleRegister(course.course_id)}
                            isLoading={registeringCourse === course.course_id}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state animate-fadeIn">
                    <BookOpen size={64} />
                    <h3>No courses found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            )}
        </div>
    );
};

const CourseCard = ({ course, isRegistered, onRegister, isLoading }) => {
    const availableSeats = course.max_seats - course.current_enrollment;
    const fillPercentage = (course.current_enrollment / course.max_seats) * 100;

    return (
        <div className={`course-card ${isRegistered ? 'registered' : ''}`}>
            <div className="course-header">
                <div className="course-badge">{course.course_code}</div>
                {isRegistered && (
                    <div className="registered-badge">
                        <Check size={14} />
                        Registered
                    </div>
                )}
            </div>

            <h3 className="course-title">{course.course_name}</h3>

            {course.description && (
                <p className="course-description">{course.description}</p>
            )}

            <div className="course-meta">
                {course.faculty_name && (
                    <div className="meta-item">
                        <User size={14} />
                        <span>{course.faculty_name}</span>
                    </div>
                )}
                <div className="meta-item">
                    <Users size={14} />
                    <span>{availableSeats} seats available</span>
                </div>
            </div>

            <div className="enrollment-progress">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${fillPercentage}%` }}
                    ></div>
                </div>
                <span className="progress-text">
                    {course.current_enrollment} / {course.max_seats} enrolled
                </span>
            </div>

            <button
                className={`btn ${isRegistered ? 'btn-secondary' : 'btn-primary'} w-full`}
                onClick={onRegister}
                disabled={isRegistered || isLoading || availableSeats === 0}
            >
                {isLoading ? (
                    <Loader size={18} className="spinner-icon" />
                ) : isRegistered ? (
                    <>
                        <Check size={18} />
                        Registered
                    </>
                ) : availableSeats === 0 ? (
                    'Course Full'
                ) : (
                    <>
                        <Plus size={18} />
                        Register
                    </>
                )}
            </button>
        </div>
    );
};

export default Courses;
