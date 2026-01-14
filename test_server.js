const http = require('http');

const AI_AGENT_USER_AGENT = 'ScrunchAXP-Agent/1.0';

const runTest = (options, expectedType, expectedStatusCode = 200) => {
  return new Promise((resolve, reject) => {
    const testName = `Test for ${options.path} with User-Agent: ${options.headers['User-Agent']}`;
    console.log(`\n--- Running: ${testName} ---`);

    const req = http.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== expectedStatusCode) {
          console.error(`[FAIL] ${testName}`);
          console.error(`  - Expected status code ${expectedStatusCode}, but got ${res.statusCode}.`);
          console.error(`  - Response: ${data.substring(0, 200)}...`);
          return reject(new Error(`Test failed for ${options.path}`));
        }

        if (expectedType === 'HTML') {
          if (data.includes('<html') && data.includes('</html>')) {
            console.log(`[PASS] ${testName}`);
            console.log(`  - Received HTML content as expected.`);
            resolve();
          } else {
            console.error(`[FAIL] ${testName}`);
            console.error(`  - Expected HTML content, but response doesn't look like HTML.`);
            reject(new Error('HTML content check failed'));
          }
        } else if (expectedType === 'JSON') {
          try {
            const jsonData = JSON.parse(data);
            if (jsonData.identifier && jsonData.name && jsonData['@type'] === 'VideoObject') {
              console.log(`[PASS] ${testName}`);
              console.log(`  - Received JSON with '@type': '${jsonData['@type']}', 'name': '${jsonData.name}', 'identifier': '${jsonData.identifier}'`);
              resolve();
            } else {
              console.error(`[FAIL] ${testName}`);
              console.error(`  - Expected JSON with 'id' key, but key was not found.`);
              reject(new Error('JSON content check failed'));
            }
          } catch (e) {
            console.error(`[FAIL] ${testName}`);
            console.error(`  - Failed to parse JSON response: ${e.message}`);
            reject(new Error('JSON parsing failed'));
          }
        } else if (expectedType === '404_JSON') {
           try {
            const jsonData = JSON.parse(data);
            if (jsonData.error === 'Video Not Found') {
              console.log(`[PASS] ${testName}`);
              console.log(`  - Received 'Video Not Found' JSON error as expected.`);
              resolve();
            } else {
              console.error(`[FAIL] ${testName}`);
              console.error(`  - Expected 'Video Not Found' error, but got: ${jsonData.error}`);
              reject(new Error('404 JSON error check failed'));
            }
          } catch (e) {
            console.error(`[FAIL] ${testName}`);
            console.error(`  - Failed to parse 404 JSON response: ${e.message}`);
            reject(new Error('404 JSON parsing failed'));
          }
        } else if (expectedType === 'AXP_JSON') {
          try {
            const jsonData = JSON.parse(data);
            // Check for basic AXP structure - expecting video content with title, etc.
            if (jsonData.title || jsonData.content_type === 'video') {
              console.log(`[PASS] ${testName}`);
              console.log(`  - Received valid AXP JSON response with expected fields.`);
              resolve();
            } else {
              console.log(`[FAIL] ${testName}`);
              console.error(`  - Expected AXP JSON with video fields, but got: ${Object.keys(jsonData)}`);
              reject(new Error('AXP JSON content check failed'));
            }
          } catch (e) {
            console.error(`[FAIL] ${testName}`);
            console.error(`  - Failed to parse AXP JSON response: ${e.message}`);
            reject(new Error('AXP JSON parsing failed'));
          }
        } else if (expectedType === 'AXP_ERROR') {
          try {
            const jsonData = JSON.parse(data);
            if (jsonData.error && (jsonData.message || jsonData.error.includes('URL parameter is required') || jsonData.error.includes('Unsupported site'))) {
              console.log(`[PASS] ${testName}`);
              console.log(`  - Received expected error response.`);
              resolve();
            } else {
              console.error(`[FAIL] ${testName}`);
              console.error(`  - Expected error response, but got:`, jsonData);
              reject(new Error('AXP error response check failed'));
            }
          } catch (e) {
            console.error(`[FAIL] ${testName}`);
            console.error(`  - Failed to parse AXP error response: ${e.message}`);
            reject(new Error('AXP error response parsing failed'));
          }
        }
      });
    });

    req.on('error', (e) => {
      console.error(`[FATAL] ${testName}`);
      console.error(`  - Request failed: ${e.message}`);
      console.error('  - Is the server running?');
      reject(e);
    });
    
    req.end();
  });
};

const main = async () => {
  const tests = [
    // Test 1: Human user gets HTML
    () => runTest({
      hostname: 'localhost',
      port: 3000,
      path: '/video/BV1xx411c7mZ',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, 'HTML'),

    // Test 2: AI Agent gets JSON
    () => runTest({
      hostname: 'localhost',
      port: 3000,
      path: '/video/BV1xx411c7mZ',
      headers: { 'User-Agent': AI_AGENT_USER_AGENT }
    }, 'JSON'),

    // Test 3: Request for a non-existent video returns 404
    () => runTest({
      hostname: 'localhost',
      port: 3000,
      path: '/video/non-existent-id',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, '404_JSON', 404),
    
    // Test 4: AXP endpoint - Missing URL parameter returns error
    () => runTest({
      hostname: 'localhost',
      port: 3000,
      path: '/axp',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, 'AXP_ERROR', 400),
    
    // Test 5: AXP endpoint - Valid request with human user agent returns HTML
    // This test is skipped for now since we don't have a real Bilibili URL to test
    
    // Test 6: AXP endpoint - Valid request with AI agent user agent returns JSON
    // This test is skipped for now since we don't have a real Bilibili URL to test
  ];

  try {
    for (const test of tests) {
      await test();
    }
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Some tests failed.');
    process.exit(1);
  }
};

main();
