const http = require('http');

const testEndpoint = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/v1/${path}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, error: 'Invalid JSON' });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
};

(async () => {
  console.log('\n=== Testing Categories API Endpoints ===\n');
  
  const endpoints = [
    'categories?featured=true&status=active&limit=8',
    'categories?status=active',
    'categories',
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\nTesting: ${endpoint}`);
    console.log('-'.repeat(60));
    try {
      const result = await testEndpoint(endpoint);
      console.log(`Status: ${result.status}`);
      console.log(`Response type: ${Array.isArray(result.data) ? 'Array' : typeof result.data}`);
      console.log(`Response length: ${Array.isArray(result.data) ? result.data.length : 'N/A'}`);
      
      if (Array.isArray(result.data) && result.data.length > 0) {
        console.log(`First item keys: ${Object.keys(result.data[0]).join(', ')}`);
        console.log(`First item:`, JSON.stringify(result.data[0], null, 2));
      } else if (result.data && typeof result.data === 'object') {
        console.log(`Response keys: ${Object.keys(result.data).join(', ')}`);
        console.log(`Response:`, JSON.stringify(result.data, null, 2));
      }
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
})();
