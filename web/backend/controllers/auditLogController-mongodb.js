const AuditLog = require('../models/AuditLog');
const { validationResult } = require('express-validator');

// @desc    Get all audit logs
// @route   GET /api/auditLogs
// @access  Public
exports.getAllAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 500;
        const action = req.query.action;
        const role = req.query.role;
        const status = req.query.status;
        const userId = req.query.userId;
        const targetType = req.query.targetType;
        const search = req.query.search;

        // Build query
        let query = {};
        
        if (action && action !== 'all') {
            query.action = action.toUpperCase();
        }

        if (role && role !== 'all' && ['admin', 'employee', 'citizen'].includes(role)) {
            query.role = role;
        }

        if (status && status !== 'all' && ['SUCCESS', 'FAILED'].includes(status.toUpperCase())) {
            query.status = status.toUpperCase();
        }
        
        if (userId) {
            query.userId = userId;
        }
        
        if (targetType && targetType !== 'all' && ['user', 'application', 'project', 'system', 'auth'].includes(targetType)) {
            query.targetType = targetType;
        }
        
        if (search) {
            query.$or = [
                { userName: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } },
                { action: { $regex: search, $options: 'i' } }
            ];
        }

        const auditLogs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AuditLog.countDocuments(query);

        res.status(200).json({
            success: true,
            count: auditLogs.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: auditLogs
        });
    } catch (error) {
        console.error('Error in getAllAuditLogs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit logs',
            error: error.message
        });
    }
};

// @desc    Get single audit log by ID
// @route   GET /api/auditLogs/:id
// @access  Public
exports.getAuditLogById = async (req, res) => {
    try {
        const auditLog = await AuditLog.findById(req.params.id);

        if (!auditLog) {
            return res.status(404).json({
                success: false,
                message: 'Audit log not found'
            });
        }

        res.status(200).json({
            success: true,
            data: auditLog
        });
    } catch (error) {
        console.error('Error in getAuditLogById:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit log',
            error: error.message
        });
    }
};

// @desc    Create new audit log
// @route   POST /api/auditLogs
// @access  Public
exports.createAuditLog = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const allowed = AuditLog.schema.path('action').enumValues;
        const body = { ...req.body };
        let action = String(body.action || 'APPLICATION_UPDATED').toUpperCase().replace(/-/g, '_');
        if (action.includes('APPROVED')) action = 'APPLICATION_APPROVED';
        else if (action.includes('REJECTED')) action = 'APPLICATION_REJECTED';
        else if (action.includes('CREATED')) action = 'APPLICATION_CREATED';
        if (!allowed.includes(action)) action = 'APPLICATION_UPDATED';

        const auditLog = await AuditLog.create({
            userId: body.userId || 'system',
            userName: body.userName || 'System',
            role: body.role || 'admin',
            action,
            targetType: body.targetType || 'system',
            targetId: body.targetId,
            status: body.status || 'SUCCESS',
            ipAddress: body.ipAddress || '127.0.0.1',
            userAgent: body.userAgent || 'Housing System',
            details: body.details || action,
            previousStatus: body.previousStatus,
            newStatus: body.newStatus,
            rejectionReason: body.rejectionReason,
        });

        res.status(201).json({
            success: true,
            message: 'Audit log created successfully',
            data: auditLog
        });
    } catch (error) {
        console.error('Error in createAuditLog:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating audit log',
            error: error.message
        });
    }
};

// @desc    Get audit log statistics
// @route   GET /api/auditLogs/stats
// @access  Public
exports.getAuditLogStats = async (req, res) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [
            total,
            approvals,
            rejections,
            logins,
            todayActivities,
            activeAdmins,
        ] = await Promise.all([
            AuditLog.countDocuments(),
            AuditLog.countDocuments({ action: 'APPLICATION_APPROVED' }),
            AuditLog.countDocuments({ action: 'APPLICATION_REJECTED' }),
            AuditLog.countDocuments({ action: 'LOGIN' }),
            AuditLog.countDocuments({ createdAt: { $gte: startOfToday } }),
            AuditLog.distinct('userName', { role: 'admin', action: 'LOGIN' }),
        ]);

        res.status(200).json({
            success: true,
            data: {
                total,
                totalActivities: total,
                approvals,
                rejections,
                logins,
                todayActivities,
                activeAdmins: activeAdmins.length,
            }
        });
    } catch (error) {
        console.error('Error in getAuditLogStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit log statistics',
            error: error.message
        });
    }
};

// @desc    Get recent audit logs
// @route   GET /api/auditLogs/recent
// @access  Public
exports.getRecentAuditLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const auditLogs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json({
            success: true,
            count: auditLogs.length,
            data: auditLogs
        });
    } catch (error) {
        console.error('Error in getRecentAuditLogs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent audit logs',
            error: error.message
        });
    }
};
