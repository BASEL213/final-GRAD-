const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// @route   GET /api/users
// @desc    Get all users
// @access  Public
router.get('/', userController.getAllUsers);

// @route   GET /api/users/:id
// @desc    Get single user by ID
// @access  Public
router.get('/:id', userController.getUserById);

// @route   POST /api/users
// @desc    Create new user
// @access  Public
router.post('/', userController.createUser);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Public
router.put('/:id', userController.updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Public
router.delete('/:id', userController.deleteUser);

module.exports = router;
