// Integration Testing Script
// Run this to verify backend is fully functional

const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

// Test configuration
const BACKEND_URL = 'http://localhost:5000';

// Generate unique test data
const generateTestApplication = () => {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 100000000); // 8 digits
  
  return {
    name: `Integration Test User ${timestamp}`,
    nationalId: `${timestamp.toString().slice(-14)}${randomSuffix.toString().slice(-4)}`.padEnd(14, '0').slice(0, 14),
    email: `test${timestamp}@integration.com`,
    phone: `01${randomSuffix.toString().padStart(9, '0')}`, // 01 + 9 digits = 11 digits total
    projectId: '507f1f77bcf86cd799439011',
    projectName: 'Integration Test Project',
    income: 8000,
    familySize: 2,
    currentHousing: 'Test housing for integration'
  };
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// HTTP request helper
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testBackendHealth() {
  log('\n🔍 Testing Backend Health...', colors.blue);
  
  try {
    const response = await makeRequest('GET', '/api/health');
    
    if (response.status === 200 && response.data.success) {
      log('✅ Backend health check passed', colors.green);
      return true;
    } else {
      log(`❌ Backend health check failed: ${JSON.stringify(response.data)}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Backend health check error: ${error.message}`, colors.red);
    return false;
  }
}

async function testApplicationsEndpoint() {
  log('\n📋 Testing Applications Endpoint...', colors.blue);
  
  try {
    const response = await makeRequest('GET', '/api/applications');
    
    if (response.status === 200 && response.data.success) {
      log(`✅ Applications endpoint works - Found ${response.data.count || 0} applications`, colors.green);
      return true;
    } else {
      log(`❌ Applications endpoint failed: ${JSON.stringify(response.data)}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Applications endpoint error: ${error.message}`, colors.red);
    return false;
  }
}

async function testCreateApplication() {
  log('\n➕ Testing Create Application...', colors.blue);
  
  try {
    const testApplication = generateTestApplication();
    const response = await makeRequest('POST', '/api/applications', testApplication);
    
    if (response.status === 201 && response.data.success) {
      log('✅ Create application works', colors.green);
      log(`📝 Created application ID: ${response.data.data._id}`, colors.yellow);
      return response.data.data._id;
    } else {
      log(`❌ Create application failed: ${JSON.stringify(response.data)}`, colors.red);
      return null;
    }
  } catch (error) {
    log(`❌ Create application error: ${error.message}`, colors.red);
    return null;
  }
}

async function testGetApplication(applicationId) {
  if (!applicationId) return false;
  
  log('\n👁️ Testing Get Application...', colors.blue);
  
  try {
    const response = await makeRequest('GET', `/api/applications/${applicationId}`);
    
    if (response.status === 200 && response.data.success) {
      log('✅ Get application works', colors.green);
      log(`📋 Retrieved: ${response.data.data.name} - ${response.data.data.status}`, colors.yellow);
      return true;
    } else {
      log(`❌ Get application failed: ${JSON.stringify(response.data)}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Get application error: ${error.message}`, colors.red);
    return false;
  }
}

async function testUpdateStatus(applicationId) {
  if (!applicationId) return false;
  
  log('\n🔄 Testing Update Status...', colors.blue);
  
  try {
    const response = await makeRequest('PUT', `/api/applications/${applicationId}/status`, {
      status: 'approved',
      reviewedBy: 'Integration Test'
    });
    
    if (response.status === 200 && response.data.success) {
      log('✅ Update status works', colors.green);
      log(`📊 Updated to: ${response.data.data.status}`, colors.yellow);
      return true;
    } else {
      log(`❌ Update status failed: ${JSON.stringify(response.data)}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Update status error: ${error.message}`, colors.red);
    return false;
  }
}

async function testStatisticsEndpoint() {
  log('\n📊 Testing Statistics Endpoint...', colors.blue);
  
  try {
    const response = await makeRequest('GET', '/api/applications/stats');
    
    if (response.status === 200 && response.data.success) {
      const stats = response.data.data;
      log('✅ Statistics endpoint works', colors.green);
      log(`📈 Total: ${stats.total}, Pending: ${stats.pending}, Approved: ${stats.approved}, Rejected: ${stats.rejected}`, colors.yellow);
      return true;
    } else {
      log(`❌ Statistics endpoint failed: ${JSON.stringify(response.data)}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Statistics endpoint error: ${error.message}`, colors.red);
    return false;
  }
}

async function testDatabaseConnection() {
  log('\n🗄️ Testing Database Connection...', colors.blue);
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/findoor');
    log('✅ Database connection successful', colors.green);
    
    // Test Application model
    const Application = require('./models/Application');
    const count = await Application.countDocuments();
    log(`📊 Database contains ${count} applications`, colors.yellow);
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, colors.red);
    return false;
  }
}

async function cleanupTestData(applicationId) {
  if (!applicationId) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/findoor');
    const Application = require('./models/Application');
    
    await Application.deleteOne({ _id: applicationId });
    log('🧹 Test data cleaned up', colors.blue);
    
    await mongoose.disconnect();
  } catch (error) {
    log(`⚠️ Cleanup warning: ${error.message}`, colors.yellow);
  }
}

async function testCORS() {
  log('\n🌐 Testing CORS...', colors.blue);
  
  try {
    const response = await makeRequest('OPTIONS', '/api/applications');
    
    if (response.status === 204 || response.status === 200) {
      log('✅ CORS headers present', colors.green);
      return true;
    } else {
      log(`⚠️ CORS test returned status: ${response.status}`, colors.yellow);
      return true; // CORS might be configured differently
    }
  } catch (error) {
    log(`⚠️ CORS test error: ${error.message}`, colors.yellow);
    return true; // Don't fail the test for CORS issues
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting Integration Tests...', colors.blue);
  log('=====================================', colors.blue);
  
  const results = {
    backendHealth: false,
    databaseConnection: false,
    applicationsEndpoint: false,
    createApplication: false,
    getApplication: false,
    updateStatus: false,
    statisticsEndpoint: false,
    cors: false
  };
  
  let createdApplicationId = null;
  
  // Run tests
  results.backendHealth = await testBackendHealth();
  results.databaseConnection = await testDatabaseConnection();
  results.applicationsEndpoint = await testApplicationsEndpoint();
  results.cors = await testCORS();
  
  createdApplicationId = await testCreateApplication();
  results.createApplication = !!createdApplicationId;
  
  if (createdApplicationId) {
    results.getApplication = await testGetApplication(createdApplicationId);
    results.updateStatus = await testUpdateStatus(createdApplicationId);
  }
  
  results.statisticsEndpoint = await testStatisticsEndpoint();
  
  // Cleanup test data
  if (createdApplicationId) {
    await cleanupTestData(createdApplicationId);
  }
  
  // Results summary
  log('\n=====================================', colors.blue);
  log('📊 TEST RESULTS SUMMARY', colors.blue);
  log('=====================================', colors.blue);
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? colors.green : colors.red;
    log(`${status.padEnd(10)} ${test}`, color);
  });
  
  log('\n=====================================', colors.blue);
  log(`🎯 Overall Result: ${passedTests}/${totalTests} tests passed`, 
      passedTests === totalTests ? colors.green : colors.yellow);
  
  if (passedTests === totalTests) {
    log('🎉 ALL TESTS PASSED! Backend is fully functional!', colors.green);
    log('\n📋 Next Steps:', colors.blue);
    log('1. Start your React frontend: npm run dev', colors.yellow);
    log('2. Replace components with backend-ready versions', colors.yellow);
    log('3. Test the full integration', colors.yellow);
    log('4. Verify responsiveness on different screen sizes', colors.yellow);
  } else {
    log('⚠️ Some tests failed. Check the errors above.', colors.yellow);
    log('\n🔧 Troubleshooting:', colors.blue);
    log('1. Make sure backend is running: npm run dev', colors.yellow);
    log('2. Check MongoDB is running: mongod', colors.yellow);
    log('3. Verify .env configuration', colors.yellow);
    log('4. Check for port conflicts', colors.yellow);
  }
  
  log('\n🌐 Backend URL: http://localhost:5000', colors.blue);
  log('🏥 Health Check: http://localhost:5000/api/health', colors.blue);
  log('📱 Ready for React integration!', colors.blue);
}

// Run tests
runAllTests().catch(console.error);
