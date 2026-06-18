const express = require('express');
const router = express.Router();

// Import MongoDB-only controller
const {
    getAllNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    deleteNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getUnreadNotificationsCount,
    deleteExpiredNotifications
} = require('../controllers/notificationController-mongodb');

// @desc    Get all notifications
// @route   GET /api/notifications-mongodb
// @access  Public
router.get('/', getAllNotifications);

// @desc    Get unread notifications count
// @route   GET /api/notifications-mongodb/unread-count
// @access  Public
router.get('/unread-count', getUnreadNotificationsCount);

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications-mongodb/mark-all-read
// @access  Public
router.patch('/mark-all-read', markAllNotificationsAsRead);

// @desc    Delete expired notifications
// @route   DELETE /api/notifications-mongodb/cleanup-expired
// @access  Public
router.delete('/cleanup-expired', deleteExpiredNotifications);

// @desc    Get single notification by ID
// @route   GET /api/notifications-mongodb/:id
// @access  Public
router.get('/:id', getNotificationById);

// @desc    Mark notification as read
// @route   PATCH /api/notifications-mongodb/:id/read
// @access  Public
router.patch('/:id/read', markNotificationAsRead);

// @desc    Create new notification
// @route   POST /api/notifications-mongodb
// @access  Public
router.post('/', createNotification);

// @desc    Update notification
// @route   PUT /api/notifications-mongodb/:id
// @access  Public
router.put('/:id', updateNotification);

// @desc    Delete notification
// @route   DELETE /api/notifications-mongodb/:id
// @access  Public
router.delete('/:id', deleteNotification);

module.exports = router;
