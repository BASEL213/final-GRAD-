const express = require('express');
const router = express.Router();

// Import MongoDB-only controller
const {
    getAllAuditLogs,
    getAuditLogById,
    createAuditLog,
    getAuditLogStats,
    getRecentAuditLogs
} = require('../controllers/auditLogController-mongodb');

// @desc    Get all audit logs
// @route   GET /api/auditLogs-mongodb
// @access  Public
router.get('/', getAllAuditLogs);

// @desc    Get audit log statistics
// @route   GET /api/auditLogs-mongodb/stats
// @access  Public
router.get('/stats', getAuditLogStats);

// @desc    Get recent audit logs
// @route   GET /api/auditLogs-mongodb/recent
// @access  Public
router.get('/recent', getRecentAuditLogs);

// @desc    Get single audit log by ID
// @route   GET /api/auditLogs-mongodb/:id
// @access  Public
router.get('/:id', getAuditLogById);

// @desc    Create new audit log
// @route   POST /api/auditLogs-mongodb
// @access  Public
router.post('/', createAuditLog);

module.exports = router;
