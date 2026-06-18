import React, { useState, useEffect, useMemo } from 'react';
import { projectsAPI } from '../services/apiService';

const PRICE_BANDS = [
  { value: '', label: 'All prices' },
  { value: 'under-2', label: 'Under 2M EGP' },
  { value: '2-5', label: '2M – 5M EGP' },
  { value: '5-10', label: '5M – 10M EGP' },
  { value: 'over-10', label: 'Over 10M EGP' },
];

const extractCity = (location) => {
  if (!location) return '';
  if (typeof location === 'object') return location.city || location.district || '';
  const parts = String(location).split(',').map(p => p.trim());
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
};

const parsePriceBounds = (priceRange) => {
  if (!priceRange) return { min: 0, max: 0 };
  const nums = String(priceRange).match(/[\d.]+/g)?.map(Number) || [];
  if (nums.length >= 2) return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: 0, max: 0 };
};

const matchesPriceBand = (priceRange, band) => {
  if (!band) return true;
  const { min, max } = parsePriceBounds(priceRange);
  switch (band) {
    case 'under-2': return max > 0 && max < 2;
    case '2-5':     return min < 5 && max >= 2;
    case '5-10':    return min < 10 && max >= 5;
    case 'over-10': return min >= 10;
    default: return true;
  }
};

const EMPTY_FORM = {
  name: '', location: '', totalUnits: '', availableUnits: '',
  priceRange: '', type: 'Apartments', status: 'active',
  completionDate: '', description: '', imageUrl: '',
};

