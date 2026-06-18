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
    resetPassword,
    getUserStats
} = require('../controllers/userController-mongodb');

// @desc    Get all users
// @route   GET /api/users
// @access  Public
router.get('/', getAllUsers);

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Public
router.get('/stats', getUserStats);

// @desc    Reset user password
// @route   PATCH /api/users/:id/reset-password
// @access  Public
router.patch('/:id/reset-password', resetPassword);

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', getUserById);

// @desc    Create new user
// @route   POST /api/users
// @access  Public
router.post('/', createUser);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Public
router.put('/:id', updateUser);

// @desc    Verify user
// @route   PATCH /api/users/:id/verify
// @access  Public
router.patch('/:id/verify', verifyUser);

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Public
router.delete('/:id', deleteUser);

module.exports = router;
