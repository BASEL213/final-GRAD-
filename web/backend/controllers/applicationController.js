const mongoose = require('mongoose');
const Application = require('../models/Application');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');
const auditService = require('../utils/auditService');

/** IDs of all projects in MongoDB */
const getValidProjectIdSet = async () => {
    const projects = await Project.find({}).select('_id').lean();
    return new Set(projects.map((p) => String(p._id)));
};

/** Delete applications whose projectId is missing or not in the projects collection */
exports.cleanupOrphanApplications = async () => {
    const validProjectIds = await getValidProjectIdSet();
    const allApps = await Application.find({}).select('_id projectId').lean();

    const orphanIds = allApps
        .filter((app) => {
            const pid = String(app.projectId || '');
            return !pid || !mongoose.Types.ObjectId.isValid(pid) || !validProjectIds.has(pid);
        })
        .map((app) => app._id);

    if (orphanIds.length === 0) {
        return { deletedCount: 0 };
    }

    const result = await Application.deleteMany({ _id: { $in: orphanIds } });
    console.log(`🗑️ Removed ${result.deletedCount} application(s) not linked to a MongoDB project`);
    return { deletedCount: result.deletedCount };
};

/** Attach real project records from MongoDB by projectId */
const enrichApplicationsWithProjects = async (applications) => {
    const list = applications.map((a) => (a.toObject ? a.toObject() : { ...a }));
    const validIds = [
        ...new Set(
            list
                .map((a) => a.projectId)
                .filter((id) => id && mongoose.Types.ObjectId.isValid(String(id)))
                .map(String)
        ),
    ];

    const projects = validIds.length
        ? await Project.find({ _id: { $in: validIds } }).lean()
        : [];
    const projectById = Object.fromEntries(projects.map((p) => [String(p._id), p]));

    return list.map((app) => {
        const pid = String(app.projectId || '');
        const project = projectById[pid];
        return {
            ...app,
            projectLinked: !!project,
            projectMongoId: project ? String(project._id) : null,
            projectName: project ? project.name : app.projectName,
            projectLocation: project?.location || null,
            projectStatus: project?.status || null,
            projectDetails: project
                ? {
                      _id: project._id,
                      name: project.name,
                      location: project.location,
                      status: project.status,
                      priceRange: project.priceRange,
                      availableUnits: project.availableUnits,
                      totalUnits: project.totalUnits,
                  }
                : null,
        };
    });
};

// @desc    Get all applications
// @route   GET /api/applications
// @access  Public
exports.getAllApplications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 500;
        const status = req.query.status;
        const search = req.query.search;

        // Build query
        let query = {};
        
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { nationalId: { $regex: search, $options: 'i' } }
            ];
        }

        // Add debugging to track query execution
        console.log('🔍 API Query:', JSON.stringify(query, null, 2));
        console.log('🔍 Pagination - Page:', page, 'Limit:', limit);

        const applications = await Application.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Application.countDocuments(query);
        const enrichedData = await enrichApplicationsWithProjects(applications);
        const linkedOnly = enrichedData.filter((app) => app.projectLinked);

        console.log('📊 API Results:', linkedOnly.length, 'linked applications');
        console.log('📊 Total Count:', linkedOnly.length);

        res.status(200).json({
            success: true,
            count: linkedOnly.length,
            total: linkedOnly.length,
            page,
            pages: Math.ceil(total / limit),
            data: linkedOnly
        });
    } catch (error) {
        console.error('Error in getAllApplications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching applications',
            error: error.message
        });
    }
};

// @desc    Get recent applications linked to MongoDB projects
// @route   GET /api/applications/recent
// @access  Public
exports.getRecentApplications = async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 4, 1), 20);
        const validProjectIds = [...(await getValidProjectIdSet())];

        if (validProjectIds.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: [],
            });
        }

        const applications = await Application.find({ projectId: { $in: validProjectIds } })
            .sort({ createdAt: -1 })
            .limit(limit);

        const enrichedData = await enrichApplicationsWithProjects(applications);
        const linkedOnly = enrichedData.filter((app) => app.projectLinked);

        res.status(200).json({
            success: true,
            count: linkedOnly.length,
            data: linkedOnly,
        });
    } catch (error) {
        console.error('Error in getRecentApplications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching recent applications',
            error: error.message,
        });
    }
};

// @desc    Get single application by ID
// @route   GET /api/applications/:id
// @access  Public
exports.getApplicationById = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        const [enriched] = await enrichApplicationsWithProjects([application]);

        res.status(200).json({
            success: true,
            data: enriched
        });
    } catch (error) {
        console.error('Error in getApplicationById:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching application',
            error: error.message
        });
    }
};

