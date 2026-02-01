import { useState, useEffect } from 'react';
import { registrationsAPI } from '../services/api';
import {
    BookOpen,
    Trash2,
    Clock,
    AlertTriangle,
    CheckCircle,
    Loader,
    User
} from 'lucide-react';
import toast from 'react-hot-toast';
import './MyRegistrations.css';

const MyRegistrations = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [droppingCourse, setDroppingCourse] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadRegistrations();
    }, []);

    const loadRegistrations = async () => {
        try {
            const response = await registrationsAPI.getMyRegistrations();
            setRegistrations(response.registrations);
        } catch (error) {
            toast.error('Failed to load registrations');
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = async (courseId) => {
        if (!confirm('Are you sure you want to drop this course?')) return;

        setDroppingCourse(courseId);
        try {
            await registrationsAPI.drop(courseId);
            toast.success('Course dropped successfully');
            loadRegistrations();
        } catch (error) {
            toast.error(error.message || 'Failed to drop course');
        } finally {
            setDroppingCourse(null);
        }
    };

    const filteredRegistrations = registrations.filter(reg => {
        if (filter === 'all') return true;
        return reg.status === filter;
    });

    const activeCount = registrations.filter(r => r.status === 'registered').length;
    const droppedCount = registrations.filter(r => r.status === 'dropped').length;

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner" style={{ width: 48, height: 48 }}></div>
            </div>
        );
    }

    return (
        <div className="registrations-page">
            <div className="page-header animate-slideUp">
                <div>
                    <h1>My Registrations</h1>
                    <p>Manage your course registrations</p>
                </div>
            </div>

            <div className="filter-tabs animate-slideUp stagger-1">
                <button
                    className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({registrations.length})
                </button>
                <button
                    className={`filter-tab ${filter === 'registered' ? 'active' : ''}`}
                    onClick={() => setFilter('registered')}
                >
                    <CheckCircle size={16} />
                    Active ({activeCount})
                </button>
                <button
                    className={`filter-tab ${filter === 'dropped' ? 'active' : ''}`}
                    onClick={() => setFilter('dropped')}
                >
                    <AlertTriangle size={16} />
                    Dropped ({droppedCount})
                </button>
            </div>

            {filteredRegistrations.length > 0 ? (
                <div className="registrations-list animate-slideUp stagger-2">
                    {filteredRegistrations.map((reg) => (
                        <RegistrationCard
                            key={reg.reg_id}
                            registration={reg}
                            onDrop={() => handleDrop(reg.course_id)}
                            isDropping={droppingCourse === reg.course_id}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state animate-fadeIn">
                    <BookOpen size={64} />
                    <h3>No registrations found</h3>
                    <p>
                        {filter === 'all'
                            ? "You haven't registered for any courses yet."
                            : `No ${filter} registrations.`}
                    </p>
                </div>
            )}
        </div>
    );
};

const RegistrationCard = ({ registration: reg, onDrop, isDropping }) => {
    const isActive = reg.status === 'registered';

    return (
        <div className={`registration-card ${isActive ? '' : 'dropped'}`}>
            <div className="reg-content">
                <div className="reg-badge">{reg.course_code}</div>
                <h3 className="reg-title">{reg.course_name}</h3>

                <div className="reg-meta">
                    {reg.faculty_name && (
                        <div className="meta-item">
                            <User size={14} />
                            <span>{reg.faculty_name}</span>
                        </div>
                    )}
                    <div className="meta-item">
                        <Clock size={14} />
                        <span>
                            {isActive ? 'Registered' : 'Dropped'} on {new Date(
                                isActive ? reg.registered_at : reg.dropped_at
                            ).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="reg-actions">
                <span className={`status-badge ${isActive ? 'status-active' : 'status-dropped'}`}>
                    {isActive ? (
                        <>
                            <CheckCircle size={14} />
                            Active
                        </>
                    ) : (
                        <>
                            <AlertTriangle size={14} />
                            Dropped
                        </>
                    )}
                </span>

                {isActive && (
                    <button
                        className="btn btn-danger"
                        onClick={onDrop}
                        disabled={isDropping}
                    >
                        {isDropping ? (
                            <Loader size={16} className="spinner-icon" />
                        ) : (
                            <>
                                <Trash2 size={16} />
                                Drop Course
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default MyRegistrations;
