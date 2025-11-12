#!/usr/bin/env node

/**
 * SMS API Test Script
 * 
 * This script tests the SMS provider API directly to verify credentials and connectivity.
 * Run this before testing the full OTP flow to ensure SMS is properly configured.
 * 
 * Usage:
 *   node scripts/test-sms-api.js <mobile_number>
 * 
 * Example:
 *   node scripts/test-sms-api.js 9876543210
 */

const axios = require('axios');
const config = require('../config.json');

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

async function testSmsApi(mobileNumber) {
  try {
    header('📱 SMS API TEST');

    // Validate input
    if (!mobileNumber) {
      log(colors.red, '❌ Error: Mobile number is required');
      log(colors.yellow, '\nUsage: node scripts/test-sms-api.js <mobile_number>');
      log(colors.yellow, 'Example: node scripts/test-sms-api.js 9876543210\n');
      process.exit(1);
    }

    // Validate mobile number format
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobileNumber)) {
      log(colors.red, '❌ Error: Invalid mobile number format');
      log(colors.yellow, 'Mobile number should be 10 digits starting with 6-9\n');
      process.exit(1);
    }

    // Check if SMS vendor URL is configured
    if (!config.smsvendor) {
      log(colors.red, '❌ Error: SMS vendor URL not configured in config.json');
      log(colors.yellow, '\nPlease add "smsvendor" to config.json with your SMS API URL\n');
      process.exit(1);
    }

    // Test message
    const testMessage = `Test SMS from SELORG API. Your OTP is 123456. SELORG`;

    // Build API URL
    const smsApiUrl = `${config.smsvendor}to_mobileno=${mobileNumber}&sms_text=${encodeURIComponent(testMessage)}`;
    
    // Log request details
    log(colors.blue, '📤 Sending test SMS...\n');
    console.log('Mobile Number:', mobileNumber);
    console.log('Message:', testMessage);
    console.log('API URL:', smsApiUrl.replace(/pass=[^&]+/, 'pass=***'));
    console.log('');

    // Make API request
    log(colors.yellow, '⏳ Waiting for response...\n');
    
    const startTime = Date.now();
    const response = await axios.get(smsApiUrl, {
      timeout: 15000,
      validateStatus: false // Don't throw on any status
    });
    const duration = Date.now() - startTime;

    // Log response details
    header('📨 SMS API RESPONSE');
    
    console.log('HTTP Status:', response.status);
    console.log('Response Time:', duration + 'ms');
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('');

    // Check success
    const isSuccess = 
      response.data?.status === "success" ||
      response.data?.status === "Success" ||
      response.data?.message === "success" ||
      response.data?.success === true ||
      response.data?.Status === "Success" ||
      response.status === 200;

    if (isSuccess) {
      log(colors.green, '✅ SUCCESS: SMS sent successfully!\n');
      log(colors.green, '🎉 Your SMS provider is properly configured.\n');
      
      if (response.data?.messageId || response.data?.id) {
        console.log('Message ID:', response.data.messageId || response.data.id);
      }
      
      log(colors.cyan, '\n📱 Check the mobile device for SMS delivery.\n');
      
      return true;
    } else {
      log(colors.red, '❌ FAILED: SMS API returned non-success status\n');
      
      const errorMsg = response.data?.message || response.data?.error || response.data?.Error || 'Unknown error';
      log(colors.red, 'Error Message:', errorMsg);
      
      log(colors.yellow, '\n💡 Troubleshooting Tips:');
      console.log('  1. Check SMS provider credentials in config.json');
      console.log('  2. Verify account has sufficient credits');
      console.log('  3. Ensure sender ID (SID) is approved');
      console.log('  4. Check if message templates are approved (DLT)');
      console.log('  5. Verify mobile number is not in DND registry');
      console.log('  6. Contact SMS provider support\n');
      
      return false;
    }

  } catch (error) {
    header('❌ ERROR OCCURRED');
    
    log(colors.red, 'Error Type:', error.name);
    log(colors.red, 'Error Message:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      log(colors.yellow, '\n⏰ Timeout: SMS API did not respond within 15 seconds');
      console.log('  - Check your internet connection');
      console.log('  - Verify SMS API endpoint is correct');
      console.log('  - Check firewall settings\n');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      log(colors.yellow, '\n🌐 Network Error: Cannot reach SMS API');
      console.log('  - Check SMS API URL in config.json');
      console.log('  - Verify internet connection');
      console.log('  - Check DNS settings\n');
    } else {
      log(colors.yellow, '\n💡 Possible Issues:');
      console.log('  1. SMS API endpoint is incorrect');
      console.log('  2. Network connectivity problems');
      console.log('  3. Firewall blocking outbound requests');
      console.log('  4. SMS provider server is down');
      console.log('  5. Invalid API credentials\n');
    }
    
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', error.response.data);
    }
    
    console.log('');
    return false;
  }
}

// Run the test
const mobileNumber = process.argv[2];

testSmsApi(mobileNumber)
  .then(success => {
    if (success) {
      log(colors.green, '✅ Test completed successfully!\n');
      process.exit(0);
    } else {
      log(colors.red, '❌ Test failed. Please check the errors above.\n');
      process.exit(1);
    }
  })
  .catch(error => {
    log(colors.red, '❌ Unexpected error:', error.message, '\n');
    process.exit(1);
  });


