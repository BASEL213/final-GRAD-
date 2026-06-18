// Simple test script to verify backend setup
const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing Backend Setup...\n');

// Test 1: Check environment variables
console.log('1️⃣ Testing Environment Variables:');
console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
console.log(`   PORT: ${process.env.PORT ? '✅ Set' : '❌ Missing'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV ? '✅ Set' : '❌ Missing'}\n`);

// Test 2: Database connection
console.log('2️⃣ Testing Database Connection...');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/findoor', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('   ✅ MongoDB connection successful\n');
    
    // Test 3: Test Application model
    console.log('3️⃣ Testing Application Model...');
    const Application = require('./models/Application');
    
    // Test creating a sample application
    const testApp = {
        name: 'Test User',
        nationalId: '99998888777766',
        email: 'test@example.com',
        phone: '01234567890',
        projectId: '507f1f77bcf86cd799439011',
        projectName: 'Test Project',
        income: 5000,
        familySize: 3,
        currentHousing: 'Test housing'
    };
    
    Application.create(testApp)
    .then(() => {
        console.log('   ✅ Application model working\n');
        
        // Test 4: Clean up test data
        console.log('4️⃣ Cleaning up test data...');
        return Application.deleteOne({ nationalId: '99998888777766' });
    })
    .then(() => {
        console.log('   ✅ Test data cleaned up\n');
        
        // Test 5: Server startup test
        console.log('5️⃣ Testing Server Startup...');
        const express = require('express');
        const cors = require('cors');
        
        const app = express();
        app.use(cors());
        app.use(express.json());
        
        // Test route
        app.get('/api/test', (req, res) => {
            res.json({
                success: true,
                message: 'Backend is working correctly!',
                timestamp: new Date().toISOString()
            });
        });
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`   ✅ Server started successfully on port ${PORT}`);
            console.log(`   🌐 Test endpoint: http://localhost:${PORT}/api/test`);
            console.log('\n🎉 All tests passed! Backend is ready to use!');
            console.log('\n📋 Next steps:');
            console.log('   1. Open browser and visit: http://localhost:5000/api/test');
            console.log('   2. Run: npm run dev (to start with nodemon)');
            console.log('   3. Test with Postman using the endpoints');
            console.log('   4. Connect your React frontend');
            
            // Close test server after 10 seconds
            setTimeout(() => {
                console.log('\n🔌 Test server stopping...');
                process.exit(0);
            }, 10000);
        });
        
    })
    .catch((error) => {
        console.log('   ❌ Error with Application model:', error.message);
    });
})
.catch((error) => {
    console.log('   ❌ MongoDB connection failed:', error.message);
    console.log('\n🔧 Possible solutions:');
    console.log('   1. Make sure MongoDB is running: mongod');
    console.log('   2. Check MongoDB service: sudo systemctl status mongod');
    console.log('   3. Try different connection string');
    console.log('   4. Check if port 27017 is available');
});
