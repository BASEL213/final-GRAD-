const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/housing_system').then(async () => {
  const db = mongoose.connection.db;
  
  console.log('🔧 Fixing application data structure for dashboard compatibility...');
  
  // Get all applications
  const applications = await db.collection('applications').find({}).toArray();
  console.log(`📊 Found ${applications.length} applications to fix`);
  
  // Update each application to have applicantName field
  for (const app of applications) {
    const updateData = {
      applicantName: app.name, // Add applicantName field with same value as name
      applicantId: app._id,    // Add applicantId field
      applicantEmail: app.email, // Add applicantEmail field
      applicantPhone: app.phone, // Add applicantPhone field
      submittedDate: app.createdAt, // Add submittedDate field
      updatedAt: new Date()
    };
    
    await db.collection('applications').updateOne(
      { _id: app._id },
      { $set: updateData }
    );
    
    console.log(`✅ Updated: ${app.name} -> applicantName: ${app.name}`);
  }
  
  console.log('\n🎉 All applications updated successfully!');
  
  // Verify one application
  const sampleApp = await db.collection('applications').findOne({});
  console.log('\n📋 Sample updated application structure:');
  console.log(`- applicantName: ${sampleApp.applicantName}`);
  console.log(`- applicantEmail: ${sampleApp.applicantEmail}`);
  console.log(`- applicantPhone: ${sampleApp.applicantPhone}`);
  console.log(`- submittedDate: ${sampleApp.submittedDate}`);
  
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
  
}).catch(console.error);
