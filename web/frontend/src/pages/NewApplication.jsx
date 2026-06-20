import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI, applicationsAPI } from '../services/apiService';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/api$/, '');
const fixImageUrl = (url) => {
  if (!url) return url;
  try {
    const u = new URL(url);
    const base = new URL(API_ORIGIN);
    u.hostname = base.hostname;
    u.port     = base.port;
    u.protocol = base.protocol;
    return u.toString();
  } catch { return url; }
};

const steps = [
  { id: 1, label: 'Personal Info',   icon: 'bi-person'           },
  { id: 2, label: 'Project',         icon: 'bi-building'         },
  { id: 3, label: 'Financial',       icon: 'bi-cash-stack'       },
  { id: 4, label: 'Documents',       icon: 'bi-file-earmark-text'},
];

const EMPTY_FORM = {
  applicantName: '',
  nationalId: '',
  applicantEmail: '',
  applicantPhone: '',
  projectName: '',
  projectId: '',
  income: '',
  familySize: '',
  currentHousing: '',
  unitType: '2BR',
  preferredFloor: 'Any',
  paymentMethod: 'installments',
  specialRequirements: '',
};

const EMPTY_FILES = {
  nationalIdPhoto: null,
  incomeCertificate: null,
  birthCertificate: null,
  otherDocuments: [],
};

