import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import MyRegistrations from './pages/MyRegistrations';
import FacultyCourses from './pages/FacultyCourses';
import Enrollments from './pages/Enrollments';
import ManageCourses from './pages/ManageCourses';
import ManageUsers from './pages/ManageUsers';
import Policies from './pages/Policies';
import AuditLogs from './pages/AuditLogs';

import './index.css';

// Unauthorized Page
const Unauthorized = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '1rem',
    padding: '2rem',
    textAlign: 'center'
  }}>
    <h1 style={{ color: '#ef4444', fontSize: '3rem' }}>403</h1>
    <h2>Access Denied</h2>
    <p style={{ color: '#64748b' }}>You don't have permission to access this page.</p>
    <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
  </div>
);

// Layout with Navbar
const Layout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
  </>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a25',
              color: '#f1f5f9',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#1a1a25',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#1a1a25',
              },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes - All Users */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/courses"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Layout>
                  <Courses />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-registrations"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <Layout>
                  <MyRegistrations />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Faculty Routes */}
          <Route
            path="/my-courses"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <Layout>
                  <FacultyCourses />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/enrollments"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <Layout>
                  <Enrollments />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/manage-courses"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <ManageCourses />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <ManageUsers />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/policies"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <Policies />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <AuditLogs />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
