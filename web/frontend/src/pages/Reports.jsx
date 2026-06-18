import React, { useState, useEffect, useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { applicationsAPI, projectsAPI, usersAPI } from '../services/apiService';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const COLORS = {
  approved: 'rgba(22,163,74,0.85)',
  pending:  'rgba(217,119,6,0.85)',
  rejected: 'rgba(220,38,38,0.85)',
  primary:  'rgba(37,99,235,0.85)',
  info:     'rgba(6,182,212,0.85)',
};

const CHART_PALETTE = [
  'rgba(37,99,235,0.8)',
  'rgba(6,182,212,0.8)',
  'rgba(22,163,74,0.8)',
  'rgba(217,119,6,0.8)',
  'rgba(220,38,38,0.8)',
  'rgba(139,92,246,0.8)',
  'rgba(236,72,153,0.8)',
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Reports = () => {
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedPeriod, setSelectedPeriod]   = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedCity, setSelectedCity]       = useState('all');
  const [selectedStatus, setSelectedStatus]   = useState('all');
  const [rawData, setRawData] = useState({ users: [], projects: [], applications: [] });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, projectsRes, appsRes] = await Promise.all([
        usersAPI.getAll({ limit: 500 }),
        projectsAPI.getAll({ limit: 1000 }),
        applicationsAPI.getAll({ limit: 500 }),
      ]);
      setRawData({
        users:        usersRes.data        || [],
        projects:     projectsRes.data     || [],
        applications: appsRes.data         || [],
      });
    } catch {
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── helpers ─────────────────────────────────────────────
  const cityOf = (proj) => {
    if (typeof proj.location === 'string') return proj.location.split(',')[0].trim();
    return proj.location?.city || 'Unknown';
  };

  const submittedDate = (app) =>
    new Date(app.createdAt || app.submittedAt || app.submittedDate);

  // ── unique filter options ────────────────────────────────
  const uniqueCities = useMemo(() =>
    [...new Set(rawData.projects.map(cityOf).filter(c => c !== 'Unknown'))].sort(),
  [rawData.projects]);

  // ── filtered slices ─────────────────────────────────────
  const { filteredApps, filteredProjects } = useMemo(() => {
    let apps     = [...rawData.applications];
    let projects = [...rawData.projects];

    if (selectedStatus !== 'all')
      apps = apps.filter(a => a.status === selectedStatus);

    if (selectedProject !== 'all')
      apps = apps.filter(a => String(a.projectId) === String(selectedProject));

    if (selectedCity !== 'all') {
      projects = projects.filter(p => cityOf(p) === selectedCity);
      const ids = new Set(projects.map(p => String(p._id || p.id)));
      apps = apps.filter(a => ids.has(String(a.projectId)));
    }

    if (selectedPeriod !== 'all') {
      const now = Date.now();
      const days = { '7days': 7, '30days': 30, '90days': 90 }[selectedPeriod];
      if (days) {
        const cutoff = now - days * 86400000;
        apps = apps.filter(a => submittedDate(a).getTime() >= cutoff);
      }
    }

    return { filteredApps: apps, filteredProjects: projects };
  }, [rawData, selectedStatus, selectedProject, selectedCity, selectedPeriod]);

  // ── KPI calculations ────────────────────────────────────
  const kpis = useMemo(() => {
    const apps     = filteredApps;
    const projects = filteredProjects;
    const all      = rawData.applications;

    const approved  = apps.filter(a => a.status === 'approved').length;
    const pending   = apps.filter(a => a.status === 'pending').length;
    const rejected  = apps.filter(a => a.status === 'rejected').length;
    const total     = apps.length;
    const rate      = total > 0 ? Math.round((approved / total) * 100) : 0;

    const activeProjects    = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    // Avg approval time
    const decided = all.filter(a => (a.status === 'approved' || a.status === 'rejected') && a.reviewedAt);
    const avgDays = decided.length > 0
      ? (decided.reduce((s, a) => {
          const d = (new Date(a.reviewedAt) - submittedDate(a)) / 86400000;
          return s + Math.max(0, Math.floor(d));
        }, 0) / decided.length).toFixed(1)
      : '—';

    // Most requested project
    const projectCounts = {};
    all.forEach(a => {
      const proj = rawData.projects.find(p => String(p._id || p.id) === String(a.projectId));
      if (proj) projectCounts[proj.name] = (projectCounts[proj.name] || 0) + 1;
    });
    const topProject = Object.keys(projectCounts).length
      ? Object.entries(projectCounts).sort((a,b) => b[1]-a[1])[0][0] : 'N/A';

    // Approvals this month
    const now = new Date();
    const monthlyApprovals = all.filter(a => {
      if (a.status !== 'approved' || !a.reviewedAt) return false;
      const d = new Date(a.reviewedAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return {
      total, approved, pending, rejected, rate,
      totalProjects: projects.length, activeProjects, completedProjects,
      totalUsers: rawData.users.length,
      avgDays, topProject, monthlyApprovals,
    };
  }, [filteredApps, filteredProjects, rawData]);

  // ── chart datasets (all follow filters) ─────────────────
  const statusDoughnutData = useMemo(() => ({
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [{
      data: [kpis.approved, kpis.pending, kpis.rejected],
      backgroundColor: [COLORS.approved, COLORS.pending, COLORS.rejected],
      borderWidth: 0,
    }],
  }), [kpis]);

  const monthlyBarData = useMemo(() => {
    const counts = {};
    MONTHS.forEach(m => { counts[m] = 0; });
    filteredApps.forEach(a => {
      const m = submittedDate(a).toLocaleDateString('en-US', { month: 'short' });
      if (counts[m] !== undefined) counts[m]++;
    });
    return {
      labels: MONTHS,
      datasets: [{
        label: 'Applications',
        data: MONTHS.map(m => counts[m]),
        backgroundColor: COLORS.primary,
        borderRadius: 4,
      }],
    };
  }, [filteredApps]);

  const cityBarData = useMemo(() => {
    const counts = {};
    filteredProjects.forEach(p => {
      const c = cityOf(p);
      counts[c] = (counts[c] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 8);
    return {
      labels: sorted.map(([c]) => c),
      datasets: [{
        label: 'Projects',
        data: sorted.map(([,n]) => n),
        backgroundColor: sorted.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
        borderRadius: 4,
      }],
    };
  }, [filteredProjects]);

  const projectDemandData = useMemo(() => {
    const counts = {};
    filteredApps.forEach(a => {
      const proj = rawData.projects.find(p => String(p._id || p.id) === String(a.projectId));
      if (proj) counts[proj.name] = (counts[proj.name] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 8);
    return {
      labels: sorted.map(([n]) => n.length > 20 ? n.slice(0, 18) + '…' : n),
      datasets: [{
        label: 'Applications',
        data: sorted.map(([,n]) => n),
        backgroundColor: COLORS.info,
        borderRadius: 4,
      }],
    };
  }, [filteredApps, rawData.projects]);

  // ── chart options ────────────────────────────────────────
  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 12 }, boxWidth: 12, padding: 16 } },
      tooltip: { callbacks: {
        label: ctx => ` ${ctx.label}: ${ctx.parsed} (${kpis.total > 0 ? Math.round(ctx.parsed/kpis.total*100) : 0}%)`,
      }},
    },
  };

  const barOpts = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#f1f5f9' }, ticks: { precision: 0, font: { size: 11 } }, beginAtZero: true },
    },
  });

  const hBarOpts = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { precision: 0, font: { size: 11 } }, beginAtZero: true },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  // ── export ───────────────────────────────────────────────
  const exportCSV = (type) => {
    try {
      let headers, rows, filename;
      if (type === 'applications') {
        headers = ['ID', 'Applicant', 'Project', 'Status', 'Submitted'];
        rows = filteredApps.map(a => {
          const user = rawData.users.find(u => u.email === a.email || u.nationalId === a.nationalId);
          const proj = rawData.projects.find(p => p._id === a.projectId);
          return [a._id, user?.name || a.name || 'Unknown', proj?.name || a.projectName || 'Unknown', a.status, new Date(a.createdAt).toLocaleDateString()];
        });
        filename = `applications-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        headers = ['Project', 'City', 'Total Units', 'Available', 'Status'];
        rows = filteredProjects.map(p => [
          p.name, cityOf(p), p.totalUnits || 0, p.availableUnits || 0, p.status || 'Unknown',
        ]);
        filename = `projects-${new Date().toISOString().split('T')[0]}.csv`;
      }
      const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
      Object.assign(document.createElement('a'), { href: url, download: filename }).click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed. Please try again.');
    }
  };

  // ── render helpers ───────────────────────────────────────
  const activeFilters = [selectedPeriod, selectedProject, selectedCity, selectedStatus].filter(v => v !== 'all').length;

  const resetFilters = () => {
    setSelectedPeriod('all');
    setSelectedProject('all');
    setSelectedCity('all');
    setSelectedStatus('all');
  };

  // ── loading / error ──────────────────────────────────────
  if (loading) return (
    <div className="page-loading" style={{ minHeight: 300 }}>
      <div className="spinner-border text-primary" role="status" />
      <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>Loading analytics…</span>
    </div>
  );

  if (error) return (
    <div className="alert alert-danger d-flex align-items-start gap-3 m-4">
      <i className="bi bi-exclamation-triangle-fill fs-5 mt-1" />
      <div>
        <strong>Error loading reports</strong>
        <p className="mb-2 mt-1">{error}</p>
        <button className="btn btn-sm btn-danger" onClick={loadData}>
          <i className="bi bi-arrow-clockwise me-1" />Retry
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* ── Page header ─────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h2>Reports & Analytics</h2>
          <p style={{ color: 'var(--gray-400)', margin: 0, fontSize: 13 }}>
            Real-time performance monitoring across all data
            {activeFilters > 0 && (
              <span className="badge bg-primary ms-2" style={{ fontSize: 11 }}>
                {activeFilters} filter{activeFilters > 1 ? 's' : ''} active
              </span>
            )}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => exportCSV('applications')}>
            <i className="bi bi-download me-1" />Export Applications
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => exportCSV('projects')}>
            <i className="bi bi-download me-1" />Export Projects
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => window.print()}>
            <i className="bi bi-printer me-1" />Print
          </button>
          <button className="btn btn-sm" onClick={loadData}
            style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)', color: 'var(--gray-600)' }}>
            <i className="bi bi-arrow-clockwise me-1" />Refresh
          </button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
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
              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Date Range</label>
              <select className="form-select form-select-sm" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Project</label>
              <select className="form-select form-select-sm" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
                <option value="all">All Projects</option>
                {rawData.projects.map(p => (
                  <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>City / Governorate</label>
              <select className="form-select form-select-sm" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                <option value="all">All Cities</option>
                {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Application Status</label>
              <select className="form-select form-select-sm" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Cards (8 in 2×4 grid) ───────────────────── */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Applications',  value: kpis.total,             sub: `${kpis.rate}% approval rate`, icon: 'bi-file-earmark-text', color: 'primary' },
          { label: 'Approved',            value: kpis.approved,          sub: 'Applications approved',       icon: 'bi-check-circle',      color: 'success' },
          { label: 'Pending',             value: kpis.pending,           sub: 'Awaiting review',             icon: 'bi-clock-history',     color: 'warning' },
          { label: 'Rejected',            value: kpis.rejected,          sub: 'Not eligible',                icon: 'bi-x-circle',          color: 'danger'  },
          { label: 'Total Projects',      value: kpis.totalProjects,     sub: 'Housing projects',            icon: 'bi-building',          color: 'info'    },
          { label: 'Active Projects',     value: kpis.activeProjects,    sub: 'Under construction',          icon: 'bi-hammer',            color: 'success' },
          { label: 'Completed Projects',  value: kpis.completedProjects, sub: 'Fully delivered',             icon: 'bi-building-check',    color: 'primary' },
          { label: 'Registered Users',    value: kpis.totalUsers,        sub: 'Total registered users',      icon: 'bi-people',            color: 'secondary'},
        ].map(c => (
          <div className="col-6 col-xl-3" key={c.label}>
            <div className="kpi-card d-flex align-items-center gap-3">
              <div className={`kpi-icon bg-${c.color} bg-opacity-10`}>
                <i className={`bi ${c.icon} text-${c.color}`} />
              </div>
              <div>
                <div className="kpi-label">{c.label}</div>
                <div className="kpi-value">{c.value}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{c.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Performance highlight strip ──────────────────── */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="row text-center g-0" style={{ divider: '1px solid var(--gray-100)' }}>
            {[
              { label: 'Avg. Approval Time', value: `${kpis.avgDays} days`, icon: 'bi-stopwatch',     color: 'primary' },
              { label: 'Most Requested',     value: kpis.topProject,        icon: 'bi-trophy',         color: 'warning' },
              { label: 'Approvals This Month', value: kpis.monthlyApprovals, icon: 'bi-calendar-check', color: 'success' },
              { label: 'Approval Rate',      value: `${kpis.rate}%`,        icon: 'bi-percent',        color: 'info'    },
            ].map((m, i) => (
              <div key={m.label} className="col-6 col-md-3" style={{ borderRight: i < 3 ? '1px solid var(--gray-100)' : 'none' }}>
                <div className="py-2 px-3">
                  <i className={`bi ${m.icon} text-${m.color} mb-1 d-block`} style={{ fontSize: 22 }} />
                  <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--gray-900)' }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{m.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts row 1: Doughnut + Monthly Bar ─────────── */}
      <div className="row g-3 mb-4">
        <div className="col-xl-4">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span className="fw-semibold" style={{ fontSize: 14 }}>
                <i className="bi bi-pie-chart text-primary me-2" />Status Distribution
              </span>
              <span className="badge bg-primary bg-opacity-10 text-primary" style={{ fontSize: 11 }}>
                {kpis.total} total
              </span>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center" style={{ height: 280 }}>
              {kpis.total > 0 ? (
                <Doughnut data={statusDoughnutData} options={doughnutOpts} />
              ) : (
                <div className="text-center text-muted">
                  <i className="bi bi-pie-chart fs-1 d-block mb-2" />
                  <span style={{ fontSize: 13 }}>No data for selected filters</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-8">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span className="fw-semibold" style={{ fontSize: 14 }}>
                <i className="bi bi-bar-chart text-primary me-2" />Applications per Month
              </span>
              <span className="badge bg-primary bg-opacity-10 text-primary" style={{ fontSize: 11 }}>
                {new Date().getFullYear()}
              </span>
            </div>
            <div className="card-body" style={{ height: 280 }}>
              <Bar data={monthlyBarData} options={barOpts()} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts row 2: City + Project Demand ──────────── */}
      <div className="row g-3 mb-4">
        <div className="col-xl-6">
          <div className="card h-100">
            <div className="card-header">
              <span className="fw-semibold" style={{ fontSize: 14 }}>
                <i className="bi bi-geo-alt text-primary me-2" />Projects by City
              </span>
            </div>
            <div className="card-body" style={{ height: 280 }}>
              {cityBarData.labels.length > 0 ? (
                <Bar data={cityBarData} options={hBarOpts} />
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-geo-alt fs-1 d-block mb-2" />
                  <span style={{ fontSize: 13 }}>No project data</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-6">
          <div className="card h-100">
            <div className="card-header">
              <span className="fw-semibold" style={{ fontSize: 14 }}>
                <i className="bi bi-trophy text-warning me-2" />Top Projects by Demand
              </span>
            </div>
            <div className="card-body" style={{ height: 280 }}>
              {projectDemandData.labels.length > 0 ? (
                <Bar data={projectDemandData} options={hBarOpts} />
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-building fs-1 d-block mb-2" />
                  <span style={{ fontSize: 13 }}>No application–project data</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail tables ────────────────────────────────── */}
      <div className="row g-3">
        <div className="col-xl-6">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span className="fw-semibold" style={{ fontSize: 14 }}>
                <i className="bi bi-file-earmark-text text-primary me-2" />Applications
                <span className="badge bg-secondary ms-2" style={{ fontSize: 11 }}>{filteredApps.length}</span>
              </span>
              <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: 11 }} onClick={() => exportCSV('applications')}>
                <i className="bi bi-download me-1" />CSV
              </button>
            </div>
            <div className="table-responsive">
              {filteredApps.length > 0 ? (
                <table className="table table-hover table-sm mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Applicant</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.slice(0, 50).map(app => {
                      const user = rawData.users.find(u => u.email === app.email || u.nationalId === app.nationalId);
                      const proj = rawData.projects.find(p => p._id === app.projectId);
                      return (
                        <tr key={app._id}>
                          <td><small className="font-monospace text-muted">{app._id?.slice(-6)}</small></td>
                          <td style={{ fontSize: 13 }}>{user?.name || app.name || 'Unknown'}</td>
                          <td style={{ fontSize: 13 }}>{proj?.name || app.projectName || '—'}</td>
                          <td>
                            <span className={`badge bg-${app.status === 'approved' ? 'success' : app.status === 'pending' ? 'warning' : 'danger'}`}
                              style={{ fontSize: 11 }}>
                              {app.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                            {submittedDate(app).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-inbox fs-2 text-muted d-block mb-2" />
                  <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>No applications match the current filters</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-6">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span className="fw-semibold" style={{ fontSize: 14 }}>
                <i className="bi bi-building text-primary me-2" />Projects
                <span className="badge bg-secondary ms-2" style={{ fontSize: 11 }}>{filteredProjects.length}</span>
              </span>
              <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: 11 }} onClick={() => exportCSV('projects')}>
                <i className="bi bi-download me-1" />CSV
              </button>
            </div>
            <div className="table-responsive">
              {filteredProjects.length > 0 ? (
                <table className="table table-hover table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>City</th>
                      <th>Available</th>
                      <th>Sold</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.slice(0, 50).map(proj => {
                      const sold = Math.max(0, (proj.totalUnits || 0) - (proj.availableUnits || 0));
                      return (
                        <tr key={proj._id}>
                          <td style={{ fontSize: 13, fontWeight: 500 }}>{proj.name}</td>
                          <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{cityOf(proj)}</td>
                          <td style={{ fontSize: 13 }}>{proj.availableUnits ?? '—'}</td>
                          <td style={{ fontSize: 13 }}>{sold}</td>
                          <td>
                            <span className={`badge bg-${proj.status === 'active' ? 'success' : proj.status === 'completed' ? 'primary' : 'warning'}`}
                              style={{ fontSize: 11 }}>
                              {proj.status || 'Unknown'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-building fs-2 text-muted d-block mb-2" />
                  <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>No projects match the current filters</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
