import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Mail, Lock, User, ArrowRight, Loader, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
    const [step, setStep] = useState('credentials'); // 'credentials' or 'otp'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        otp: ''
    });
    const [tempSession, setTempSession] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login, verifyOTP, resendOTP } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await login(formData.email, formData.password);

            if (response.mfaRequired) {
                setTempSession({
                    userId: response.userId,
                    tempSessionId: response.tempSessionId
                });
                setStep('otp');
                toast.success('OTP sent to your email!');
            }
        } catch (error) {
            toast.error(error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleOTPSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await verifyOTP(tempSession.userId, formData.otp, tempSession.tempSessionId);
            toast.success('Login successful!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            await resendOTP(tempSession.userId, tempSession.tempSessionId);
            toast.success('New OTP sent!');
        } catch (error) {
            toast.error(error.message || 'Failed to resend OTP');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card animate-scaleIn">
                <div className="auth-header">
                    <div className="auth-logo">
                        <GraduationCap size={32} />
                    </div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to access your course portal</p>
                </div>

                {step === 'credentials' ? (
                    <form onSubmit={handleCredentialsSubmit} className="auth-form">
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <div className="input-with-icon">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="text"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="form-input"
                                    placeholder="Enter your email"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

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
                                    placeholder="Enter your password"
                                    required
                                    autoComplete="current-password"
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

                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                            {loading ? (
                                <Loader size={20} className="spinner-icon" />
                            ) : (
                                <>
                                    Continue
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOTPSubmit} className="auth-form animate-slideUp">
                        <div className="otp-message">
                            <Mail size={48} className="otp-icon" />
                            <p>We've sent a 6-digit verification code to your email. Please enter it below.</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Verification Code</label>
                            <input
                                type="text"
                                name="otp"
                                value={formData.otp}
                                onChange={handleChange}
                                className="form-input otp-input"
                                placeholder="000000"
                                maxLength={6}
                                required
                                autoFocus
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                            {loading ? (
                                <Loader size={20} className="spinner-icon" />
                            ) : (
                                <>
                                    Verify & Login
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <div className="auth-actions">
                            <button type="button" className="btn btn-ghost" onClick={handleResendOTP}>
                                Resend Code
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => setStep('credentials')}>
                                Back to Login
                            </button>
                        </div>
                    </form>
                )}

                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/register">Sign up</Link></p>
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

export default Login;
