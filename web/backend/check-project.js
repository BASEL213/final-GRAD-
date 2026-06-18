const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/housing_system').then(async () => {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('Collections in housing_system:');
  collections.forEach(col => {
    console.log(' -', col.name);
  });
  
  // Check projects collection
  const projects = await db.collection('projects').find({name: 'new sharm'}).toArray();
  console.log('\nProjects with name "new sharm":', projects.length);
  if (projects.length > 0) {
    console.log('Found project:', projects[0]);
  }
  
  // Count all projects
  const totalProjects = await db.collection('projects').countDocuments();
  console.log('\nTotal projects in database:', totalProjects);
  
  mongoose.disconnect();
}).catch(console.error);
