import { useState, useEffect } from 'react';
import { coursesAPI, registrationsAPI } from '../services/api';
import {
    Users,
    BookOpen,
    Mail,
    Calendar,
    ChevronDown,
    ChevronUp,
    Search,
    Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Faculty.css';

const Enrollments = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCourses, setExpandedCourses] = useState({});
    const [studentData, setStudentData] = useState({});
    const [loadingStudents, setLoadingStudents] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const response = await coursesAPI.getMyCourses();
            setCourses(response.courses);
            // Auto-expand first course if exists
            if (response.courses.length > 0) {
                const firstCourseId = response.courses[0].course_id;
                setExpandedCourses({ [firstCourseId]: true });
                loadStudents(firstCourseId);
            }
        } catch (error) {
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async (courseId) => {
        if (studentData[courseId]) return; // Already loaded

        setLoadingStudents(prev => ({ ...prev, [courseId]: true }));
        try {
            const response = await registrationsAPI.getEnrolledStudents(courseId);
            setStudentData(prev => ({ ...prev, [courseId]: response.students }));
        } catch (error) {
            toast.error('Failed to load students');
        } finally {
            setLoadingStudents(prev => ({ ...prev, [courseId]: false }));
        }
    };

    const toggleCourse = (courseId) => {
        const isExpanding = !expandedCourses[courseId];
        setExpandedCourses(prev => ({
            ...prev,
            [courseId]: isExpanding
        }));

        if (isExpanding && !studentData[courseId]) {
            loadStudents(courseId);
        }
    };

    const getTotalEnrollments = () => {
        return courses.reduce((sum, course) => sum + course.current_enrollment, 0);
    };

    const filterStudents = (students) => {
        if (!searchTerm) return students;
        return students.filter(student =>
            student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
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
                    <h1>Student Enrollments</h1>
                    <p>View students enrolled in your courses</p>
                </div>
                <div className="header-stats">
                    <div className="stat-pill">
                        <BookOpen size={16} />
                        <span>{courses.length} Courses</span>
                    </div>
                    <div className="stat-pill">
                        <Users size={16} />
                        <span>{getTotalEnrollments()} Students</span>
                    </div>
                </div>
            </div>

            <div className="search-bar animate-slideUp stagger-1">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                />
            </div>

            {courses.length === 0 ? (
                <div className="empty-state animate-slideUp">
                    <Users size={64} />
                    <h3>No Enrollments</h3>
                    <p>You don't have any courses assigned yet.</p>
                </div>
            ) : (
                <div className="enrollments-list animate-slideUp stagger-2">
                    {courses.map((course) => (
                        <div key={course.course_id} className="enrollment-card">
                            <div
                                className="enrollment-header"
                                onClick={() => toggleCourse(course.course_id)}
                            >
                                <div className="course-info">
                                    <span className="course-code">{course.course_code}</span>
                                    <h3>{course.course_name}</h3>
                                </div>
                                <div className="enrollment-meta">
                                    <div className="enrollment-count">
                                        <Users size={16} />
                                        <span>{course.current_enrollment} enrolled</span>
                                    </div>
                                    {expandedCourses[course.course_id] ? (
                                        <ChevronUp size={20} />
                                    ) : (
                                        <ChevronDown size={20} />
                                    )}
                                </div>
                            </div>

                            {expandedCourses[course.course_id] && (
                                <div className="students-table-container">
                                    {loadingStudents[course.course_id] ? (
                                        <div className="loading-students">
                                            <div className="spinner" style={{ width: 24, height: 24 }}></div>
                                            <span>Loading students...</span>
                                        </div>
                                    ) : studentData[course.course_id]?.length === 0 ? (
                                        <div className="no-students">
                                            <Users size={32} />
                                            <p>No students enrolled yet</p>
                                        </div>
                                    ) : (
                                        <table className="students-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Student</th>
                                                    <th>Email</th>
                                                    <th>Enrolled On</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filterStudents(studentData[course.course_id] || []).map((student, index) => (
                                                    <tr key={student.user_id}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            <div className="student-cell">
                                                                <div className="student-avatar">
                                                                    {student.username.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span>{student.username}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <a href={`mailto:${student.email}`} className="email-link">
                                                                <Mail size={14} />
                                                                {student.email}
                                                            </a>
                                                        </td>
                                                        <td>
                                                            <span className="date-cell">
                                                                <Calendar size={14} />
                                                                {new Date(student.registered_at).toLocaleDateString()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Enrollments;
