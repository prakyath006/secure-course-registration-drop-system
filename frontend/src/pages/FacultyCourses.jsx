import { useState, useEffect } from 'react';
import { coursesAPI } from '../services/api';
import {
    BookOpen,
    Users,
    GraduationCap,
    Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Faculty.css';

const FacultyCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const response = await coursesAPI.getMyCourses();
            setCourses(response.courses);
        } catch (error) {
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner" style={{ width: 48, height: 48 }}></div>
            </div>
        );
    }

    return (
        <div className="faculty-page">
            <div className="page-header animate-slideUp">
                <div>
                    <h1>My Courses</h1>
                    <p>Courses assigned to you</p>
                </div>
                <div className="stat-pill">
                    <BookOpen size={16} />
                    <span>{courses.length} Courses</span>
                </div>
            </div>

            {courses.length === 0 ? (
                <div className="empty-state animate-slideUp">
                    <GraduationCap size={64} />
                    <h3>No Courses Assigned</h3>
                    <p>You haven't been assigned any courses yet.</p>
                </div>
            ) : (
                <div className="courses-grid animate-slideUp stagger-1">
                    {courses.map((course, index) => (
                        <div
                            key={course.course_id}
                            className="course-card"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="course-card-header">
                                <span className="course-code">{course.course_code}</span>
                                <div className="enrollment-badge">
                                    <Users size={14} />
                                    <span>{course.current_enrollment} / {course.max_seats}</span>
                                </div>
                            </div>

                            <h3 className="course-title">{course.course_name}</h3>

                            {course.description && (
                                <p className="course-description">{course.description}</p>
                            )}

                            <div className="course-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Enrolled</span>
                                    <span className="stat-value">{course.current_enrollment}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Available</span>
                                    <span className="stat-value">{course.max_seats - course.current_enrollment}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Capacity</span>
                                    <span className="stat-value">{course.max_seats}</span>
                                </div>
                            </div>

                            <div className="enrollment-progress">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${(course.current_enrollment / course.max_seats) * 100}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FacultyCourses;