// @desc    Create new application
// @route   POST /api/applications
// @access  Public
exports.createApplication = async (req, res) => {
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

        // Check if application with same national ID or email already exists
        const existingApplication = await Application.findOne({
            $or: [
                { nationalId: req.body.nationalId },
                { email: req.body.email }
            ]
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'An application with this National ID or email already exists'
            });
        }

        const projectId = String(req.body.projectId || '');
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid project ID. Please select a project from the housing projects list.',
            });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(400).json({
                success: false,
                message: 'Project not found. The application must be linked to an existing housing project.',
            });
        }

        if (project.availableUnits !== undefined && project.availableUnits <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No available units in this project. All units have been reserved.',
            });
        }

        const payload = {
            ...req.body,
            projectId: String(project._id),
            projectName: project.name,
        };

        // Use a MongoDB transaction so the application insert and the unit decrement
        // are atomic — if either fails the other is rolled back automatically.
        const session = await mongoose.startSession();
        let application;
        try {
            await session.withTransaction(async () => {
                [application] = await Application.create([payload], { session });

                // Decrement availableUnits only when the project tracks inventory
                if (project.availableUnits !== undefined && project.availableUnits > 0) {
                    await Project.findByIdAndUpdate(
                        project._id,
                        { $inc: { availableUnits: -1 } },
                        { session, new: true }
                    );
                }
            });
        } finally {
            session.endSession();
        }

        const [enriched] = await enrichApplicationsWithProjects([application]);

        await auditService.logApplicationCreated(application, req);

        // Create admin notification for new application (best-effort, must not block)
        try {
            const Notification = require('../models/Notification');
            await Notification.create({
                type: 'new_application',
                title: 'New Application Received',
                message: `${application.name} submitted a housing application for project "${application.projectName}".`,
                targetUserId: 'admin',
                priority: 'high',
                category: 'application',
                actionRequired: true,
                relatedEntityId: String(application._id),
                relatedEntityType: 'Application',
                actionUrl: `/applications/${application._id}`,
            });
        } catch (_notifErr) {}

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            data: enriched
        });
    } catch (error) {
        console.error('Error in createApplication:', error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `An application with this ${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating application',
            error: error.message
        });
    }
};

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Public
exports.updateApplication = async (req, res) => {
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

        let application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Update application
        application = await Application.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            message: 'Application updated successfully',
            data: application
        });
    } catch (error) {
        console.error('Error in updateApplication:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `An application with this ${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating application',
            error: error.message
        });
    }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Public
exports.deleteApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        await application.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Application deleted successfully',
            data: application
        });
    } catch (error) {
        console.error('Error in deleteApplication:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting application',
            error: error.message
        });
    }
};

// @desc    Update application status (approve/reject)
// @route   PATCH /api/applications/:id/status
// @access  Public
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status, rejectionReason, reviewedBy } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be pending, approved, or rejected'
            });
        }

        if (status === 'rejected' && !rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required when rejecting an application'
            });
        }

        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        const previousStatus = application.status;
        const wasApproved = previousStatus === 'approved';
        const nowApproved = status === 'approved';

        // Atomic unit tracking when approval status changes
        if (!wasApproved && nowApproved) {
            // Decrement only if units are available
            const updatedProject = await Project.findOneAndUpdate(
                { _id: application.projectId, availableUnits: { $gt: 0 } },
                { $inc: { availableUnits: -1 } },
                { new: true }
            );
            if (!updatedProject) {
                return res.status(409).json({
                    success: false,
                    message: 'Cannot approve: no available units remaining in this project.',
                });
            }
            // Auto-mark project as completed when last unit is reserved
            if (updatedProject.availableUnits === 0 && updatedProject.status === 'active') {
                await Project.updateOne({ _id: application.projectId }, { $set: { status: 'completed' } });
            }
        } else if (wasApproved && !nowApproved) {
            // Restore a unit when un-approving (reject/revert to pending)
            const restored = await Project.findOneAndUpdate(
                { _id: application.projectId },
                { $inc: { availableUnits: 1 } },
                { new: true }
            );
            // Re-activate project if it was auto-completed due to 0 units
            if (restored && restored.status === 'completed') {
                await Project.updateOne({ _id: application.projectId }, { $set: { status: 'active' } });
            }
        }

        // Update application status
        application.status = status;
        application.reviewedBy = reviewedBy;
        application.reviewedAt = new Date();

        if (status === 'rejected') {
            application.rejectionReason = rejectionReason;
        } else {
            application.rejectionReason = undefined;
        }

        await application.save();

        await auditService.logApplicationStatusChange(
            application,
            previousStatus,
            { name: reviewedBy || 'Admin', role: 'admin' },
            req
        );

        res.status(200).json({
            success: true,
            message: `Application ${status} successfully`,
            data: application
        });
    } catch (error) {
        console.error('Error in updateApplicationStatus:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating application status',
            error: error.message
        });
    }
};

// @desc    Get application statistics
// @route   GET /api/applications/stats
// @access  Public
exports.getApplicationStats = async (req, res) => {
    try {
        const validProjectIds = [...(await getValidProjectIdSet())];
        const matchStage = validProjectIds.length
            ? { $match: { projectId: { $in: validProjectIds } } }
            : { $match: { _id: null } };

        const stats = await Application.aggregate([
            matchStage,
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalApplications = validProjectIds.length
            ? await Application.countDocuments({ projectId: { $in: validProjectIds } })
            : 0;

        const formattedStats = {
            total: totalApplications,
            pending: 0,
            approved: 0,
            rejected: 0
        };

        stats.forEach(stat => {
            formattedStats[stat._id] = stat.count;
        });

        res.status(200).json({
            success: true,
            data: formattedStats
        });
    } catch (error) {
        console.error('Error in getApplicationStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching application statistics',
            error: error.message
        });
    }
};
