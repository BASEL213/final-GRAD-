// Removed data.json dependency - now using only backend API

class DataService {
  constructor() {
    this.subscribers = [];
    this.cache = {
      users: null,
      projects: null,
      applications: null,
      auditLogs: null,
      notifications: null
    };
    this.lastUpdate = null;
    this.apiBaseUrl = 'http://localhost:5000/api'; // Backend API URL
    this.init();
  }

  init() {
    this.loadInitialData();
    this.setupStorageSync();
  }

  // Load initial data from backend API (no data.json dependency)
  async loadInitialData() {
    // Start with empty cache - will be populated by API calls
    this.cache = {
      users: [],
      projects: [],
      applications: [],
      auditLogs: [],
      notifications: []
    };
    
    console.log('Initialized empty cache - will load from backend API');
    
    // Load data from backend API
    try {
      await Promise.all([
        this.loadProjectsFromAPI(),
        this.loadUsersFromAPI(),
        this.loadApplicationsFromAPI(),
        this.loadAuditLogsFromAPI(),
        this.loadNotificationsFromAPI()
      ]);
      
      console.log('Loaded data from backend API:', {
        users: this.cache.users.length,
        projects: this.cache.projects.length,
        applications: this.cache.applications.length,
        auditLogs: this.cache.auditLogs.length,
        notifications: this.cache.notifications.length
      });
      
    } catch (err) {
      console.error('Error loading from backend API:', err);
      // Keep empty cache - frontend will show no data until API works
    }
    this.notifySubscribers('initial_load');
  }

