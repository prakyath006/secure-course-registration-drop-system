import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Mail, Lock, User, ArrowRight, Loader, Eye, EyeOff, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'student'
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return false;
        }

        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return false;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(formData.password)) {
            toast.error('Password must contain uppercase, lowercase, number, and special character');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            await register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });

            toast.success('Registration successful! Please log in.');
            navigate('/login');
        } catch (error) {
            toast.error(error.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card auth-card-register animate-scaleIn">
                <div className="auth-header">
                    <div className="auth-logo">
                        <GraduationCap size={32} />
                    </div>
                    <h1>Create Account</h1>
                    <p>Join our secure course registration platform</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <div className="input-with-icon">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Choose a username"
                                    required
                                    minLength={3}
                                    maxLength={50}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <div className="input-with-icon">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Create a password"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <div className="input-with-icon">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <div className="input-with-icon">
                            <UserCog size={18} className="input-icon" />
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="form-input form-select"
                            >
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="password-requirements">
                        <p>Password must contain:</p>
                        <ul>
                            <li className={formData.password.length >= 8 ? 'valid' : ''}>At least 8 characters</li>
                            <li className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>One uppercase letter</li>
                            <li className={/[a-z]/.test(formData.password) ? 'valid' : ''}>One lowercase letter</li>
                            <li className={/\d/.test(formData.password) ? 'valid' : ''}>One number</li>
                            <li className={/[@$!%*?&]/.test(formData.password) ? 'valid' : ''}>One special character (@$!%*?&)</li>
                        </ul>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                        {loading ? (
                            <Loader size={20} className="spinner-icon" />
                        ) : (
                            <>
                                Create Account
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Sign in</Link></p>
                </div>
            </div>

            <div className="auth-decoration">
                <div className="decoration-circle circle-1"></div>
                <div className="decoration-circle circle-2"></div>
                <div className="decoration-circle circle-3"></div>
            </div>
        </div>
    );
};

export default Register;
