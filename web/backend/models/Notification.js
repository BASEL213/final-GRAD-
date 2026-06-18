const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        required: [true, 'Notification type is required'],
        enum: [
            'new_application',
            'application_approved',
            'application_rejected',
            'project_update',
            'system_alert',
            'user_registered',
            'deadline_reminder',
            'maintenance_notice'
        ]
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [500, 'Message cannot exceed 500 characters']
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    category: {
        type: String,
        enum: ['applications', 'projects', 'users', 'system', 'maintenance'],
        default: 'system'
    },
    targetUserId: {
        type: String,
        required: [true, 'Target user ID is required'],
        ref: 'User'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    actionRequired: {
        type: Boolean,
        default: false
    },
    relatedEntityId: {
        type: String,
        required: false
    },
    relatedEntityType: {
        type: String,
        enum: ['application', 'project', 'user', 'system'],
        required: false
    },
    expiresAt: {
        type: Date,
        required: false
    },
    actionUrl: {
        type: String,
        required: false,
        trim: true
    }
}, {
    timestamps: true
});

// Index for better query performance
notificationSchema.index({ targetUserId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ expiresAt: 1 });

// Virtual for formatted creation date
notificationSchema.virtual('createdFormatted').get(function() {
    return this.createdAt ? this.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) : '';
});

// Virtual for expiration status
notificationSchema.virtual('isExpired').get(function() {
    return this.expiresAt && this.expiresAt < new Date();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
    this.isRead = true;
    return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
