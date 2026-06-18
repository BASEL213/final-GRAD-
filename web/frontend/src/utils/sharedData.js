// Shared data utility for consistent data across all components
// Import data from data.json file
import dataJson from '../../data.json';

// Use applications from data.json instead of hardcoded fallback data
export const SHARED_FALLBACK_APPLICATIONS = dataJson.applications || [];

// Use projects from data.json
export const SHARED_FALLBACK_PROJECTS = dataJson.projects || [];

// Use users from data.json
export const SHARED_FALLBACK_USERS = dataJson.users || [];

// Use audit logs from data.json
export const SHARED_AUDIT_LOGS = dataJson.auditLogs || [];

// Use notifications from data.json
export const SHARED_NOTIFICATIONS = dataJson.notifications || [];

// Use system settings from data.json
export const SHARED_SYSTEM_SETTINGS = dataJson.systemSettings || {};

// Utility functions for data consistency
export const getApplicationsFromStorage = () => {
    try {
        const saved = localStorage.getItem('housingApplications');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.length > 0 ? parsed : SHARED_FALLBACK_APPLICATIONS;
        }
    } catch (err) {
        console.error('Failed to load applications from localStorage:', err);
    }
    return SHARED_FALLBACK_APPLICATIONS;
};

export const getApplicationStats = (applications) => {
    const stats = {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        approved: applications.filter(app => app.status === 'approved').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
    };
    
    stats.approvalRate = applications.length > 0 ? 
        ((stats.approved / applications.length) * 100).toFixed(1) : 0;
    
    return stats;
};

export const getProjectStats = () => {
    try {
        const saved = localStorage.getItem('housingProjects');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.length > 0 ? parsed : SHARED_FALLBACK_PROJECTS;
        }
    } catch (err) {
        console.error('Failed to load projects from localStorage:', err);
    }
    return SHARED_FALLBACK_PROJECTS;
};

export const getUserStats = () => {
    try {
        const saved = localStorage.getItem('housingUsers');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.length > 0 ? parsed : SHARED_FALLBACK_USERS;
        }
    } catch (err) {
        console.error('Failed to load users from localStorage:', err);
    }
    return SHARED_FALLBACK_USERS;
};

export const getAuditLogs = () => {
    try {
        const saved = localStorage.getItem('housingAuditLogs');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.length > 0 ? parsed : SHARED_AUDIT_LOGS;
        }
    } catch (err) {
        console.error('Failed to load audit logs from localStorage:', err);
    }
    return SHARED_AUDIT_LOGS;
};

export const getNotifications = () => {
    try {
        const saved = localStorage.getItem('housingNotifications');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.length > 0 ? parsed : SHARED_NOTIFICATIONS;
        }
    } catch (err) {
        console.error('Failed to load notifications from localStorage:', err);
    }
    return SHARED_NOTIFICATIONS;
};

export const getSystemSettings = () => {
    try {
        const saved = localStorage.getItem('housingSystemSettings');
        if (saved) {
            const parsed = JSON.parse(saved);
            return Object.keys(parsed).length > 0 ? parsed : SHARED_SYSTEM_SETTINGS;
        }
    } catch (err) {
        console.error('Failed to load system settings from localStorage:', err);
    }
    return SHARED_SYSTEM_SETTINGS;
};
