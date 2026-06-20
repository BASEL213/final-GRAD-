const User = require('../models/User');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const https = require('https');
const auditService = require('../utils/auditService');
const { sendOtpEmail } = require('../utils/emailService');

// Generate JWT Token — always include role so middleware can authorise without a DB lookup
const generateToken = (id, role = 'citizen') => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'findoor_jwt_secret_2024_housing_system', {
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
        const token = generateToken(user._id, user.role);

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
            const token = generateToken(user._id, user.role);

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
            console.error('Database connection failed:', dbError.message);
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable. Please try again later.'
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

// @desc    Forgot password — sends 6-digit OTP to email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
        }

        const { email } = req.body;
        const user = await User.findOne({ email });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.status(200).json({ success: true, message: 'If that email is registered, an OTP has been sent.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.passwordResetToken = crypto.createHash('sha256').update(otp).digest('hex');
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save({ validateBeforeSave: false });

        try {
            await sendOtpEmail(email, otp);
        } catch (emailErr) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            console.error('Email send failed:', emailErr.message);
            return res.status(500).json({ success: false, message: 'Failed to send OTP email. Check server email configuration.' });
        }

        res.status(200).json({ success: true, message: 'OTP sent to your email address.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Server error while processing forgot password' });
    }
};

// @desc    Reset password using OTP (email + otp + new password)
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        if (!email || !otp || !password) {
            return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const hashedOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');

        const user = await User.findOne({
            email,
            passwordResetToken: hashedOtp,
            passwordResetExpires: { $gt: Date.now() },
        }).select('+passwordResetToken +passwordResetExpires');

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        const jwtToken = generateToken(user._id, user.role);
        res.status(200).json({
            success: true,
            message: 'Password reset successful.',
            data: { token: jwtToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Server error while resetting password.' });
    }
};

// @desc    Google Sign-In — verify Google ID token or access token and return app JWT
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
    try {
        const { idToken, accessToken } = req.body;
        if (!idToken && !accessToken) {
            return res.status(400).json({ success: false, message: 'Google token is required.' });
        }

        // Verify token with Google — prefer idToken, fall back to accessToken (web)
        const payload = await new Promise((resolve, reject) => {
            let url;
            if (idToken) {
                url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
            } else {
                url = `https://www.googleapis.com/oauth2/v3/userinfo`;
            }

            const options = idToken ? {} : {
                headers: { Authorization: `Bearer ${accessToken}` }
            };

            const makeRequest = (targetUrl, reqOptions) => {
                const urlObj = new URL(targetUrl);
                const reqOpts = {
                    hostname: urlObj.hostname,
                    path: urlObj.pathname + urlObj.search,
                    method: 'GET',
                    ...reqOptions,
                };
                https.request(reqOpts, (resp) => {
                    let data = '';
                    resp.on('data', (chunk) => { data += chunk; });
                    resp.on('end', () => {
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.error) reject(new Error(parsed.error_description || 'Invalid token'));
                            else resolve(parsed);
                        } catch { reject(new Error('Failed to parse Google response')); }
                    });
                }).on('error', reject).end();
            };

            makeRequest(url, options);
        });

        const { sub: googleId, email, name, picture } = payload;
        if (!email) return res.status(400).json({ success: false, message: 'Could not retrieve email from Google.' });

        // Find existing user by googleId or email
        let user = await User.findOne({ $or: [{ googleId }, { email }] }).select('+googleId');

        if (user) {
            // Link Google ID if not already linked
            if (!user.googleId) {
                user.googleId = googleId;
                user.isGoogleUser = true;
                await user.save({ validateBeforeSave: false });
            }
        } else {
            // Create new Google user
            user = await User.create({
                name: name || email.split('@')[0],
                email,
                googleId,
                isGoogleUser: true,
                role: 'citizen',
            });
        }

        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const token = generateToken(user._id, user.role);
        res.status(200).json({
            success: true,
            message: 'Google sign-in successful.',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone || '',
                    nationalId: user.nationalId || '',
                    role: user.role,
                    isVerified: user.isVerified,
                    isGoogleUser: user.isGoogleUser,
                    picture: picture || null,
                },
            },
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(401).json({ success: false, message: error.message || 'Google authentication failed.' });
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
