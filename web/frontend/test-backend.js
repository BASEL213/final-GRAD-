const http = require('http');

// Test function to make HTTP requests
function testEndpoint(path, method = 'GET', data = null) {
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
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            data: JSON.parse(body)
          };
          console.log(`✅ ${method} ${path} - Status: ${res.statusCode}`);
          console.log(`   Response:`, JSON.stringify(result.data, null, 2));
          resolve(result);
        } catch (error) {
          console.log(`❌ ${method} ${path} - Status: ${res.statusCode}`);
          console.log(`   Raw Response:`, body);
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${method} ${path} - Error: ${error.message}`);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test all backend endpoints
async function testBackend() {
  console.log('🧪 Testing Backend API Endpoints...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing Health Check:');
    await testEndpoint('/api/health');
    console.log('');

    // Test projects endpoint
    console.log('2. Testing Projects API:');
    await testEndpoint('/api/projects');
    console.log('');

    // Test users endpoint
    console.log('3. Testing Users API:');
    await testEndpoint('/api/users');
    console.log('');

    // Test applications endpoint
    console.log('4. Testing Applications API:');
    await testEndpoint('/api/applications');
    console.log('');

    // Test creating a new project
    console.log('5. Testing Create Project:');
    const newProject = {
      name: 'Test Project',
      location: {
        city: 'Test City',
        district: 'Test District',
        address: 'Test Address'
      },
      type: 'residential',
      category: 'apartments',
      status: 'active',
      development: {
        totalUnits: 100,
        availableUnits: 50,
        soldUnits: 50,
        phases: 1
      },
      pricing: {
        priceRange: '1M - 2M EGP',
        unitTypes: ['1BR', '2BR'],
        downPayment: '10%',
        installmentYears: 5
      }
    };
    await testEndpoint('/api/projects', 'POST', newProject);
    console.log('');

    console.log('✅ Backend testing completed!');

  } catch (error) {
    console.error('❌ Backend testing failed:', error.message);
  }
}

// Run the tests
testBackend();
