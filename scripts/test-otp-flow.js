#!/usr/bin/env node

/**
 * OTP Flow Test Script
 * 
 * This script tests the complete OTP authentication flow.
 * It sends an OTP and then prompts you to verify it.
 * 
 * Usage:
 *   node scripts/test-otp-flow.js <mobile_number>
 * 
 * Example:
 *   node scripts/test-otp-flow.js 9876543210
 * 
 * Prerequisites:
 *   - Server must be running (npm start)
 *   - NODE_ENV=development in .env for console OTP
 */

const axios = require('axios');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function header(text) {
  const border = '='.repeat(70);
  console.log('\n' + colors.cyan + border);
  console.log(colors.bright + colors.cyan + text);
  console.log(border + colors.reset + '\n');
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function sendOtp(mobileNumber, baseUrl) {
  try {
    header('📤 STEP 1: SEND OTP');
    
    console.log('Mobile Number:', mobileNumber);
    console.log('Endpoint:', `${baseUrl}/v1/otp/send-otp`);
    console.log('');
    
    log(colors.yellow, '⏳ Sending OTP request...\n');
    
    const response = await axios.post(`${baseUrl}/v1/otp/send-otp`, {
      mobileNumber
    }, {
      timeout: 10000
    });
    
    log(colors.green, '✅ OTP sent successfully!\n');
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('');
    
    if (response.data?.data?.devMode) {
      log(colors.cyan, '🔥 DEVELOPMENT MODE ACTIVE');
      log(colors.cyan, '📝 Check your server console for the OTP');
      log(colors.cyan, 'Look for the section with 🔐 icons showing the OTP\n');
    }
    
    if (response.data?.data?.smsStatus?.sent === false) {
      log(colors.yellow, '⚠️  SMS delivery failed, but OTP is available in console');
      log(colors.yellow, 'Reason:', response.data.data.smsStatus.reason, '\n');
    } else if (response.data?.data?.smsStatus?.sent === true) {
      log(colors.green, '📱 SMS sent successfully to mobile device\n');
    }
    
    return true;
    
  } catch (error) {
    log(colors.red, '❌ Failed to send OTP\n');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
    
    if (error.code === 'ECONNREFUSED') {
      log(colors.yellow, '\n⚠️  Cannot connect to server');
      console.log('  - Is the server running? (npm start)');
      console.log('  - Check if port 5001 is correct\n');
    }
    
    return false;
  }
}

async function verifyOtp(mobileNumber, otp, baseUrl) {
  try {
    header('✅ STEP 2: VERIFY OTP');
    
    console.log('Mobile Number:', mobileNumber);
    console.log('OTP:', otp);
    console.log('Endpoint:', `${baseUrl}/v1/otp/verify-otp`);
    console.log('');
    
    log(colors.yellow, '⏳ Verifying OTP...\n');
    
    const response = await axios.post(`${baseUrl}/v1/otp/verify-otp`, {
      mobileNumber,
      otp
    }, {
      timeout: 10000
    });
    
    log(colors.green, '✅ OTP verified successfully!\n');
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('');
    
    if (response.data?.data?.token) {
      log(colors.cyan, '🎟️  JWT Token received:');
      console.log(response.data.data.token.substring(0, 50) + '...\n');
      
      log(colors.cyan, '🔄 Refresh Token received:');
      console.log(response.data.data.refreshToken.substring(0, 50) + '...\n');
      
      log(colors.green, '🎉 Authentication successful!');
      log(colors.green, 'You can now use the JWT token for authenticated requests\n');
      
      return {
        success: true,
        token: response.data.data.token,
        refreshToken: response.data.data.refreshToken,
        user: response.data.data.user
      };
    }
    
    return { success: true };
    
  } catch (error) {
    log(colors.red, '❌ Failed to verify OTP\n');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 400) {
        log(colors.yellow, '\n💡 Common issues:');
        console.log('  - OTP is incorrect (check server console)');
        console.log('  - OTP has expired (valid for 5 minutes)');
        console.log('  - OTP already used (request a new one)\n');
      }
    } else {
      console.log('Error:', error.message);
    }
    
    return { success: false };
  }
}

