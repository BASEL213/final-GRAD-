import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import dataService from '../services/dataService';

const Applications = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectingAppId, setRejectingAppId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAppId, setDeletingAppId] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvingAppId, setApprovingAppId] = useState(null);

  
  
  // Load applications using data service
  const fetchApplications = () => {
    try {
      setLoading(true);
      setError(null);
      
      const applicationsData = dataService.getEnrichedApplications();
      
      setApplications(applicationsData);
    } catch (err) {
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Setup data service subscription and initial load
  useEffect(() => {
    fetchApplications();
    
    // Subscribe to data changes for live updates
    const unsubscribe = dataService.subscribe((changeType, data, cache) => {
      fetchApplications();
    });
    
    return () => unsubscribe();
  }, []);

  // Handle URL parameters for initial filtering
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam === 'pending') {
      setStatusFilter('pending');
    }
  }, [searchParams]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter applications using data service search
  const filteredApplications = dataService.searchApplications(searchTerm, statusFilter);

  // Handle application rejection with reason dialog
  const handleRejectClick = (appId) => {
    setRejectingAppId(appId);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  // Confirm rejection with reason
  const confirmRejection = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setUpdatingId(rejectingAppId);
      await dataService.updateApplicationStatus(rejectingAppId, 'rejected', rejectionReason);
      setShowRejectDialog(false);
      setRejectionReason('');
      fetchApplications(); // Refresh data
    } catch (err) {
      alert('Failed to reject application');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle application approval
  const handleApprove = async (appId) => {
    try {
      setUpdatingId(appId);
      await dataService.updateApplicationStatus(appId, 'approved');
      fetchApplications(); // Refresh data
    } catch (err) {
      alert('Failed to approve application');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle application deletion
  const handleDelete = async (appId) => {
    try {
      setUpdatingId(appId);
      await dataService.deleteApplication(appId);
      setShowDeleteDialog(false);
      setDeletingAppId(null);
      fetchApplications(); // Refresh data
    } catch (err) {
      alert('Failed to delete application');
    } finally {
      setUpdatingId(null);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Applicant Name', 'Email', 'Project', 'Status', 'Submitted Date'];
    const csvData = filteredApplications.map(app => [
      app.id || app._id,
      app.applicantName,
      app.email,
      app.projectName,
      app.status,
      formatDate(app.submittedDate)
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'applications.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-success';
      case 'rejected':
        return 'bg-danger';
      case 'pending':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <div className="text-danger">
          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '3rem' }}></i>
          <h4 className="mt-3">Error Loading Applications</h4>
          <p className="text-muted">{error}</p>
          <button className="btn btn-primary" onClick={fetchApplications}>
            <i className="bi bi-arrow-clockwise me-2"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2><i className="bi bi-file-earmark-text me-2"></i>Housing Applications</h2>
          <p className="text-muted mb-0">Manage and review housing applications</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-success" onClick={exportToCSV}>
            <i className="bi bi-download me-2"></i>Export CSV
          </button>
                    <Link to="/applications/new" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>New Application
          </Link>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label">Search Applications</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by name, email, or project..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label className="form-label">Status Filter</label>
                <select 
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label className="form-label">Actions</label>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                  >
                    <i className="bi bi-arrow-clockwise"></i> Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
              <h4 className="mt-3 text-muted">No Applications Found</h4>
              <p className="text-muted">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'No applications have been submitted yet'
                }
              </p>
              {searchTerm || statusFilter !== 'all' ? (
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </button>
              ) : (
                <Link to="/applications/new" className="btn btn-primary">
                  <i className="bi bi-plus-circle me-2"></i>Submit First Application
                </Link>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Applicant</th>
                    <th>Email</th>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id || app._id}>
                      <td>
                        <small className="text-muted font-monospace">
                          #{(app.id || app._id)?.toString().slice(-6) || 'N/A'}
                        </small>
                      </td>
                      <td className="fw-medium">{app.applicantName || 'Unknown'}</td>
                      <td>{app.email || 'N/A'}</td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {app.projectName || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(app.submittedDate)}
                        </small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <Link 
                            to={`/applications/${app.id || app._id}/review`}
                            className="btn btn-outline-primary"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          {app.status === 'pending' && (
                            <>
                              <button 
                                className="btn btn-success"
                                onClick={() => handleApprove(app.id || app._id)}
                                disabled={updatingId === (app.id || app._id)}
                              >
                                {updatingId === (app.id || app._id) ? (
                                  <span className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </span>
                                ) : (
                                  <i className="bi bi-check"></i>
                                )}
                              </button>
                              <button 
                                className="btn btn-danger"
                                onClick={() => handleRejectClick(app.id || app._id)}
                                disabled={updatingId === (app.id || app._id)}
                              >
                                {updatingId === (app.id || app._id) ? (
                                  <span className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </span>
                                ) : (
                                  <i className="bi bi-x"></i>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Application</h5>
                <button type="button" className="btn-close" onClick={() => setShowRejectDialog(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Rejection Reason</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Please provide a reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRejectDialog(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmRejection}>
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
