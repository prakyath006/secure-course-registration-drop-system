import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check for existing session on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                try {
                    // Verify token is still valid
                    const response = await authAPI.getProfile();
                    setUser(response.user);
                    setIsAuthenticated(true);
                } catch (error) {
                    // Token invalid, clear storage
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        const response = await authAPI.login({ email, password });
        return response;
    };

    const verifyOTP = async (userId, otp, tempSessionId) => {
        const response = await authAPI.verifyOTP({ userId, otp, tempSessionId });

        if (response.success) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            setUser(response.user);
            setIsAuthenticated(true);
        }

        return response;
    };

    const register = async (userData) => {
        const response = await authAPI.register(userData);
        return response;
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            // Ignore error, logout anyway
        }

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    const resendOTP = async (userId, tempSessionId) => {
        const response = await authAPI.resendOTP({ userId, tempSessionId });
        return response;
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        verifyOTP,
        register,
        logout,
        resendOTP,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
