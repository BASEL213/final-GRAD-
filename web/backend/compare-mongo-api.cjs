const mongoose = require('mongoose');
const Application = require('./models/Application');
const http = require('http');

const mongoUri = 'mongodb://sbasmalaibrahim_db_user:basmala123@ac-euwdhug-shard-00-00.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-01.z7jzimi.mongodb.net:27017,ac-euwdhug-shard-00-02.z7jzimi.mongodb.net:27017/housing_system?replicaSet=atlas-d1h5pd-shard-0&ssl=true&authSource=admin';

async function compareData() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get all applications from MongoDB
    const mongoApps = await Application.find({}, { applicantName: 1, status: 1, projectName: 1, _id: 1, email: 1, phone: 1 });
    console.log(`\n📊 MongoDB Applications: ${mongoApps.length}`);
    
    // Get applications from API
    const apiData = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/applications',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      });
      
      req.on('error', reject);
      req.end();
    });
    
    console.log(`📊 API Applications: ${apiData.data ? apiData.data.length : 0}`);
    
    // Compare the data
    console.log('\n🔍 Comparison Analysis:');
    
    const mongoIds = mongoApps.map(app => app._id.toString());
    const apiIds = apiData.data ? apiData.data.map(app => (app._id || app.id).toString()) : [];
    
    // Find missing applications
    const missingInAPI = mongoIds.filter(id => !apiIds.includes(id));
    const extraInAPI = apiIds.filter(id => !mongoIds.includes(id));
    
    if (missingInAPI.length > 0) {
      console.log('\n❌ Applications missing from API:');
      missingInAPI.forEach(id => {
        const app = mongoApps.find(a => a._id.toString() === id);
        const statusIcon = app.status === 'pending' ? '⏳' : app.status === 'approved' ? '✅' : '❌';
        console.log(`  ${statusIcon} ${app.applicantName || 'Unknown'} - Status: ${app.status} - Project: ${app.projectName || 'N/A'}`);
        console.log(`     ID: ${app._id}`);
      });
    }
    
    if (extraInAPI.length > 0) {
      console.log('\n⚠️ Extra applications in API (not in MongoDB):');
      extraInAPI.forEach(id => {
        console.log(`     ID: ${id}`);
      });
    }
    
    if (missingInAPI.length === 0 && extraInAPI.length === 0) {
      console.log('✅ Data is perfectly synchronized!');
    }
    
    // Status comparison
    console.log('\n📈 Status Comparison:');
    const mongoStatus = {
      pending: mongoApps.filter(a => a.status === 'pending').length,
      approved: mongoApps.filter(a => a.status === 'approved').length,
      rejected: mongoApps.filter(a => a.status === 'rejected').length
    };
    
    const apiStatus = {
      pending: apiData.data ? apiData.data.filter(a => a.status === 'pending').length : 0,
      approved: apiData.data ? apiData.data.filter(a => a.status === 'approved').length : 0,
      rejected: apiData.data ? apiData.data.filter(a => a.status === 'rejected').length : 0
    };
    
    console.log('MongoDB:', mongoStatus);
    console.log('API:', apiStatus);
    
    await mongoose.disconnect();
    console.log('\n✅ Comparison completed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

compareData();
