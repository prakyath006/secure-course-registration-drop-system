import { useState, useEffect } from 'react';
import { coursesAPI, adminAPI } from '../services/api';
import {
    BookOpen,
    Plus,
    Edit2,
    Trash2,
    X,
    Search,
    Users,
    Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Admin.css';

const ManageCourses = () => {
    const [courses, setCourses] = useState([]);
    const [faculty, setFaculty] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        courseName: '',
        courseCode: '',
        description: '',
        facultyId: '',
        maxSeats: 30
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [coursesRes, usersRes] = await Promise.all([
                coursesAPI.getAll(),
                adminAPI.getUsers('faculty')
            ]);
            setCourses(coursesRes.courses);
            setFaculty(usersRes.users);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (editingCourse) {
                await coursesAPI.update(editingCourse.course_id, formData);
                toast.success('Course updated successfully');
            } else {
                await coursesAPI.create(formData);
                toast.success('Course created successfully');
            }
            closeModal();
            loadData();
        } catch (error) {
            toast.error(error.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (courseId) => {
        if (!confirm('Are you sure you want to delete this course?')) return;

        try {
            await coursesAPI.delete(courseId);
            toast.success('Course deleted successfully');
            loadData();
        } catch (error) {
            toast.error(error.message || 'Failed to delete course');
        }
    };

    const openModal = (course = null) => {
        if (course) {
            setEditingCourse(course);
            setFormData({
                courseName: course.course_name,
                courseCode: course.course_code,
                description: course.description || '',
                facultyId: course.faculty_id || '',
                maxSeats: course.max_seats
            });
        } else {
            setEditingCourse(null);
            setFormData({
                courseName: '',
                courseCode: '',
                description: '',
                facultyId: '',
                maxSeats: 30
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCourse(null);
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
        <div className="admin-page">
            <div className="page-header animate-slideUp">
                <div>
                    <h1>Manage Courses</h1>
                    <p>Add, edit, or remove courses</p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} />
                    Add Course
                </button>
            </div>

            <div className="search-bar animate-slideUp stagger-1">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                />
            </div>

            <div className="table-container animate-slideUp stagger-2">
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Course Name</th>
                            <th>Faculty</th>
                            <th>Enrollment</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCourses.map((course) => (
                            <tr key={course.course_id}>
                                <td>
                                    <span className="course-code-badge">{course.course_code}</span>
                                </td>
                                <td>
                                    <div className="course-name">{course.course_name}</div>
                                    {course.description && (
                                        <div className="course-desc">{course.description}</div>
                                    )}
                                </td>
                                <td>{course.faculty_name || '-'}</td>
                                <td>
                                    <div className="enrollment-cell">
                                        <Users size={14} />
                                        {course.current_enrollment} / {course.max_seats}
                                    </div>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="btn btn-ghost btn-icon"
                                            onClick={() => openModal(course)}
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-icon"
                                            onClick={() => handleDelete(course.course_id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal animate-scaleIn" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCourse ? 'Edit Course' : 'Add New Course'}</h2>
                            <button className="btn btn-ghost btn-icon" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Course Code</label>
                                    <input
                                        type="text"
                                        value={formData.courseCode}
                                        onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                                        className="form-input"
                                        required
                                        disabled={editingCourse}
                                        placeholder="CS101"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Max Seats</label>
                                    <input
                                        type="number"
                                        value={formData.maxSeats}
                                        onChange={(e) => setFormData({ ...formData, maxSeats: parseInt(e.target.value) })}
                                        className="form-input"
                                        required
                                        min="1"
                                        max="500"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Course Name</label>
                                <input
                                    type="text"
                                    value={formData.courseName}
                                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                                    className="form-input"
                                    required
                                    placeholder="Introduction to Computer Science"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="form-input"
                                    rows="3"
                                    placeholder="Course description..."
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Assign Faculty</label>
                                <select
                                    value={formData.facultyId}
                                    onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                                    className="form-input form-select"
                                >
                                    <option value="">Select Faculty...</option>
                                    {faculty.map(f => (
                                        <option key={f.user_id} value={f.user_id}>
                                            {f.username} ({f.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? (
                                        <Loader size={18} className="spinner-icon" />
                                    ) : editingCourse ? (
                                        'Update Course'
                                    ) : (
                                        'Create Course'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCourses;
