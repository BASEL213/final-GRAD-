const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/housing_system').then(async () => {
  const db = mongoose.connection.db;
  
  console.log('🔍 Checking application-project linkage...');
  
  // Get all applications
  const applications = await db.collection('applications').find({}).toArray();
  console.log(`📊 Found ${applications.length} applications`);
  
  // Get all projects
  const projects = await db.collection('projects').find({}).toArray();
  console.log(`🏗️ Found ${projects.length} projects`);
  
  // Check each application's project linkage
  applications.forEach((app, index) => {
    console.log(`\n${index + 1}. Application: ${app.name || app.applicantName || 'No name'}`);
    console.log(`   - Application ID: ${app._id}`);
    console.log(`   - Project ID: ${app.projectId}`);
    console.log(`   - Project Name (from app): ${app.projectName || 'Not set'}`);
    
    // Find matching project
    const project = projects.find(p => p._id.toString() === app.projectId);
    if (project) {
      console.log(`   ✅ Found project: ${project.name}`);
    } else {
      console.log(`   ❌ No matching project found for projectId: ${app.projectId}`);
      // Show available project IDs for debugging
      console.log(`   📋 Available project IDs:`);
      projects.slice(0, 3).forEach(p => {
        console.log(`      - ${p._id} (${p.name})`);
      });
    }
  });
  
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
  
}).catch(console.error);
