const express = require('express');
const router = express.Router();

// Sample audit logs (in real app, this would come from database)
let auditLogs = [
  {
    id: 'audit_001',
    userId: 'user_005',
    userName: 'System Administrator',
    action: 'APPLICATION_APPROVED',
    targetId: 'app_001',
    targetType: 'application',
    timestamp: '2024-01-22T14:30:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: 'Approved housing application for Ahmed Mohamed Hassan - Cairo Garden Residences',
    previousStatus: 'pending',
    newStatus: 'approved'
  },
  {
    id: 'audit_002',
    userId: 'user_005',
    userName: 'System Administrator',
    action: 'APPLICATION_REJECTED',
    targetId: 'app_003',
    targetType: 'application',
    timestamp: '2024-01-28T10:00:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: 'Rejected housing application for Omar Abdel Rahman - Mansoura Gardens',
    previousStatus: 'pending',
    newStatus: 'rejected',
    rejectionReason: 'Monthly income below minimum requirement for villa category'
  },
  {
    id: 'audit_003',
    userId: 'user_005',
    userName: 'System Administrator',
    action: 'LOGIN',
    targetId: null,
    targetType: 'system',
    timestamp: '2024-02-05T08:00:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: 'System administrator logged into housing management system'
  },
  {
    id: 'audit_005',
    userId: 'user_005',
    userName: 'System Administrator',
    action: 'PROJECT_CREATED',
    targetId: 'proj_005',
    targetType: 'project',
    timestamp: '2024-02-01T09:00:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: 'Created new affordable housing project: Suez Canal City Residences'
  },
  {
    id: 'audit_006',
    userId: 'user_005',
    userName: 'System Administrator',
    action: 'USER_VERIFIED',
    targetId: 'user_004',
    targetType: 'user',
    timestamp: '2024-03-05T10:00:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: 'Verified user account for Mona Mahmoud Ali - Doctor'
  }
];

// GET /api/auditLogs - Get all audit logs
router.get('/', (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: auditLogs,
      count: auditLogs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving audit logs',
      error: error.message
    });
  }
});

// GET /api/auditLogs/:id - Get audit log by ID
router.get('/:id', (req, res) => {
  try {
    const auditLog = auditLogs.find(log => log.id === req.params.id);
    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }
    res.status(200).json({
      success: true,
      message: 'Audit log retrieved successfully',
      data: auditLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving audit log',
      error: error.message
    });
  }
});

// POST /api/auditLogs - Create new audit log
router.post('/', (req, res) => {
  try {
    const newAuditLog = {
      id: `audit_${Date.now()}`,
      ...req.body,
      timestamp: new Date().toISOString()
    };
    auditLogs.push(newAuditLog);
    res.status(201).json({
      success: true,
      message: 'Audit log created successfully',
      data: newAuditLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating audit log',
      error: error.message
    });
  }
});

// GET /api/auditLogs/user/:userId - Get audit logs by user
router.get('/user/:userId', (req, res) => {
  try {
    const userAuditLogs = auditLogs.filter(log => log.userId === req.params.userId);
    res.status(200).json({
      success: true,
      message: 'User audit logs retrieved successfully',
      data: userAuditLogs,
      count: userAuditLogs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving user audit logs',
      error: error.message
    });
  }
});

module.exports = router;
