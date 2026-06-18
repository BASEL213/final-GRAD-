const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

// Middleware to protect routes
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Not authorized. Token missing.' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'findoor_jwt_secret_2024_housing_system');
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Not authorized. Invalid token.' });
    }
};

// Validation middleware for registration
const validateRegister = [
    body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Name must be between 3 and 100 characters')
        .trim(),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('phone')
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^01[0-9]{9}$/)
        .withMessage('Phone number must start with 01 and be 11 digits'),
    body('nationalId')
        .notEmpty()
        .withMessage('National ID is required')
        .isLength({ min: 14, max: 14 })
        .withMessage('National ID must be exactly 14 digits')
        .isNumeric()
        .withMessage('National ID must contain only numbers'),
    body('role')
        .optional()
        .isIn(['citizen', 'admin'])
        .withMessage('Role must be either citizen or admin')
];

// Validation middleware for login
const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Validation middleware for profile update
const validateProfileUpdate = [
    body('name')
        .optional()
        .isLength({ min: 3, max: 100 })
        .withMessage('Name must be between 3 and 100 characters')
        .trim(),
    body('phone')
        .optional()
        .matches(/^01[0-9]{9}$/)
        .withMessage('Phone number must start with 01 and be 11 digits'),
    body('profile.address')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Address cannot exceed 200 characters'),
    body('profile.dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date'),
    body('profile.occupation')
        .optional()
        .isLength({ max: 100 })
        .withMessage('Occupation cannot exceed 100 characters'),
    body('profile.familySize')
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage('Family size must be between 1 and 20')
];

// Validation middleware for forgot password
const validateForgotPassword = [
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail()
];

// Validation middleware for reset password
const validateResetPassword = [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Validation middleware for change password
const validateChangePassword = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegister, authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, authController.login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', protect, authController.getProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, validateProfileUpdate, authController.updateProfile);

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', protect, validateChangePassword, authController.changePassword);

module.exports = router;
