const express = require('express');
const router = express.Router();

// Import MongoDB-only controller
const {
    getAllApplications,
    getApplicationById,
    createApplication,
    updateApplication,
    deleteApplication,
    updateApplicationStatus,
    getApplicationStats
} = require('../controllers/applicationController');

// @desc    Get all applications
// @route   GET /api/applications-mongodb
// @access  Public
router.get('/', getAllApplications);

// @desc    Get application statistics
// @route   GET /api/applications-mongodb/stats
// @access  Public
router.get('/stats', getApplicationStats);

// @desc    Get single application by ID
// @route   GET /api/applications-mongodb/:id
// @access  Public
router.get('/:id', getApplicationById);

// @desc    Create new application
// @route   POST /api/applications-mongodb
// @access  Public
router.post('/', createApplication);

// @desc    Update application
// @route   PUT /api/applications-mongodb/:id
// @access  Public
router.put('/:id', updateApplication);

// @desc    Update application status
// @route   PATCH /api/applications-mongodb/:id/status
// @access  Public
router.patch('/:id/status', updateApplicationStatus);

// @desc    Delete application
// @route   DELETE /api/applications-mongodb/:id
// @access  Public
router.delete('/:id', deleteApplication);

module.exports = router;