async function testAuthenticatedEndpoint(token, baseUrl) {
  try {
    header('🔐 STEP 3: TEST AUTHENTICATED ENDPOINT');
    
    console.log('Endpoint:', `${baseUrl}/v1/users/profile`);
    console.log('Using JWT token...\n');
    
    log(colors.yellow, '⏳ Fetching user profile...\n');
    
    const response = await axios.get(`${baseUrl}/v1/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 10000
    });
    
    log(colors.green, '✅ Authenticated request successful!\n');
    
    console.log('User Profile:', JSON.stringify(response.data, null, 2));
    console.log('');
    
    return true;
    
  } catch (error) {
    log(colors.red, '❌ Authenticated request failed\n');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        log(colors.yellow, '\n💡 Token might be invalid or expired\n');
      }
    } else {
      console.log('Error:', error.message);
    }
    
    return false;
  }
}

async function runTest() {
  try {
    const mobileNumber = process.argv[2];
    const baseUrl = process.argv[3] || 'http://localhost:5001';
    
    header('🧪 OTP FLOW TEST');
    
    // Validate input
    if (!mobileNumber) {
      log(colors.red, '❌ Error: Mobile number is required\n');
      log(colors.yellow, 'Usage: node scripts/test-otp-flow.js <mobile_number> [base_url]\n');
      log(colors.yellow, 'Example: node scripts/test-otp-flow.js 9876543210');
      log(colors.yellow, 'Example: node scripts/test-otp-flow.js 9876543210 http://localhost:5001\n');
      process.exit(1);
    }
    
    // Validate mobile number format
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobileNumber)) {
      log(colors.red, '❌ Error: Invalid mobile number format');
      log(colors.yellow, 'Mobile number should be 10 digits starting with 6-9\n');
      process.exit(1);
    }
    
    console.log('Base URL:', baseUrl);
    console.log('Mobile Number:', mobileNumber);
    console.log('');
    
    log(colors.magenta, '📋 Test Flow:');
    console.log('  1. Send OTP to mobile number');
    console.log('  2. Get OTP from server console');
    console.log('  3. Verify OTP and get JWT token');
    console.log('  4. Test authenticated endpoint with token');
    console.log('');
    
    log(colors.cyan, '⚠️  Make sure:');
    console.log('  - Server is running (npm start)');
    console.log('  - NODE_ENV=development in .env');
    console.log('  - MongoDB is running');
    console.log('');
    
    const proceed = await question(colors.yellow + 'Ready to start? (y/n): ' + colors.reset);
    
    if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
      log(colors.yellow, '\nTest cancelled.\n');
      process.exit(0);
    }
    
    // Step 1: Send OTP
    const sendSuccess = await sendOtp(mobileNumber, baseUrl);
    
    if (!sendSuccess) {
      log(colors.red, '❌ Test failed at Step 1. Please fix the errors and try again.\n');
      process.exit(1);
    }
    
    // Step 2: Get OTP from user
    log(colors.bright + colors.cyan, '\n📝 Check your server console for the OTP');
    log(colors.cyan, 'It will be displayed between 🔐 icons\n');
    
    const otp = await question(colors.yellow + 'Enter the OTP from console: ' + colors.reset);
    
    if (!otp || otp.length !== 6) {
      log(colors.red, '\n❌ Invalid OTP format. OTP should be 6 digits.\n');
      process.exit(1);
    }
    
    // Step 3: Verify OTP
    const verifyResult = await verifyOtp(mobileNumber, otp, baseUrl);
    
    if (!verifyResult.success) {
      log(colors.red, '❌ Test failed at Step 2. Please check the OTP and try again.\n');
      process.exit(1);
    }
    
    // Step 4: Test authenticated endpoint (optional)
    if (verifyResult.token) {
      console.log('');
      const testAuth = await question(colors.yellow + 'Test authenticated endpoint? (y/n): ' + colors.reset);
      
      if (testAuth.toLowerCase() === 'y' || testAuth.toLowerCase() === 'yes') {
        await testAuthenticatedEndpoint(verifyResult.token, baseUrl);
      }
    }
    
    // Success summary
    header('🎉 TEST COMPLETED SUCCESSFULLY!');
    
    log(colors.green, '✅ All steps passed:');
    console.log('  ✓ OTP sent successfully');
    console.log('  ✓ OTP verified successfully');
    console.log('  ✓ JWT token received');
    console.log('  ✓ User authenticated');
    console.log('');
    
    log(colors.cyan, '📌 Summary:');
    console.log('  Mobile:', mobileNumber);
    console.log('  Verified:', verifyResult.user?.isVerified ? 'Yes' : 'No');
    if (verifyResult.user?.id) {
      console.log('  User ID:', verifyResult.user.id);
    }
    console.log('');
    
    log(colors.magenta, '🎯 Next Steps:');
    console.log('  1. Save the JWT token for API requests');
    console.log('  2. Test other endpoints with the token');
    console.log('  3. Use Postman collection for comprehensive testing');
    console.log('  4. Review ENV_SETUP.md for production configuration');
    console.log('');
    
    process.exit(0);
    
  } catch (error) {
    log(colors.red, '\n❌ Unexpected error:', error.message, '\n');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the test
runTest();


