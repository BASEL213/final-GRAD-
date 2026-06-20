import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { useAuth } from '../context/AuthContext';
import apiDataManager from '../data/apiDataManager';
import { applicationsAPI, auditLogsAPI } from '../services/apiService';
import { enrichApplications } from '../utils/projectLink';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const CHART_COLORS = {
  primary:  'rgba(37, 99, 235, 0.85)',
  success:  'rgba(22, 163, 74, 0.85)',
  warning:  'rgba(217, 119, 6, 0.85)',
  danger:   'rgba(220, 38, 38, 0.85)',
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 10 } } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, precision: 0 } },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 10, padding: 16 } },
  },
};

const daysBetween = (dateA, dateB) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round(Math.abs(new Date(dateB) - new Date(dateA)) / msPerDay);
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isInitialLoad = useRef(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [dashboardData, setDashboardData] = useState({
    metrics: null,
    insights: null,
    trends: null,
    systemHealth: null,
  });
  const [actionLoading, setActionLoading] = useState({});
  const [recentApplications, setRecentApplications] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [monthlyChartData, setMonthlyChartData] = useState({ labels: [], datasets: [] });
  const [avgDecisionDays, setAvgDecisionDays] = useState(null);

  const loadDashboardData = useCallback(async (options = {}) => {
    const showFullLoader = options.showFullLoader ?? isInitialLoad.current;
    try {
      if (showFullLoader) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const [metrics, insights, trends] = await Promise.all([
        apiDataManager.getDashboardMetrics(),
        apiDataManager.getSmartInsights(),
        apiDataManager.getTrendCalculations(),
      ]);

      const monthlyData = await apiDataManager.getApplicationTrends();
      setMonthlyChartData({
        labels: monthlyData.map(t => {
          const d = new Date(t.month + '-01');
          return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }),
        datasets: [
          { label: 'Total',    data: monthlyData.map(t => t.total),    backgroundColor: CHART_COLORS.primary  },
          { label: 'Approved', data: monthlyData.map(t => t.approved), backgroundColor: CHART_COLORS.success  },
          { label: 'Pending',  data: monthlyData.map(t => t.pending),  backgroundColor: CHART_COLORS.warning  },
          { label: 'Rejected', data: monthlyData.map(t => t.rejected), backgroundColor: CHART_COLORS.danger   },
        ],
      });

      setDashboardData({ metrics, insights, trends, systemHealth: null });
      setLastUpdate(new Date());
    } catch {
      setError('Unable to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isInitialLoad.current = false;
    }
  }, []);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const [recentRes, projectsRes] = await Promise.all([
          applicationsAPI.getRecent(20),
          apiDataManager.getProjects(),
        ]);
        // Enrich but do NOT filter by project linkage — unlinked apps are still real
        const all = enrichApplications(recentRes.data || [], projectsRes);

        setRecentApplications(all.slice(0, 4));

        // Oldest pending first for the "Needs Action" table
        const pending = all
          .filter(a => a.status === 'pending')
          .sort((a, b) => new Date(a.submittedDate) - new Date(b.submittedDate))
          .slice(0, 5);
        setPendingApplications(pending);

        // Avg days to decision from decided applications
        const decided = all.filter(a => a.status === 'approved' || a.status === 'rejected');
        if (decided.length > 0) {
          const totalDays = decided.reduce((sum, a) => {
            const decisionDate = a.updatedAt || a.reviewedDate || new Date();
            return sum + daysBetween(a.submittedDate, decisionDate);
          }, 0);
          setAvgDecisionDays(Math.round(totalDays / decided.length));
        }
      } catch {
        setRecentApplications([]);
        setPendingApplications([]);
      }
    };
    loadApplications();
  }, [dashboardData]);

  useEffect(() => {
    loadDashboardData();
    const unsubscribe = apiDataManager.subscribe((data) => {
      if (data.type && data.type !== 'dashboard_loaded') {
        loadDashboardData({ showFullLoader: false });
      }
    });
    const refresh = setInterval(() => loadDashboardData({ showFullLoader: false }), 30000);
    return () => { unsubscribe(); clearInterval(refresh); };
  }, [loadDashboardData]);

  const handleApproveApplication = async (appId) => {
    try {
      setActionLoading(prev => ({ ...prev, [appId]: 'approving' }));
      const success = await apiDataManager.approveApplication(appId);
      if (success) loadDashboardData({ showFullLoader: false });
    } catch {
      // silent
    } finally {
      setActionLoading(prev => ({ ...prev, [appId]: null }));
    }
  };

  const handleRejectApplication = async (appId) => {
    try {
      setActionLoading(prev => ({ ...prev, [appId]: 'rejecting' }));
      const success = await apiDataManager.rejectApplication(appId, 'Rejected by admin');
      if (success) loadDashboardData({ showFullLoader: false });
    } catch {
      // silent
    } finally {
      setActionLoading(prev => ({ ...prev, [appId]: null }));
    }
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => ({
    approved: 'bg-success',
    pending:  'bg-warning text-dark',
    rejected: 'bg-danger',
  }[status] || 'bg-secondary');

  const statusChartData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [{
      data: [
        dashboardData.metrics?.approvedApplications || 0,
        dashboardData.metrics?.pendingApplications  || 0,
        dashboardData.metrics?.rejectedApplications || 0,
      ],
      backgroundColor: [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger],
      borderWidth: 0,
    }],
  };

  const m = dashboardData.metrics;

  if (loading && !m) {
    return (
      <div className="page-loading">
        <div className="spinner-border text-primary" role="status" />
        <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>Loading dashboard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex align-items-start gap-3">
        <i className="bi bi-exclamation-triangle-fill fs-5 mt-1"></i>
        <div>
          <strong>Failed to load dashboard</strong>
          <p className="mb-2 mt-1">{error}</p>
          <button className="btn btn-sm btn-danger" onClick={loadDashboardData}>
            <i className="bi bi-arrow-clockwise me-1"></i>Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Refresh indicator */}
      {refreshing && (
        <div className="position-fixed d-flex align-items-center gap-2"
          style={{ top: 16, right: 24, zIndex: 200, background: '#fff', border: '1px solid var(--gray-200)',
            borderRadius: 8, padding: '6px 14px', boxShadow: 'var(--shadow-md)', fontSize: 12, color: 'var(--gray-600)' }}>
          <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span>
          Updating…
        </div>
      )}

      {/* Page header */}
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p style={{ color: 'var(--gray-400)', margin: 0, fontSize: 13 }}>
            Welcome back, <strong>{user?.name || 'Admin'}</strong> — Last updated {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <button
          className="btn btn-sm"
          onClick={() => loadDashboardData({ showFullLoader: false })}
          disabled={loading || refreshing}
          style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)', color: 'var(--gray-600)' }}
        >
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {/* Smart Insights */}
      {dashboardData.insights && (
        dashboardData.insights.pendingOver3Days > 0 || dashboardData.insights.highDemandProjects?.length > 0 || dashboardData.insights.lowApprovalRate
      ) && (
        <div className="mb-4">
          <div className="row g-2">
            {dashboardData.insights.pendingOver3Days > 0 && (
              <div className="col-md-4">
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" style={{ fontSize: 13 }}>
                  <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                  <span><strong>{dashboardData.insights.pendingOver3Days}</strong> applications pending over 3 days</span>
                </div>
              </div>
            )}
            {dashboardData.insights.highDemandProjects?.length > 0 && (
              <div className="col-md-4">
                <div className="alert alert-warning d-flex align-items-center gap-2 mb-0" style={{ fontSize: 13 }}>
                  <i className="bi bi-graph-up flex-shrink-0"></i>
                  <span><strong>{dashboardData.insights.highDemandProjects.length}</strong> high-demand projects</span>
                </div>
              </div>
            )}
            {dashboardData.insights.lowApprovalRate && (
              <div className="col-md-4">
                <div className="alert alert-warning d-flex align-items-center gap-2 mb-0" style={{ fontSize: 13 }}>
                  <i className="bi bi-percent flex-shrink-0"></i>
                  <span>Low approval rate: <strong>{m?.approvalRate}%</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        {[
          {
            label: 'Total Applications',
            value: m?.totalApplications || 0,
            sub: `${m?.pendingApplications || 0} pending`,
            icon: 'bi-file-earmark-text',
            color: 'primary',
          },
          {
            label: 'Approved',
            value: m?.approvedApplications || 0,
            sub: `${m?.approvalRate || 0}% approval rate`,
            icon: 'bi-check-circle',
            color: 'success',
          },
          {
            label: 'Active Projects',
            value: m?.activeProjects || 0,
            sub: `${m?.totalProjects || 0} total projects`,
            icon: 'bi-building',
            color: 'info',
          },
          {
            label: 'Total Users',
            value: m?.totalUsers || 0,
            sub: 'Total registered users',
            icon: 'bi-people',
            color: 'warning',
          },
          {
            label: 'Avg. Decision Time',
            value: avgDecisionDays !== null ? `${avgDecisionDays}d` : '—',
            sub: 'From submission to decision',
            icon: 'bi-clock-history',
            color: 'secondary',
          },
        ].map(card => (
          <div className="col-6 col-xl" key={card.label}>
            <div className="kpi-card d-flex align-items-center gap-3">
              <div className={`kpi-icon bg-${card.color} bg-opacity-10`}>
                <i className={`bi ${card.icon} text-${card.color}`}></i>
              </div>
              <div>
                <div className="kpi-label">{card.label}</div>
                <div className="kpi-value">{card.value}</div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{card.sub}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-3 mb-4">
        <div className="col-xl-8">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span className="fw-semibold" style={{ fontSize: 14 }}>Application Trends</span>
              <span className="badge bg-primary bg-opacity-10 text-primary" style={{ fontSize: 11 }}>
                Last 6 months
              </span>
            </div>
            <div className="card-body" style={{ height: 260 }}>
              {monthlyChartData.labels.length > 0 ? (
                <Bar data={monthlyChartData} options={barOptions} />
              ) : (
                <div className="page-loading h-100">
                  <i className="bi bi-bar-chart fs-1 text-muted"></i>
                  <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>No trend data yet</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-xl-4">
          <div className="card h-100">
            <div className="card-header">
              <span className="fw-semibold" style={{ fontSize: 14 }}>Status Distribution</span>
            </div>
            <div className="card-body" style={{ height: 260 }}>
              {(m?.totalApplications || 0) > 0 ? (
                <Doughnut data={statusChartData} options={doughnutOptions} />
              ) : (
                <div className="page-loading h-100">
                  <i className="bi bi-pie-chart fs-1 text-muted"></i>
                  <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>No applications yet</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications — full width */}
      <div className="card mb-4">
        <div className="card-header d-flex align-items-center justify-content-between">
          <span className="fw-semibold" style={{ fontSize: 14 }}>Recent Applications</span>
          <Link to="/applications" className="btn btn-sm btn-outline-primary" style={{ fontSize: 12 }}>
            View All
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Project</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.length > 0 ? recentApplications.map(app => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{app.applicantName || 'Unknown'}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                      #{app.id?.toString().slice(-6) || 'N/A'}
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{app.projectName || '—'}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(app.status)}`}>{app.status}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {formatDate(app.submittedDate)}
                  </td>
                  <td>
                    {app.status === 'pending' && (
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-success btn-sm"
                          onClick={() => handleApproveApplication(app.id)}
                          disabled={!!actionLoading[app.id]}>
                          {actionLoading[app.id] === 'approving'
                            ? <span className="spinner-border spinner-border-sm" />
                            : <i className="bi bi-check"></i>}
                        </button>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => handleRejectApplication(app.id)}
                          disabled={!!actionLoading[app.id]}>
                          {actionLoading[app.id] === 'rejecting'
                            ? <span className="spinner-border spinner-border-sm" />
                            : <i className="bi bi-x"></i>}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <i className="bi bi-inbox fs-2 text-muted d-block mb-2"></i>
                    <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>No recent applications</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Applications — Needs Action */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-semibold" style={{ fontSize: 14 }}>Pending Applications — Needs Action</span>
            {pendingApplications.length > 0 && (
              <span className="badge bg-danger" style={{ fontSize: 11 }}>
                {pendingApplications.length} waiting
              </span>
            )}
          </div>
          <Link
            to="/applications?status=pending"
            className="btn btn-sm btn-outline-danger"
            style={{ fontSize: 12 }}
          >
            View All Pending
          </Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Project</th>
                <th>Days Waiting</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingApplications.length > 0 ? pendingApplications.map(app => {
                const daysWaiting = app.submittedDate
                  ? daysBetween(app.submittedDate, new Date())
                  : 0;
                const isUrgent = daysWaiting >= 3;
                return (
                  <tr key={app.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{app.applicantName || 'Unknown'}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                        #{app.id?.toString().slice(-6) || 'N/A'}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{app.projectName || '—'}</td>
                    <td>
                      <span
                        className={`badge ${isUrgent ? 'bg-danger' : 'bg-warning text-dark'}`}
                        style={{ fontSize: 11 }}
                      >
                        {daysWaiting}d
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                      {formatDate(app.submittedDate)}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApproveApplication(app.id)}
                          disabled={!!actionLoading[app.id]}
                        >
                          {actionLoading[app.id] === 'approving'
                            ? <span className="spinner-border spinner-border-sm" />
                            : <><i className="bi bi-check me-1"></i>Approve</>}
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleRejectApplication(app.id)}
                          disabled={!!actionLoading[app.id]}
                        >
                          {actionLoading[app.id] === 'rejecting'
                            ? <span className="spinner-border spinner-border-sm" />
                            : <><i className="bi bi-x me-1"></i>Reject</>}
                        </button>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => navigate(`/applications/${app.id}`)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <i className="bi bi-check-circle fs-2 text-success d-block mb-2"></i>
                    <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
                      No pending applications — all caught up!
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
