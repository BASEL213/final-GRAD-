import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { applicationsAPI, projectsAPI } from '../services/apiService';
import { enrichApplications, filterLinkedApplications, formatMongoIdShort } from '../utils/projectLink';

const Applications = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [applications, setApplications] = useState([]);
  const [projects, setProjects] = useState([]);
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

  
  
  // Load applications and projects using API service
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both applications and projects
      const [applicationsResponse, projectsResponse] = await Promise.all([
        applicationsAPI.getAll({ limit: 100 }),
        projectsAPI.getAll({ limit: 100 }),
      ]);

      const applicationsData = applicationsResponse.data || [];
      const projectsData = projectsResponse.data || [];
      const enrichedApplications = filterLinkedApplications(
        enrichApplications(applicationsData, projectsData)
      );

      setProjects(projectsData);
      setApplications(enrichedApplications);
    } catch (err) {
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Setup initial load
  useEffect(() => {
    fetchApplications();
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

  // Filter applications locally
  const filteredApplications = applications.filter((app) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === '' ||
      (app.applicantName && app.applicantName.toLowerCase().includes(q)) ||
      (app.applicantEmail && app.applicantEmail.toLowerCase().includes(q)) ||
      (app.email && app.email.toLowerCase().includes(q)) ||
      (app.projectName && app.projectName.toLowerCase().includes(q)) ||
      (app._id && String(app._id).toLowerCase().includes(q)) ||
      (app.nationalId && app.nationalId.includes(searchTerm));

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesProject =
      projectFilter === 'all' || app.projectMongoId === projectFilter || app.projectId === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  // Handle application rejection with reason dialog
  const handleRejectClick = (appId) => {
    setRejectingAppId(appId);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const confirmRejection = async () => {
    if (!rejectionReason.trim()) return;

    setShowRejectDialog(false);
    await updateApplicationStatus(rejectingAppId, 'rejected', rejectionReason);
  };

  // Handle application approval with confirmation
  const handleApproveClick = (appId) => {
    setApprovingAppId(appId);
    setShowApproveDialog(true);
  };

  // Confirm approval
  const confirmApproval = async () => {
    setShowApproveDialog(false);
    await updateApplicationStatus(approvingAppId, 'approved');
  };

  // Handle application deletion with confirmation
  const handleDeleteClick = (appId) => {
    setDeletingAppId(appId);
    setShowDeleteDialog(true);
  };

  // Confirm deletion
  const confirmDeletion = async () => {
    setShowDeleteDialog(false);
    try {
      await applicationsAPI.delete(deletingAppId);
      fetchApplications();
    } catch (err) {
      setError('Failed to delete application.');
    }
  };

  
  // Update application status using API service
  const updateApplicationStatus = async (appId, newStatus, reason = null) => {
    setUpdatingId(appId);
    
    try {
      const statusData = {
        status: newStatus,
        reviewedBy: 'Admin',
        rejectionReason: reason || null
      };
      await applicationsAPI.updateStatus(appId, statusData);
      const updatedApplications = applications.map(app =>
        (app.id === appId || app._id === appId) ? { ...app, status: newStatus, rejectionReason: reason } : app
      );
      setApplications(updatedApplications);
    } catch (error) {
      setError('Failed to update application status');
      fetchApplications();
    } finally {
      setUpdatingId(null);
      setRejectingAppId(null);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Application ID', 'Applicant Name', 'Email', 'Phone', 'Project', 'Status', 'Submission Date'];
    const csvData = filteredApplications.map(app => [
      app.id || app._id || 'N/A',
      app.applicantName || 'Unknown',
      app.applicantEmail || 'N/A',
      app.applicantPhone || 'N/A',
      app.projectName || 'Unknown',
      app.status || 'Unknown',
      formatDate(app.submittedAt || app.createdAt)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <h4><i className="bi bi-exclamation-triangle me-2"></i>Error Loading Applications</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchApplications}>
            <i className="bi bi-arrow-clockwise me-2"></i>Try Again
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
            <div className="col-md-3">
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
            <div className="col-md-3">
              <select
                className="form-select"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p._id} value={String(p._id)}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-12 col-lg-auto">
              <button className="btn btn-outline-secondary w-100" onClick={fetchApplications}>
                <i className="bi bi-arrow-clockwise me-2"></i>Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {filteredApplications.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Applicant Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Submission Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id || app._id}>
                      <td>
                        <small
                          className="font-monospace text-primary"
                          title={app._id || app.id}
                        >
                          {formatMongoIdShort(app._id || app.id)}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                            <i className="bi bi-person text-primary"></i>
                          </div>
                          <div>
                            <div className="fw-medium">{app.applicantName || 'Unknown User'}</div>
                            <small className="text-muted">
                              NID: {app.nationalId || '—'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <small>{app.applicantEmail || app.email || 'N/A'}</small>
                      </td>
                      <td>
                        <small>{app.applicantPhone || app.phone || 'N/A'}</small>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">{app.projectName || 'Unknown Project'}</div>
                          {app.projectLinked ? (
                            <>
                              <small
                                className="text-muted font-monospace"
                                title={app.projectMongoId || app.projectId}
                              >
                                Project: {formatMongoIdShort(app.projectMongoId || app.projectId)}
                              </small>
                              <span className="badge bg-success bg-opacity-10 text-success ms-1" style={{ fontSize: '0.65rem' }}>
                                Linked
                              </span>
                            </>
                          ) : (
                            <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>
                              Project not in database
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge bg-${
                          app.status === 'approved' ? 'success' :
                          app.status === 'pending' ? 'warning' : 'danger'
                        }`}>
                          {app.status || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <small>{formatDate(app.submittedAt || app.createdAt)}</small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm" role="group">
                          <Link
                            to={`/applications/${app._id || app.id}`}
                            className="btn btn-outline-primary"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          {app.status === 'pending' && (
                            <>
                              <button
                                className="btn btn-outline-success"
                                onClick={() => updateApplicationStatus(app._id || app.id, 'approved')}
                                disabled={updatingId === (app._id || app.id)}
                              >
                                {updatingId === (app._id || app.id) ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <i className="bi bi-check"></i>
                                )}
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => handleRejectClick(app._id || app.id)}
                                disabled={updatingId === (app._id || app.id)}
                              >
                                <i className="bi bi-x"></i>
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
          ) : (
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
          )}
        </div>
      </div>

      {/* Rejection Reason Dialog */}
      {showRejectDialog && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle text-danger me-2"></i>
                  Reject Application
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowRejectDialog(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-3">Please provide a reason for rejecting this application:</p>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Enter rejection reason..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  autoFocus
                ></textarea>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowRejectDialog(false)}
                >
                  <i className="bi bi-x-circle me-2"></i>Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={confirmRejection}
                  disabled={!rejectionReason.trim() || updatingId === rejectingAppId}
                >
                  {updatingId === rejectingAppId ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Confirm Rejection
                    </>
                  )}
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
