/**
 * Direct SMS API Test Script
 * Tests SMS sending WITHOUT the full app infrastructure
 * Run: node scripts/test-sms-direct.js
 */

const axios = require("axios");
const config = require("../config.json");

async function testSMSAPI() {
  console.log('\n' + '='.repeat(80));
  console.log('📱 DIRECT SMS API TEST');
  console.log('='.repeat(80));
  
  // Get mobile number from command line or use test number
  const mobileNumber = process.argv[2] || "9876543210";
  const testOTP = "123456";
  const message = `Dear Customer, Your OTP for verification is ${testOTP}. Valid for 5 minutes. Do not share with anyone. SELORG`;
  
  console.log('\n📋 TEST CONFIGURATION:');
  console.log('Mobile Number:', mobileNumber);
  console.log('Test OTP:', testOTP);
  console.log('Message:', message);
  console.log('Message Length:', message.length, 'characters');
  
  // Build API URL
  const smsApiUrl = `${config.smsvendor}to_mobileno=${mobileNumber}&sms_text=${encodeURIComponent(message)}`;
  
  console.log('\n🔗 SMS API DETAILS:');
  console.log('Base URL:', config.smsvendor.split('?')[0]);
  console.log('Full URL (masked):', smsApiUrl.replace(/pass=[^&]+/, 'pass=***'));
  
  // Extract credentials from URL for display
  const urlParams = new URLSearchParams(config.smsvendor.split('?')[1]);
  console.log('\n🔑 CREDENTIALS CHECK:');
  console.log('User:', urlParams.get('user') || 'NOT FOUND');
  console.log('Password:', urlParams.get('pass') ? '***' + urlParams.get('pass').slice(-3) : 'NOT FOUND');
  console.log('Sender:', urlParams.get('sender') || 'NOT FOUND');
  console.log('Template ID:', urlParams.get('t_id') || 'NOT FOUND');
  
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SENDING SMS...');
  console.log('='.repeat(80));
  
  try {
    const response = await axios.get(smsApiUrl, {
      timeout: 15000,
      validateStatus: false
    });
    
    console.log('\n📨 RESPONSE RECEIVED:');
    console.log('HTTP Status Code:', response.status);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    // Check for success
    const isSuccess = 
      response.data?.status === "success" ||
      response.data?.status === "Success" ||
      response.data?.message === "success" ||
      response.data?.success === true ||
      response.data?.Status === "Success" ||
      response.status === 200;
    
    if (isSuccess) {
      console.log('\n' + '✅'.repeat(40));
      console.log('✅ SMS SENT SUCCESSFULLY!');
      console.log('✅ Check your phone:', mobileNumber);
      console.log('✅ You should receive OTP:', testOTP);
      console.log('✅'.repeat(40) + '\n');
      
      return { success: true };
    } else {
      console.log('\n' + '❌'.repeat(40));
      console.log('❌ SMS FAILED!');
      console.log('❌ Reason:', response.data?.message || response.data?.error || 'Unknown error');
      console.log('❌'.repeat(40) + '\n');
      
      console.log('\n🔍 TROUBLESHOOTING:');
      console.log('1. Check if SMS API credentials are correct in config.json');
      console.log('2. Verify you have SMS credits in your Spearuc account');
      console.log('3. Check if template ID is approved');
      console.log('4. Try sending SMS manually from Spearuc dashboard');
      console.log('5. Contact Spearuc support if issue persists\n');
      
      return { success: false, error: response.data };
    }
    
  } catch (error) {
    console.log('\n' + '❌'.repeat(40));
    console.log('❌ SMS API REQUEST FAILED!');
    console.log('❌ Error:', error.message);
    console.log('❌'.repeat(40) + '\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔍 ISSUE: Cannot connect to SMS API server');
      console.log('   - Check if URL is correct in config.json');
      console.log('   - Verify internet connection');
      console.log('   - Try accessing the URL in browser\n');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('🔍 ISSUE: Request timed out');
      console.log('   - SMS API server might be slow');
      console.log('   - Check internet connection');
      console.log('   - Try increasing timeout\n');
    } else {
      console.log('🔍 ISSUE:', error.code || 'Unknown error');
      console.log('   - Check error details above');
      console.log('   - Verify SMS API configuration\n');
    }
    
    console.log('📚 For more help, see: SMS_TESTING_GUIDE.md\n');
    
    return { success: false, error: error.message };
  }
}

// Run the test
console.log('\n╔═══════════════════════════════════════════════════════════════════════════╗');
console.log('║  SELORG SMS API DIRECT TEST                                               ║');
console.log('║  Tests SMS delivery without the full application                         ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

testSMSAPI().then(result => {
  if (result.success) {
    console.log('✅ TEST PASSED - SMS API is working!\n');
    process.exit(0);
  } else {
    console.log('❌ TEST FAILED - SMS API has issues\n');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 UNEXPECTED ERROR:', error);
  process.exit(1);
});

