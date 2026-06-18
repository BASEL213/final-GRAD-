const express = require('express');
const router = express.Router();

// Import MongoDB-only controller
const {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectStats
} = require('../controllers/projectController');

// @desc    Get all projects
// @route   GET /api/projects-mongodb
// @access  Public
router.get('/', getAllProjects);

// @desc    Get project statistics
// @route   GET /api/projects-mongodb/stats
// @access  Public
router.get('/stats', getProjectStats);

// @desc    Get single project by ID
// @route   GET /api/projects-mongodb/:id
// @access  Public
router.get('/:id', getProjectById);

// @desc    Create new project
// @route   POST /api/projects-mongodb
// @access  Public
router.post('/', createProject);

// @desc    Update project
// @route   PUT /api/projects-mongodb/:id
// @access  Public
router.put('/:id', updateProject);

// @desc    Delete project
// @route   DELETE /api/projects-mongodb/:id
// @access  Public
router.delete('/:id', deleteProject);

module.exports = router;
