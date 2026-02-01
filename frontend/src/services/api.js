const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * API Service
 * Handles all HTTP requests to the backend
 */
class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    /**
     * Get authorization headers
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Handle API response
     */
    async handleResponse(response) {
        const data = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
            throw new Error(data.message || 'An error occurred');
        }

        return data;
    }

    /**
     * GET request
     */
    async get(endpoint) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        return this.handleResponse(response);
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
        return this.handleResponse(response);
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });
        return this.handleResponse(response);
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
        return this.handleResponse(response);
    }
}

const api = new ApiService();

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    verifyOTP: (data) => api.post('/auth/verify-otp', data),
    resendOTP: (data) => api.post('/auth/resend-otp', data),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/me'),
};

// Courses API
export const coursesAPI = {
    getAll: () => api.get('/courses'),
    getAvailable: () => api.get('/courses/available'),
    getById: (id) => api.get(`/courses/${id}`),
    getMyCourses: () => api.get('/courses/my-courses'),
    create: (data) => api.post('/courses', data),
    update: (id, data) => api.put(`/courses/${id}`, data),
    delete: (id) => api.delete(`/courses/${id}`),
};

// Registrations API
export const registrationsAPI = {
    getMyRegistrations: (status) => api.get(`/registrations/my${status ? `?status=${status}` : ''}`),
    register: (courseId) => api.post('/registrations', { courseId }),
    drop: (courseId) => api.delete(`/registrations/${courseId}`),
    getEnrolledStudents: (courseId) => api.get(`/registrations/course/${courseId}/students`),
    getStats: () => api.get('/registrations/stats'),
    verifyIntegrity: (regId) => api.get(`/registrations/${regId}/verify`),
};

// Admin API
export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    getUsers: (role) => api.get(`/admin/users${role ? `?role=${role}` : ''}`),
    updateUserStatus: (userId, isActive) => api.put(`/admin/users/${userId}/status`, { isActive }),
    getPolicies: () => api.get('/admin/policies'),
    updatePolicy: (key, value) => api.put('/admin/policies', { key, value }),
    getAuditLogs: (params) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/admin/audit-logs${query ? `?${query}` : ''}`);
    },
    verifyAuditLog: (logId) => api.get(`/admin/audit-logs/${logId}/verify`),
};

export default api;
