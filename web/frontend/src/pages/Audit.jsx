import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { auditLogsAPI } from '../services/apiService';
import {
  formatLogDateTime,
  formatTargetDisplay,
  getActionConfig,
  getRoleBadgeClass,
  getResultBadge,
} from '../utils/auditLogDisplay';

const ACTION_OPTIONS = [
  'APPLICATION_APPROVED',
  'APPLICATION_REJECTED',
  'APPLICATION_CREATED',
  'APPLICATION_UPDATED',
  'LOGIN',
  'FAILED_LOGIN',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DEACTIVATED',
  'RESET_PASSWORD',
];

const Audit = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    approvals: 0,
    rejections: 0,
    logins: 0,
    todayActivities: 0,
    activeAdmins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [logsRes, statsRes] = await Promise.all([
        auditLogsAPI.getAll({ limit: 500 }),
        auditLogsAPI.getStats(),
      ]);
      setAuditLogs(logsRes.data || []);
      setStats({
        totalActivities: 0,
        approvals: 0,
        rejections: 0,
        logins: 0,
        todayActivities: 0,
        activeAdmins: 0,
        ...(statsRes.data || {}),
      });
    } catch (err) {
      setError(err.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return auditLogs.filter((log) => {
      if (q) {
        const hay = [
          log.userName,
          log.role,
          log.action,
          log.details,
          log.targetType,
          log.targetId,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (roleFilter !== 'all' && (log.role || 'admin') !== roleFilter) return false;
      if (statusFilter !== 'all' && (log.status || 'SUCCESS') !== statusFilter) return false;

      if (dateFilter !== 'all') {
        const { relative } = formatLogDateTime(log);
        const d = new Date(log.createdAt || log.timestamp);
        if (dateFilter === 'today' && d < today) return false;
        if (dateFilter === 'week') {
          const weekAgo = new Date(today.getTime() - 7 * 86400000);
          if (d < weekAgo) return false;
        }
        if (dateFilter === 'month') {
          const monthAgo = new Date(today.getTime() - 30 * 86400000);
          if (d < monthAgo) return false;
        }
      }
      return true;
    });
  }, [auditLogs, searchTerm, actionFilter, roleFilter, statusFilter, dateFilter]);

  const sortedLogs = useMemo(
    () =>
      [...filteredLogs].sort(
        (a, b) =>
          new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)
      ),
    [filteredLogs]
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-2 text-muted">Loading audit logs…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Error Loading Audit Logs</h4>
        <p>{error}</p>
        <button type="button" className="btn btn-primary" onClick={loadData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="audit-page">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="mb-1">
            <i className="bi bi-shield-check text-primary me-2" />
            Audit Logs
          </h2>
          <p className="text-muted mb-0">
            Tracking &amp; monitoring — who did what, when, on which record (admin only).
          </p>
        </div>
        <button type="button" className="btn btn-outline-primary" onClick={loadData}>
          <i className="bi bi-arrow-clockwise me-2" />
          Refresh
        </button>
      </div>

      <div className="row g-3 mb-4">
        {[
          { label: 'Total Activities', value: stats.totalActivities ?? stats.total ?? 0, icon: 'bi-clock-history', color: 'primary' },
          { label: 'Approvals', value: stats.approvals ?? 0, icon: 'bi-check-circle', color: 'success' },
          { label: 'Rejections', value: stats.rejections ?? 0, icon: 'bi-x-circle', color: 'danger' },
          { label: 'Logins', value: stats.logins ?? 0, icon: 'bi-box-arrow-in-right', color: 'info' },
          { label: "Today's Activities", value: stats.todayActivities ?? 0, icon: 'bi-calendar-day', color: 'warning' },
          { label: 'Active Admins', value: stats.activeAdmins ?? 0, icon: 'bi-shield-check', color: 'secondary' },
        ].map((card) => (
          <div className="col-6 col-md-4 col-lg-2" key={card.label}>
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center py-3">
                <i className={`bi ${card.icon} text-${card.color} fs-4`} />
                <h4 className="mb-0 fw-bold mt-2">{card.value}</h4>
                <small className="text-muted">{card.label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <h6 className="mb-3">
            <i className="bi bi-funnel me-2" />
            Filters
          </h6>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small text-muted">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="User, action, target..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted">Action</label>
              <select className="form-select" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                <option value="all">All actions</option>
                {ACTION_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted">Role</label>
              <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All roles</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
                <option value="citizen">Citizen</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted">Result</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted">Date</label>
              <select className="form-select" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
              </select>
            </div>
          </div>
          <small className="text-muted mt-2 d-block">
            Showing {sortedLogs.length} of {auditLogs.length} records
          </small>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Result</th>
                  <th>Date</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {sortedLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No audit logs match your filters.
                    </td>
                  </tr>
                ) : (
                  sortedLogs.map((log) => {
                    const actionCfg = getActionConfig(log.action);
                    const dt = formatLogDateTime(log);
                    const result = getResultBadge(log);
                    return (
                      <tr key={log._id}>
                        <td>
                          <div className="fw-semibold">{log.userName}</div>
                          <small className="text-muted">{log.details?.slice(0, 60)}</small>
                        </td>
                        <td>
                          <span className={`badge ${getRoleBadgeClass(log.role)}`}>
                            {(log.role || 'admin').charAt(0).toUpperCase() + (log.role || 'admin').slice(1)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${actionCfg.color}`}>
                            <i className={`bi ${actionCfg.icon} me-1`} />
                            {actionCfg.label}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark me-1">{log.targetType || '—'}</span>
                          <span className="font-monospace small">{formatTargetDisplay(log)}</span>
                        </td>
                        <td>
                          <span className={`badge ${result.class}`}>{result.label}</span>
                        </td>
                        <td>
                          <small className="d-block">{dt.date}</small>
                          <small className="text-muted">{dt.time}</small>
                          <small className="text-primary d-block">{dt.relative}</small>
                        </td>
                        <td>
                          <small className="font-monospace text-muted">{log.ipAddress || '—'}</small>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Audit;
