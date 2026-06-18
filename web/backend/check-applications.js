const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/housing_system').then(async () => {
  const db = mongoose.connection.db;
  const applications = await db.collection('applications').find({}).limit(1).toArray();
  console.log('Sample application structure:');
  console.log(JSON.stringify(applications[0], null, 2));
  mongoose.disconnect();
}).catch(console.error);
