const mongoose = require('mongoose');
const Application = require('./models/Application');
require('dotenv').config();

// Sample data for testing
const sampleApplications = [
    {
        name: 'Ahmed Mohamed Hassan',
        nationalId: '12345678901234',
        email: 'ahmed.hassan@email.com',
        phone: '01234567890',
        projectId: '507f1f77bcf86cd799439011',
        projectName: 'Cairo Garden Residences',
        income: 8500,
        familySize: 4,
        currentHousing: 'Rented apartment in Nasr City',
        status: 'pending'
    },
    {
        name: 'Sara Mahmoud Ali',
        nationalId: '98765432109876',
        email: 'sara.ali@email.com',
        phone: '01987654321',
        projectId: '507f1f77bcf86cd799439012',
        projectName: 'Alexandria Coastal Towers',
        income: 12000,
        familySize: 3,
        currentHousing: 'Family house in Alexandria',
        status: 'approved',
        reviewedBy: 'Admin User',
        reviewedAt: new Date('2024-03-20T10:30:00Z')
    },
    {
        name: 'Mohamed Kamel Said',
        nationalId: '45678901234567',
        email: 'mohamed.said@email.com',
        phone: '01555555555',
        projectId: '507f1f77bcf86cd799439013',
        projectName: 'New Capital City Complex',
        income: 6500,
        familySize: 5,
        currentHousing: 'Shared accommodation',
        status: 'rejected',
        rejectionReason: 'Income below minimum requirement for selected project',
        reviewedBy: 'Admin User',
        reviewedAt: new Date('2024-03-19T14:20:00Z')
    },
    {
        name: 'Fatma Omar Ibrahim',
        nationalId: '78901234567890',
        email: 'fatma.ibrahim@email.com',
        phone: '01011111111',
        projectId: '507f1f77bcf86cd799439014',
        projectName: 'Delta Green Community',
        income: 15000,
        familySize: 2,
        currentHousing: 'Living with parents',
        status: 'pending'
    },
    {
        name: 'Omar Khalid Mahmoud',
        nationalId: '32109876543210',
        email: 'omar.mahmoud@email.com',
        phone: '01222222222',
        projectId: '507f1f77bcf86cd799439015',
        projectName: 'Giza Heights Project',
        income: 9500,
        familySize: 3,
        currentHousing: 'Apartment in Giza',
        status: 'approved',
        reviewedBy: 'Admin User',
        reviewedAt: new Date('2024-03-18T09:15:00Z')
    }
];

// Seed function
const seedDatabase = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/findoor');
        
        // Clear existing data
        await Application.deleteMany({});
        console.log('🗑️ Cleared existing applications');
        
        // Insert sample data
        await Application.insertMany(sampleApplications);
        console.log('🌱 Sample applications seeded successfully');
        
        console.log(`📊 Inserted ${sampleApplications.length} applications`);
        console.log('📈 Status breakdown:');
        const statusCounts = {};
        sampleApplications.forEach(app => {
            statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
        });
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database');
        process.exit(0);
    }
};

// Run seed function
seedDatabase();
