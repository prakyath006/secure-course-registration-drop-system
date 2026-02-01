import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    GraduationCap,
    LayoutDashboard,
    BookOpen,
    Users,
    Settings,
    LogOut,
    Shield,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getNavLinks = () => {
        if (!user) return [];

        const links = [
            { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ];

        if (user.role === 'student') {
            links.push(
                { to: '/courses', label: 'Courses', icon: BookOpen },
                { to: '/my-registrations', label: 'My Courses', icon: GraduationCap }
            );
        }

        if (user.role === 'faculty') {
            links.push(
                { to: '/my-courses', label: 'My Courses', icon: BookOpen },
                { to: '/enrollments', label: 'Enrollments', icon: Users }
            );
        }

        if (user.role === 'admin') {
            links.push(
                { to: '/manage-courses', label: 'Courses', icon: BookOpen },
                { to: '/manage-users', label: 'Users', icon: Users },
                { to: '/policies', label: 'Policies', icon: Settings },
                { to: '/audit-logs', label: 'Audit Logs', icon: Shield }
            );
        }

        return links;
    };

    const getRoleBadgeClass = () => {
        switch (user?.role) {
            case 'admin': return 'badge-error';
            case 'faculty': return 'badge-warning';
            default: return 'badge-primary';
        }
    };

    if (!isAuthenticated) return null;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/dashboard" className="navbar-brand">
                    <div className="navbar-logo">
                        <GraduationCap size={28} />
                    </div>
                    <span className="navbar-title">CourseHub</span>
                </Link>

                <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                    {getNavLinks().map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <link.icon size={18} />
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </div>

                <div className="navbar-right">
                    <div className="navbar-user">
                        <div className="user-avatar">
                            {user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user?.username}</span>
                            <span className={`badge ${getRoleBadgeClass()}`}>{user?.role}</span>
                        </div>
                    </div>

                    <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
                        <LogOut size={20} />
                    </button>

                    <button
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
