const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');
const Project = require('./models/Project');

// Sample application for testing
const sampleApplication = {
  name: 'Ahmed Mohamed Hassan',
  email: 'ahmed.hassan@email.com',
  phone: '01234567890',
  nationalId: '29012345678901',
  address: '123 El-Tahrir Street, Cairo, Egypt',
  occupation: 'Software Engineer',
  familySize: 4,
  monthlyIncome: 25000,
  projectId: null, // Will be assigned when project is selected
  status: 'pending',
  submittedDate: new Date(),
  currentHousing: 'Renting apartment in Nasr City',
  income: 25000,
  projectName: 'Test Project', // Will reference existing project
  documents: {
    nationalIdCard: true,
    residenceProof: true,
    incomeStatement: false
  },
  preferences: {
    unitType: 'apartment',
    areaRange: '100-150',
    budgetRange: '1.5M-2.5M'
  }
};

async function insertSampleApplication() {
  try {
    console.log('🌱 Inserting sample application for testing...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/housing_system');
    
    // Get existing users and projects to reference
    const users = await User.find();
    const projects = await Project.find();
    
    if (users.length > 0) {
      sampleApplication.userId = users[0]._id;
    }
    
    if (projects.length > 0) {
      sampleApplication.projectId = projects[0]._id;
    }
    
    // Insert the sample application
    const application = new Application(sampleApplication);
    await application.save();
    
    console.log('✅ Sample application inserted successfully!');
    console.log('📄 Application details:', {
      name: application.name,
      email: application.email,
      status: application.status,
      projectId: application.projectId,
      userId: application.userId
    });
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error inserting sample application:', error);
    process.exit(1);
  }
}

// Run the insertion
insertSampleApplication();
