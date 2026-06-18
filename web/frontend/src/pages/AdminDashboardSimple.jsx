import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminDashboardSimple = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('currentUser');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    setLoading(false);
    return () => clearInterval(timer);
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* 🔝 Top Header Bar */}
      <div className="container-fluid px-4 py-3" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #e5e7eb' }}>
        <div className="row align-items-center">
          <div className="col-md-6">
            <h4 className="mb-0 fw-bold text-primary">
              <i className="bi bi-speedometer2 me-2"></i>
              Admin Dashboard
            </h4>
            <p className="mb-0 text-muted small">
              Welcome back, {user?.name || 'Admin'} | {currentTime.toLocaleString()}
            </p>
          </div>
          <div className="col-md-6 text-end">
            <button className="btn btn-outline-danger btn-sm me-2" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-fluid px-4 py-4">
        {/* 📊 KPI Cards */}
        <div className="row mb-4">
          <div className="col-lg-2 col-md-4 mb-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
              <div className="card-body text-center">
                <div className="text-primary mb-2">
                  <i className="bi bi-people-fill fs-2"></i>
                </div>
                <h3 className="card-title text-primary mb-1">5</h3>
                <p className="card-text text-muted small mb-0">Total Users</p>
              </div>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 mb-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
              <div className="card-body text-center">
                <div className="text-success mb-2">
                  <i className="bi bi-building fs-2"></i>
                </div>
                <h3 className="card-title text-success mb-1">5</h3>
                <p className="card-text text-muted small mb-0">Projects</p>
              </div>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 mb-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
              <div className="card-body text-center">
                <div className="text-warning mb-2">
                  <i className="bi bi-file-text-fill fs-2"></i>
                </div>
                <h3 className="card-title text-warning mb-1">4</h3>
                <p className="card-text text-muted small mb-0">Applications</p>
              </div>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 mb-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
              <div className="card-body text-center">
                <div className="text-info mb-2">
                  <i className="bi bi-clock-history fs-2"></i>
                </div>
                <h3 className="card-title text-info mb-1">2</h3>
                <p className="card-text text-muted small mb-0">Pending</p>
              </div>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 mb-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
              <div className="card-body text-center">
                <div className="text-success mb-2">
                  <i className="bi bi-check-circle-fill fs-2"></i>
                </div>
                <h3 className="card-title text-success mb-1">1</h3>
                <p className="card-text text-muted small mb-0">Approved</p>
              </div>
            </div>
          </div>
          <div className="col-lg-2 col-md-4 mb-3">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
              <div className="card-body text-center">
                <div className="text-danger mb-2">
                  <i className="bi bi-x-circle-fill fs-2"></i>
                </div>
                <h3 className="card-title text-danger mb-1">1</h3>
                <p className="card-text text-muted small mb-0">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* 📋 Recent Applications Table */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
              <div className="card-header bg-white border-0">
                <h5 className="mb-0">Recent Applications</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Applicant</th>
                        <th>Project</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>APP001</td>
                        <td>Ahmed Mohamed</td>
                        <td>New Cairo Residential</td>
                        <td><span className="badge bg-warning">Pending</span></td>
                        <td>2024-04-20</td>
                      </tr>
                      <tr>
                        <td>APP002</td>
                        <td>Fatma Ali</td>
                        <td>Alexandria Heights</td>
                        <td><span className="badge bg-success">Approved</span></td>
                        <td>2024-04-18</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardSimple;