const NewApplication = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [uploadedFiles, setUploadedFiles] = useState(EMPTY_FILES);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const response = await projectsAPI.getAll();
        const active = (response.data || []).filter(p => p.status === 'active');
        setProjects(active);
      } catch {
        setError('Failed to load projects. Please refresh and try again.');
      } finally {
        setPageLoading(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'projectId') {
      const proj = projects.find(p => String(p._id) === value);
      setFormData(prev => ({ ...prev, projectId: value, projectName: proj ? proj.name : '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleFile = (e, key) => {
    const file = e.target.files[0];
    if (file) setUploadedFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleMultiFile = (e) => {
    setUploadedFiles(prev => ({ ...prev, otherDocuments: Array.from(e.target.files) }));
  };

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.applicantName.trim()) { setError('Full name is required.'); return false; }
      if (!/^[0-9]{14}$/.test(formData.nationalId)) { setError('National ID must be exactly 14 digits.'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.applicantEmail)) { setError('Enter a valid email address.'); return false; }
      if (!/^01[0-9]{9}$/.test(formData.applicantPhone)) { setError('Phone must start with 01 and be 11 digits.'); return false; }
    }
    if (step === 2) {
      if (!formData.projectId) { setError('Please select a project.'); return false; }
    }
    if (step === 3) {
      const income = parseFloat(formData.income);
      if (isNaN(income) || income <= 0) { setError('Monthly income must be a positive number.'); return false; }
      const family = parseInt(formData.familySize);
      if (isNaN(family) || family < 1 || family > 20) { setError('Family size must be between 1 and 20.'); return false; }
      if (formData.currentHousing.trim().length < 10) { setError('Current housing description must be at least 10 characters.'); return false; }
    }
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await applicationsAPI.create({
        name: formData.applicantName,
        nationalId: formData.nationalId,
        email: formData.applicantEmail,
        phone: formData.applicantPhone,
        projectName: formData.projectName,
        projectId: formData.projectId,
        income: parseFloat(formData.income),
        familySize: parseInt(formData.familySize),
        currentHousing: formData.currentHousing,
        unitType: formData.unitType,
        preferredFloor: formData.preferredFloor,
        paymentMethod: formData.paymentMethod,
        specialRequirements: formData.specialRequirements,
        status: 'pending',
      });
      setSuccess('Application submitted successfully! Redirecting…');
      setTimeout(() => navigate('/applications'), 2000);
    } catch (err) {
      if (err.message?.includes('National ID')) setError('That National ID already has an application.');
      else if (err.message?.includes('Email')) setError('That email already has an application.');
      else setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setUploadedFiles(EMPTY_FILES);
    setError('');
    setSuccess('');
    setStep(1);
  };

  if (pageLoading) {
    return (
      <div className="page-loading">
        <div className="spinner-border text-primary" role="status" />
        <span>Loading projects…</span>
      </div>
    );
  }

  const FileInput = ({ label, fileKey, accept, required }) => (
    <div className="mb-3">
      <label className="form-label">{label}{required && ' *'}</label>
      <input
        type="file"
        className="form-control"
        accept={accept}
        onChange={e => handleFile(e, fileKey)}
        required={required}
      />
      {uploadedFiles[fileKey] && (
        <div className="mt-1 d-flex align-items-center gap-1" style={{ fontSize: 12, color: 'var(--success)' }}>
          <i className="bi bi-check-circle-fill"></i>
          {uploadedFiles[fileKey].name}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2>New Housing Application</h2>
          <p>Complete all sections to submit an application.</p>
        </div>
        <button
          type="button"
          className="btn btn-sm"
          style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)', color: 'var(--gray-600)' }}
          onClick={() => navigate('/applications')}
        >
          <i className="bi bi-arrow-left me-1"></i>Back
        </button>
      </div>

      {/* Step indicator */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="d-flex align-items-center justify-content-between">
            {steps.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: step > s.id ? 'var(--success)' : step === s.id ? 'var(--primary)' : 'var(--gray-100)',
                      border: step === s.id ? '2px solid var(--primary)' : '2px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: step >= s.id ? '#fff' : 'var(--gray-400)',
                      fontSize: 15, transition: 'all .2s',
                    }}
                  >
                    {step > s.id
                      ? <i className="bi bi-check"></i>
                      : <i className={`bi ${s.icon}`}></i>
                    }
                  </div>
                  <span style={{ fontSize: 11, marginTop: 5, color: step >= s.id ? 'var(--gray-700)' : 'var(--gray-400)', fontWeight: step === s.id ? 600 : 400 }}>
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: step > s.id ? 'var(--success)' : 'var(--gray-100)', margin: '0 8px', marginBottom: 20 }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" style={{ fontSize: 13 }}>
          <i className="bi bi-exclamation-circle-fill flex-shrink-0"></i>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-3" style={{ fontSize: 13 }}>
          <i className="bi bi-check-circle-fill flex-shrink-0"></i>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1 — Personal Info */}
        {step === 1 && (
          <div className="card">
            <div className="card-header">
              <i className="bi bi-person me-2 text-primary"></i>
              <span className="fw-semibold">Personal Information</span>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-control" name="applicantName"
                    value={formData.applicantName} onChange={handleChange}
                    placeholder="Enter your full name" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">National ID *</label>
                  <input type="text" className="form-control" name="nationalId"
                    value={formData.nationalId} onChange={handleChange}
                    placeholder="14-digit National ID" maxLength={14} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email Address *</label>
                  <input type="email" className="form-control" name="applicantEmail"
                    value={formData.applicantEmail} onChange={handleChange}
                    placeholder="your@email.com" required />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Phone Number *</label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ fontSize: 12, color: 'var(--gray-400)' }}>EG</span>
                    <input type="tel" className="form-control" name="applicantPhone"
                      value={formData.applicantPhone} onChange={handleChange}
                      placeholder="01xxxxxxxxx" maxLength={11} required />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Project */}
        {step === 2 && (
          <div className="card">
            <div className="card-header">
              <i className="bi bi-building me-2 text-primary"></i>
              <span className="fw-semibold">Project &amp; Preferences</span>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label mb-2">Preferred Project *</label>
                  {projects.length > 0 ? (
                    <div className="row g-3">
                      {projects.map(p => {
                        const selected = formData.projectId === String(p._id);
                        const sold = Math.max(0, (p.totalUnits || 0) - (p.availableUnits || 0));
                        const pct = p.totalUnits > 0 ? Math.round((sold / p.totalUnits) * 100) : 0;
                        return (
                          <div key={p._id} className="col-md-6 col-lg-4">
                            <div
                              onClick={() => handleChange({ target: { name: 'projectId', value: String(p._id) } })}
                              style={{
                                border: selected ? '2px solid var(--primary)' : '1.5px solid var(--gray-200)',
                                borderRadius: 10,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                background: selected ? '#f0f6ff' : '#fff',
                                boxShadow: selected ? '0 0 0 3px rgba(59,130,246,.15)' : '0 1px 3px rgba(0,0,0,.06)',
                                transition: 'all .15s',
                              }}
                            >
                              <div style={{ position: 'relative', height: 120, background: 'var(--gray-100)' }}>
                                {p.imageUrl ? (
                                  <img src={fixImageUrl(p.imageUrl)} alt={p.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <i className="bi bi-building" style={{ fontSize: 36, color: 'var(--gray-300)' }}></i>
                                  </div>
                                )}
                                {selected && (
                                  <div style={{
                                    position: 'absolute', top: 8, right: 8,
                                    background: 'var(--primary)', color: '#fff',
                                    borderRadius: '50%', width: 22, height: 22,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13
                                  }}>
                                    <i className="bi bi-check"></i>
                                  </div>
                                )}
                              </div>
                              <div style={{ padding: '10px 12px 12px' }}>
                                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 6 }}>
                                  <i className="bi bi-geo-alt me-1"></i>
                                  {typeof p.location === 'string' ? p.location : (p.location?.city || '—')}
                                </div>
                                {p.priceRange && (
                                  <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 6 }}>
                                    {p.priceRange}
                                  </div>
                                )}
                                <div style={{ fontSize: 10, color: 'var(--gray-400)', marginBottom: 4 }}>
                                  {p.availableUnits} of {p.totalUnits} units available
                                </div>
                                <div className="progress" style={{ height: 3 }}>
                                  <div className="progress-bar bg-primary" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="alert alert-warning" style={{ fontSize: 13 }}>
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      No active projects available at this time. Please try again later.
                    </div>
                  )}
                </div>
                <div className="col-md-4">
                  <label className="form-label">Unit Type</label>
                  <select className="form-select" name="unitType"
                    value={formData.unitType} onChange={handleChange}>
                    <option value="Studio">Studio</option>
                    <option value="1BR">1 Bedroom</option>
                    <option value="2BR">2 Bedrooms</option>
                    <option value="3BR">3 Bedrooms</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Preferred Floor</label>
                  <select className="form-select" name="preferredFloor"
                    value={formData.preferredFloor} onChange={handleChange}>
                    <option value="Any">Any floor</option>
                    <option value="Ground">Ground</option>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="3rd">3rd</option>
                    <option value="4th">4th</option>
                    <option value="5th">5th</option>
                    <option value="6th+">6th or above</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Payment Method</label>
                  <select className="form-select" name="paymentMethod"
                    value={formData.paymentMethod} onChange={handleChange}>
                    <option value="installments">Installments</option>
                    <option value="cash">Cash</option>
                    <option value="bank_loan">Bank Loan</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Financial */}
        {step === 3 && (
          <div className="card">
            <div className="card-header">
              <i className="bi bi-cash-stack me-2 text-primary"></i>
              <span className="fw-semibold">Financial &amp; Housing Details</span>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Monthly Income (EGP) *</label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ fontSize: 12 }}>EGP</span>
                    <input type="number" className="form-control" name="income"
                      value={formData.income} onChange={handleChange}
                      placeholder="0.00" min="0" step="0.01" required />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Family Size *</label>
                  <input type="number" className="form-control" name="familySize"
                    value={formData.familySize} onChange={handleChange}
                    placeholder="Number of members" min="1" max="20" required />
                </div>
                <div className="col-12">
                  <label className="form-label">Current Housing Situation *</label>
                  <textarea className="form-control" name="currentHousing"
                    value={formData.currentHousing} onChange={handleChange}
                    placeholder="Describe your current living situation (min 10 characters)…"
                    rows="3" required />
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                    {formData.currentHousing.length}/200 characters
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label">Special Requirements</label>
                  <textarea className="form-control" name="specialRequirements"
                    value={formData.specialRequirements} onChange={handleChange}
                    placeholder="Any special needs or preferences (optional)…"
                    rows="2" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Documents */}
        {step === 4 && (
          <div className="card">
            <div className="card-header">
              <i className="bi bi-file-earmark-text me-2 text-primary"></i>
              <span className="fw-semibold">Required Documents</span>
            </div>
            <div className="card-body">
              <div className="alert alert-info mb-4" style={{ fontSize: 13 }}>
                <i className="bi bi-info-circle me-2"></i>
                Accepted formats: JPG, PNG, PDF. Maximum 5 MB per file.
              </div>
              <div className="row g-2">
                <div className="col-md-6">
                  <FileInput label="National ID Photo" fileKey="nationalIdPhoto" accept="image/*" required />
                </div>
                <div className="col-md-6">
                  <FileInput label="Income Certificate" fileKey="incomeCertificate" accept="image/*,.pdf" required />
                </div>
                <div className="col-md-6">
                  <FileInput label="Birth Certificate" fileKey="birthCertificate" accept="image/*,.pdf" required />
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Other Documents</label>
                    <input type="file" className="form-control" accept="image/*,.pdf"
                      multiple onChange={handleMultiFile} />
                    {uploadedFiles.otherDocuments.length > 0 && (
                      <div className="mt-1 d-flex align-items-center gap-1" style={{ fontSize: 12, color: 'var(--success)' }}>
                        <i className="bi bi-check-circle-fill"></i>
                        {uploadedFiles.otherDocuments.length} file(s) selected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="d-flex justify-content-between mt-4">
          <div>
            {step > 1 && (
              <button type="button" className="btn btn-sm me-2"
                style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)', color: 'var(--gray-600)' }}
                onClick={prevStep}>
                <i className="bi bi-chevron-left me-1"></i>Back
              </button>
            )}
            <button type="button" className="btn btn-sm"
              style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)', color: 'var(--gray-600)' }}
              onClick={resetForm}>
              <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
            </button>
          </div>
          <div>
            {step < 4 ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={nextStep}>
                Next <i className="bi bi-chevron-right ms-1"></i>
              </button>
            ) : (
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Submitting…</>
                ) : (
                  <><i className="bi bi-check-lg me-1"></i>Submit Application</>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewApplication;
