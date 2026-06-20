import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { applicationsAPI, projectsAPI } from '../services/apiService';
import { enrichApplication } from '../utils/projectLink';

// Format date helper function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const ReviewApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState('');

  // Load application data
  useEffect(() => {
    const loadApplication = async () => {
      try {
        setLoading(true);
        
        // Fetch both application and projects data
        const [applicationResponse, projectsResponse] = await Promise.all([
          applicationsAPI.getById(id),
          projectsAPI.getAll({ limit: 1000 }),
        ]);

        const appData = applicationResponse.data;
        const projectsData = projectsResponse.data || [];

        if (appData) {
          setApplication(enrichApplication(appData, projectsData));
        } else {
          setUpdateError('Application not found');
        }
      } catch (err) {
        setUpdateError('Failed to load application');
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [id]);

  // Handle approve application
  const handleApprove = async () => {
    try {
      setUpdateLoading(true);
      setUpdateError('');

      await applicationsAPI.updateStatus(id, { status: 'approved', reviewedBy: 'Admin' });
      setSuccessMessage('Application approved successfully!');
      if (application) {
        const prevAvailable = application.projectDetails?.availableUnits;
        setApplication({
          ...application,
          status: 'approved',
          projectDetails: application.projectDetails
            ? { ...application.projectDetails, availableUnits: prevAvailable > 0 ? prevAvailable - 1 : 0 }
            : null,
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to approve application';
      setUpdateError(msg);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle reject application
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setUpdateError('Please provide a reason for rejection');
      return;
    }

    try {
      setUpdateLoading(true);
      setUpdateError('');

      await applicationsAPI.updateStatus(id, { status: 'rejected', reviewedBy: 'Admin', rejectionReason: rejectReason });
      setSuccessMessage('Application rejected successfully!');
      setShowRejectReason(false);
      if (application) {
        const prevAvailable = application.projectDetails?.availableUnits ?? 0;
        const wasApproved = application.status === 'approved';
        setApplication({
          ...application,
          status: 'rejected',
          rejectionReason: rejectReason,
          projectDetails: application.projectDetails && wasApproved
            ? { ...application.projectDetails, availableUnits: prevAvailable + 1 }
            : application.projectDetails,
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reject application';
      setUpdateError(msg);
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading application details...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-warning">
          <h4>Application Not Found</h4>
          <p>The application with ID "{id}" was not found.</p>
          <Link to="/applications" className="btn btn-primary">
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">
          <i className="bi bi-file-earmark-text me-2"></i>
          Review Application
        </h2>
        <Link to="/applications" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Back to Applications
        </Link>
      </div>

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      {updateError && (
        <div className="alert alert-danger" role="alert">
          {updateError}
        </div>
      )}

      <div className="row">
        <div className="col-md-8">
          <div className="card shadow mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Application Details</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Application ID:</strong>{' '}
                  <span className="font-monospace small">{application._id}</span>
                </div>
                <div className="col-md-6">
                  <strong>Status:</strong>
                  <span className={`badge bg-${
                    application.status === 'approved' ? 'success' : 
                    application.status === 'rejected' ? 'danger' : 'warning'
                  } ms-2`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    <i className="bi bi-person me-2"></i>
                    Applicant Information
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Full Name</label>
                      <p className="form-control-plaintext">{application.applicantName || application.name || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">National ID</label>
                      <p className="form-control-plaintext font-monospace">{application.nationalId || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Email</label>
                      <p className="form-control-plaintext">{application.applicantEmail || application.email || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Phone</label>
                      <p className="form-control-plaintext">{application.applicantPhone || application.phone || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Monthly Income</label>
                      <p className="form-control-plaintext">{application.income != null ? `${Number(application.income).toLocaleString()} EGP` : 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Family Size</label>
                      <p className="form-control-plaintext">{application.familySize || 'N/A'}</p>
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Current Housing Situation</label>
                      <p className="form-control-plaintext">{application.currentHousing || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm mb-4">
                <div className="card-header bg-light">
                  <h5 className="mb-0">
                    <i className="bi bi-building me-2"></i>
                    Project Information
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Project Name</label>
                      <p className="form-control-plaintext">
                        {application.projectName}
                        {application.projectLinked ? (
                          <span className="badge bg-success ms-2">Linked to Projects DB</span>
                        ) : (
                          <span className="badge bg-warning text-dark ms-2">Not linked</span>
                        )}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Project ID</label>
                      <p className="form-control-plaintext font-monospace small">
                        {application.projectMongoId || application.projectId || 'N/A'}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Location</label>
                      <p className="form-control-plaintext">
                        {application.projectLocation || application.projectDetails?.location || 'N/A'}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Requested Unit Type</label>
                      <p className="form-control-plaintext">{application.unitType || application.requestedUnitType || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Preferred Floor</label>
                      <p className="form-control-plaintext">{application.preferredFloor || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Payment Method</label>
                      <p className="form-control-plaintext">{application.paymentMethod || 'N/A'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Submission Date</label>
                      <p className="form-control-plaintext">{formatDate(application.submittedDate)}</p>
                    </div>
                    {application.projectDetails?.totalUnits !== undefined && (
                      <div className="col-12 mb-3">
                        <label className="form-label">Unit Availability</label>
                        <div className="d-flex align-items-center gap-3">
                          {application.projectDetails.availableUnits === 0 ? (
                            <span className="badge bg-danger fs-6">Sold Out — No Units Available</span>
                          ) : (
                            <>
                              <span className="badge bg-success fs-6">
                                {application.projectDetails.availableUnits} / {application.projectDetails.totalUnits} units available
                              </span>
                              <div className="progress flex-grow-1" style={{ height: '8px' }}>
                                <div
                                  className="progress-bar bg-success"
                                  style={{ width: `${(application.projectDetails.availableUnits / application.projectDetails.totalUnits) * 100}%` }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {application.specialRequirements && (
                    <div className="mt-3">
                      <label className="form-label">Special Requirements</label>
                      <p className="form-control-plaintext">{application.specialRequirements}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          {application.documents && (
            <div className="card shadow mb-4">
              <div className="card-header bg-dark text-white">
                <h5 className="mb-0">
                  <i className="bi bi-folder2-open me-2"></i>
                  Uploaded Documents
                </h5>
              </div>
              <div className="card-body p-3">
                {[
                  { key: 'nationalIdCopy',    label: 'National ID Copy' },
                  { key: 'incomeCertificate', label: 'Income Certificate' },
                  { key: 'birthCertificate',  label: 'Family Status Document' },
                ].map(({ key, label }) => {
                  const url = application.documents[key];
                  const hasFile = url && url.startsWith('/uploads/');
                  const serverBase = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');
                  const fullUrl = hasFile ? `${serverBase}${url}` : null;
                  const isImage = hasFile && /\.(jpg|jpeg|png)$/i.test(url);
                  return (
                    <div key={key} className="mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <small className="fw-semibold text-muted">{label}</small>
                        {hasFile ? (
                          <span className="badge bg-success">Uploaded</span>
                        ) : (
                          <span className="badge bg-secondary">Not uploaded</span>
                        )}
                      </div>
                      {hasFile && (
                        isImage ? (
                          <a href={fullUrl} target="_blank" rel="noreferrer">
                            <img
                              src={fullUrl}
                              alt={label}
                              className="img-fluid rounded border"
                              style={{ maxHeight: '120px', objectFit: 'cover', width: '100%' }}
                            />
                          </a>
                        ) : (
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-primary btn-sm w-100"
                          >
                            <i className="bi bi-file-earmark-pdf me-1"></i>
                            View PDF
                          </a>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card shadow">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">Actions</h5>
            </div>
            <div className="card-body">
              {application.status === 'pending' && (
                <>
                  {application.projectDetails?.availableUnits === 0 && (
                    <div className="alert alert-warning py-2 small mb-2">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      This project is sold out. Approval will be blocked by the server.
                    </div>
                  )}
                  <button
                    className="btn btn-success w-100 mb-2"
                    onClick={handleApprove}
                    disabled={updateLoading || application.projectDetails?.availableUnits === 0}
                    title={application.projectDetails?.availableUnits === 0 ? 'No available units' : ''}
                  >
                    {updateLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Approve Application
                      </>
                    )}
                  </button>
                  
                  <button
                    className="btn btn-danger w-100"
                    onClick={() => setShowRejectReason(true)}
                    disabled={updateLoading}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Reject Application
                  </button>
                </>
              )}
              
              {application.status !== 'pending' && (
                <div className="text-center">
                  <p className="text-muted mb-0">
                    This application has been {application.status}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showRejectReason && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Application</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRejectReason(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="rejectReason" className="form-label">Reason for Rejection</label>
                  <textarea
                    className="form-control"
                    id="rejectReason"
                    rows="4"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this application..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRejectReason(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={updateLoading}
                >
                  {updateLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Rejecting...
                    </>
                  ) : (
                    'Reject Application'
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

export default ReviewApplication;
