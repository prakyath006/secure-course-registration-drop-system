import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import {
    Users,
    Search,
    UserCheck,
    UserX,
    Mail,
    Calendar,
    Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Admin.css';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    useEffect(() => {
        loadUsers();
    }, [roleFilter]);

    const loadUsers = async () => {
        try {
            const response = await adminAPI.getUsers(roleFilter);
            setUsers(response.users);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            await adminAPI.updateUserStatus(userId, !currentStatus);
            toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
            loadUsers();
        } catch (error) {
            toast.error(error.message || 'Failed to update user status');
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'admin': return 'badge-error';
            case 'faculty': return 'badge-warning';
            default: return 'badge-primary';
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
        <div className="admin-page">
            <div className="page-header animate-slideUp">
                <div>
                    <h1>Manage Users</h1>
                    <p>View and manage user accounts</p>
                </div>
                <div className="stat-pill">
                    <Users size={16} />
                    <span>{users.length} Users</span>
                </div>
            </div>

            <div className="filters-bar animate-slideUp stagger-1">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input"
                    />
                </div>

                <div className="filter-select">
                    <Filter size={18} />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="form-input form-select"
                    >
                        <option value="">All Roles</option>
                        <option value="student">Students</option>
                        <option value="faculty">Faculty</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            </div>

            <div className="table-container animate-slideUp stagger-2">
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.user_id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{user.username}</span>
                                    </div>
                                </td>
                                <td>
                                    <a href={`mailto:${user.email}`} className="email-link">
                                        <Mail size={14} />
                                        {user.email}
                                    </a>
                                </td>
                                <td>
                                    <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <span className="date-cell">
                                        <Calendar size={14} />
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-pill ${user.is_active ? 'active' : 'inactive'}`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className={`btn ${user.is_active ? 'btn-danger' : 'btn-primary'}`}
                                        onClick={() => handleToggleStatus(user.user_id, user.is_active)}
                                        title={user.is_active ? 'Deactivate' : 'Activate'}
                                    >
                                        {user.is_active ? (
                                            <>
                                                <UserX size={16} />
                                                Deactivate
                                            </>
                                        ) : (
                                            <>
                                                <UserCheck size={16} />
                                                Activate
                                            </>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageUsers;
