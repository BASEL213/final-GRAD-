const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
exports.getAllProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const type = req.query.type;
        const search = req.query.search;

        // Build query
        let query = {};
        
        if (status && ['active', 'completed', 'planning'].includes(status)) {
            query.status = status;
        }
        
        if (type && ['Apartments', 'Villas', 'Mixed'].includes(type)) {
            query.type = type;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const projects = await Project.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Project.countDocuments(query);

        res.status(200).json({
            success: true,
            count: projects.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: projects
        });
    } catch (error) {
        console.error('Error in getAllProjects:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching projects',
            error: error.message
        });
    }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Public
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('Error in getProjectById:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching project',
            error: error.message
        });
    }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Public
exports.createProject = async (req, res) => {
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

        // Create project
        const project = await Project.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project
        });
    } catch (error) {
        console.error('Error in createProject:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating project',
            error: error.message
        });
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Public
exports.updateProject = async (req, res) => {
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

        let project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Update project
        project = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            data: project
        });
    } catch (error) {
        console.error('Error in updateProject:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating project',
            error: error.message
        });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Public
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        await project.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully',
            data: project
        });
    } catch (error) {
        console.error('Error in deleteProject:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting project',
            error: error.message
        });
    }
};

// @desc    Get project statistics
// @route   GET /api/projects/stats
// @access  Public
exports.getProjectStats = async (req, res) => {
    try {
        const stats = await Project.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalUnits: { $sum: '$totalUnits' },
                    availableUnits: { $sum: '$availableUnits' }
                }
            }
        ]);

        const totalProjects = await Project.countDocuments();

        const formattedStats = {
            total: totalProjects,
            active: 0,
            completed: 0,
            planning: 0,
            totalUnits: 0,
            availableUnits: 0
        };

        stats.forEach(stat => {
            formattedStats[stat._id] = stat.count;
            formattedStats.totalUnits += stat.totalUnits;
            formattedStats.availableUnits += stat.availableUnits;
        });

        res.status(200).json({
            success: true,
            data: formattedStats
        });
    } catch (error) {
        console.error('Error in getProjectStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching project statistics',
            error: error.message
        });
    }
};
