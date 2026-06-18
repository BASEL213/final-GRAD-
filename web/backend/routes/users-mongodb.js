const express = require('express');
const router = express.Router();

// Import MongoDB-only controller
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    verifyUser,
    getUserStats
} = require('../controllers/userController-mongodb');

// @desc    Get all users
// @route   GET /api/users-mongodb
// @access  Public
router.get('/', getAllUsers);

// @desc    Get user statistics
// @route   GET /api/users-mongodb/stats
// @access  Public
router.get('/stats', getUserStats);

// @desc    Get single user by ID
// @route   GET /api/users-mongodb/:id
// @access  Public
router.get('/:id', getUserById);

// @desc    Create new user
// @route   POST /api/users-mongodb
// @access  Public
router.post('/', createUser);

// @desc    Update user
// @route   PUT /api/users-mongodb/:id
// @access  Public
router.put('/:id', updateUser);

// @desc    Verify user
// @route   PATCH /api/users-mongodb/:id/verify
// @access  Public
router.patch('/:id/verify', verifyUser);

// @desc    Delete user
// @route   DELETE /api/users-mongodb/:id
// @access  Public
router.delete('/:id', deleteUser);

module.exports = router;
