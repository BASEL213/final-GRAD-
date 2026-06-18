import React, { useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../services/apiService';

const TYPE_ICON = {
  new_application:      'bi-file-earmark-text',
  application_submitted:'bi-file-earmark-plus',
  application_approved: 'bi-check-circle',
  application_rejected: 'bi-x-circle',
  deadline_reminder:    'bi-clock',
  system_alert:         'bi-gear',
  system_update:        'bi-gear',
  user_action:          'bi-person',
};

const TYPE_COLOR = {
  new_application:      'text-primary',
  application_submitted:'text-primary',
  application_approved: 'text-success',
  application_rejected: 'text-danger',
  deadline_reminder:    'text-warning',
  system_alert:         'text-secondary',
  system_update:        'text-secondary',
  user_action:          'text-info',
};

const PRIORITY_BADGE = {
  high:   'bg-danger',
  medium: 'bg-warning text-dark',
  low:    'bg-info text-dark',
};

const relativeTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState({ type: 'all', priority: 'all', status: 'all' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [markingAll, setMarkingAll]     = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await notificationsAPI.getAll({ limit: 200 });
      setNotifications(res.data || []);
    } catch {
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const filteredNotifications = notifications.filter(n => {
    if (filter.type !== 'all' && (n.type || '') !== filter.type) return false;
    if (filter.priority !== 'all' && (n.priority || 'medium') !== filter.priority) return false;
    if (filter.status === 'read'   && !n.isRead) return false;
    if (filter.status === 'unread' &&  n.isRead) return false;
    return true;
  });

  const unreadFiltered = filteredNotifications.filter(n => !n.isRead);
  const totalUnread    = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      await loadNotifications();
    } catch {
      setError('Failed to mark notification as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setDeleteTarget(null);
      await loadNotifications();
    } catch {
      setError('Failed to delete notification');
      setDeleteTarget(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      for (const n of unreadFiltered) {
        await notificationsAPI.markAsRead(n._id);
      }
      await loadNotifications();
    } catch {
      setError('Failed to mark all notifications as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const resetFilters = () => setFilter({ type: 'all', priority: 'all', status: 'all' });
  const activeFilters = Object.values(filter).filter(v => v !== 'all').length;

  if (loading) return (
    <div className="page-loading" style={{ minHeight: 300 }}>
      <div className="spinner-border text-primary" role="status" />
      <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>Loading notifications…</span>
    </div>
  );

  return (
    <div>
      {/* ── Header ─────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Notifications</h2>
          <p style={{ color: 'var(--gray-400)', margin: 0, fontSize: 13 }}>
            Applications, approvals, and system events
            {totalUnread > 0 && (
              <span className="badge bg-danger ms-2" style={{ fontSize: 11 }}>
                {totalUnread} unread
              </span>
            )}
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm btn-primary"
            onClick={markAllAsRead}
            disabled={unreadFiltered.length === 0 || markingAll}
          >
            {markingAll
              ? <><span className="spinner-border spinner-border-sm me-1" />Marking…</>
              : <><i className="bi bi-check-all me-1" />Mark {unreadFiltered.length > 0 ? `${unreadFiltered.length} ` : ''}Read</>
            }
          </button>
          <button className="btn btn-sm" onClick={loadNotifications}
            style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)', color: 'var(--gray-600)' }}>
            <i className="bi bi-arrow-clockwise me-1" />Refresh
          </button>
        </div>
      </div>

      {/* ── KPI strip ──────────────────────────────────── */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total',         value: notifications.length,                                      icon: 'bi-bell',                color: 'primary'   },
          { label: 'Unread',        value: totalUnread,                                               icon: 'bi-envelope',            color: 'warning'   },
          { label: 'High Priority', value: notifications.filter(n => n.priority === 'high').length,   icon: 'bi-exclamation-triangle', color: 'danger'    },
          { label: 'Action Needed', value: notifications.filter(n => n.actionRequired).length,        icon: 'bi-lightning-charge',    color: 'info'      },
        ].map(c => (
          <div className="col-6 col-xl-3" key={c.label}>
            <div className="kpi-card d-flex align-items-center gap-3">
              <div className={`kpi-icon bg-${c.color} bg-opacity-10`}>
                <i className={`bi ${c.icon} text-${c.color}`} />
              </div>
              <div>
                <div className="kpi-label">{c.label}</div>
                <div className="kpi-value">{c.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <span className="fw-semibold" style={{ fontSize: 14 }}>
            <i className="bi bi-funnel me-2 text-primary" />Filters
          </span>
          {activeFilters > 0 && (
            <button className="btn btn-sm btn-link text-danger p-0 text-decoration-none" onClick={resetFilters}>
              <i className="bi bi-x-circle me-1" />Clear all
            </button>
          )}
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Type</label>
              <select className="form-select form-select-sm" value={filter.type}
                onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}>
                <option value="all">All Types</option>
                <option value="new_application">New Application</option>
                <option value="application_submitted">Application Submitted</option>
                <option value="application_approved">Application Approved</option>
                <option value="application_rejected">Application Rejected</option>
                <option value="deadline_reminder">Deadline Reminder</option>
                <option value="system_update">System Update</option>
                <option value="user_action">User Action</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Priority</label>
              <select className="form-select form-select-sm" value={filter.priority}
                onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Status</label>
              <select className="form-select form-select-sm" value={filter.status}
                onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                Showing <strong>{filteredNotifications.length}</strong> of <strong>{notifications.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────── */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)} />
        </div>
      )}

      {/* ── Table ──────────────────────────────────────── */}
      <div className="card">
        <div className="table-responsive">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-bell-slash fs-1 text-muted d-block mb-2" />
              <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                {notifications.length === 0 ? 'No notifications yet' : 'No notifications match your filters'}
              </span>
            </div>
          ) : (
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Priority</th>
                  <th>Target</th>
                  <th>When</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map(n => (
                  <tr key={n._id} style={{ background: n.isRead ? undefined : 'rgba(37,99,235,0.04)' }}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <i className={`bi ${TYPE_ICON[n.type] || 'bi-bell'} ${TYPE_COLOR[n.type] || 'text-muted'}`}
                          style={{ fontSize: 18 }} />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>
                            {(n.type || 'notification').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          {n.actionRequired && (
                            <div style={{ fontSize: 11, color: 'var(--warning)' }}>
                              <i className="bi bi-exclamation-triangle me-1" />Action required
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: n.isRead ? 400 : 600, fontSize: 13 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{n.message}</div>
                    </td>
                    <td>
                      <span className={`badge ${PRIORITY_BADGE[n.priority || 'medium'] || 'bg-secondary'}`}
                        style={{ fontSize: 11 }}>
                        {(n.priority || 'medium').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                      {n.targetUserId ? 'User' : 'System'}
                    </td>
                    <td>
                      <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>{relativeTime(n.createdAt)}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${n.isRead ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`}
                        style={{ fontSize: 11 }}>
                        {n.isRead ? 'Read' : 'Unread'}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        {!n.isRead && (
                          <button className="btn btn-outline-primary" onClick={() => markAsRead(n._id)} title="Mark as read">
                            <i className="bi bi-check" />
                          </button>
                        )}
                        <button className="btn btn-outline-danger" onClick={() => setDeleteTarget(n._id)} title="Delete">
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Delete confirmation modal ───────────────────── */}
      {deleteTarget && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,.45)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h6 className="modal-title text-danger">
                  <i className="bi bi-exclamation-triangle me-2" />Delete Notification
                </h6>
                <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} />
              </div>
              <div className="modal-body" style={{ fontSize: 13 }}>
                Are you sure you want to delete this notification? This cannot be undone.
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => deleteNotification(deleteTarget)}>
                  <i className="bi bi-trash me-1" />Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