const Projects = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterPrice, setFilterPrice] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await projectsAPI.getAll();
      setProjectsList(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const cityOptions = useMemo(() => {
    const cities = new Set();
    projectsList.forEach(p => { const c = extractCity(p.location); if (c) cities.add(c); });
    return Array.from(cities).sort((a, b) => a.localeCompare(b));
  }, [projectsList]);

  const typeOptions = useMemo(() => {
    const types = new Set();
    projectsList.forEach(p => { if (p.type) types.add(p.type); });
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  }, [projectsList]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projectsList.filter(p => {
      if (q) {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const loc  = String(p.location || '').toLowerCase();
        if (!name.includes(q) && !desc.includes(q) && !loc.includes(q)) return false;
      }
      if (filterCity && extractCity(p.location) !== filterCity) return false;
      if (filterPrice && !matchesPriceBand(p.priceRange, filterPrice)) return false;
      if (filterType && p.type !== filterType) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      return true;
    });
  }, [projectsList, search, filterCity, filterPrice, filterType, filterStatus]);

  const hasActiveFilters = search || filterCity || filterPrice || filterType || filterStatus;
  const clearFilters = () => { setSearch(''); setFilterCity(''); setFilterPrice(''); setFilterType(''); setFilterStatus(''); };

  const openAdd = () => { setEditingProject(null); setFormData(EMPTY_FORM); setShowModal(true); };

  const openEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      location: typeof project.location === 'string' ? project.location : (project.location?.city || ''),
      totalUnits: project.totalUnits || '',
      availableUnits: project.availableUnits || '',
      priceRange: project.priceRange || '',
      type: project.type || 'Apartments',
      status: project.status || 'active',
      completionDate: project.completionDate ? new Date(project.completionDate).toISOString().split('T')[0] : '',
      description: project.description || '',
      imageUrl: project.imageUrl || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) { showToast('Project name is required.', 'danger'); return; }
    if (!formData.location?.trim()) { showToast('Location is required.', 'danger'); return; }
    if (!formData.totalUnits || parseInt(formData.totalUnits) <= 0) { showToast('Total units must be greater than 0.', 'danger'); return; }
    if (formData.availableUnits === '' || parseInt(formData.availableUnits) < 0) { showToast('Available units must be 0 or more.', 'danger'); return; }
    if (!formData.priceRange?.trim()) { showToast('Price range is required.', 'danger'); return; }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        totalUnits: parseInt(formData.totalUnits),
        availableUnits: parseInt(formData.availableUnits),
      };
      if (editingProject) {
        await projectsAPI.update(editingProject._id, payload);
        showToast('Project updated successfully.');
      } else {
        await projectsAPI.create(payload);
        showToast('Project added successfully.');
      }
      setShowModal(false);
      setEditingProject(null);
      await fetchProjects();
    } catch (err) {
      showToast(err.message || 'Failed to save project.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (project) => {
    const newStatus = project.status === 'active' ? 'completed' : 'active';
    try {
      await projectsAPI.update(project._id, { ...project, status: newStatus });
      showToast(`Project marked as ${newStatus}.`);
      await fetchProjects();
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'danger');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await projectsAPI.delete(deleteTarget._id);
      showToast('Project deleted.');
      setDeleteTarget(null);
      await fetchProjects();
    } catch (err) {
      showToast(err.message || 'Failed to delete project.', 'danger');
      setDeleteTarget(null);
    }
  };

  const StatusBadge = ({ status }) => {
    const map = { active: 'bg-success', completed: 'bg-primary', planning: 'bg-warning text-dark' };
    return <span className={`badge ${map[status] || 'bg-secondary'}`}>{(status || '—').charAt(0).toUpperCase() + (status || '').slice(1)}</span>;
  };

  return (
    <div>
      {/* Toast */}
      {toastMsg && (
        <div
          className={`alert alert-${toastType} d-flex align-items-center gap-2`}
          style={{ position: 'fixed', top: 16, right: 24, zIndex: 9999, minWidth: 280, fontSize: 13, boxShadow: 'var(--shadow-lg)' }}
        >
          <i className={`bi ${toastType === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'}`}></i>
          {toastMsg}
        </div>
      )}

      {/* Page header */}
      <div className="page-header">
        <div>
          <h2>Projects</h2>
          <p>Manage housing projects and availability.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <i className="bi bi-plus me-1"></i>Add Project
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Search</label>
              <input type="text" className="form-control form-control-sm" placeholder="Name, location…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label">City</label>
              <select className="form-select form-select-sm" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                <option value="">All cities</option>
                {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Price</label>
              <select className="form-select form-select-sm" value={filterPrice} onChange={e => setFilterPrice(e.target.value)}>
                {PRICE_BANDS.map(b => <option key={b.value || 'all'} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Type</label>
              <select className="form-select form-select-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">All types</option>
                {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Status</label>
              <select className="form-select form-select-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="planning">Planning</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="col-md-1">
              {hasActiveFilters && (
                <button type="button" className="btn btn-sm w-100"
                  style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)', color: 'var(--gray-600)' }}
                  onClick={clearFilters} title="Clear filters">
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <span className="fw-semibold" style={{ fontSize: 14 }}>
            <i className="bi bi-building me-2 text-primary"></i>
            Projects ({filteredProjects.length}{hasActiveFilters ? ` of ${projectsList.length}` : ''})
          </span>
          <button className="btn btn-sm"
            style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)', color: 'var(--gray-600)', fontSize: 12 }}
            onClick={fetchProjects}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="page-loading py-5">
              <div className="spinner-border text-primary" role="status" />
              <span>Loading projects…</span>
            </div>
          ) : error ? (
            <div className="p-4">
              <div className="alert alert-warning mb-0" style={{ fontSize: 13 }}>
                <i className="bi bi-exclamation-triangle me-2"></i>{error}
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 52 }}></th>
                    <th>Project Name</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Units</th>
                    <th>Price Range</th>
                    <th>Status</th>
                    <th>Completion</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-5">
                        <i className="bi bi-building fs-2 d-block mb-2 text-muted"></i>
                        <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                          {hasActiveFilters ? 'No projects match your filters.' : 'No projects yet.'}
                        </span>
                        {hasActiveFilters && (
                          <div className="mt-2">
                            <button type="button" className="btn btn-sm btn-link" onClick={clearFilters}>Clear filters</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : filteredProjects.map(project => {
                    const sold = Math.max(0, (project.totalUnits || 0) - (project.availableUnits || 0));
                    const pct = project.totalUnits > 0 ? Math.round((sold / project.totalUnits) * 100) : 0;
                    return (
                      <tr key={project._id || project.id}>
                        <td style={{ padding: '6px 8px' }}>
                          {project.imageUrl ? (
                            <img
                              src={project.imageUrl}
                              alt={project.name}
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--gray-200)' }}
                            />
                          ) : (
                            <div style={{ width: 44, height: 44, borderRadius: 6, background: 'var(--gray-100)', border: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <i className="bi bi-building text-muted" style={{ fontSize: 18 }}></i>
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{project.name}</div>
                          {project.description && (
                            <div style={{ fontSize: 11, color: 'var(--gray-400)' }} className="text-truncate-2">
                              {project.description}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {typeof project.location === 'string' ? project.location : (project.location?.city || '—')}
                        </td>
                        <td style={{ fontSize: 13 }}>{project.type || '—'}</td>
                        <td>
                          <div style={{ fontSize: 13 }}>
                            <span style={{ fontWeight: 600 }}>{project.availableUnits || 0}</span>
                            <span style={{ color: 'var(--gray-400)' }}> / {project.totalUnits || 0}</span>
                          </div>
                          <div className="progress mt-1" style={{ height: 3 }}>
                            <div className="progress-bar bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--gray-600)' }}>{project.priceRange || '—'}</td>
                        <td><StatusBadge status={project.status} /></td>
                        <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                          {project.completionDate ? new Date(project.completionDate).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button type="button" className="btn btn-sm btn-outline-primary" title="Edit" onClick={() => openEdit(project)}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${project.status === 'active' ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                              title={project.status === 'active' ? 'Mark completed' : 'Mark active'}
                              onClick={() => handleToggleStatus(project)}
                            >
                              <i className={`bi ${project.status === 'active' ? 'bi-check-circle' : 'bi-arrow-counterclockwise'}`}></i>
                            </button>
                            <button type="button" className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => setDeleteTarget(project)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,.45)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-building me-2 text-primary"></i>
                  {editingProject ? 'Edit Project' : 'Add New Project'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Project Name *</label>
                    <input type="text" className="form-control" value={formData.name}
                      onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                      placeholder="Project name" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Location *</label>
                    <input type="text" className="form-control" value={formData.location}
                      onChange={e => setFormData(f => ({ ...f, location: e.target.value }))}
                      placeholder="City or district" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Total Units *</label>
                    <input type="number" className="form-control" value={formData.totalUnits}
                      onChange={e => setFormData(f => ({ ...f, totalUnits: e.target.value }))}
                      placeholder="0" min="1" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Available Units *</label>
                    <input type="number" className="form-control" value={formData.availableUnits}
                      onChange={e => setFormData(f => ({ ...f, availableUnits: e.target.value }))}
                      placeholder="0" min="0" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={formData.type}
                      onChange={e => setFormData(f => ({ ...f, type: e.target.value }))}>
                      <option value="Apartments">Apartments</option>
                      <option value="Villas">Villas</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Price Range *</label>
                    <input type="text" className="form-control" value={formData.priceRange}
                      onChange={e => setFormData(f => ({ ...f, priceRange: e.target.value }))}
                      placeholder="e.g. 1M – 3M EGP" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={formData.status}
                      onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="planning">Planning</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Completion Date</label>
                    <input type="date" className="form-control" value={formData.completionDate}
                      onChange={e => setFormData(f => ({ ...f, completionDate: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows="3" value={formData.description}
                      onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                      placeholder="Brief project description…" />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Image URL</label>
                    <div className="d-flex gap-2 align-items-start">
                      <input type="text" className="form-control" value={formData.imageUrl}
                        onChange={e => setFormData(f => ({ ...f, imageUrl: e.target.value }))}
                        placeholder="http://localhost:3000/uploads/projects/photo.jpg" />
                      {formData.imageUrl && (
                        <img src={formData.imageUrl} alt="preview"
                          style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--gray-200)', flexShrink: 0 }}
                          onError={e => { e.target.style.display = 'none'; }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="button" className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="bi bi-check-lg me-1"></i>{editingProject ? 'Update' : 'Add Project'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,.45)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h6 className="modal-title text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>Delete Project
                </h6>
                <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} />
              </div>
              <div className="modal-body" style={{ fontSize: 13 }}>
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button type="button" className="btn btn-sm btn-danger" onClick={handleDelete}>
                  <i className="bi bi-trash me-1"></i>Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
