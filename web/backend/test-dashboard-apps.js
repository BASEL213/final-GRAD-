const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/housing_system').then(async () => {
  const db = mongoose.connection.db;
  
  console.log('🔍 Testing dashboard applications data...');
  
  // Get all applications
  const applications = await db.collection('applications').find({}).toArray();
  console.log(`📊 Found ${applications.length} applications in MongoDB`);
  
  // Check if applications have required fields
  applications.forEach((app, index) => {
    console.log(`${index + 1}. ${app.name || app.applicantName || 'No name'}`);
    console.log(`   - applicantName: ${app.applicantName || 'Missing'}`);
    console.log(`   - projectName: ${app.projectName || 'Missing'}`);
    console.log(`   - submittedDate: ${app.submittedDate || app.createdAt || 'Missing'}`);
    console.log(`   - status: ${app.status || 'Missing'}`);
    console.log('');
  });
  
  // Test sorting logic (same as dashboard)
  const sorted = applications
    .sort((a, b) => new Date(b.submittedDate || b.createdAt) - new Date(a.submittedDate || a.createdAt))
    .slice(0, 5);
  
  console.log(`🎯 Top 5 recent applications:`);
  sorted.forEach((app, index) => {
    console.log(`${index + 1}. ${app.applicantName || app.name || 'No name'} - ${app.status}`);
  });
  
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
  
}).catch(console.error);
