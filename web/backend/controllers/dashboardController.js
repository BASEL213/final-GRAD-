const mongoose = require('mongoose');
const Application = require('../models/Application');
const Project = require('../models/Project');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @desc    Get dashboard metrics
// @route   GET /api/dashboard/metrics
// @access  Public
exports.getDashboardMetrics = async (req, res) => {
    try {
        const validProjectIds = (await Project.find({}).select('_id').lean()).map((p) => String(p._id));
        const appQuery = validProjectIds.length
            ? { projectId: { $in: validProjectIds } }
            : { _id: null };

        // Get counts from all collections (applications only linked to MongoDB projects)
        const [applicationsCount, projectsCount, usersCount] = await Promise.all([
            Application.countDocuments(appQuery),
            Project.countDocuments(),
            User.countDocuments()
        ]);

        // Get application status counts
        const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
            Application.countDocuments({ ...appQuery, status: 'pending' }),
            Application.countDocuments({ ...appQuery, status: 'approved' }),
            Application.countDocuments({ ...appQuery, status: 'rejected' })
        ]);

        // Get project status counts
        const [activeProjects, planningProjects] = await Promise.all([
            Project.countDocuments({ status: 'active' }),
            Project.countDocuments({ status: 'planning' })
        ]);

        const totalApplications = applicationsCount;
        const approvalRate = totalApplications > 0 ? 
            Math.round((approvedCount / totalApplications) * 100) : 0;

        const metrics = {
            totalApplications,
            pendingApplications: pendingCount,
            approvedApplications: approvedCount,
            rejectedApplications: rejectedCount,
            approvalRate,
            totalProjects: projectsCount,
            activeProjects,
            planningProjects,
            totalUsers: usersCount,
            todayApplications: 0, // TODO: Calculate today's applications
            thisWeekApplications: 0, // TODO: Calculate this week's applications
            thisMonthApplications: 0 // TODO: Calculate this month's applications
        };

        res.status(200).json({
            success: true,
            data: metrics
        });
    } catch (error) {
        console.error('Error getting dashboard metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard metrics',
            error: error.message
        });
    }
};

// @desc    Get dashboard insights
// @route   GET /api/dashboard/insights
// @access  Public
exports.getDashboardInsights = async (req, res) => {
    try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        // Applications pending over 3 days
        const pendingOver3Days = await Application.countDocuments({
            status: 'pending',
            createdAt: { $lt: threeDaysAgo }
        });

        const validProjectIds = (await Project.find({}).select('_id').lean()).map((p) => String(p._id));
        const appQuery = validProjectIds.length
            ? { projectId: { $in: validProjectIds } }
            : { _id: null };

        // Get all applications and projects for demand analysis
        const applications = await Application.find(appQuery);
        const projects = await Project.find({});

        // Calculate project demand
        const projectDemand = {};
        applications.forEach(app => {
            if (app.projectId) {
                projectDemand[app.projectId] = (projectDemand[app.projectId] || 0) + 1;
            }
        });

        const highDemandProjects = projects
            .filter(project => projectDemand[project._id] > 5)
            .map(project => ({
                ...project.toObject(),
                applicationCount: projectDemand[project._id] || 0
            }));

        const totalApplications = applications.length;
        const approvedApplications = applications.filter(app => app.status === 'approved').length;
        const approvalRate = totalApplications > 0 ? 
            Math.round((approvedApplications / totalApplications) * 100) : 0;

        const insights = {
            pendingOver3Days,
            highDemandProjects,
            lowApprovalRate: approvalRate < 40,
            urgentApplications: [] // TODO: Get actual urgent applications
        };

        res.status(200).json({
            success: true,
            data: insights
        });
    } catch (error) {
        console.error('Error getting dashboard insights:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard insights',
            error: error.message
        });
    }
};

// @desc    Get application trends
// @route   GET /api/dashboard/trends
// @access  Public
exports.getApplicationTrends = async (req, res) => {
    try {
        const applications = await Application.find({})
            .sort({ createdAt: 1 });

        const monthlyData = {};

        applications.forEach(app => {
            const date = new Date(app.createdAt);
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

        const trends = Object.values(monthlyData)
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6); // Last 6 months

        res.status(200).json({
            success: true,
            data: trends
        });
    } catch (error) {
        console.error('Error getting application trends:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching application trends',
            error: error.message
        });
    }
};

// @desc    Get system health
// @route   GET /api/dashboard/health
// @access  Public
exports.getSystemHealth = async (req, res) => {
    try {
        // Check database connection
        const dbState = mongoose.connection.readyState;
        const dbStatus = dbState === 1 ? 'Connected' : 'Disconnected';

        const health = {
            apiResponseTime: 'Fast',
            databaseStatus: dbStatus,
            storageUsage: 78,
            lastBackup: new Date().toISOString(),
            timestamp: new Date().toISOString()
        };

        res.status(200).json({
            success: true,
            data: health
        });
    } catch (error) {
        console.error('Error getting system health:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching system health',
            error: error.message
        });
    }
};
