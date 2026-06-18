// API Service for Findoor Backend Integration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;

// Exponential-backoff retry for transient failures
const withRetry = async (fn, retries = MAX_RETRIES, delayMs = 800) => {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise(r => setTimeout(r, delayMs * (MAX_RETRIES - retries + 1)));
    return withRetry(fn, retries - 1, delayMs);
  }
};

// Fetch with AbortController timeout + retry
const apiCall = async (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await withRetry(() =>
      fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('authToken') ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` } : {}),
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      })
    );

    clearTimeout(timer);
    const data = await response.json();

    if (!response.ok) {
      if (data.errors && Array.isArray(data.errors)) {
        throw new Error(data.errors.map(e => e.msg).join(', ') || data.message || 'API request failed');
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw error;
  }
};

// Applications API
export const applicationsAPI = {
  // Get all applications
  getAll: async (params = { limit: 500 }) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/applications?${queryString}` : '/applications';
    return apiCall(url);
  },

  // Get single application by ID
  getById: async (id) => {
    return apiCall(`/applications/${id}`);
  },

  // Update application status
  updateStatus: async (id, statusData) => {
    return apiCall(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  },

  // Update application (general update)
  update: async (id, updateData) => {
    return apiCall(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Delete application
  delete: async (id) => {
    return apiCall(`/applications/${id}`, {
      method: 'DELETE',
    });
  },

  // Get application statistics
  getStats: async () => {
    return apiCall('/applications/stats');
  },

  // Get recent applications linked to MongoDB projects
  getRecent: async (limit = 4) => {
    return apiCall(`/applications/recent?limit=${limit}`);
  },

  // Create new application
  create: async (applicationData) => {
    return apiCall('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },
};

// Projects API
export const projectsAPI = {
  // Get all projects (high limit so list matches dashboard total count)
  getAll: async (params = { limit: 1000 }) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/projects?${queryString}` : '/projects';
    return apiCall(url);
  },

  // Get single project by ID
  getById: async (id) => {
    return apiCall(`/projects/${id}`);
  },

  // Create new project
  create: async (projectData) => {
    return apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  // Update project
  update: async (id, projectData) => {
    return apiCall(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  // Delete project
  delete: async (id) => {
    return apiCall(`/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

// Users API
export const usersAPI = {
  getAll: async (params = { limit: 500 }) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/users?${queryString}` : '/users';
    return apiCall(url);
  },

  getStats: async () => apiCall('/users/stats'),

  getById: async (id) => apiCall(`/users/${id}`),

  create: async (userData) =>
    apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  update: async (id, userData) =>
    apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),

  resetPassword: async (id, password) =>
    apiCall(`/users/${id}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    }),

  delete: async (id) =>
    apiCall(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// Audit Logs API
export const auditLogsAPI = {
  getAll: async (params = { limit: 500 }) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/auditLogs?${queryString}` : '/auditLogs';
    return apiCall(url);
  },

  getStats: async () => apiCall('/auditLogs/stats'),

  getRecent: async (limit = 10) => apiCall(`/auditLogs/recent?limit=${limit}`),

  create: async (logData) =>
    apiCall('/auditLogs', {
      method: 'POST',
      body: JSON.stringify(logData),
    }),
};

// Dashboard API
export const dashboardAPI = {
  // Get dashboard metrics
  getMetrics: async () => {
    return apiCall('/dashboard/metrics');
  },

  // Get dashboard insights
  getInsights: async () => {
    return apiCall('/dashboard/insights');
  },

  // Get application trends
  getTrends: async () => {
    return apiCall('/dashboard/trends');
  },

  // Get system health
  getHealth: async () => {
    return apiCall('/dashboard/health');
  },
};

// Notifications API
export const notificationsAPI = {
  // Get all notifications
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/notifications?${queryString}` : '/notifications';
    return apiCall(url);
  },

  // Get single notification by ID
  getById: async (id) => {
    return apiCall(`/notifications/${id}`);
  },

  // Create new notification
  create: async (notificationData) => {
    return apiCall('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  },

  // Update notification
  update: async (id, notificationData) => {
    return apiCall(`/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(notificationData),
    });
  },

  // Delete notification
  delete: async (id) => {
    return apiCall(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  // Mark notification as read
  markAsRead: async (id) => {
    return apiCall(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  // Mark all notifications as read for a user
  markAllAsRead: async (targetUserId) => {
    return apiCall('/notifications/mark-all-read', {
      method: 'PATCH',
      body: JSON.stringify({ targetUserId }),
    });
  },

  // Get unread notifications count
  getUnreadCount: async (targetUserId) => {
    const queryString = new URLSearchParams({ targetUserId }).toString();
    return apiCall(`/notifications/unread-count?${queryString}`);
  },

  // Delete expired notifications
  deleteExpired: async () => {
    return apiCall('/notifications/cleanup-expired', {
      method: 'DELETE',
    });
  },
};

// Health check
export const healthCheck = async () => {
  return apiCall('/health');
};

export default applicationsAPI;
