const User = require('../models/User');
const { validationResult } = require('express-validator');
const auditService = require('../utils/auditService');

// @desc    Get all users
// @route   GET /api/users
// @access  Public
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 500;
        const role = req.query.role;
        const status = req.query.status;
        const department = req.query.department;
        const isVerified = req.query.isVerified;
        const search = req.query.search;

        // Build query
        let query = {};
        
        if (role && ['citizen', 'employee', 'admin'].includes(role)) {
            query.role = role;
        }

        if (status && ['active', 'inactive', 'suspended'].includes(status)) {
            query.status = status;
        }

        if (department) {
            query.department = department;
        }
        
        if (isVerified !== undefined) {
            query.isVerified = isVerified === 'true';
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { nationalId: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ role: 1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(query);

        // Enrich with application link flags (by email or nationalId)
        const applications = await require('../models/Application')
            .find({})
            .select('email nationalId')
            .lean();
        const appEmails = new Set(applications.map((a) => (a.email || '').toLowerCase()).filter(Boolean));
        const appNids = new Set(applications.map((a) => (a.nationalId || '').trim()).filter(Boolean));

        const enriched = users.map((u) => {
            const obj = u.toObject ? u.toObject() : { ...u };
            const email = (obj.email || '').toLowerCase();
            const nid = (obj.nationalId || '').trim();
            obj.hasApplication = appEmails.has(email) || appNids.has(nid);
            obj.applicationEmailMatch = appEmails.has(email);
            obj.applicationNationalIdMatch = appNids.has(nid);
            return obj;
        });

        res.status(200).json({
            success: true,
            count: enriched.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: enriched
        });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error in getUserById:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Public
exports.createUser = async (req, res) => {
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

        // Check if user with same email or national ID already exists
        const existingUser = await User.findOne({
            $or: [
                { email: req.body.email },
                { nationalId: req.body.nationalId }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'A user with this email or National ID already exists'
            });
        }

        const role = (req.body.role || '').toLowerCase();
        if (!['admin', 'employee'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Only Admin and Employee accounts can be created here. Citizens register via the public portal.',
            });
        }

        const payload = { ...req.body, role };
        if (role === 'admin') {
            payload.department = 'Administration';
        }
        if (role === 'employee' && !payload.department) {
            return res.status(400).json({
                success: false,
                message: 'Department is required for Employee accounts',
            });
        }

        const user = await User.create(payload);

        await auditService.logUserChange('USER_CREATED', user, req.body.createdBy || 'Admin', req);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse
        });
    } catch (error) {
        console.error('Error in createUser:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `A user with this ${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Public
exports.updateUser = async (req, res) => {
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

        let user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email or national ID is being updated to an existing one
        if (req.body.email || req.body.nationalId) {
            const existingUser = await User.findOne({
                _id: { $ne: req.params.id },
                $or: [
                    { email: req.body.email },
                    { nationalId: req.body.nationalId }
                ].filter(Boolean)
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'A user with this email or National ID already exists'
                });
            }
        }

        const updates = { ...req.body };
        const effectiveRole = (updates.role || user.role || '').toLowerCase();

        if (effectiveRole === 'citizen') {
            delete updates.department;
            delete updates.role;
        } else if (!['admin', 'employee'].includes(effectiveRole)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Staff accounts must be Admin or Employee.',
            });
        } else if (effectiveRole === 'admin') {
            updates.department = 'Administration';
        } else if (effectiveRole === 'employee' && updates.department === undefined && !user.department) {
            return res.status(400).json({
                success: false,
                message: 'Department is required for Employee accounts',
            });
        }

        user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            {
                new: true,
                runValidators: true
            }
        ).select('-password');

        const action =
            updates.status === 'inactive'
                ? 'USER_DEACTIVATED'
                : updates.status === 'active'
                  ? 'USER_ACTIVATED'
                  : 'USER_UPDATED';
        await auditService.logUserChange(action, user, req.body.updatedBy || 'Admin', req);

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Error in updateUser:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `A user with this ${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error.message
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Public
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: user
        });
    } catch (error) {
        console.error('Error in deleteUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// @desc    Verify user
// @route   PATCH /api/users/:id/verify
// @access  Public
exports.verifyUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.isVerified = true;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User verified successfully',
            data: user
        });
    } catch (error) {
        console.error('Error in verifyUser:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying user',
            error: error.message
        });
    }
};

// @desc    Reset user password (admin action)
// @route   PATCH /api/users/:id/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const newPassword = req.body.password || req.body.temporaryPassword;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Temporary password must be at least 6 characters'
            });
        }

        user.password = newPassword;
        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            success: true,
            message: 'Password reset successfully',
            data: userResponse
        });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Public
exports.getUserStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalEmployees,
            totalAdmins,
            totalCitizens,
            activeUsers,
            inactiveUsers,
            suspendedUsers
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'employee' }),
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ role: 'citizen' }),
            User.countDocuments({ status: 'active' }),
            User.countDocuments({ status: 'inactive' }),
            User.countDocuments({ status: 'suspended' })
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalEmployees,
                totalAdmins,
                totalCitizens,
                totalStaff: totalEmployees + totalAdmins,
                activeUsers,
                inactiveUsers,
                suspendedUsers
            }
        });
    } catch (error) {
        console.error('Error in getUserStats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
};
