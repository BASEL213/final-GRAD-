import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usersAPI, applicationsAPI } from '../services/apiService';
import { clearStuckOverlays } from '../utils/cleanupOverlays';
import {
  DEPARTMENTS,
  STAFF_ROLES,
  USER_STATUSES,
  EMPTY_STAFF_FORM,
  normalizeRole,
  isStaffRole,
  getDisplayDepartment,
  buildApplicantIndex,
  citizenHasApplication,
  getUserDisplayStatus,
  getHasApplicationDisplay,
  formatLastLogin,
} from '../constants/userManagement';

const defaultStats = {
  totalUsers: 0,
  totalEmployees: 0,
  totalAdmins: 0,
  totalCitizens: 0,
  activeApplicants: 0,
  inactiveApplicants: 0,
};

const Roles = () => {
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [applicantIndex, setApplicantIndex] = useState({ byEmail: new Set(), byNationalId: new Set() });
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_STAFF_FORM });
  const [editingCitizen, setEditingCitizen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  // Toggle status confirmation
  const [toggleTarget, setToggleTarget] = useState(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Reset password modal
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, statsRes, appsRes] = await Promise.all([
        usersAPI.getAll({ limit: 2000 }),
        usersAPI.getStats(),
        applicationsAPI.getAll({ limit: 1000 }),
      ]);
      const usersList = usersRes.data || [];
      const totalFromApi = usersRes.total ?? usersList.length;
      const appsList = appsRes.data || [];
      const index = buildApplicantIndex(appsList);
      usersList.forEach((u) => {
        if (u.hasApplication === true) return;
        if (citizenHasApplication(u, index)) u.hasApplication = true;
      });
      const citizens = usersList.filter((u) => normalizeRole(u.role) === 'citizen');
      const activeApplicants = citizens.filter((u) => citizenHasApplication(u, index)).length;

      setUsers(usersList);
      setUsersTotal(totalFromApi);
      setApplicantIndex(index);
      setStats({
        ...defaultStats,
        ...(statsRes.data || {}),
        activeApplicants,
        inactiveApplicants: citizens.length - activeApplicants,
      });
    } catch (err) {
      setError(err.message || 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      const role = normalizeRole(user.role);
      if (q && !user.name?.toLowerCase().includes(q) && !user.email?.toLowerCase().includes(q)) return false;
      if (filterRole && role !== filterRole) return false;
      if (filterStatus && user.status !== filterStatus) return false;
      if (filterDepartment) {
        if (!isStaffRole(user.role)) return false;
        if (user.department !== filterDepartment) return false;
      }
      return true;
    });
  }, [users, search, filterRole, filterStatus, filterDepartment]);

  const openAddModal = () => {
    setEditingUser(null);
    setEditingCitizen(false);
    setFormData({ ...EMPTY_STAFF_FORM });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    const role = normalizeRole(user.role);
    const staff = isStaffRole(role);
    setEditingUser(user);
    setEditingCitizen(!staff);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      nationalId: user.nationalId || '',
      password: '',
      department: staff ? (user.department || 'Housing Review') : '',
      role: staff ? role : 'citizen',
      status: user.status || 'active',
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setEditingCitizen(false);
    setFormData({ ...EMPTY_STAFF_FORM });
    setFormError('');
    clearStuckOverlays();
  };

  const handleSave = async () => {
    if (!formData.name?.trim() || !formData.email?.trim() || !formData.phone?.trim() || !formData.nationalId?.trim()) {
      setFormError('Please fill in name, email, phone, and national ID.');
      return;
    }
    if (!/^[0-9]{14}$/.test(formData.nationalId.trim())) {
      setFormError('National ID must be exactly 14 digits.');
      return;
    }
    if (!/^01[0-9]{9}$/.test(formData.phone.trim())) {
      setFormError('Phone must start with 01 and be 11 digits (e.g. 01012345678).');
      return;
    }
    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      setFormError('Temporary password is required (min 6 characters) for new users.');
      return;
    }
    if (!editingCitizen && formData.role === 'employee' && !formData.department) {
      setFormError('Please select a department for Employee accounts.');
      return;
    }

    setFormError('');
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        nationalId: formData.nationalId.trim(),
        status: formData.status,
      };

      if (editingCitizen) {
        await usersAPI.update(editingUser._id, payload);
        showToast('Citizen account updated successfully.');
      } else {
        payload.role = formData.role;
        if (formData.role === 'employee') payload.department = formData.department;

        if (editingUser) {
          await usersAPI.update(editingUser._id, payload);
          showToast('Staff user updated successfully.');
        } else {
          await usersAPI.create({ ...payload, password: formData.password });
          showToast('Staff user created successfully.');
        }
      }
      closeModal();
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const confirmToggleStatus = async () => {
    if (!toggleTarget) return;
    const newStatus = toggleTarget.status === 'active' ? 'inactive' : 'active';
    try {
      await usersAPI.update(toggleTarget._id, { status: newStatus });
      showToast(`${toggleTarget.name} has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
      setToggleTarget(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'danger');
      setToggleTarget(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await usersAPI.delete(deleteTarget._id);
      showToast(`${deleteTarget.name} has been deleted.`);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete user.', 'danger');
      setDeleteTarget(null);
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetPassword || resetPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    setResetError('');
    setResetting(true);
    try {
      await usersAPI.resetPassword(resetTarget._id, resetPassword);
      showToast(`Password reset for ${resetTarget.name}. Share the temporary password securely.`);
      setResetTarget(null);
      setResetPassword('');
    } catch (err) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setResetting(false);
    }
  };

  const getRoleBadge = (role) => {
    const r = normalizeRole(role);
    const map = { admin: 'bg-danger', employee: 'bg-primary', citizen: 'bg-secondary' };
    const label = r.charAt(0).toUpperCase() + r.slice(1);
    return <span className={`badge ${map[r] || 'bg-secondary'}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="page-loading py-5">
        <div className="spinner-border text-primary" role="status" />
        <span>Loading users…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4><i className="bi bi-exclamation-triangle me-2"></i>Error Loading Users</h4>
        <p>{error}</p>
        <button type="button" className="btn btn-primary" onClick={loadData}>
          <i className="bi bi-arrow-clockwise me-2"></i>Try Again
        </button>
      </div>
    );
  }

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
          <h2>Users Management</h2>
          <p>
            Staff accounts and citizen records — {usersTotal} total users.
            Citizens register on the public portal; staff are added here.
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={openAddModal}>
          <i className="bi bi-person-plus me-1"></i>Add Staff
        </button>
      </div>

      {/* Statistics */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Users',        value: stats.totalUsers,         icon: 'bi-people',              color: 'primary'   },
          { label: 'Admins',             value: stats.totalAdmins,        icon: 'bi-shield-check',        color: 'danger'    },
          { label: 'Employees',          value: stats.totalEmployees,     icon: 'bi-person-badge',        color: 'info'      },
          { label: 'Citizens',           value: stats.totalCitizens,      icon: 'bi-person',              color: 'secondary' },
          { label: 'Active Applicants',  value: stats.activeApplicants,   icon: 'bi-file-earmark-check',  color: 'success'   },
          { label: 'Pending Applicants', value: stats.inactiveApplicants, icon: 'bi-file-earmark',        color: 'secondary' },
        ].map((card) => (
          <div className="col-6 col-md-4 col-lg" key={card.label}>
            <div className="kpi-card">
              <div className={`kpi-icon bg-${card.color} bg-opacity-10`}>
                <i className={`bi ${card.icon} text-${card.color}`}></i>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 2 }}>{card.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1 }}>{card.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row g-2">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="">All roles</option>
                <option value="citizen">Citizen</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All statuses</option>
                {USER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select form-select-sm" value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}>
                <option value="">All departments</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <span className="fw-semibold" style={{ fontSize: 14 }}>
            <i className="bi bi-people me-2 text-primary"></i>
            Users ({filteredUsers.length}{filteredUsers.length !== users.length ? ` of ${users.length}` : ''})
          </span>
          <button className="btn btn-sm"
            style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)', color: 'var(--gray-600)', fontSize: 12 }}
            onClick={loadData}>
            <i className="bi bi-arrow-clockwise me-1"></i>Refresh
          </button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Has Application</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4" style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                      No users match your filters.
                    </td>
                  </tr>
                ) : filteredUsers.map((user) => {
                  const role = normalizeRole(user.role);
                  const displayStatus = getUserDisplayStatus(user, applicantIndex);
                  const hasApp = getHasApplicationDisplay(user, applicantIndex);
                  return (
                    <tr key={user._id}>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{user.name}</td>
                      <td>
                        {hasApp.badgeClass ? (
                          <span className={`badge ${hasApp.badgeClass}`} title={hasApp.title || ''}>{hasApp.text}</span>
                        ) : (
                          <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>{hasApp.text}</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gray-600)' }}>{user.email}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td style={{ fontSize: 12 }}>{getDisplayDepartment(user) || '—'}</td>
                      <td>
                        <span className={`badge ${displayStatus.badgeClass}`}>{displayStatus.label}</span>
                        {role === 'citizen' && (
                          <small className="d-block mt-1" style={{ color: 'var(--gray-400)', fontSize: 10 }}>
                            Account: {user.status || 'active'}
                          </small>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{formatLastLogin(user.lastLogin)}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          <button type="button" className="btn btn-sm btn-outline-primary" title="Edit"
                            onClick={() => openEditModal(user)}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${user.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                            onClick={() => setToggleTarget(user)}
                          >
                            <i className={`bi ${user.status === 'active' ? 'bi-pause' : 'bi-play'}`}></i>
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-secondary" title="Reset Password"
                            onClick={() => { setResetTarget(user); setResetPassword(''); setResetError(''); }}>
                            <i className="bi bi-key"></i>
                          </button>
                          {role !== 'admin' && (
                            <button type="button" className="btn btn-sm btn-outline-danger" title="Delete"
                              onClick={() => setDeleteTarget(user)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Role hierarchy info */}
      <div className="row mt-4 g-3">
        {[
          {
            color: 'secondary', icon: 'bi-person', title: 'Citizen',
            desc: 'Registers via public portal. Applies for housing, uploads documents, tracks status.',
            can: ['Self-registration'], cannot: ['No admin access'],
          },
          {
            color: 'primary', icon: 'bi-person-badge', title: 'Employee',
            desc: 'Government staff — reviews applications and documents.',
            can: ['Review applications', 'Request missing documents'], cannot: ['Final approve/reject', 'User management'],
          },
          {
            color: 'danger', icon: 'bi-shield-check', title: 'Admin',
            desc: 'Senior authority — full system control.',
            can: ['Approve / reject applications', 'Manage users & employees', 'Audit logs & reports'], cannot: [],
          },
        ].map((item) => (
          <div className="col-md-4" key={item.title}>
            <div className="card h-100">
              <div className="card-body">
                <h6 className={`text-${item.color} mb-2`}>
                  <i className={`bi ${item.icon} me-2`}></i>{item.title}
                </h6>
                <p style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 8 }}>{item.desc}</p>
                <ul className="list-unstyled mb-0" style={{ fontSize: 12 }}>
                  {item.can.map(c => <li key={c}><i className="bi bi-check-circle text-success me-1"></i>{c}</li>)}
                  {item.cannot.map(c => <li key={c}><i className="bi bi-x-circle text-danger me-1"></i>{c}</li>)}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2 text-primary"></i>
                  {editingCitizen ? 'Edit Citizen Account' : editingUser ? 'Edit Staff User' : 'Add Staff User'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} />
              </div>
              <div className="modal-body">
                {!editingCitizen && (
                  <div className="alert alert-info py-2 mb-3" style={{ fontSize: 12 }}>
                    <i className="bi bi-info-circle me-1"></i>
                    <strong>Admin</strong> and <strong>Employee</strong> only — citizens use the public registration page.
                  </div>
                )}
                {editingCitizen && editingUser && (
                  <div className="alert alert-secondary py-2 mb-3" style={{ fontSize: 12 }}>
                    <i className="bi bi-person me-1"></i>
                    Citizen account — contact &amp; status only.
                    <span className={`badge ms-2 ${getUserDisplayStatus(editingUser, applicantIndex).badgeClass}`}>
                      {getUserDisplayStatus(editingUser, applicantIndex).label}
                    </span>
                  </div>
                )}

                {formError && (
                  <div className="alert alert-danger py-2 mb-3" style={{ fontSize: 12 }}>
                    <i className="bi bi-exclamation-circle me-1"></i>{formError}
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name *</label>
                    <input type="text" className="form-control" value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email Address *</label>
                    <input type="email" className="form-control" value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!!editingUser} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone Number *</label>
                    <input type="tel" className="form-control" placeholder="01012345678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">National ID *</label>
                    <input type="text" className="form-control" placeholder="14 digits" maxLength={14}
                      value={formData.nationalId}
                      onChange={(e) => setFormData({ ...formData, nationalId: e.target.value.replace(/\D/g, '') })}
                      disabled={!!editingUser} />
                  </div>
                  {!editingUser && (
                    <div className="col-md-6">
                      <label className="form-label">Temporary Password *</label>
                      <input type="password" className="form-control" placeholder="Min 6 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                  )}
                  {!editingCitizen && (
                    <div className="col-md-6">
                      <label className="form-label">Role *</label>
                      <select className="form-select" value={formData.role}
                        onChange={(e) => setFormData({
                          ...formData,
                          role: e.target.value,
                          department: e.target.value === 'employee' ? (formData.department || 'Housing Review') : '',
                        })}>
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  )}
                  {editingCitizen && (
                    <div className="col-md-6">
                      <label className="form-label">Role</label>
                      <input type="text" className="form-control" value="Citizen" disabled readOnly />
                    </div>
                  )}
                  {!editingCitizen && formData.role === 'employee' && (
                    <div className="col-md-6">
                      <label className="form-label">Department *</label>
                      <select className="form-select" value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}>
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  )}
                  {!editingCitizen && formData.role === 'admin' && (
                    <div className="col-md-6">
                      <label className="form-label">Department</label>
                      <input type="text" className="form-control" value="Administration" disabled readOnly />
                      <small style={{ color: 'var(--gray-400)', fontSize: 11 }}>Assigned automatically for Admin accounts</small>
                    </div>
                  )}
                  <div className="col-md-6">
                    <label className="form-label">Status *</label>
                    <select className="form-select" value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      {USER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-sm btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="button" className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                    : <><i className="bi bi-check-lg me-1"></i>{editingUser ? 'Save Changes' : 'Add Staff'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle status confirmation */}
      {toggleTarget && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,.45)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h6 className="modal-title">
                  <i className={`bi ${toggleTarget.status === 'active' ? 'bi-pause-circle text-warning' : 'bi-play-circle text-success'} me-2`}></i>
                  {toggleTarget.status === 'active' ? 'Deactivate' : 'Activate'} User
                </h6>
                <button type="button" className="btn-close" onClick={() => setToggleTarget(null)} />
              </div>
              <div className="modal-body" style={{ fontSize: 13 }}>
                Are you sure you want to {toggleTarget.status === 'active' ? 'deactivate' : 'activate'}{' '}
                <strong>{toggleTarget.name}</strong>?
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setToggleTarget(null)}>Cancel</button>
                <button type="button"
                  className={`btn btn-sm ${toggleTarget.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                  onClick={confirmToggleStatus}>
                  {toggleTarget.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,.45)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h6 className="modal-title text-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>Delete User
                </h6>
                <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} />
              </div>
              <div className="modal-body" style={{ fontSize: 13 }}>
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button type="button" className="btn btn-sm btn-danger" onClick={confirmDelete}>
                  <i className="bi bi-trash me-1"></i>Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,.45)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h6 className="modal-title">
                  <i className="bi bi-key me-2 text-primary"></i>Reset Password
                </h6>
                <button type="button" className="btn-close" onClick={() => { setResetTarget(null); setResetPassword(''); setResetError(''); }} />
              </div>
              <div className="modal-body">
                <p style={{ fontSize: 13, marginBottom: 12 }}>
                  Set a temporary password for <strong>{resetTarget.name}</strong>.
                </p>
                {resetError && (
                  <div className="alert alert-danger py-2 mb-2" style={{ fontSize: 12 }}>
                    <i className="bi bi-exclamation-circle me-1"></i>{resetError}
                  </div>
                )}
                <input
                  type="password"
                  className="form-control"
                  placeholder="Min 6 characters"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  autoFocus
                />
                <small style={{ color: 'var(--gray-400)', fontSize: 11 }}>Share this password securely with the user.</small>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-sm btn-secondary"
                  onClick={() => { setResetTarget(null); setResetPassword(''); setResetError(''); }}>Cancel</button>
                <button type="button" className="btn btn-sm btn-primary" onClick={handleResetPasswordSubmit} disabled={resetting}>
                  {resetting
                    ? <><span className="spinner-border spinner-border-sm me-2" />Resetting…</>
                    : <><i className="bi bi-check-lg me-1"></i>Reset Password</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