  // Load data from backend API methods
  async loadProjectsFromAPI() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/projects?limit=1000`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.cache.projects = result.data;
        }
      }
    } catch (error) {
      console.error('Failed to load projects from API:', error);
    }
  }

  async loadUsersFromAPI() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users?limit=500`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.cache.users = result.data;
        }
      }
    } catch (error) {
      console.error('Failed to load users from API:', error);
    }
  }

  async loadApplicationsFromAPI() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/applications`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.cache.applications = result.data;
        }
      }
    } catch (error) {
      console.error('Failed to load applications from API:', error);
    }
  }

  async loadAuditLogsFromAPI() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auditLogs`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.cache.auditLogs = result.data;
        }
      }
    } catch (error) {
      console.error('Failed to load audit logs from API:', error);
    }
  }

  async loadNotificationsFromAPI() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/notifications`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.cache.notifications = result.data;
        }
      }
    } catch (error) {
      console.error('Failed to load notifications from API:', error);
    }
  }

  // Apply any persisted status changes
  applyPersistedChanges() {
    try {
      const permanentStatus = localStorage.getItem('permanentApplicationStatus');
      if (permanentStatus) {
        const statusChanges = JSON.parse(permanentStatus);
        this.cache.applications = this.cache.applications.map(app => {
          if (statusChanges[app.id]) {
            const change = statusChanges[app.id];
            return {
              ...app,
              status: change.status,
              rejectionReason: change.rejectionReason,
              reviewedAt: change.reviewedAt,
              reviewedBy: change.reviewedBy
            };
          }
          return app;
        });
      }

      const updatedApplications = localStorage.getItem('backendApplications');
      if (updatedApplications) {
        this.cache.applications = JSON.parse(updatedApplications);
      }
    } catch (error) {
      console.error('Error applying persisted changes:', error);
    }
  }

  // Setup storage sync
  setupStorageSync() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'backendApplications' || e.key === 'permanentApplicationStatus') {
        this.loadInitialData();
      }
    });
  }

  // Subscribe to data changes
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers
  notifySubscribers(changeType, data = null) {
    this.subscribers.forEach(callback => {
      try {
        callback(changeType, data, this.cache);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  // Get all applications
  getApplications() {
    return [...this.cache.applications];
  }

  // Get application by ID
  getApplication(id) {
    return this.cache.applications.find(app => app.id === id || app._id === id);
  }

  // Add new application
  addApplication(applicationData) {
    const newApplication = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: applicationData.userId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: applicationData.projectId,
      status: 'pending',
      priority: 'normal',
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      applicationData: {
        requestedUnitType: applicationData.requestedUnitType || '2BR',
        preferredFloor: applicationData.preferredFloor || 'Any',
        paymentMethod: applicationData.paymentMethod || 'installments',
        specialRequirements: applicationData.specialRequirements || '',
        applicantName: applicationData.applicantName,
        applicantEmail: applicationData.applicantEmail,
        applicantPhone: applicationData.applicantPhone,
        nationalId: applicationData.nationalId,
        familySize: applicationData.familySize,
        income: applicationData.income,
        currentHousing: applicationData.currentHousing
      },
      documents: applicationData.documents || {
        nationalIdCopy: 'uploaded',
        incomeCertificate: 'uploaded',
        birthCertificate: 'uploaded',
        otherDocuments: []
      },
      reviewNotes: null,
      rejectionReason: null
    };

    this.cache.applications.unshift(newApplication); // Add to beginning for newest first
    this.saveToStorage();
    this.notifySubscribers('application_added', newApplication);
    
    // Add audit log
    this.addAuditLog({
      action: 'application_submitted',
      userId: newApplication.userId,
      userName: applicationData.applicantName,
      applicationId: newApplication.id,
      details: `New application submitted for ${this.getProjectName(applicationData.projectId)}`
    });

    return newApplication;
  }

  // Get application by ID with enriched data
  getApplicationById(id) {
    const application = this.cache.applications.find(app => 
      app.id === id || app._id === id
    );
    
    if (!application) {
      return null;
    }
    
    const user = this.cache.users.find(u => u.id === application.userId);
    const project = this.cache.projects.find(p => p.id === application.projectId);
    
    return {
      ...application,
      // User information
      applicantName: user ? user.name : 'Unknown User',
      email: user ? user.email : 'N/A',
      phone: user ? user.phone : 'N/A',
      nationalId: user ? user.nationalId : 'N/A',
      address: user?.profile?.address || 'N/A',
      occupation: user?.profile?.occupation || 'N/A',
      familySize: user?.profile?.familySize || 'N/A',
      monthlyIncome: user?.profile?.monthlyIncome || 'N/A',
      
      // Project information
      projectName: project ? project.name : 'Unknown Project',
      projectLocation: project ? `${project.location?.city}, ${project.location?.district}` : 'N/A',
      
      // Application specific data
      requestedUnitType: application?.applicationData?.requestedUnitType || 'N/A',
      preferredFloor: application?.applicationData?.preferredFloor || 'N/A',
      paymentMethod: application?.applicationData?.paymentMethod || 'N/A',
      specialRequirements: application?.applicationData?.specialRequirements || 'N/A',
      
      // Documents status
      documents: application?.documents || {},
      
      // Dates
      submittedDate: application.submittedAt || application.createdAt || new Date().toISOString(),
      reviewedDate: application.reviewedAt || 'N/A',
      reviewedBy: application.reviewedBy || 'N/A'
    };
  }

  // Update application status
  updateApplicationStatus(applicationId, status, rejectionReason = null, reviewedBy = 'Admin') {
    const applicationIndex = this.cache.applications.findIndex(app => 
      app.id === applicationId || app._id === applicationId
    );

    if (applicationIndex === -1) {
      throw new Error('Application not found');
    }

    const oldStatus = this.cache.applications[applicationIndex].status;
    const updatedApplication = {
      ...this.cache.applications[applicationIndex],
      status,
      rejectionReason: status === 'rejected' ? rejectionReason : null,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewedBy || 'Admin'
    };

    this.cache.applications[applicationIndex] = updatedApplication;
    this.saveToStorage();
    this.notifySubscribers('application_status_updated', updatedApplication);
    
    // Add audit log
    this.addAuditLog({
      action: 'application_' + status,
      userId: this.cache.applications[applicationIndex].userId,
      userName: this.getApplicationUserName(this.cache.applications[applicationIndex]),
      applicationId,
      details: `Application ${status}${rejectionReason ? ` - Reason: ${rejectionReason}` : ''}`
    });

    // Add notification
    this.addNotification({
      type: status === 'approved' ? 'success' : 'warning',
      title: `Application ${status}`,
      message: `Your application has been ${status}`,
      userId: this.cache.applications[applicationIndex].userId,
      applicationId
    });

    return this.cache.applications[applicationIndex];
  }

  // Delete application
  deleteApplication(applicationId) {
    const applicationIndex = this.cache.applications.findIndex(app => 
      app.id === applicationId || app._id === applicationId
    );

    if (applicationIndex === -1) {
      throw new Error('Application not found');
    }

    const deletedApplication = this.cache.applications[applicationIndex];
    this.cache.applications.splice(applicationIndex, 1);
    this.saveToStorage();
    this.notifySubscribers('application_deleted', deletedApplication);
    
    // Add audit log
    this.addAuditLog({
      action: 'application_deleted',
      userId: deletedApplication.userId,
      userName: this.getApplicationUserName(deletedApplication),
      applicationId,
      details: `Application deleted`
    });

    return deletedApplication;
  }

  // Get all users
  getUsers() {
    return [...this.cache.users];
  }

  // Get user by ID
  getUser(userId) {
    return this.cache.users.find(user => user._id === userId);
  }

  // Get user by ID (alias for getUser)
  getUserById(userId) {
    return this.getUser(userId);
  }

  // Get all projects from MongoDB backend
  async getProjects() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/projects?limit=1000`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      
      if (result.success) {
        this.cache.projects = result.data;
        return result.data;
      } else {
        console.error('API returned error:', result.message);
        // Return cached data if available
        return [...(this.cache.projects || [])];
      }
    } catch (error) {
      console.error('Failed to fetch projects from API:', error);
      // Return cached data if available
      return [...(this.cache.projects || [])];
    }
  }

  // Synchronous version for backward compatibility
  getProjectsSync() {
    return [...(this.cache.projects || [])];
  }

  // Get project by ID
  getProject(projectId) {
    return this.cache.projects.find(project => project.id === projectId);
  }

  // Get project name
  getProjectName(projectId) {
    const project = this.getProject(projectId);
    return project ? project.name : 'Unknown Project';
  }

  // Add new project to real database
  async addProject(projectData) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const newProject = result.data;
        this.cache.projects.push(newProject);
        this.saveToStorage();
        this.notifySubscribers('project_added', newProject);
        return newProject;
      } else {
        throw new Error(result.message || 'Failed to create project');
      }
    } catch (error) {
      console.error('Failed to add project to API:', error);
      // Fallback to local storage for offline mode
      const newProject = {
        id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: projectData.name,
        location: projectData.location || {},
        type: projectData.type || 'residential',
        category: projectData.category || 'apartments',
        status: projectData.status || 'planning',
        development: projectData.development || {
          totalUnits: 0,
          availableUnits: 0,
          soldUnits: 0,
          phases: 1
        },
        pricing: projectData.pricing || {
          priceRange: '0 - 0 EGP',
          unitTypes: [],
          downPayment: '10%',
          installmentYears: 5
        },
        timeline: projectData.timeline || {
          completionDate: new Date().toISOString().split('T')[0],
          deliveryDate: new Date().toISOString().split('T')[0],
          constructionProgress: 0
        },
        features: projectData.features || {
          amenities: [],
          areaRange: '0 - 0 sqm',
          floors: 1
        },
        description: projectData.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.cache.projects.push(newProject);
      this.saveToStorage();
      this.notifySubscribers('project_added', newProject);
      
      return newProject;
    }
  }

  // Update project
  updateProject(projectId, projectData) {
    const projectIndex = this.cache.projects.findIndex(proj => proj.id === projectId || proj._id === projectId);
    if (projectIndex !== -1) {
      this.cache.projects[projectIndex] = {
        ...this.cache.projects[projectIndex],
        ...projectData,
        updatedAt: new Date().toISOString()
      };
      this.saveToStorage();
      this.notifySubscribers('project_updated', this.cache.projects[projectIndex]);
      
      // Add audit log
      this.addAuditLog({
        action: 'project_updated',
        userId: 'admin',
        userName: 'Admin User',
        projectId: projectId,
        details: `Project updated: ${this.cache.projects[projectIndex].name}`
      });
      
      return this.cache.projects[projectIndex];
    }
    return null;
  }

  // Update user
  async updateUser(userId, userData) {
    try {
      // Update via backend API
      const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const updatedUser = result.data;
          
          // Update cache with the response from backend
          const userIndex = this.cache.users.findIndex(user => user._id === userId);
          if (userIndex !== -1) {
            this.cache.users[userIndex] = updatedUser;
            this.saveToStorage();
            this.notifySubscribers('user_updated', updatedUser);
            
            // Add audit log
            this.addAuditLog({
              action: 'user_updated',
              userId: userId,
              userName: updatedUser.name,
              details: `User ${userId} updated: ${JSON.stringify(userData)}`
            });
          }
          
          return updatedUser;
        }
      } else {
        throw new Error('Failed to update user in backend');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      // Delete from backend API
      const response = await fetch(`${this.apiBaseUrl}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // Remove from cache
        const userIndex = this.cache.users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
          const deletedUser = this.cache.users[userIndex];
          this.cache.users.splice(userIndex, 1);
          
          this.saveToStorage();
          this.notifySubscribers('user_deleted', deletedUser);
          
          // Add audit log
          this.addAuditLog({
            action: 'user_deleted',
            userId: userId,
            userName: deletedUser.name,
            details: `User ${userId} deleted`
          });
          
          return deletedUser;
        }
      } else {
        throw new Error('Failed to delete user from backend');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Add new user
  async addUser(userData) {
    try {
      // Add to backend API
      const response = await fetch(`${this.apiBaseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const newUser = result.data;
          
          // Add to cache
          this.cache.users.push(newUser);
          this.saveToStorage();
          this.notifySubscribers('user_added', newUser);
          
          // Add audit log
          this.addAuditLog({
            action: 'user_added',
            userId: newUser._id || newUser.id,
            userName: newUser.name,
            details: `User ${newUser.name} added`
          });
          
          return newUser;
        }
      } else {
        throw new Error('Failed to add user to backend');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }

  // Delete project from real database
  async deleteProject(projectId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/projects/${projectId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Find and remove from cache
        const projectIndex = this.cache.projects.findIndex(proj => proj.id === projectId || proj._id === projectId);
        if (projectIndex !== -1) {
          const deletedProject = this.cache.projects[projectIndex];
          this.cache.projects.splice(projectIndex, 1);
          this.saveToStorage();
          this.notifySubscribers('project_deleted', deletedProject);
          
          // Add audit log
          this.addAuditLog({
            action: 'project_deleted',
            userId: 'admin',
            userName: 'Admin User',
            projectId: projectId,
            details: `Project deleted: ${deletedProject.name}`
          });
          
          return deletedProject;
        }
      } else {
        throw new Error(result.message || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Failed to delete project from API:', error);
      // Fallback to local deletion
      const projectIndex = this.cache.projects.findIndex(proj => proj.id === projectId || proj._id === projectId);
      if (projectIndex !== -1) {
        const deletedProject = this.cache.projects[projectIndex];
        this.cache.projects.splice(projectIndex, 1);
        this.saveToStorage();
        this.notifySubscribers('project_deleted', deletedProject);
        return deletedProject;
      }
      return null;
    }
  }

  // Get user details for application
  getApplicationUser(application) {
    // Backend applications have name, email, phone directly
    if (application.name) {
      return {
        id: application.userId || application._id || 'unknown',
        name: application.name,
        email: application.email || 'unknown@example.com',
        phone: application.phone || 'N/A',
        role: 'citizen',
        isVerified: false
      };
    }
    
    // For data.json applications, try to find user by userId
    if (application.userId) {
      const user = this.getUser(application.userId);
      if (user) return user;
    }
    
    // For applications with applicationData
    if (application.applicationData && application.applicationData.applicantName) {
      return {
        id: application.userId || application.id || 'unknown',
        name: application.applicationData.applicantName,
        email: application.applicationData.applicantEmail || 'unknown@example.com',
        phone: application.applicationData.applicantPhone || 'N/A',
        role: 'citizen',
        isVerified: false
      };
    }
    
    return {
      id: 'unknown',
      name: 'Unknown User',
      email: 'unknown@example.com',
      phone: 'N/A',
      role: 'citizen',
      isVerified: false
    };
  }

  // Get application user name
  getApplicationUserName(application) {
    const user = this.getApplicationUser(application);
    return user ? user.name : 'Unknown User';
  }

  // Get enriched applications with user and project data
  getEnrichedApplications() {
    console.log('🔍 Total applications in cache:', this.cache.applications.length);
    console.log('🔍 Raw application data:', this.cache.applications);
    
    return this.cache.applications.map(app => {
      const user = this.getApplicationUser(app);
      
      // Try multiple ways to get project information
      let project = null;
      let projectName = 'Unknown Project';
      
      // First try by projectId
      if (app.projectId) {
        project = this.getProject(app.projectId);
        if (project) {
          projectName = project.name;
        }
      }
      
      // If no project found, try by projectName in applicationData
      if (!project && app.applicationData && app.applicationData.projectName) {
        const projects = this.getProjects();
        project = projects.find(p => p.name === app.applicationData.projectName);
        if (project) {
          projectName = project.name;
        }
      }
      
      // If still no project found, use the projectName from applicationData
      if (!project && app.applicationData && app.applicationData.projectName) {
        projectName = app.applicationData.projectName;
      }
      
      console.log('🔍 Processing app:', app.id, 'projectId:', app.projectId, 'project found:', !!project, 'projectName:', projectName);
      
      return {
        ...app,
        applicantName: app.applicationData?.applicantName || (user && user.name) || 'Unknown User',
        applicantEmail: app.applicationData?.applicantEmail || (user && user.email) || 'unknown@example.com',
        applicantPhone: app.applicationData?.applicantPhone || (user && user.phone) || 'N/A',
        projectName: projectName,
        priority: app.priority || 'normal',
        status: app.status || 'pending',
        // Include unit type, preferred floor, and payment method with defaults
        requestedUnitType: app.requestedUnitType || app.applicationData?.requestedUnitType || '2BR',
        preferredFloor: app.preferredFloor || app.applicationData?.preferredFloor || 'Any',
        paymentMethod: app.paymentMethod || app.applicationData?.paymentMethod || 'installments'
      };
    });
  }

  // Get application statistics
  getApplicationStats() {
    const applications = this.cache.applications;
    return {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      approved: applications.filter(app => app.status === 'approved').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      approvalRate: applications.length > 0 ? 
        ((applications.filter(app => app.status === 'approved').length / applications.length) * 100).toFixed(1) : 0
    };
  }

  // Get latest applications
  getLatestApplications(limit = 5) {
    return this.getEnrichedApplications()
      .sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt))
      .slice(0, limit);
  }

  // Add audit log
  addAuditLog(logData) {
    const newLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action: logData.action,
      userId: logData.userId,
      userName: logData.userName,
      applicationId: logData.applicationId,
      details: logData.details
    };

    this.cache.auditLogs.unshift(newLog);
    this.saveToStorage();
    this.notifySubscribers('audit_log_added', newLog);
  }

  // Get audit logs
  getAuditLogs() {
    return [...this.cache.auditLogs];
  }

  // Add notification
  addNotification(notificationData) {
    const newNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      userId: notificationData.userId,
      applicationId: notificationData.applicationId,
      read: false,
      isRead: false,
      priority: notificationData.priority || 'normal'
    };

    this.cache.notifications.unshift(newNotification);
    this.saveToStorage();
    this.notifySubscribers('notification_added', newNotification);
  }

  // Get notifications
  getNotifications() {
    return [...this.cache.notifications];
  }

  // Load notifications from API
  async loadNotificationsFromAPI() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/notifications`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.cache.notifications = result.data;
          console.log('✅ Notifications loaded from API:', result.data.length, 'notifications');
        }
      }
    } catch (error) {
      console.error('Failed to load notifications from API:', error);
    }
  }

  // Mark notification as read
  async markNotificationRead(notificationId) {
    try {
      // Update via backend API
      const response = await fetch(`${this.apiBaseUrl}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update cache with the response from backend
          const notificationIndex = this.cache.notifications.findIndex(notif => notif._id === notificationId);
          if (notificationIndex !== -1) {
            this.cache.notifications[notificationIndex].isRead = true;
            this.saveToStorage();
            this.notifySubscribers('notification_read', this.cache.notifications[notificationIndex]);
          }
          return result.data;
        }
      } else {
        throw new Error('Failed to mark notification as read in backend');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Fallback to local update
      const notificationIndex = this.cache.notifications.findIndex(notif => notif._id === notificationId);
      if (notificationIndex !== -1) {
        this.cache.notifications[notificationIndex].isRead = true;
        this.saveToStorage();
        this.notifySubscribers('notification_read', this.cache.notifications[notificationIndex]);
      }
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      // Delete via backend API
      const response = await fetch(`${this.apiBaseUrl}/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Remove from cache
          const notificationIndex = this.cache.notifications.findIndex(notif => notif._id === notificationId);
          if (notificationIndex !== -1) {
            const deletedNotification = this.cache.notifications.splice(notificationIndex, 1)[0];
            this.saveToStorage();
            this.notifySubscribers('notification_deleted', deletedNotification);
            return deletedNotification;
          }
        }
      } else {
        throw new Error('Failed to delete notification from backend');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Fallback to local deletion
      const notificationIndex = this.cache.notifications.findIndex(notif => notif._id === notificationId);
      if (notificationIndex !== -1) {
        const deletedNotification = this.cache.notifications.splice(notificationIndex, 1)[0];
        this.saveToStorage();
        this.notifySubscribers('notification_deleted', deletedNotification);
        return deletedNotification;
      }
      return null;
    }
  }

  // Test function to verify addApplication works correctly
  testAddApplication() {
    console.log('🧪 Testing addApplication functionality...');
    
    const testAppData = {
      applicantName: 'Test User',
      applicantEmail: 'test@example.com',
      applicantPhone: '01234567890',
      nationalId: '12345678901234',
      projectName: 'Cairo Garden Residences',
      projectId: 'proj_001',
      income: 25000,
      familySize: 4,
      currentHousing: 'Renting apartment',
      requestedUnitType: '2BR',
      preferredFloor: 'Any',
      paymentMethod: 'installments',
      specialRequirements: 'None'
    };
    
    console.log('🧪 Adding test application...');
    const newApp = this.addApplication(testAppData);
    console.log('🧪 Test application added:', newApp);
    console.log('🧪 Total applications now:', this.cache.applications.length);
    
    const enrichedApps = this.getEnrichedApplications();
    console.log('🧪 Enriched applications:', enrichedApps);
    
    return newApp;
  }

  // Save to localStorage for persistence
  saveToStorage() {
    try {
      localStorage.setItem('backendApplications', JSON.stringify(this.cache.applications));
      localStorage.setItem('backendUsers', JSON.stringify(this.cache.users));
      localStorage.setItem('backendProjects', JSON.stringify(this.cache.projects));
      localStorage.setItem('backendAuditLogs', JSON.stringify(this.cache.auditLogs));
      localStorage.setItem('backendNotifications', JSON.stringify(this.cache.notifications));
      
      // Also save permanent status changes
      const permanentStatus = {};
      this.cache.applications.forEach(app => {
        if (app.status !== 'pending') {
          permanentStatus[app.id] = {
            status: app.status,
            rejectionReason: app.rejectionReason,
            reviewedAt: app.reviewedAt,
            reviewedBy: app.reviewedBy
          };
        }
      });
      localStorage.setItem('permanentApplicationStatus', JSON.stringify(permanentStatus));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  // Search applications
  searchApplications(query, statusFilter = 'all') {
    let applications = this.getEnrichedApplications();
    
    // Filter by status
    if (statusFilter !== 'all') {
      applications = applications.filter(app => app.status === statusFilter);
    }
    
    // Search by query
    if (query) {
      const searchQuery = query.toLowerCase();
      applications = applications.filter(app => 
        app.applicantName?.toLowerCase().includes(searchQuery) ||
        app.applicantEmail?.toLowerCase().includes(searchQuery) ||
        app.projectName?.toLowerCase().includes(searchQuery) ||
        app.id?.toLowerCase().includes(searchQuery)
      );
    }
    
    return applications;
  }

  // Refresh data from backend API (if available)
  async refreshFromBackend() {
    try {
      const response = await fetch('http://localhost:5000/api/applications');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          this.cache.applications = data.data;
          this.saveToStorage();
          this.notifySubscribers('backend_refresh');
          return { success: true, error: null };
        }
      }
      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      console.log('Backend refresh failed, using local data');
      return { success: false, error: error.message };
    }
  }

  // Enhanced error handling for API calls
  async safeApiCall(url, options = {}) {
    try {
      const response = await fetch(url, {
        timeout: 10000, // 10 second timeout
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network connection failed. Please check your internet connection.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }

  // Get projects with error handling
  async getProjectsWithErrorHandling() {
    try {
      const projects = await this.getProjects();
      if (!projects || projects.length === 0) {
        return { 
          success: false, 
          error: 'No projects available at the moment. Please try again later.',
          data: []
        };
      }
      return { success: true, error: null, data: projects };
    } catch (error) {
      return { 
        success: false, 
        error: 'Failed to load projects from database. Please refresh the page.',
        data: []
      };
    }
  }
}

// Create singleton instance
const dataService = new DataService();

export default dataService;
export { DataService };
