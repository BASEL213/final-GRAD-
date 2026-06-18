const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/findoor')
  .then(() => {
    console.log('✅ REAL DATABASE CONNECTION SUCCESSFUL');
    
    // Test if we can save data
    const Application = require('./models/Application');
    const testApp = new Application({
      name: 'DB Test User',
      nationalId: '12345678901234',
      email: 'dbtest@example.com',
      phone: '01234567890',
      projectId: '507f1f77bcf86cd799439011',
      projectName: 'DB Test Project',
      income: 5000,
      familySize: 3,
      currentHousing: 'Test housing for DB validation'
    });

    testApp.save()
      .then(() => {
        console.log('✅ DATA SAVED TO REAL DATABASE');
        
        // Test if we can retrieve it
        return Application.findOne({ email: 'dbtest@example.com' });
      })
      .then(found => {
        if (found) {
          console.log('✅ DATA RETRIEVED FROM REAL DATABASE');
          console.log('✅ CONFIRMED: Your system uses REAL MongoDB database');
        } else {
          console.log('❌ DATA NOT FOUND IN DATABASE');
        }
      })
      .then(() => {
        // Clean up test data
        return Application.deleteOne({ email: 'dbtest@example.com' });
      })
      .then(() => {
        console.log('✅ TEST DATA CLEANED UP');
        process.exit(0);
      });
  })
  .catch(err => {
    console.log('❌ DATABASE CONNECTION ERROR:', err);
    console.log('❌ Your system may be using FAKE DATA');
    process.exit(1);
  });
