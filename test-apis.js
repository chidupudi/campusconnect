#!/usr/bin/env node

const http = require('http');

// Test configuration
const baseUrl = 'http://localhost:5000';

// Test data
const testStudent = {
  name: 'Test Student',
  email: 'test@campusconnect.com',
  course: 'Computer Science',
  password: 'testpass123'
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
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
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'GET'
    };

    const response = await makeRequest(options);
    console.log(`✅ Health check: ${response.statusCode} - ${JSON.stringify(response.body)}`);
    return response.statusCode === 200;
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
    return false;
  }
}

async function testStudentSignup() {
  console.log('\n👤 Testing Student Signup...');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/students/signup',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, testStudent);
    console.log(`✅ Student signup: ${response.statusCode} - ${response.body?.message || 'Success'}`);

    if (response.body?.token) {
      console.log(`🔑 JWT Token received: ${response.body.token.substring(0, 20)}...`);
      return { success: true, token: response.body.token };
    }
    return { success: response.statusCode === 201, token: null };
  } catch (error) {
    console.log(`❌ Student signup failed: ${error.message}`);
    return { success: false, token: null };
  }
}

async function testStudentLogin() {
  console.log('\n🔐 Testing Student Login...');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/students/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const loginData = {
      email: testStudent.email,
      password: testStudent.password
    };

    const response = await makeRequest(options, loginData);
    console.log(`✅ Student login: ${response.statusCode} - ${response.body?.message || 'Success'}`);

    if (response.body?.token) {
      console.log(`🔑 JWT Token received: ${response.body.token.substring(0, 20)}...`);
      return { success: true, token: response.body.token };
    }
    return { success: response.statusCode === 200, token: null };
  } catch (error) {
    console.log(`❌ Student login failed: ${error.message}`);
    return { success: false, token: null };
  }
}

async function testStudentProfile(token) {
  console.log('\n📋 Testing Student Profile...');
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/students/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);
    console.log(`✅ Student profile: ${response.statusCode}`);
    if (response.body) {
      console.log(`📋 Profile data: ${JSON.stringify(response.body, null, 2)}`);
    }
    return response.statusCode === 200;
  } catch (error) {
    console.log(`❌ Student profile failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 CampusConnect API Test Suite');
  console.log('================================');
  console.log(`🌐 Testing against: ${baseUrl}`);

  const results = {
    healthCheck: false,
    studentSignup: false,
    studentLogin: false,
    studentProfile: false
  };

  let token = null;

  // Test 1: Health Check
  results.healthCheck = await testHealthCheck();

  // Test 2: Student Signup
  const signupResult = await testStudentSignup();
  results.studentSignup = signupResult.success;
  token = signupResult.token;

  // Test 3: Student Login (if signup failed, try login anyway)
  if (!token) {
    const loginResult = await testStudentLogin();
    results.studentLogin = loginResult.success;
    token = loginResult.token;
  } else {
    results.studentLogin = true; // signup includes login
  }

  // Test 4: Student Profile (requires token)
  if (token) {
    results.studentProfile = await testStudentProfile(token);
  }

  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };