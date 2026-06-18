/** Normalize audit log timestamp from MongoDB */
export const getLogTimestamp = (log) => {
  const raw = log?.createdAt || log?.timestamp || log?.date;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatLogDateTime = (log) => {
  const d = getLogTimestamp(log);
  if (!d) return { date: '—', time: '', relative: 'Unknown date' };
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    relative: getRelativeTime(d),
  };
};

export const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatTargetDisplay = (log) => {
  const id = log?.targetId;
  if (!id) return '—';
  const s = String(id);
  if (log.targetType === 'application') {
    return s.length > 8 ? `APP-${s.slice(-6).toUpperCase()}` : s;
  }
  if (log.targetType === 'user') {
    return s.length > 8 ? `USER-${s.slice(-6).toUpperCase()}` : s;
  }
  return s.length > 12 ? `#${s.slice(-8)}` : s;
};

export const getActionConfig = (action) => {
  const a = (action || '').toUpperCase();
  const map = {
    APPLICATION_APPROVED: { color: 'success', icon: 'bi-check-circle-fill', label: 'Approved' },
    APPLICATION_REJECTED: { color: 'danger', icon: 'bi-x-circle-fill', label: 'Rejected' },
    APPLICATION_CREATED: { color: 'primary', icon: 'bi-file-earmark-plus', label: 'Submitted' },
    APPLICATION_UPDATED: { color: 'info', icon: 'bi-pencil', label: 'Updated' },
    APPLICATION_DELETED: { color: 'danger', icon: 'bi-trash', label: 'Deleted' },
    LOGIN: { color: 'info', icon: 'bi-box-arrow-in-right', label: 'Login' },
    LOGOUT: { color: 'secondary', icon: 'bi-box-arrow-right', label: 'Logout' },
    FAILED_LOGIN: { color: 'danger', icon: 'bi-shield-x', label: 'Failed Login' },
    USER_CREATED: { color: 'primary', icon: 'bi-person-plus', label: 'User Created' },
    USER_UPDATED: { color: 'info', icon: 'bi-person-gear', label: 'User Updated' },
    USER_DELETED: { color: 'danger', icon: 'bi-person-x', label: 'User Deleted' },
    USER_DEACTIVATED: { color: 'warning', icon: 'bi-pause-circle', label: 'Deactivated' },
    USER_ACTIVATED: { color: 'success', icon: 'bi-play-circle', label: 'Activated' },
    RESET_PASSWORD: { color: 'warning', icon: 'bi-key', label: 'Reset Password' },
    PROJECT_CREATED: { color: 'primary', icon: 'bi-building-add', label: 'Project Created' },
    PROJECT_UPDATED: { color: 'info', icon: 'bi-building', label: 'Project Updated' },
    DASHBOARD_ACCESS: { color: 'secondary', icon: 'bi-speedometer2', label: 'Dashboard' },
  };
  return (
    map[a] || {
      color: 'secondary',
      icon: 'bi-circle',
      label: a.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    }
  );
};

export const getRoleBadgeClass = (role) => {
  const r = (role || '').toLowerCase();
  if (r === 'admin') return 'bg-danger';
  if (r === 'employee') return 'bg-primary';
  if (r === 'citizen') return 'bg-secondary';
  return 'bg-light text-dark';
};

export const getResultBadge = (log) => {
  const status = (log?.status || 'SUCCESS').toUpperCase();
  if (status === 'FAILED') return { class: 'bg-danger', label: 'Failed' };
  return { class: 'bg-success', label: 'Success' };
};

export const getActivitySummary = (log) => {
  if (log?.details) return log.details;
  const cfg = getActionConfig(log?.action);
  return `${log?.userName || 'User'} — ${cfg.label}`;
};
