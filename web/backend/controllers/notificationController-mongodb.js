const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Public
exports.getAllNotifications = async (req, res) => {
    try {
        console.log('🔍 getAllNotifications called!');
        
        // Simple approach - get all notifications
        const notifications = await Notification.find({}).sort({ createdAt: -1 }).limit(50);
        console.log(`📊 Found ${notifications.length} notifications`);
        
        // Return the data
        res.status(200).json({
            success: true,
            count: notifications.length,
            total: notifications.length,
            page: 1,
            pages: 1,
            data: notifications
        });
        
    } catch (error) {
        console.error('❌ Error in getAllNotifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications',
            error: error.message
        });
    }
};

// @desc    Get single notification by ID
// @route   GET /api/notifications/:id
// @access  Public
exports.getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Check if notification is expired
        if (notification.isExpired) {
            return res.status(410).json({
                success: false,
                message: 'Notification has expired'
            });
        }

        res.status(200).json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Error in getNotificationById:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notification',
            error: error.message
        });
    }
};

// @desc    Create new notification
// @route   POST /api/notifications
// @access  Public
exports.createNotification = async (req, res) => {
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

        // Create notification
        const notification = await Notification.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: notification
        });
    } catch (error) {
        console.error('Error in createNotification:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating notification',
            error: error.message
        });
    }
};

// @desc    Update notification
// @route   PUT /api/notifications/:id
// @access  Public
exports.updateNotification = async (req, res) => {
    try {
        let notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Check if notification is expired
        if (notification.isExpired) {
            return res.status(410).json({
                success: false,
                message: 'Cannot update expired notification'
            });
        }

        // Update notification
        notification = await Notification.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            success: true,
            message: 'Notification updated successfully',
            data: notification
        });
    } catch (error) {
        console.error('Error in updateNotification:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notification',
            error: error.message
        });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Public
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await notification.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully',
            data: notification
        });
    } catch (error) {
        console.error('Error in deleteNotification:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting notification',
            error: error.message
        });
    }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Public
exports.markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Check if notification is expired
        if (notification.isExpired) {
            return res.status(410).json({
                success: false,
                message: 'Cannot update expired notification'
            });
        }

        await notification.markAsRead();

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        console.error('Error in markNotificationAsRead:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking notification as read',
            error: error.message
        });
    }
};

// @desc    Mark all notifications as read for a user
// @route   PATCH /api/notifications/mark-all-read
// @access  Public
exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        const { targetUserId } = req.body;

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'Target user ID is required'
            });
        }

        const result = await Notification.updateMany(
            { 
                targetUserId, 
                isRead: false,
                $or: [
                    { expiresAt: { $exists: false } },
                    { expiresAt: { $gt: new Date() } }
                ]
            },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: `${result.modifiedCount} notifications marked as read`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error in markAllNotificationsAsRead:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking notifications as read',
            error: error.message
        });
    }
};

// @desc    Get unread notifications count for a user
// @route   GET /api/notifications/unread-count
// @access  Public
exports.getUnreadNotificationsCount = async (req, res) => {
    try {
        const { targetUserId } = req.query;

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'Target user ID is required'
            });
        }

        const count = await Notification.countDocuments({
            targetUserId,
            isRead: false,
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } }
            ]
        });

        res.status(200).json({
            success: true,
            unreadCount: count
        });
    } catch (error) {
        console.error('Error in getUnreadNotificationsCount:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching unread notifications count',
            error: error.message
        });
    }
};

// @desc    Delete expired notifications
// @route   DELETE /api/notifications/cleanup-expired
// @access  Public
exports.deleteExpiredNotifications = async (req, res) => {
    try {
        const result = await Notification.deleteMany({
            expiresAt: { $lt: new Date() }
        });

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} expired notifications deleted`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error in deleteExpiredNotifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting expired notifications',
            error: error.message
        });
    }
};
