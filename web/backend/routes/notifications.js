const express = require('express');
const router = express.Router();
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

// GET /api/notifications - Get all notifications
router.get('/', getAllNotifications);

// GET /api/notifications/:id - Get notification by ID
router.get('/:id', getNotificationById);

// POST /api/notifications - Create new notification
router.post('/', createNotification);

// PUT /api/notifications/:id - Update notification
router.put('/:id', updateNotification);

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', deleteNotification);

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', markNotificationAsRead);

// PATCH /api/notifications/mark-all-read - Mark all notifications as read
router.patch('/mark-all-read', markAllNotificationsAsRead);

// GET /api/notifications/unread-count - Get unread notifications count
router.get('/unread-count', getUnreadNotificationsCount);

// DELETE /api/notifications/cleanup-expired - Delete expired notifications
router.delete('/cleanup-expired', deleteExpiredNotifications);

module.exports = router;
