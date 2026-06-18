// Simple audit logging middleware for tracking system activities

const auditLogs = []; // In-memory storage (in production, use database)

const createAuditLog = (action, target, type, admin = 'Admin User') => {
  const log = {
    id: Date.now().toString(),
    admin,
    action,
    target,
    type,
    date: new Date().toISOString()
  };
  
  auditLogs.unshift(log); // Add to beginning (newest first)
  
  // Keep only last 1000 logs to prevent memory issues
  if (auditLogs.length > 1000) {
    auditLogs.pop();
  }
  
  return log;
};

// Middleware to log application status changes
const logApplicationStatusChange = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log the status change if it was successful
    if (req.originalUrl?.includes('/applications/') && req.method === 'PUT' && res.statusCode === 200) {
      try {
        const parsedData = JSON.parse(data);
        if (parsedData.success && parsedData.data) {
          const application = parsedData.data;
          const status = application.status;
          const action = `${status.charAt(0).toUpperCase() + status.slice(1)} application for ${application.name}`;
          const target = `Application #${application._id?.slice(-8) || 'Unknown'}`;
          const type = status === 'approved' ? 'approval' : 'rejection';
          
          createAuditLog(action, target, type, application.reviewedBy || 'Admin User');
        }
      } catch (err) {
        console.error('Error logging audit:', err);
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Middleware to log new applications
const logNewApplication = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log new application creation
    if (req.originalUrl?.includes('/applications') && req.method === 'POST' && res.statusCode === 201) {
      try {
        const parsedData = JSON.parse(data);
        if (parsedData.success && parsedData.data) {
          const application = parsedData.data;
          const action = `Created new application for ${application.name}`;
          const target = `Application #${application._id?.slice(-8) || 'Unknown'}`;
          
          createAuditLog(action, target, 'creation', 'System');
        }
      } catch (err) {
        console.error('Error logging audit:', err);
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Get audit logs endpoint
const getAuditLogs = (req, res) => {
  try {
    const { limit = 50, offset = 0, type, admin, search } = req.query;
    
    let filteredLogs = [...auditLogs];
    
    // Apply filters
    if (type) {
      filteredLogs = filteredLogs.filter(log => log.type === type);
    }
    
    if (admin) {
      filteredLogs = filteredLogs.filter(log => log.admin.toLowerCase().includes(admin.toLowerCase()));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.action.toLowerCase().includes(searchLower) ||
        log.target.toLowerCase().includes(searchLower) ||
        log.admin.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const paginatedLogs = filteredLogs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedLogs,
      total: filteredLogs.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs'
    });
  }
};

// Create audit log endpoint
const createAuditLogEndpoint = (req, res) => {
  try {
    const { action, target, type, admin } = req.body;
    
    if (!action || !target || !type) {
      return res.status(400).json({
        success: false,
        message: 'Action, target, and type are required'
      });
    }
    
    const log = createAuditLog(action, target, type, admin || 'Admin User');
    
    res.status(201).json({
      success: true,
      data: log,
      message: 'Audit log created successfully'
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create audit log'
    });
  }
};

module.exports = {
  auditLogs,
  createAuditLog,
  logApplicationStatusChange,
  logNewApplication,
  getAuditLogs,
  createAuditLogEndpoint
};
