import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import {
    Shield,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Filter,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Admin.css';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        limit: 50,
        offset: 0
    });

    useEffect(() => {
        loadLogs();
    }, [filters.offset, filters.action]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getAuditLogs(filters);
            setLogs(response.logs);
        } catch (error) {
            toast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (logId) => {
        try {
            const response = await adminAPI.verifyAuditLog(logId);
            if (response.valid) {
                toast.success('Log integrity verified ✓');
            } else {
                toast.error('Log integrity check failed - possible tampering!');
            }
        } catch (error) {
            toast.error('Verification failed');
        }
    };

    const getActionBadgeClass = (action) => {
        if (action.includes('LOGIN') || action.includes('REGISTER') || action.includes('SUCCESS')) {
            return 'badge-success';
        }
        if (action.includes('FAILED') || action.includes('UNAUTHORIZED') || action.includes('VIOLATION')) {
            return 'badge-error';
        }
        if (action.includes('DROP') || action.includes('DELETE')) {
            return 'badge-warning';
        }
        return 'badge-primary';
    };

    const actionOptions = [
        'USER_REGISTER',
        'LOGIN_ATTEMPT',
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'OTP_FAILED',
        'LOGOUT',
        'COURSE_CREATE',
        'COURSE_UPDATE',
        'COURSE_DELETE',
        'COURSE_REGISTER',
        'COURSE_DROP',
        'POLICY_UPDATE',
        'UNAUTHORIZED_ACCESS',
        'INTEGRITY_CHECK'
    ];

    return (
        <div className="admin-page">
            <div className="page-header animate-slideUp">
                <div>
                    <h1>Audit Logs</h1>
                    <p>View system activity and security events</p>
                </div>
                <div className="stat-pill">
                    <Shield size={16} />
                    <span>{logs.length} Entries</span>
                </div>
            </div>

            <div className="filters-bar animate-slideUp stagger-1">
                <div className="filter-select">
                    <Filter size={18} />
                    <select
                        value={filters.action}
                        onChange={(e) => setFilters({ ...filters, action: e.target.value, offset: 0 })}
                        className="form-input form-select"
                    >
                        <option value="">All Actions</option>
                        {actionOptions.map(action => (
                            <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="page-loading">
                    <div className="spinner" style={{ width: 48, height: 48 }}></div>
                </div>
            ) : (
                <>
                    <div className="table-container animate-slideUp stagger-2">
                        <table>
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Action</th>
                                    <th>User ID</th>
                                    <th>Details</th>
                                    <th>IP Address</th>
                                    <th>Verify</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.log_id}>
                                        <td>
                                            <span className="timestamp-cell">
                                                <Clock size={14} />
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${getActionBadgeClass(log.action)}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            {log.user_id ? (
                                                <span className="user-id-cell">
                                                    <User size={14} />
                                                    {log.user_id}
                                                </span>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="details-cell">
                                                {log.details ? JSON.stringify(JSON.parse(log.details), null, 0).slice(0, 50) + '...' : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="ip-cell">{log.ip_address || '-'}</span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-ghost btn-icon"
                                                onClick={() => handleVerify(log.log_id)}
                                                title="Verify Integrity"
                                            >
                                                <CheckCircle size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination animate-fadeIn">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setFilters({ ...filters, offset: Math.max(0, filters.offset - filters.limit) })}
                            disabled={filters.offset === 0}
                        >
                            <ChevronLeft size={18} />
                            Previous
                        </button>
                        <span className="page-info">
                            Showing {filters.offset + 1} - {filters.offset + logs.length}
                        </span>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setFilters({ ...filters, offset: filters.offset + filters.limit })}
                            disabled={logs.length < filters.limit}
                        >
                            Next
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AuditLogs;
