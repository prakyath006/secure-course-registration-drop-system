import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, coursesAPI, registrationsAPI } from '../services/api';
import {
    BookOpen,
    Users,
    GraduationCap,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    Calendar
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, [user]);

    const loadDashboardData = async () => {
        try {
            if (user.role === 'admin') {
                const response = await adminAPI.getDashboard();
                setStats(response.dashboard);
            } else if (user.role === 'student') {
                const [coursesRes, registrationsRes] = await Promise.all([
                    coursesAPI.getAvailable(),
                    registrationsAPI.getMyRegistrations()
                ]);
                setStats({
                    availableCourses: coursesRes.count,
                    registeredCourses: registrationsRes.registrations.filter(r => r.status === 'registered').length,
                    droppedCourses: registrationsRes.registrations.filter(r => r.status === 'dropped').length,
                    recentRegistrations: registrationsRes.registrations.slice(0, 5)
                });
            } else if (user.role === 'faculty') {
                const response = await coursesAPI.getMyCourses();
                const totalStudents = response.courses.reduce((acc, c) => acc + c.current_enrollment, 0);
                setStats({
                    courses: response.courses,
                    totalCourses: response.count,
                    totalStudents
                });
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner" style={{ width: 48, height: 48 }}></div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header animate-slideUp">
                <div className="welcome-section">
                    <h1>{getGreeting()}, {user.username}!</h1>
                    <p>Welcome to your {user.role} dashboard</p>
                </div>
                <div className="header-date">
                    <Calendar size={18} />
                    <span>{new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}</span>
                </div>
            </div>

            {user.role === 'admin' && stats && (
                <AdminDashboard stats={stats} />
            )}

            {user.role === 'student' && stats && (
                <StudentDashboard stats={stats} />
            )}

            {user.role === 'faculty' && stats && (
                <FacultyDashboard stats={stats} />
            )}
        </div>
    );
};

const AdminDashboard = ({ stats }) => (
    <>
        <div className="stats-grid animate-slideUp stagger-1">
            <StatCard
                title="Total Users"
                value={stats.users.total}
                icon={Users}
                color="primary"
                subtitle={`${stats.users.active} active`}
            />
            <StatCard
                title="Students"
                value={stats.users.students}
                icon={GraduationCap}
                color="accent"
            />
            <StatCard
                title="Faculty"
                value={stats.users.faculty}
                icon={BookOpen}
                color="secondary"
            />
            <StatCard
                title="Registrations"
                value={stats.registrations.active_registrations}
                icon={CheckCircle}
                color="success"
                subtitle={`${stats.registrations.dropped_registrations} dropped`}
            />
        </div>

        <div className="dashboard-grid">
            <div className="card animate-slideUp stagger-2">
                <h3 className="card-title">Registration Status</h3>
                <div className="status-info">
                    {stats.registrationStatus.isOpen ? (
                        <div className="status-badge status-open">
                            <CheckCircle size={20} />
                            <span>Registration Open</span>
                        </div>
                    ) : (
                        <div className="status-badge status-closed">
                            <AlertCircle size={20} />
                            <span>Registration Closed</span>
                        </div>
                    )}
                    <p className="status-dates">
                        Window: {new Date(stats.registrationStatus.startDate).toLocaleDateString()} -
                        {new Date(stats.registrationStatus.endDate).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="card animate-slideUp stagger-3">
                <h3 className="card-title">Top Courses by Enrollment</h3>
                <div className="course-list">
                    {stats.registrations.topCourses?.map((course, index) => (
                        <div key={index} className="course-item">
                            <span className="course-rank">#{index + 1}</span>
                            <span className="course-name">{course.course_name}</span>
                            <span className="course-count">{course.enrollment_count} students</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </>
);

const StudentDashboard = ({ stats }) => (
    <>
        <div className="stats-grid animate-slideUp stagger-1">
            <StatCard
                title="Available Courses"
                value={stats.availableCourses}
                icon={BookOpen}
                color="primary"
            />
            <StatCard
                title="Registered Courses"
                value={stats.registeredCourses}
                icon={CheckCircle}
                color="success"
            />
            <StatCard
                title="Dropped Courses"
                value={stats.droppedCourses}
                icon={AlertCircle}
                color="warning"
            />
        </div>

        <div className="card animate-slideUp stagger-2">
            <h3 className="card-title">Recent Registrations</h3>
            {stats.recentRegistrations?.length > 0 ? (
                <div className="registrations-list">
                    {stats.recentRegistrations.map((reg) => (
                        <div key={reg.reg_id} className="registration-item">
                            <div className="reg-info">
                                <span className="reg-course">{reg.course_name}</span>
                                <span className="reg-code">{reg.course_code}</span>
                            </div>
                            <div className="reg-meta">
                                <span className={`badge ${reg.status === 'registered' ? 'badge-success' : 'badge-warning'}`}>
                                    {reg.status}
                                </span>
                                <span className="reg-date">
                                    <Clock size={14} />
                                    {new Date(reg.registered_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <GraduationCap size={48} />
                    <p>No registrations yet. Browse available courses to get started!</p>
                </div>
            )}
        </div>
    </>
);

const FacultyDashboard = ({ stats }) => (
    <>
        <div className="stats-grid animate-slideUp stagger-1">
            <StatCard
                title="My Courses"
                value={stats.totalCourses}
                icon={BookOpen}
                color="primary"
            />
            <StatCard
                title="Total Students"
                value={stats.totalStudents}
                icon={Users}
                color="success"
            />
        </div>

        <div className="card animate-slideUp stagger-2">
            <h3 className="card-title">My Courses</h3>
            {stats.courses?.length > 0 ? (
                <div className="faculty-courses">
                    {stats.courses.map((course) => (
                        <div key={course.course_id} className="faculty-course-item">
                            <div className="course-info">
                                <h4>{course.course_name}</h4>
                                <span className="course-code">{course.course_code}</span>
                            </div>
                            <div className="course-stats">
                                <div className="enrollment-bar">
                                    <div
                                        className="enrollment-fill"
                                        style={{ width: `${(course.current_enrollment / course.max_seats) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="enrollment-text">
                                    {course.current_enrollment} / {course.max_seats} enrolled
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <BookOpen size={48} />
                    <p>No courses assigned yet.</p>
                </div>
            )}
        </div>
    </>
);

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className={`stat-card stat-${color}`}>
        <div className="stat-icon">
            <Icon size={24} />
        </div>
        <div className="stat-content">
            <span className="stat-value">{value}</span>
            <span className="stat-title">{title}</span>
            {subtitle && <span className="stat-subtitle">{subtitle}</span>}
        </div>
    </div>
);

export default Dashboard;
