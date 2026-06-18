import dataManager from '../data/dataManager';

class DashboardCalculations {
  constructor() {
    this.cache = {
      metrics: null,
      insights: null,
      trends: null,
      lastUpdate: null
    };
  }

  // Get all dashboard data with caching
  getDashboardData() {
    const now = Date.now();
    
    // Cache for 1 second to prevent excessive recalculations
    if (this.cache.lastUpdate && (now - this.cache.lastUpdate) < 1000) {
      return {
        metrics: this.cache.metrics,
        insights: this.cache.insights,
        trends: this.cache.trends,
        systemHealth: dataManager.systemHealth
      };
    }

    const metrics = this.calculateMetrics();
    const insights = this.calculateInsights(metrics);
    const trends = this.calculateTrends();

    // Update cache
    this.cache = {
      metrics,
      insights,
      trends,
      lastUpdate: now
    };

    return {
      metrics,
      insights,
      trends,
      systemHealth: dataManager.updateSystemHealth()
    };
  }

  // Calculate all dashboard metrics
  calculateMetrics() {
    const data = dataManager.getAllData();
    const { applications, users, projects } = data;

    // Basic counts
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    const approvedApplications = applications.filter(app => app.status === 'approved').length;
    const rejectedApplications = applications.filter(app => app.status === 'rejected').length;

    // Approval rate
    const approvalRate = totalApplications > 0 ? 
      Math.round((approvedApplications / totalApplications) * 100) : 0;

    // Project statistics
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const planningProjects = projects.filter(p => p.status === 'planning').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    // User statistics
    const adminUsers = users.filter(u => u.role === 'admin').length;
    const citizenUsers = users.filter(u => u.role === 'citizen').length;
    const activeUsers = users.filter(u => u.status === 'active').length;

    // Time-based calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayApplications = applications.filter(app => 
      new Date(app.submittedDate) >= today
    ).length;

    const thisWeekApplications = applications.filter(app => 
      new Date(app.submittedDate) >= thisWeek
    ).length;

    const thisMonthApplications = applications.filter(app => 
      new Date(app.submittedDate) >= thisMonth
    ).length;

