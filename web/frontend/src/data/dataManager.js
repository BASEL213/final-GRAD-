import initialData from '../../data.json';

class DataManager {
  constructor() {
    this.data = {
      users: [],
      projects: [],
      applications: [],
      auditLogs: [],
      notifications: []
    };
    this.listeners = [];
    this.systemHealth = {
      apiResponseTime: 'Fast',
      databaseStatus: 'Connected',
      storageUsage: 78,
      lastBackup: new Date().toISOString()
    };
    this.initializeData();
  }

  // Initialize data from JSON file
  initializeData() {
    try {
      // Load initial data from JSON
      this.data.users = [...initialData.users];
      this.data.projects = [...initialData.projects];
      this.data.applications = [...initialData.applications];
      this.data.auditLogs = [...initialData.auditLogs];
      this.data.notifications = [...initialData.notifications];

      // Ensure all applications have proper dates
      this.data.applications = this.data.applications.map(app => ({
        ...app,
        submittedDate: app.submittedDate || app.createdAt || new Date().toISOString(),
        status: app.status || 'pending'
      }));

      // Generate initial audit logs if none exist
      if (this.data.auditLogs.length === 0) {
        this.generateInitialAuditLogs();
      }

      this.notifyListeners();
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }

  // Subscribe to data changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of data changes
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.data));
  }

  // Get all data
  getAllData() {
    return { ...this.data };
  }

  // Get users
  getUsers() {
    return [...this.data.users];
  }

  // Get projects
  getProjects() {
    return [...this.data.projects];
  }

  // Get applications with enriched data
  getApplications() {
    const applications = [...this.data.applications];
    const users = this.data.users;
    const projects = this.data.projects;

    return applications.map(app => {
      const user = users.find(u => u.id === app.userId);
      const project = projects.find(p => p.id === app.projectId);
      
      return {
        ...app,
        applicantName: user ? user.name : 'Unknown User',
        projectName: project ? project.name : 'Unknown Project',
        submittedDate: app.submittedAt || app.createdAt || new Date().toISOString()
      };
    });
  }

  // Get application by ID with enriched data
  getApplicationById(id) {
    const application = this.data.applications.find(app => 
      app.id === id || app._id === id
    );
    
    if (!application) {
      return null;
    }
    
    const user = this.data.users.find(u => u.id === application.userId);
    const project = this.data.projects.find(p => p.id === application.projectId);
    
    return {
      ...application,
      applicantName: user ? user.name : 'Unknown User',
      projectName: project ? project.name : 'Unknown Project',
      submittedDate: application.submittedAt || application.createdAt || new Date().toISOString()
    };
  }

  // Update application status and create audit log
  updateApplicationStatus(applicationId, newStatus, reason = '') {
    const application = this.data.applications.find(app => 
      app.id === applicationId || app._id === applicationId
    );
    
    if (!application) {
      throw new Error(`Application with ID ${applicationId} not found`);
    }
    
    const oldStatus = application.status;
    application.status = newStatus;
    
    // Add rejection reason if provided
    if (reason && newStatus === 'rejected') {
      application.rejectionReason = reason;
    }
    
    // Create audit log entry
    const auditLog = {
      id: `audit_${Date.now()}`,
      action: `application_${newStatus}`,
      details: `Application ${applicationId} ${newStatus}${reason ? ` - Reason: ${reason}` : ''}`,
      timestamp: new Date().toISOString(),
      userId: 'admin', // This should come from the current user context
      userName: 'Admin', // This should come from the current user context
      applicationId: applicationId,
      oldStatus: oldStatus,
      newStatus: newStatus
    };
    
    this.data.auditLogs.push(auditLog);
    
    // Notify listeners of the change
    this.notifyListeners('application_updated', application);
    
    return application;
  }

  // Get audit logs
  getAuditLogs() {
    return [...this.data.auditLogs].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  // Calculate dashboard metrics dynamically
  getDashboardMetrics() {
    const applications = this.data.applications;
    const users = this.data.users;
    const projects = this.data.projects;

    const totalApplications = applications.length;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    const approvedApplications = applications.filter(app => app.status === 'approved').length;
    const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
    
    const approvalRate = totalApplications > 0 ? 
      Math.round((approvedApplications / totalApplications) * 100) : 0;

    const activeProjects = projects.filter(p => p.status === 'active').length;
    const planningProjects = projects.filter(p => p.status === 'planning').length;

    const adminUsers = users.filter(u => u.role === 'admin').length;
    const citizenUsers = users.filter(u => u.role === 'citizen').length;

    return {
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      approvalRate,
      totalProjects: projects.length,
      activeProjects,
      planningProjects,
      totalUsers: users.length,
      adminUsers,
      citizenUsers
    };
  }

  // Calculate smart insights
  getSmartInsights() {
    const applications = this.data.applications;
    const projects = this.data.projects;
    const metrics = this.getDashboardMetrics();

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Applications pending over 3 days
    const pendingOver3Days = applications.filter(app => 
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

    const highDemandProjects = projects.filter(project => 
      projectDemand[project.id] > 5
    ).map(project => ({
      ...project,
      applicationCount: projectDemand[project.id] || 0
    }));

    // Low approval rate warning
    const lowApprovalRate = metrics.approvalRate < 40;

    return {
      pendingOver3Days: pendingOver3Days.length,
      highDemandProjects,
      lowApprovalRate,
      urgentApplications: pendingOver3Days
    };
  }

  // Get application trends by month
  getApplicationTrends() {
    const applications = this.data.applications;
    const monthlyData = {};

    applications.forEach(app => {
      const date = new Date(app.submittedDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0
        };
      }

      monthlyData[monthKey].total++;
      monthlyData[monthKey][app.status]++;
    });

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  }

  // Approve application
  approveApplication(applicationId) {
    const application = this.data.applications.find(app => app.id === applicationId);
    if (application && application.status === 'pending') {
      application.status = 'approved';
      application.approvedDate = new Date().toISOString();
      this.addAuditLog('approved', `Application ${application.id} approved`, 'Admin');
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Reject application
  rejectApplication(applicationId, reason = '') {
    const application = this.data.applications.find(app => app.id === applicationId);
    if (application && application.status === 'pending') {
      application.status = 'rejected';
      application.rejectedDate = new Date().toISOString();
      application.rejectionReason = reason;
      this.addAuditLog('rejected', `Application ${application.id} rejected: ${reason}`, 'Admin');
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Create new project
  createProject(projectData) {
    const newProject = {
      id: `proj_${Date.now()}`,
      ...projectData,
      status: 'planning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.projects.push(newProject);
    this.addAuditLog('created', `Project ${newProject.id} created`, 'Admin');
    this.notifyListeners();
    return newProject;
  }

  // Add audit log
  addAuditLog(action, details, userName) {
    const log = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      details,
      userName: userName || 'System',
      timestamp: new Date().toISOString()
    };

    this.data.auditLogs.push(log);
    return log;
  }

  // Get project demand analysis
  getProjectDemandAnalysis() {
    const projects = this.data.projects;
    const applications = this.data.applications;

    return projects.map(project => {
      const projectApplications = applications.filter(app => app.projectId === project.id);
      const demand = projectApplications.length;
      
      let demandLevel = 'Low';
      if (demand > 10) demandLevel = 'High';
      else if (demand > 5) demandLevel = 'Medium';

      return {
        ...project,
        demand,
        demandLevel,
        applications: projectApplications,
        unitsSold: projectApplications.filter(app => app.status === 'approved').length,
        utilizationRate: project.totalUnits > 0 ? 
          Math.round((projectApplications.filter(app => app.status === 'approved').length / project.totalUnits) * 100) : 0
      };
    });
  }

  // Simulate system health
  updateSystemHealth() {
    const responseTime = Math.random() * 1000;
    
    this.systemHealth = {
      apiResponseTime: responseTime < 300 ? 'Fast' : responseTime < 800 ? 'Medium' : 'Slow',
      databaseStatus: Math.random() > 0.05 ? 'Connected' : 'Error',
      storageUsage: Math.min(95, this.systemHealth.storageUsage + (Math.random() - 0.5)),
      lastBackup: new Date().toISOString()
    };

    return this.systemHealth;
  }

  // Generate initial audit logs (minimal, no duplicates)
  generateInitialAuditLogs() {
    // Only create essential initial logs
    this.addAuditLog('system', 'Housing system initialized', 'System');
  }

  // Calculate weekly/monthly changes
  getTrendCalculations() {
    const applications = this.data.applications;
    const users = this.data.users;
    
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

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

    const thisMonthUsers = users.filter(user => new Date(user.createdAt) >= lastMonth).length;
    const lastMonthUsers = users.filter(user => {
      const date = new Date(user.createdAt);
      return date >= twoMonthsAgo && date < lastMonth;
    }).length;

    return {
      weeklyChange: {
        applications: lastWeekApps > 0 ? Math.round(((thisWeekApps - lastWeekApps) / lastWeekApps) * 100) : 0,
        users: lastMonthUsers > 0 ? Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100) : 0
      },
      monthlyChange: {
        applications: lastMonthApps > 0 ? Math.round(((thisMonthApps - lastMonthApps) / lastMonthApps) * 100) : 0,
        users: lastMonthUsers > 0 ? Math.round(((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100) : 0
      }
    };
  }
}

// Create singleton instance
const dataManager = new DataManager();

export default dataManager;
