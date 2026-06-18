import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardMinimal = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 5,
    totalProjects: 5,
    totalApplications: 4,
    pendingApplications: 2
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (!token || !user) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#004085', color: 'white', padding: '20px 0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: '0', fontSize: '1.5rem' }}>Admin Dashboard</h1>
              <p style={{ margin: '0', opacity: 0.75, fontSize: '0.9rem' }}>Welcome back, Admin</p>
            </div>
            <button onClick={handleLogout} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h2 style={{ marginBottom: '30px', color: '#333' }}>Dashboard Overview</h2>
        
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#007bff', margin: '0 0 10px 0' }}>Total Users</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0' }}>{stats.totalUsers}</p>
            <p style={{ color: '#666', margin: '0' }}>1 Admin, 4 Citizens</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#28a745', margin: '0 0 10px 0' }}>Total Projects</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0' }}>{stats.totalProjects}</p>
            <p style={{ color: '#666', margin: '0' }}>4 Active, 1 Planning</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#ffc107', margin: '0 0 10px 0' }}>Total Applications</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0' }}>{stats.totalApplications}</p>
            <p style={{ color: '#666', margin: '0' }}>This month count</p>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: '#dc3545', margin: '0 0 10px 0' }}>Pending</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0' }}>{stats.pendingApplications}</p>
            <p style={{ color: '#666', margin: '0' }}>Awaiting review</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <button onClick={() => navigate('/applications')} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer' }}>
              View Applications
            </button>
            <button onClick={() => navigate('/projects')} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer' }}>
              Manage Projects
            </button>
            <button onClick={() => navigate('/notifications')} style={{ backgroundColor: '#ffc107', color: 'black', border: 'none', padding: '12px', borderRadius: '4px', cursor: 'pointer' }}>
              Notifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMinimal;
