const User = require('../models/User');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const auditService = require('../utils/auditService');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret-key', {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, email, password, phone, nationalId } = req.body;
        const role = 'citizen';

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { nationalId }]
        });

        if (existingUser) {
            const field = existingUser.email === email ? 'email' : 'national ID';
            return res.status(400).json({
                success: false,
                message: `User with this ${field} already exists`
            });
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password,
            phone,
            nationalId,
            role
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    nationalId: user.nationalId,
                    role: user.role,
                    isVerified: user.isVerified,
                    createdAt: user.createdAt
                },
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Registration failed'
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Try database first
        try {
            // Find user and include password
            const user = await User.findOne({ email }).select('+password');

            if (!user || !(await user.comparePassword(password))) {
                await auditService.logLogin({ email, name: email }, req, false);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            user.lastLogin = new Date();
            await user.save({ validateBeforeSave: false });

            await auditService.logLogin(user, req, true);

            // Generate token
            const token = generateToken(user._id);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        nationalId: user.nationalId,
                        role: user.role,
                        isVerified: user.isVerified,
                        profile: user.profile,
                        createdAt: user.createdAt
                    },
                    token
                }
            });
        } catch (dbError) {
            console.log('Database connection failed, using fallback login:', dbError.message);
            
            // Fallback login for demo purposes
            const fallbackUsers = [
                {
                    id: 'admin-fallback',
                    name: 'Admin User',
                    email: 'admin@gov.eg',
                    password: 'admin123',
                    phone: '01234567890',
                    nationalId: '12345678901234',
                    role: 'admin',
                    isVerified: true,
                    profile: {
                        address: 'Cairo, Egypt',
                        occupation: 'System Administrator',
                        familySize: 4
                    },
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'citizen-fallback',
                    name: 'Citizen User',
                    email: 'citizen@example.com',
                    password: '123456',
                    phone: '01234567891',
                    nationalId: '12345678901235',
                    role: 'citizen',
                    isVerified: true,
                    profile: {
                        address: 'Alexandria, Egypt',
                        occupation: 'Engineer',
                        familySize: 3
                    },
                    createdAt: new Date().toISOString()
                }
            ];

            const fallbackUser = fallbackUsers.find(user => 
                user.email === email && user.password === password
            );

            if (!fallbackUser) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password'
                });
            }

            // Generate token
            const token = generateToken(fallbackUser.id);

            const { password: _, ...userWithoutPassword } = fallbackUser;

            res.status(200).json({
                success: true,
                message: 'Login successful (fallback mode)',
                data: {
                    user: userWithoutPassword,
                    token
                }
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Login failed'
        });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    nationalId: user.nationalId,
                    role: user.role,
                    isVerified: user.isVerified,
                    profile: user.profile,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch profile'
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, phone, profile } = req.body;

        // Find user and update
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, phone, profile },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    nationalId: user.nationalId,
                    role: user.role,
                    isVerified: user.isVerified,
                    profile: user.profile,
                    updatedAt: user.updatedAt
                }
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to update profile'
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No user found with this email'
            });
        }

        // Generate reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // In production, you would send an email here
        // For demo purposes, we'll return the token
        console.log('Password reset token:', resetToken);

        res.status(200).json({
            success: true,
            message: 'Password reset token generated. Check console for token (in production, this would be emailed).',
            // In production, remove this token from response
            data: {
                resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
            }
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while processing forgot password',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to process request'
        });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { token, password } = req.body;

        // Hash token and find user
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        }).select('+passwordResetToken +passwordResetExpires');

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Set new password
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Generate new token for automatic login
        const jwtToken = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Password reset successful',
            data: {
                token: jwtToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while resetting password',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to reset password'
        });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while changing password',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to change password'
        });
    }
};
