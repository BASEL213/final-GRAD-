import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Applications from './pages/Applications';
import ReviewApplication from './pages/ReviewApplication';
import NewApplication from './pages/NewApplication';
import Projects from './pages/Projects';
import Roles from './pages/Roles';
import Audit from './pages/Audit';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/applications" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <Applications />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/applications/new" element={
              <Layout>
                <NewApplication />
              </Layout>
            } />
            <Route path="/applications/:id" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <ReviewApplication />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <Projects />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/roles" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <Roles />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/audit" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <Audit />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 16 }}>
                <i className="bi bi-exclamation-triangle" style={{ fontSize: 64, color: '#cbd5e1' }}></i>
                <h3 style={{ color: '#475569', fontWeight: 700 }}>404 — Page Not Found</h3>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>The page you are looking for does not exist.</p>
                <a href="/dashboard" className="btn btn-primary btn-sm">Go to Dashboard</a>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
