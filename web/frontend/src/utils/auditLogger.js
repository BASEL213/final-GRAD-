// Real-time Audit Logging System
// Automatically logs admin actions for audit trail

export const createAuditEntry = (action, target, type, adminName = "Admin User", details = null) => {
  const newEntry = {
    id: Date.now(), // Unique ID based on timestamp
    admin: adminName,
    action: action,
    target: target,
    date: new Date().toISOString(),
    type: type,
    details: details
  };

  // Get existing audit logs from localStorage
  const existingLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
  
  // Add new entry to the beginning
  existingLogs.unshift(newEntry);
  
  // Keep only last 100 entries to prevent localStorage overflow
  if (existingLogs.length > 100) {
    existingLogs.splice(100);
  }
  
  // Save to localStorage
  localStorage.setItem('auditLogs', JSON.stringify(existingLogs));
  
  console.log('🔍 Audit Entry Created:', newEntry);
  return newEntry;
};

export const getAuditLogs = () => {
  try {
    const logs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    return logs;
  } catch (err) {
    console.error('❌ Failed to load audit logs:', err);
    return [];
  }
};

export const clearAuditLogs = () => {
  localStorage.removeItem('auditLogs');
  console.log('🗑️ Audit logs cleared');
};

// Specific audit functions for common actions
export const logApplicationAction = (applicationId, applicationName, action, adminName) => {
  const actionText = {
    approved: `Approved application for ${applicationName}`,
    rejected: `Rejected application for ${applicationName}`,
    updated: `Updated application ${applicationId}`,
    created: `Created new application for ${applicationName}`
  };

  return createAuditEntry(
    actionText[action] || actionText.updated,
    `Application #${applicationId}`,
    action,
    adminName
  );
};

export const logProjectAction = (projectId, projectName, action, adminName) => {
  const actionText = {
    created: `Created new project: ${projectName}`,
    updated: `Updated project: ${projectName}`,
    deleted: `Deleted project: ${projectName}`
  };

  return createAuditEntry(
    actionText[action] || actionText.updated,
    `Project #${projectId}`,
    action,
    adminName
  );
};

export const logUserAction = (userId, userName, action, adminName) => {
  const actionText = {
    role_change: `Updated user role: ${userName}`,
    login: `User logged in: ${userName}`,
    logout: `User logged out: ${userName}`
  };

  return createAuditEntry(
    actionText[action] || actionText.login,
    `User #${userId}`,
    action,
    adminName
  );
};

export const logSystemAction = (action, adminName, details = null) => {
  return createAuditEntry(
    action,
    "System",
    "system",
    adminName,
    details
  );
};
