// Simple notifications controller that directly queries MongoDB
const mongoose = require('mongoose');
const Notification = require('./models/Notification');

// Simple getAllNotifications function
exports.getAllNotifications = async (req, res) => {
    try {
        console.log('🔍 Simple getAllNotifications called!');
        
        // Connect to MongoDB if not connected
        if (mongoose.connection.readyState !== 1) {
            console.log('🔗 Connecting to MongoDB...');
            await mongoose.connect('mongodb://localhost:27017/housing_system');
            console.log('✅ Connected to MongoDB');
        }
        
        // Simple query - get all notifications
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

// Test function
exports.testNotifications = async (req, res) => {
    try {
        console.log('🧪 Testing notifications...');
        
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/housing_system');
        console.log('✅ Connected to MongoDB');
        
        // Test direct query
        const notifications = await Notification.find({});
        console.log(`📊 Found ${notifications.length} notifications`);
        
        res.status(200).json({
            success: true,
            message: `Found ${notifications.length} notifications`,
            data: notifications
        });
        
    } catch (error) {
        console.error('❌ Error in testNotifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing notifications',
            error: error.message
        });
    }
};