    return {
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      approvalRate,
      totalProjects: projects.length,
      activeProjects,
      planningProjects,
      completedProjects,
      totalUsers: users.length,
      adminUsers,
      citizenUsers,
      activeUsers,
      todayApplications,
      thisWeekApplications,
      thisMonthApplications
    };
  }

  // Calculate smart insights
  calculateInsights(metrics) {
    const data = dataManager.getAllData();
    const { applications, projects } = data;

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Applications pending over 3 days
    const pendingOver3DaysApplications = applications.filter(app => 
      app.status === 'pending' && 
      new Date(app.submittedDate) < threeDaysAgo
    );

    // High demand projects (more than 5 applications)
    const projectDemand = {};
    applications.forEach(app => {
      if (app.projectId) {
        projectDemand[app.projectId] = (projectDemand[app.projectId] || 0) + 1;
      }
    });

    const highDemandProjects = projects
      .filter(project => projectDemand[project.id] > 5)
      .map(project => ({
        ...project,
        applicationCount: projectDemand[project.id] || 0,
        demandLevel: this.getDemandLevel(projectDemand[project.id] || 0)
      }));

    // Low approval rate warning
    const lowApprovalRate = metrics.approvalRate < 40;

    // Urgent applications (pending > 3 days)
    const urgentApplications = pendingOver3DaysApplications.map(app => ({
      ...app,
      daysPending: Math.floor((new Date() - new Date(app.submittedDate)) / (1000 * 60 * 60 * 24))
    }));

    // Critical issues
    const criticalIssues = [];
    
    if (pendingOver3DaysApplications.length > 10) {
      criticalIssues.push({
        type: 'critical',
        message: `${pendingOver3DaysApplications.length} applications pending over 3 days`,
        action: 'Review overdue applications'
      });
    }

    if (metrics.approvalRate < 20) {
      criticalIssues.push({
        type: 'critical',
        message: `Very low approval rate (${metrics.approvalRate}%)`,
        action: 'Review approval criteria'
      });
    }

    return {
      pendingOver3Days: pendingOver3DaysApplications.length,
      highDemandProjects,
      lowApprovalRate,
      urgentApplications,
      criticalIssues,
      totalIssues: criticalIssues.length
    };
  }

  // Calculate trends and comparisons
  calculateTrends() {
    const data = dataManager.getAllData();
    const { applications, users } = data;

    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Application trends
    const thisWeekApps = applications.filter(app => new Date(app.submittedDate) >= lastWeek).length;
    const lastWeekApps = applications.filter(app => {
      const date = new Date(app.submittedDate);
      return date >= twoWeeksAgo && date < lastWeek;
    }).length;

    const thisMonthApps = applications.filter(app => new Date(app.submittedDate) >= lastMonth).length;
    const lastMonthApps = applications.filter(app => {
      const date = new Date(app.submittedDate);
      return date >= twoMonthsAgo && date < lastMonth;
    }).length;

    // User trends
    const thisMonthUsers = users.filter(user => new Date(user.createdAt) >= lastMonth).length;
    const lastMonthUsers = users.filter(user => {
      const date = new Date(user.createdAt);
      return date >= twoMonthsAgo && date < lastMonth;
    }).length;

    // Calculate percentages
    const weeklyChange = {
      applications: lastWeekApps > 0 ? 
        Math.round(((thisWeekApps - lastWeekApps) / lastWeekApps) * 100) : 0,
      users: lastMonthUsers > 0 ? 
        Math.round(((thisMonthUsers - lastMonthUsers) / Math.max(lastMonthUsers, 1)) * 100) : 0
    };

    const monthlyChange = {
      applications: lastMonthApps > 0 ? 
        Math.round(((thisMonthApps - lastMonthApps) / lastMonthApps) * 100) : 0,
      users: lastMonthUsers > 0 ? 
        Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100) : 0
    };

    return {
      weeklyChange,
      monthlyChange,
      thisWeekApps,
      lastWeekApps,
      thisMonthApps,
      lastMonthApps,
      thisMonthUsers,
      lastMonthUsers
    };
  }

  // Get demand level based on application count
  getDemandLevel(count) {
    if (count > 10) return 'Very High';
    if (count > 7) return 'High';
    if (count > 4) return 'Medium';
    return 'Low';
  }

  // Generate chart data for application trends
  getApplicationTrendsChart() {
    const applications = dataManager.getApplications();
    const monthlyData = {};

    applications.forEach(app => {
      const date = new Date(app.submittedDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          label: monthLabel,
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0
        };
      }

      monthlyData[monthKey].total++;
      monthlyData[monthKey][app.status]++;
    });

    const sortedData = Object.values(monthlyData)
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-6); // Last 6 months

    return {
      labels: sortedData.map(d => d.label),
      datasets: [
        {
          label: 'Total Applications',
          data: sortedData.map(d => d.total),
          backgroundColor: 'rgba(37, 99, 235, 0.8)',
          borderColor: 'rgba(37, 99, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Approved',
          data: sortedData.map(d => d.approved),
          backgroundColor: 'rgba(22, 163, 74, 0.8)',
          borderColor: 'rgba(22, 163, 74, 1)',
          borderWidth: 1
        },
        {
          label: 'Pending',
          data: sortedData.map(d => d.pending),
          backgroundColor: 'rgba(217, 119, 6, 0.8)',
          borderColor: 'rgba(217, 119, 6, 1)',
          borderWidth: 1
        },
        {
          label: 'Rejected',
          data: sortedData.map(d => d.rejected),
          backgroundColor: 'rgba(220, 38, 38, 0.8)',
          borderColor: 'rgba(220, 38, 38, 1)',
          borderWidth: 1
        }
      ]
    };
  }

  // Generate status distribution chart data
  getStatusDistributionChart() {
    const metrics = this.calculateMetrics();

    return {
      labels: ['Approved', 'Pending', 'Rejected'],
      datasets: [
        {
          data: [metrics.approvedApplications, metrics.pendingApplications, metrics.rejectedApplications],
          backgroundColor: [
            'rgba(22, 163, 74, 0.8)',
            'rgba(217, 119, 6, 0.8)',
            'rgba(220, 38, 38, 0.8)'
          ],
          borderColor: [
            'rgba(22, 163, 74, 1)',
            'rgba(217, 119, 6, 1)',
            'rgba(220, 38, 38, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  }

  // Get project analysis
  getProjectAnalysis() {
    const projects = dataManager.getProjects();
    const applications = dataManager.getApplications();

    return projects.map(project => {
      const projectApplications = applications.filter(app => app.projectId === project.id);
      const demand = projectApplications.length;
      
      return {
        ...project,
        demand,
        demandLevel: this.getDemandLevel(demand),
        applications: projectApplications,
        approvedApplications: projectApplications.filter(app => app.status === 'approved'),
        utilizationRate: project.totalUnits > 0 ? 
          Math.round((projectApplications.filter(app => app.status === 'approved').length / project.totalUnits) * 100) : 0,
        averageProcessingTime: this.calculateAverageProcessingTime(projectApplications)
      };
    }).sort((a, b) => b.demand - a.demand);
  }

  // Calculate average processing time for applications
  calculateAverageProcessingTime(applications) {
    const processedApps = applications.filter(app => 
      app.status === 'approved' || app.status === 'rejected'
    );

    if (processedApps.length === 0) return 0;

    const totalDays = processedApps.reduce((total, app) => {
      const submittedDate = new Date(app.submittedDate);
      const processedDate = new Date(app.approvedDate || app.rejectedDate || new Date());
      const days = Math.floor((processedDate - submittedDate) / (1000 * 60 * 60 * 24));
      return total + days;
    }, 0);

    return Math.round(totalDays / processedApps.length);
  }

  // Clear cache
  clearCache() {
    this.cache = {
      metrics: null,
      insights: null,
      trends: null,
      lastUpdate: null
    };
  }
}

// Create singleton instance
const dashboardCalculations = new DashboardCalculations();

export default dashboardCalculations;
