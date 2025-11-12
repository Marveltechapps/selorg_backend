/**
 * SMS Delivery Diagnostic Tool
 * Comprehensive check of why SMS isn't reaching phone
 * Run: node scripts/diagnose-sms-delivery.js YOUR_MOBILE_NUMBER
 */

const axios = require("axios");
const config = require("../config.json");

async function diagnoseSMSDelivery() {
  const mobileNumber = process.argv[2] || "7418268091";
  
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  SMS DELIVERY DIAGNOSTIC TOOL                                ║');
  console.log('║  Finding why SMS is not reaching your phone                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log('📱 Testing SMS delivery to:', mobileNumber);
  console.log('⏰ Timestamp:', new Date().toLocaleString());
  console.log('\n' + '='.repeat(70) + '\n');
  
  // Check 1: Verify SMS API Configuration
  console.log('✓ CHECK 1: SMS API Configuration');
  console.log('─'.repeat(70));
  
  const smsBaseUrl = config.smsvendor;
  const urlObj = new URL(smsBaseUrl.replace('&to_mobileno=', '&to_mobileno=xxx').replace('&sms_text=', '&sms_text=xxx'));
  
  console.log('API Base URL:', urlObj.origin + urlObj.pathname);
  console.log('Type:', urlObj.searchParams.get('type') || '❌ MISSING');
  console.log('User:', urlObj.searchParams.get('user') || '❌ MISSING');
  console.log('Password:', urlObj.searchParams.get('pass') ? '✓ Present (***' + urlObj.searchParams.get('pass').slice(-3) + ')' : '❌ MISSING');
  console.log('Sender:', urlObj.searchParams.get('sender') || '❌ MISSING');
  console.log('Template ID:', urlObj.searchParams.get('t_id') || '❌ MISSING');
  
  const hasAllParams = urlObj.searchParams.get('type') && urlObj.searchParams.get('user') && 
                       urlObj.searchParams.get('pass') && urlObj.searchParams.get('sender') && 
                       urlObj.searchParams.get('t_id');
  
  if (!hasAllParams) {
    console.log('\n❌ ISSUE FOUND: Missing required parameters in config.json');
    console.log('   Fix: Update config.json with all SMS API parameters\n');
    return false;
  }
  console.log('✅ All parameters present\n');
  
  // Check 2: Test API Connectivity
  console.log('✓ CHECK 2: API Server Connectivity');
  console.log('─'.repeat(70));
  
  try {
    const testUrl = urlObj.origin;
    console.log('Testing connectivity to:', testUrl);
    
    const connectTest = await axios.get(testUrl, { timeout: 5000, validateStatus: () => true });
    console.log('✅ API server is reachable');
    console.log('   Server:', connectTest.headers.server || 'Unknown');
    console.log('   Response Time:', connectTest.headers['x-response-time'] || 'N/A');
  } catch (error) {
    console.log('❌ ISSUE FOUND: Cannot reach SMS API server');
    console.log('   Error:', error.message);
    console.log('   Fix: Check internet connection or firewall settings\n');
    return false;
  }
  console.log('');
  
  // Check 3: Send Test SMS
  console.log('✓ CHECK 3: Sending Test SMS');
  console.log('─'.repeat(70));
  
  const testOTP = '1234';
  const testMessage = `Test SMS from SELORG. Your OTP is ${testOTP}. If you receive this, SMS delivery is working!`;
  
  console.log('Mobile Number:', mobileNumber);
  console.log('Test Message:', testMessage);
  console.log('Message Length:', testMessage.length, 'characters');
  console.log('\nSending...\n');
  
  try {
    const smsApiUrl = `${config.smsvendor}to_mobileno=${mobileNumber}&sms_text=${encodeURIComponent(testMessage)}`;
    
    const response = await axios.get(smsApiUrl, {
      timeout: 15000,
      validateStatus: false
    });
    
    console.log('📨 API RESPONSE:');
    console.log('HTTP Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('');
    
    // Analyze response
    const status = response.data?.status || response.data?.Status;
    const apiMessage = response.data?.Message || response.data?.message;
    const campaignId = response.data?.campaign_id;
    
    if (status === 'success' || status === 'Success') {
      console.log('✅ API SAYS: SMS sent successfully');
      console.log('✅ Campaign ID:', campaignId || 'N/A');
      console.log('✅ API Message:', apiMessage);
      console.log('\n' + '='.repeat(70));
      console.log('📱 NOW CHECK YOUR PHONE: ' + mobileNumber);
      console.log('⏰ WAIT: Up to 2 minutes for SMS delivery');
      console.log('📧 MESSAGE: "Test SMS from SELORG. Your OTP is 1234..."');
      console.log('='.repeat(70) + '\n');
      
      // Additional checks
      console.log('🔍 IF YOU STILL DO NOT RECEIVE SMS:');
      console.log('');
      console.log('   Possible Reason 1: DND (Do Not Disturb)');
      console.log('   └─ Your number might be registered in DND registry');
      console.log('   └─ Try: Test with a non-DND number');
      console.log('');
      console.log('   Possible Reason 2: Carrier Filtering');
      console.log('   └─ Your carrier might block messages from EVOLGN sender');
      console.log('   └─ Try: Different mobile number (different carrier)');
      console.log('');
      console.log('   Possible Reason 3: Network Delay');
      console.log('   └─ Sometimes SMS takes 2-5 minutes to deliver');
      console.log('   └─ Try: Wait longer');
      console.log('');
      console.log('   Possible Reason 4: Number Format Issue');
      console.log('   └─ Current:', mobileNumber);
      console.log('   └─ Try: Verify this is your correct number');
      console.log('');
      console.log('   Possible Reason 5: Spearuc Account Issue');
      console.log('   └─ Login: http://login4.spearuc.com');
      console.log('   └─ Check: SMS delivery reports');
      console.log('   └─ Verify: Template and sender ID are active');
      console.log('');
      
      return true;
    } else {
      console.log('❌ API SAYS: SMS sending failed');
      console.log('❌ Status:', status);
      console.log('❌ Message:', apiMessage);
      console.log('❌ Full Response:', response.data);
      console.log('\n🔧 FIX NEEDED: Check SMS API credentials in config.json\n');
      return false;
    }
    
  } catch (error) {
    console.log('❌ ERROR: Failed to call SMS API');
    console.log('❌ Error:', error.message);
    console.log('❌ Code:', error.code);
    console.log('\n🔧 FIX NEEDED: Check network connectivity or SMS API URL\n');
    return false;
  }
}

diagnoseSMSDelivery().then(result => {
  if (result) {
    console.log('✅ DIAGNOSTIC COMPLETE');
    console.log('   SMS API is working correctly');
    console.log('   If you don\'t receive SMS, it\'s a carrier/DND issue\n');
  } else {
    console.log('❌ DIAGNOSTIC FOUND ISSUES');
    console.log('   Fix the issues above and try again\n');
  }
  process.exit(result ? 0 : 1);
});

