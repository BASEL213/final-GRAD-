// Complete notification data examples for MongoDB insertion
// Use this file to create sample notifications for the housing system

// MongoDB Notification Model Structure:
/*
{
  type: String (required, enum),
  title: String (required, max 100 chars),
  message: String (required, max 500 chars),
  priority: String (enum: 'low', 'medium', 'high', 'urgent', default: 'medium'),
  category: String (enum: 'applications', 'projects', 'users', 'system', 'maintenance', default: 'system'),
  targetUserId: String (required, references User._id),
  isRead: Boolean (default: false),
  actionRequired: Boolean (default: false),
  relatedEntityId: String (optional),
  relatedEntityType: String (enum: 'application', 'project', 'user', 'system', optional),
  actionUrl: String (optional),
  expiresAt: Date (optional)
}
*/

// Sample notification data for different scenarios
const notificationExamples = {
  // Application-related notifications
  applications: [
    {
      type: 'new_application',
      title: 'New Housing Application Received',
      message: 'Applicant name has submitted a new application for Project Name',
      priority: 'high',
      category: 'applications',
      targetUserId: '69f788c0c22a4292de1b3b8d', // Admin user ID
      isRead: false,
      actionRequired: true,
      relatedEntityId: 'application_id_here',
      relatedEntityType: 'application',
      actionUrl: '/applications'
    },
    {
      type: 'application_approved',
      title: 'Application Approved',
      message: 'Applicant name\'s application for Project Name has been approved',
      priority: 'medium',
      category: 'applications',
      targetUserId: '69f788c0c22a4292de1b3b8d',
      isRead: false,
      actionRequired: false,
      relatedEntityId: 'application_id_here',
      relatedEntityType: 'application',
      actionUrl: '/applications'
    },
    {
      type: 'application_rejected',
      title: 'Application Rejected',
      message: 'Applicant name\'s application for Project Name was rejected due to reason',
      priority: 'high',
      category: 'applications',
      targetUserId: '69f788c0c22a4292de1b3b8d',
      isRead: false,
      actionRequired: true,
      relatedEntityId: 'application_id_here',
      relatedEntityType: 'application',
      actionUrl: '/applications'
    },
    {
      type: 'deadline_reminder',
      title: 'Application Review Deadline',
      message: 'X applications pending review require attention before end of month',
      priority: 'high',
      category: 'applications',
      targetUserId: '69f788c0c22a4292de1b3b8d',
      isRead: false,
      actionRequired: true,
      actionUrl: '/applications'
    }
  ],

  // Project-related notifications
  projects: [
    {
      type: 'project_update',
      title: 'Project Construction Update',
      message: 'Project Name construction progress updated to X%',
      priority: 'low',
      category: 'projects',
      targetUserId: '69f788c0c22a4292de1b3b8d',
      isRead: false,
      actionRequired: false,
      relatedEntityId: 'project_id_here',
      relatedEntityType: 'project',
      actionUrl: '/projects'
    },
    {
      type: 'system_alert',
      title: 'New Project Available',
      message: 'Project Name is now available for applications',
      priority: 'medium',
      category: 'projects',
      targetUserId: '69f788c0c22a4292de1b3b8d',
      isRead: false,
      actionRequired: false,
      relatedEntityId: 'project_id_here',
      relatedEntityType: 'project',
      actionUrl: '/projects'
    }
  ],

  // User-related notifications
  users: [
    {
      type: 'user_registered',
      title: 'New User Registration',
      message: 'A new citizen user has registered in the system',
      priority: 'medium',
      category: 'users',
      targetUserId: '69f788c0c22a4292de1b3b8d',
      isRead: false,
      actionRequired: false,
      relatedEntityType: 'user',
      actionUrl: '/roles'
    }
  ],

  // System notifications
  system: [
    {
      type: 'system_alert',
      title: 'System Maintenance Scheduled',
      message: 'Scheduled maintenance on Sunday 2AM-4AM for system updates',
      priority: 'medium',
      category: 'system',
      targetUserId: '69f788c0c22a4292de1b3b8d',
      isRead: false,
      actionRequired: false,
      actionUrl: null
    },
    {
      type: 'system_alert',
      title: 'Database Backup Completed',
      message: 'Monthly database backup has been completed successfully',
      priority: 'low',
      category: 'system',
      targetUserId: '69f788c0c22a4292de1b3b8d',
      isRead: false,
      actionRequired: false,
      actionUrl: null
    },
    {
      type: 'maintenance_notice',
      title: 'System Update Available',
      message: 'A new system update is available for installation',
      priority: 'low',
      category: 'maintenance',
      targetUserId: '69f788c0c22a4292de1b3b8d',
      isRead: false,
      actionRequired: false,
      actionUrl: null
    }
  ]
};

// Ready-to-use notification data for MongoDB insertion
const readyToInsertNotifications = [
  {
    type: 'new_application',
    title: 'New Housing Application Received',
    message: 'Sarah Ahmed has submitted a new application for Cairo Garden Residences - 2BR Apartment',
    priority: 'high',
    category: 'applications',
    targetUserId: '69f788c0c22a4292de1b3b8d',
    isRead: false,
    actionRequired: true,
    relatedEntityId: '680f1234567890abcdef1234',
    relatedEntityType: 'application',
    actionUrl: '/applications'
  },
  {
    type: 'application_approved',
    title: 'Application Approved',
    message: 'Mohamed Ali\'s application for Alexandria Coastal Towers has been approved',
    priority: 'medium',
    category: 'applications',
    targetUserId: '69f788c0c22a4292de1b3b8d',
    isRead: true,
    actionRequired: false,
    relatedEntityId: '680f1234567890abcdef1235',
    relatedEntityType: 'application',
    actionUrl: '/applications'
  },
  {
    type: 'application_rejected',
    title: 'Application Rejected',
    message: 'Fatma Hassan\'s application for Giza Heights was rejected due to insufficient income',
    priority: 'high',
    category: 'applications',
    targetUserId: '69f788c0c22a4292de1b3b8d',
    isRead: false,
    actionRequired: true,
    relatedEntityId: '680f1234567890abcdef1236',
    relatedEntityType: 'application',
    actionUrl: '/applications'
  },
  {
    type: 'project_update',
    title: 'Project Construction Update',
    message: 'Suez Canal City Residences construction progress updated to 75%',
    priority: 'low',
    category: 'projects',
    targetUserId: '69f788c0c22a4292de1b3b8d',
    isRead: false,
    actionRequired: false,
    relatedEntityId: '680f1234567890abcdef1237',
    relatedEntityType: 'project',
    actionUrl: '/projects'
  },
  {
    type: 'system_alert',
    title: 'System Maintenance Scheduled',
    message: 'Scheduled maintenance on Friday 1AM-3AM for security updates',
    priority: 'medium',
    category: 'system',
    targetUserId: '69f788c0c22a4292de1b3b8d',
    isRead: true,
    actionRequired: false,
    actionUrl: null
  },
  {
    type: 'user_registered',
    title: 'New User Registration',
    message: 'A new citizen user has registered in the system',
    priority: 'medium',
    category: 'users',
    targetUserId: '69f788c0c22a4292de1b3b8d',
    isRead: true,
    actionRequired: false,
    relatedEntityType: 'user',
    actionUrl: '/roles'
  },
  {
    type: 'deadline_reminder',
    title: 'Application Review Deadline',
    message: '5 applications pending review require attention before end of week',
    priority: 'high',
    category: 'applications',
    targetUserId: '69f788c0c22a4292de1b3b8d',
    isRead: false,
    actionRequired: true,
    actionUrl: '/applications'
  },
  {
    type: 'system_alert',
    title: 'Database Backup Completed',
    message: 'Weekly database backup has been completed successfully',
    priority: 'low',
    category: 'system',
    targetUserId: '69f788c0c22a4292de1b3b8d',
    isRead: true,
    actionRequired: false,
    actionUrl: null
  },
  {
    type: 'new_application',
    title: 'Urgent Application Review',
    message: 'Emergency housing application requires immediate attention',
    priority: 'urgent',
    category: 'applications',
    targetUserId: '69f788c0c22a4292de1b3b8d',
    isRead: false,
    actionRequired: true,
    relatedEntityId: '680f1234567890abcdef1238',
    relatedEntityType: 'application',
    actionUrl: '/applications'
  },
  {
    type: 'project_update',
    title: 'New Project Available',
    message: 'Luxury Marina Complex is now available for applications',
    priority: 'medium',
    category: 'projects',
    targetUserId: '69f788c0c22a4292de1b3b8d',
    isRead: false,
    actionRequired: false,
    relatedEntityId: '680f1234567890abcdef1239',
    relatedEntityType: 'project',
    actionUrl: '/projects'
  }
];

// MongoDB insertion script
async function insertNotificationData() {
  const mongoose = require('mongoose');
  const Notification = require('./models/Notification');

  try {
    await mongoose.connect('mongodb://localhost:27017/housing_system');
    
    // Insert the ready-to-use notifications
    const inserted = await Notification.insertMany(readyToInsertNotifications);
    console.log(`✅ Inserted ${inserted.length} notifications`);
    
    // Display inserted notifications
    inserted.forEach((notif, index) => {
      console.log(`\n📋 ${index + 1}. ${notif.title}`);
      console.log(`   Type: ${notif.type} | Priority: ${notif.priority} | Read: ${notif.isRead}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Export for use
module.exports = {
  notificationExamples,
  readyToInsertNotifications,
  insertNotificationData
};
