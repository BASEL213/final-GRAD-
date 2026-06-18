const mongoose = require('mongoose');
const Notification = require('./models/Notification');
require('dotenv').config();

// Sample notifications data
const sampleNotifications = [
    {
        type: 'new_application',
        title: 'New Housing Application Received',
        message: 'A new housing application has been submitted by Ahmed Mohamed for the Cairo Housing Project.',
        priority: 'high',
        category: 'applications',
        targetUserId: '69f788c0c22a4292de1b3b8d',
        isRead: false,
        actionRequired: true,
        relatedEntityId: '69f789ebc22a4292de1b3c49',
        relatedEntityType: 'application',
        actionUrl: '/applications/69f789ebc22a4292de1b3c49'
    },
    {
        type: 'application_approved',
        title: 'Application Approved',
        message: 'Congratulations! Your housing application has been approved. Please complete the documentation process.',
        priority: 'high',
        category: 'applications',
        targetUserId: '69f76daac4aa5565c3a41234',
        isRead: false,
        actionRequired: true,
        relatedEntityId: '69f789ebc22a4292de1b3c50',
        relatedEntityType: 'application',
        actionUrl: '/applications/69f789ebc22a4292de1b3c50'
    },
    {
        type: 'project_update',
        title: 'Project Milestone Completed',
        message: 'Phase 1 of the Alexandria Housing Project has been completed successfully.',
        priority: 'medium',
        category: 'projects',
        targetUserId: '69f788c0c22a4292de1b3b8d',
        isRead: true,
        actionRequired: false,
        relatedEntityId: 'proj_alex_001',
        relatedEntityType: 'project',
        actionUrl: '/projects/proj_alex_001'
    },
    {
        type: 'system_alert',
        title: 'System Maintenance Scheduled',
        message: 'The housing system will undergo maintenance on Sunday from 2:00 AM to 4:00 AM.',
        priority: 'medium',
        category: 'system',
        targetUserId: '69f788c0c22a4292de1b3b8d',
        isRead: false,
        actionRequired: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
        type: 'deadline_reminder',
        title: 'Application Deadline Approaching',
        message: 'The deadline for Q2 housing applications is approaching. Only 3 days remaining.',
        priority: 'urgent',
        category: 'applications',
        targetUserId: '69f76daac4aa5565c3a41234',
        isRead: false,
        actionRequired: true,
        actionUrl: '/applications/new',
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    },
    {
        type: 'user_registered',
        title: 'New User Registration',
        message: 'A new user has registered: Sarah Ahmed (sarah.ahmed@email.com)',
        priority: 'low',
        category: 'users',
        targetUserId: '69f788c0c22a4292de1b3b8d',
        isRead: true,
        actionRequired: false,
        relatedEntityId: 'user_sarah_001',
        relatedEntityType: 'user',
        actionUrl: '/users/user_sarah_001'
    },
    {
        type: 'maintenance_notice',
        title: 'Document Upload Maintenance',
        message: 'Document upload service will be temporarily unavailable for maintenance.',
        priority: 'low',
        category: 'maintenance',
        targetUserId: '69f76daac4aa5565c3a41234',
        isRead: false,
        actionRequired: false,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
    },
    {
        type: 'application_rejected',
        title: 'Application Update',
        message: 'An application has been rejected due to incomplete documentation. Please review.',
        priority: 'high',
        category: 'applications',
        targetUserId: '69f788c0c22a4292de1b3b8d',
        isRead: false,
        actionRequired: true,
        relatedEntityId: '69f789ebc22a4292de1b3c51',
        relatedEntityType: 'application',
        actionUrl: '/applications/69f789ebc22a4292de1b3c51'
    }
];

// Connect to MongoDB and insert notifications
async function seedNotifications() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        
        // Use the same connection string as server.js
        const mongoUri = process.env.MONGODB_URI || 'mongodb://sbasmalaibrahim_db_user:basmala123@ac-euwdhug-shard-00-00.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-01.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-02.z7jzimi.mongodb.net:27017/housing_system?replicaSet=atlas-d1h5pd-shard-0&ssl=true&authSource=admin';
        
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Clear existing notifications
        await Notification.deleteMany({});
        console.log('🗑️ Cleared existing notifications');
        
        // Insert sample notifications
        const insertedNotifications = await Notification.insertMany(sampleNotifications);
        console.log(`✅ Successfully inserted ${insertedNotifications.length} notifications`);
        
        // Display inserted notifications
        console.log('\n📋 Inserted Notifications:');
        insertedNotifications.forEach((notif, index) => {
            console.log(`${index + 1}. ${notif.title} (${notif.type}) - Priority: ${notif.priority}`);
        });
        
    } catch (error) {
        console.error('❌ Error seeding notifications:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the seeding function
seedNotifications();
