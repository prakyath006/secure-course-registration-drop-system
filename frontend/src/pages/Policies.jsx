import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import {
    Settings,
    Calendar,
    Save,
    CheckCircle,
    AlertCircle,
    Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import './Admin.css';

const Policies = () => {
    const [policies, setPolicies] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState('');
    const [formData, setFormData] = useState({
        registration_start: '',
        registration_end: '',
        drop_deadline: ''
    });

    useEffect(() => {
        loadPolicies();
    }, []);

    const loadPolicies = async () => {
        try {
            const response = await adminAPI.getPolicies();
            setPolicies(response);

            // Set form data from policies
            const policyMap = {};
            response.policies.forEach(p => {
                policyMap[p.setting_key] = p.setting_value.split('T')[0];
            });
            setFormData({
                registration_start: policyMap.registration_start || '',
                registration_end: policyMap.registration_end || '',
                drop_deadline: policyMap.drop_deadline || ''
            });
        } catch (error) {
            toast.error('Failed to load policies');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (key) => {
        setSaving(key);
        try {
            const value = new Date(formData[key]).toISOString();
            await adminAPI.updatePolicy(key, value);
            toast.success('Policy updated successfully');
            loadPolicies();
        } catch (error) {
            toast.error(error.message || 'Failed to update policy');
        } finally {
            setSaving('');
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
                    <h1>Policy Settings</h1>
                    <p>Configure registration and drop deadlines</p>
                </div>
            </div>

            <div className="policies-grid animate-slideUp stagger-1">
                {/* Registration Status */}
                <div className="policy-status-card">
                    <h3>Current Status</h3>
                    <div className="status-grid">
                        <div className={`status-item ${policies?.status.registration.isOpen ? 'open' : 'closed'}`}>
                            {policies?.status.registration.isOpen ? (
                                <CheckCircle size={24} />
                            ) : (
                                <AlertCircle size={24} />
                            )}
                            <div>
                                <span className="status-label">Registration</span>
                                <span className="status-value">
                                    {policies?.status.registration.isOpen ? 'Open' : 'Closed'}
                                </span>
                            </div>
                        </div>
                        <div className={`status-item ${policies?.status.drop.isAllowed ? 'open' : 'closed'}`}>
                            {policies?.status.drop.isAllowed ? (
                                <CheckCircle size={24} />
                            ) : (
                                <AlertCircle size={24} />
                            )}
                            <div>
                                <span className="status-label">Course Drop</span>
                                <span className="status-value">
                                    {policies?.status.drop.isAllowed ? 'Allowed' : 'Not Allowed'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Policy Cards */}
                <div className="policy-card">
                    <div className="policy-icon">
                        <Calendar size={24} />
                    </div>
                    <div className="policy-info">
                        <h4>Registration Start</h4>
                        <p>When students can start registering for courses</p>
                    </div>
                    <div className="policy-input-group">
                        <input
                            type="date"
                            value={formData.registration_start}
                            onChange={(e) => setFormData({ ...formData, registration_start: e.target.value })}
                            className="form-input"
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() => handleSave('registration_start')}
                            disabled={saving === 'registration_start'}
                        >
                            {saving === 'registration_start' ? (
                                <Loader size={16} className="spinner-icon" />
                            ) : (
                                <Save size={16} />
                            )}
                        </button>
                    </div>
                </div>

                <div className="policy-card">
                    <div className="policy-icon">
                        <Calendar size={24} />
                    </div>
                    <div className="policy-info">
                        <h4>Registration End</h4>
                        <p>Last date for course registration</p>
                    </div>
                    <div className="policy-input-group">
                        <input
                            type="date"
                            value={formData.registration_end}
                            onChange={(e) => setFormData({ ...formData, registration_end: e.target.value })}
                            className="form-input"
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() => handleSave('registration_end')}
                            disabled={saving === 'registration_end'}
                        >
                            {saving === 'registration_end' ? (
                                <Loader size={16} className="spinner-icon" />
                            ) : (
                                <Save size={16} />
                            )}
                        </button>
                    </div>
                </div>

                <div className="policy-card">
                    <div className="policy-icon warning">
                        <AlertCircle size={24} />
                    </div>
                    <div className="policy-info">
                        <h4>Drop Deadline</h4>
                        <p>Last date students can drop courses</p>
                    </div>
                    <div className="policy-input-group">
                        <input
                            type="date"
                            value={formData.drop_deadline}
                            onChange={(e) => setFormData({ ...formData, drop_deadline: e.target.value })}
                            className="form-input"
                        />
                        <button
                            className="btn btn-primary"
                            onClick={() => handleSave('drop_deadline')}
                            disabled={saving === 'drop_deadline'}
                        >
                            {saving === 'drop_deadline' ? (
                                <Loader size={16} className="spinner-icon" />
                            ) : (
                                <Save size={16} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Policies;
