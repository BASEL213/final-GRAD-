import { applicationsAPI, projectsAPI, usersAPI, auditLogsAPI, dashboardAPI, notificationsAPI } from '../services/apiService';

class ApiDataManager {
  constructor() {
    this.listeners = [];
    this.cache = {
      applications: null,
      projects: null,
      users: null,
      auditLogs: null,
      notifications: null,
      lastUpdate: null
    };
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  // Subscribe to data changes (for compatibility with existing dashboard)
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of data changes
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.getAllData()));
  }

  // Check if cache is valid
  isCacheValid() {
    return this.cache.lastUpdate && 
           (Date.now() - this.cache.lastUpdate) < this.cacheTimeout;
  }

  // Get all data
  getAllData() {
    return {
      applications: this.cache.applications || [],
      projects: this.cache.projects || [],
      users: this.cache.users || [],
      auditLogs: this.cache.auditLogs || [],
      notifications: this.cache.notifications || []
    };
  }

  // Refresh all data from API
  async refreshData() {
    try {
      const [applicationsRes, projectsRes, usersRes, auditLogsRes, notificationsRes] = await Promise.all([
        applicationsAPI.getAll({ limit: 1000 }),
        projectsAPI.getAll(),
        usersAPI.getAll({ limit: 500 }),
        auditLogsAPI.getAll({ limit: 100 }),
        notificationsAPI.getAll()
      ]);

      this.cache = {
        applications: applicationsRes.data || [],
        projects: projectsRes.data || [],
        users: usersRes.data || [],
        auditLogs: auditLogsRes.data || [],
        notifications: notificationsRes.data || [],
        lastUpdate: Date.now()
      };

      this.notifyListeners();
      return this.cache;
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw error;
    }
  }

  // Get applications with enriched data
  async getApplications() {
    if (!this.isCacheValid()) {
      await this.refreshData();
    }
    
    const applications = [...(this.cache.applications || [])];
    const users = this.cache.users || [];
    const projects = this.cache.projects || [];

    return applications
      .filter((app) => app.projectLinked !== false)
      .map(app => {
      const user = users.find(u => u._id === app.userId || u.id === app.userId);
      const project = projects.find(
        (p) => String(p._id || p.id) === String(app.projectId || app.projectMongoId)
      );
      
      return {
        ...app,
        id: app._id || app.id,
        applicantName: app.applicantName || (user && user.name) || 'Unknown User',
        projectName: project ? project.name : app.projectName || 'Unknown Project',
        projectLinked: app.projectLinked ?? !!project,
        submittedDate: app.createdAt || app.submittedDate || new Date().toISOString(),
        unitType: app.unitType || app.requestedUnitType || '2BR',
        preferredFloor: app.preferredFloor || 'Any',
        paymentMethod: app.paymentMethod || 'installments'
      };
    })
      .filter((app) => app.projectLinked);
  }

  // Get projects
  async getProjects() {
    if (!this.isCacheValid()) {
      await this.refreshData();
    }
    
    return (this.cache.projects || []).map(project => ({
      ...project,
      id: project._id || project.id
    }));
  }

  // Get users
  async getUsers() {
    if (!this.isCacheValid()) {
      await this.refreshData();
    }
    
    return (this.cache.users || []).map(user => ({
      ...user,
      id: user._id || user.id
    }));
  }

  // Get audit logs
  async getAuditLogs() {
    if (!this.isCacheValid()) {
      await this.refreshData();
    }
    
    return (this.cache.auditLogs || [])
      .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp))
      .map(log => ({
        ...log,
        id: log._id || log.id,
        timestamp: log.createdAt || log.timestamp,
      }));
  }

  // Get notifications
  async getNotifications() {
    if (!this.isCacheValid()) {
      await this.refreshData();
    }
    
    return (this.cache.notifications || []).map(notification => ({
      ...notification,
      id: notification._id || notification.id
    }));
  }

  // Load notifications from API (for Notifications page)
  async loadNotificationsFromAPI() {
    try {
      const response = await notificationsAPI.getAll();
      this.cache.notifications = response.data || [];
      this.cache.lastUpdate = Date.now();
      this.notifyListeners();
      return this.cache.notifications;
    } catch (error) {
      console.error('Error loading notifications from API:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationRead(notificationId) {
    try {
      await notificationsAPI.markAsRead(notificationId);
      
      // Update cache
      if (this.cache.notifications) {
        const notification = this.cache.notifications.find(n => n._id === notificationId);
        if (notification) {
          notification.isRead = true;
        }
      }
      
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      await notificationsAPI.delete(notificationId);
      
      // Update cache
      if (this.cache.notifications) {
        this.cache.notifications = this.cache.notifications.filter(n => n._id !== notificationId);
      }
      
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get application by ID with enriched data
  async getApplicationById(id) {
    try {
      const response = await applicationsAPI.getById(id);
      const application = response.data;
      
      if (!application) {
        return null;
      }
      
      const users = await this.getUsers();
      const projects = await this.getProjects();
      
      const user = users.find(u => u._id === application.userId || u.id === application.userId);
      const project = projects.find(p => p._id === application.projectId || p.id === application.projectId);
      
      return {
        ...application,
        id: application._id || application.id,
        applicantName: user ? user.name : 'Unknown User',
        projectName: project ? project.name : 'Unknown Project',
        submittedDate: application.createdAt || application.submittedDate || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting application by ID:', error);
      return null;
    }
  }

  // Approve application
  async approveApplication(applicationId) {
    try {
      await applicationsAPI.updateStatus(applicationId, {
        status: 'approved',
        reviewedBy: 'Admin',
      });

      // Refresh cache
      await this.refreshData();
      return true;
    } catch (error) {
      console.error('Error approving application:', error);
      return false;
    }
  }

  // Reject application
  async rejectApplication(applicationId, reason = '') {
    try {
      await applicationsAPI.updateStatus(applicationId, {
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: 'Admin',
      });

      // Refresh cache
      await this.refreshData();
      return true;
    } catch (error) {
      console.error('Error rejecting application:', error);
      return false;
    }
  }

  // Create new project
  async createProject(projectData) {
    try {
      const response = await projectsAPI.create(projectData);
      
      // Create audit log
      await auditLogsAPI.create({
        action: 'project_created',
        details: `Project ${response.data._id} created`,
        timestamp: new Date().toISOString()
      });
      
      // Refresh cache
      await this.refreshData();
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  // Add audit log
  async addAuditLog(action, details, userName) {
    try {
      const log = await auditLogsAPI.create({
        action: action.toUpperCase(),
        details,
        userName: userName || 'System',
        userId: 'system',
        userAgent: navigator.userAgent,
        ipAddress: '127.0.0.1',
        timestamp: new Date().toISOString()
      });
      
      // Refresh cache
      await this.refreshData();
      return log.data;
    } catch (error) {
      console.error('Error adding audit log:', error);
      return null;
    }
  }

  // Get dashboard metrics from API
  async getDashboardMetrics() {
    try {
      // Use the dashboard API endpoint directly
      const response = await dashboardAPI.getMetrics();
      return response.data;
    } catch (error) {
      console.error('Error getting dashboard metrics from API:', error);
      
      // Fallback to local calculation if API fails
      try {
        const applications = await this.getApplications();
        const users = await this.getUsers();
        const projects = await this.getProjects();

        const totalApplications = applications.length;
        const pendingApplications = applications.filter(app => app.status === 'pending').length;
        const approvedApplications = applications.filter(app => app.status === 'approved').length;
        const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
        
        const approvalRate = totalApplications > 0 ? 
          Math.round((approvedApplications / totalApplications) * 100) : 0;

        const activeProjects = projects.filter(p => p.status === 'active').length;
        const planningProjects = projects.filter(p => p.status === 'planning').length;

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
      } catch (error) {
        console.error('Error calculating dashboard metrics:', error);
        return {
          totalApplications: 0,
          pendingApplications: 0,
          approvedApplications: 0,
          rejectedApplications: 0,
          approvalRate: 0,
          totalProjects: 0,
          activeProjects: 0,
          planningProjects: 0,
          totalUsers: 0,
          adminUsers: 0,
          citizenUsers: 0
        };
      }
    }
  }

  // Calculate smart insights
  async getSmartInsights() {
    try {
      const applications = await this.getApplications();
      const projects = await this.getProjects();
      const metrics = await this.getDashboardMetrics();

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

      return {
        pendingOver3Days: pendingOver3DaysApplications.length,
        highDemandProjects,
        lowApprovalRate,
        urgentApplications
      };
    } catch (error) {
      console.error('Error calculating smart insights:', error);
      return {
        pendingOver3Days: 0,
        highDemandProjects: [],
        lowApprovalRate: false,
        urgentApplications: []
      };
    }
  }

  // Get application trends by month
  async getApplicationTrends() {
    try {
      const applications = await this.getApplications();
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
    } catch (error) {
      console.error('Error getting application trends:', error);
      return [];
    }
  }

  // Get demand level based on application count
  getDemandLevel(count) {
    if (count > 10) return 'Very High';
    if (count > 7) return 'High';
    if (count > 4) return 'Medium';
    return 'Low';
  }

  // Get project demand analysis
  async getProjectDemandAnalysis() {
    try {
      const projects = await this.getProjects();
      const applications = await this.getApplications();

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
    } catch (error) {
      console.error('Error getting project demand analysis:', error);
      return [];
    }
  }

  // Calculate weekly/monthly changes
  async getTrendCalculations() {
    try {
      const applications = await this.getApplications();
      const users = await this.getUsers();
      
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
    } catch (error) {
      console.error('Error calculating trend calculations:', error);
      return {
        weeklyChange: { applications: 0, users: 0 },
        monthlyChange: { applications: 0, users: 0 }
      };
    }
  }

  // Simulate system health
  async updateSystemHealth() {
    try {
      // Use health endpoint instead of dashboard health
      const response = await fetch('http://localhost:5000/api/health');
      const data = await response.json();
      
      return {
        apiResponseTime: 'Fast',
        databaseStatus: data.success ? 'Connected' : 'Error',
        storageUsage: 78,
        lastBackup: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        apiResponseTime: 'Unknown',
        databaseStatus: 'Error',
        storageUsage: 0,
        lastBackup: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
const apiDataManager = new ApiDataManager();

export default apiDataManager;
