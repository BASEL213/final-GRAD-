const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/housing_system').then(async () => {
  const db = mongoose.connection.db;
  const projects = await db.collection('projects').find({}).toArray();
  console.log('Current MongoDB projects:');
  projects.forEach((p, i) => {
    console.log(`${i+1}. ${p.name} - ${p.location} (ID: ${p._id})`);
  });
  console.log(`\nTotal projects in MongoDB: ${projects.length}`);
  mongoose.disconnect();
}).catch(console.error);
