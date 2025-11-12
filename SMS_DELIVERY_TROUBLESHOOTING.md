# SMS OTP Not Received - Troubleshooting Guide

**Issue**: API returns 200 success but OTP not received on phone  
**Solution**: Follow this step-by-step troubleshooting guide

---

## 🔍 Step 1: Test SMS API Directly

Run the direct SMS test to isolate the issue:

```bash
npm run test:sms:direct 9876543210
```

Replace `9876543210` with your actual mobile number.

**What This Does**:
- Tests SMS API without full app infrastructure
- Shows exact API URL being called
- Displays full API response
- Shows credentials being used (masked)
- Identifies specific errors

**Expected Output**:
```
✅ SMS SENT SUCCESSFULLY!
✅ Check your phone: 9876543210
```

---

## 🔍 Step 2: Check Common Issues

### Issue A: Invalid SMS API Credentials

**Check File**: `config.json`

```json
{
  "smsvendor": "http://login4.spearuc.com/MOBILE_APPS_API/sms_api.php?type=smsquicksend&user=selorgotp&pass=welcome123&sender=EVOLGN&t_id=1707166841244742343&"
}
```

**Verify**:
- ✅ Username (`user=selorgotp`) is correct
- ✅ Password (`pass=welcome123`) is correct
- ✅ Sender ID (`sender=EVOLGN`) is approved
- ✅ Template ID (`t_id=...`) is approved by DLT

**How to Check**:
1. Log in to your Spearuc account: http://login4.spearuc.com
2. Verify credentials
3. Check SMS balance
4. Verify sender ID and template are approved

### Issue B: Insufficient SMS Balance

**Check**:
- Log in to Spearuc dashboard
- Check SMS credits balance
- Top up if needed

### Issue C: Mobile Number Format

**Correct Formats**:
- ✅ `9876543210` (10 digits, no country code)
- ✅ `+919876543210` (with country code)

**Incorrect**:
- ❌ `919876543210` (11 digits, wrong format)
- ❌ `09876543210` (leading zero)

### Issue D: Template Not Approved

Your message must match the approved DLT template exactly:
```
Dear Customer, Your OTP for verification is {otp}. Valid for 5 minutes. Do not share with anyone. SELORG
```

**Check**:
- Template ID in config.json matches approved template
- Message text matches exactly
- Sender ID is approved for this template

### Issue E: Network/Firewall Issues

**Test API Connectivity**:
```bash
curl "http://login4.spearuc.com/MOBILE_APPS_API/sms_api.php?type=smsquicksend&user=selorgotp&pass=welcome123&sender=EVOLGN&t_id=1707166841244742343&to_mobileno=9876543210&sms_text=TEST"
```

**Check**:
- Can you reach the SMS API server?
- Is your server behind a firewall?
- Are outbound HTTP requests allowed?

---

## 🔍 Step 3: Check Server Logs

When you send OTP, look for these logs:

### ✅ Success Pattern
```
🚀 Attempting to send SMS to: 9876543210
======================================================================
📱 SENDING SMS VIA API
To: 9876543210
API URL: http://login4.spearuc.com/...
======================================================================

📨 SMS API RESPONSE:
HTTP Status: 200
Response Data: { "status": "success", "messageId": "..." }
======================================================================

✅✅✅ SMS SENT SUCCESSFULLY TO YOUR PHONE! ✅✅✅
```

### ❌ Failure Pattern
```
🚀 Attempting to send SMS to: 9876543210
❌❌❌ SMS SENDING FAILED! ❌❌❌
❌ Error: SMS API error: Invalid credentials
❌ Mobile Number: 9876543210

🔍 SMS ERROR DETAILS: [detailed error stack]
```

---

## 🔍 Step 4: Verify SMS API Response

The SMS API might be responding but with an error. Check what the API actually returns:

### Success Response (Expected)
```json
{
  "status": "success",
  "messageId": "123456"
}
```

### Error Responses (Common)
```json
{
  "status": "failed",
  "error": "Invalid credentials"
}
```
**Fix**: Update credentials in config.json

```json
{
  "status": "failed",
  "error": "Insufficient balance"
}
```
**Fix**: Recharge SMS credits

```json
{
  "status": "failed",
  "error": "Invalid sender ID"
}
```
**Fix**: Use approved sender ID or get approval

---

## 🔧 Quick Fixes

### Fix 1: Update SMS API Credentials

**File**: `config.json`

```json
{
  "smsvendor": "http://login4.spearuc.com/MOBILE_APPS_API/sms_api.php?type=smsquicksend&user=YOUR_USERNAME&pass=YOUR_PASSWORD&sender=YOUR_SENDER_ID&t_id=YOUR_TEMPLATE_ID&"
}
```

Replace:
- `YOUR_USERNAME` - Your Spearuc username
- `YOUR_PASSWORD` - Your Spearuc password
- `YOUR_SENDER_ID` - Your approved sender ID (e.g., SELORG)
- `YOUR_TEMPLATE_ID` - Your DLT approved template ID

### Fix 2: Test with Your Number

```bash
# Test with YOUR actual mobile number
npm run test:sms:direct YOUR_NUMBER

# Example:
npm run test:sms:direct 9876543210
```

### Fix 3: Check Spearuc Account

1. Visit: http://login4.spearuc.com
2. Log in with credentials from config.json
3. Check:
   - SMS balance > 0
   - Sender ID is active
   - Template is approved
   - API access is enabled

---

## 🎯 Current Behavior (After Fix)

### What Happens When You Send OTP:

**Step 1**: OTP logged to console (always)
```
🔐🔐🔐 YOUR OTP: 123456 🔐🔐🔐
```

**Step 2**: SMS sending attempted (always tries)
```
🚀 Attempting to send SMS to: 9876543210
[SMS API call happens]
```

**Step 3**: One of two outcomes:

**Outcome A - SMS Success** ✅
```
✅ SMS SENT SUCCESSFULLY TO YOUR PHONE!
✅ Check your phone for OTP
```
→ You receive SMS on your phone

**Outcome B - SMS Failed** ❌
```
❌ SMS SENDING FAILED!
❌ Error: [specific error]
💡 You can still test with console OTP above
```
→ Use console OTP for testing, fix SMS issue

---

## 🚨 Common Errors & Solutions

### Error: "Invalid credentials"
**Solution**: Update username/password in config.json

### Error: "Insufficient balance"
**Solution**: Recharge SMS credits in Spearuc account

### Error: "Invalid sender ID"
**Solution**: Use approved sender ID or apply for approval

### Error: "Template not approved"
**Solution**: Get DLT approval for message template

### Error: "Network timeout"
**Solution**: Check internet connection, try again

### Error: "Rate limit exceeded"
**Solution**: Wait a few minutes, then try again

---

## 📞 Get Help

### If SMS Still Not Working:

1. **Run Diagnostic**:
   ```bash
   npm run test:sms:direct YOUR_NUMBER
   ```

2. **Check Server Logs**: Look for detailed error in console

3. **Verify Spearuc Account**: 
   - Login: http://login4.spearuc.com
   - Check balance, sender ID, template

4. **Contact Spearuc Support**:
   - They can verify if API calls are reaching their server
   - They can check if there are account issues

5. **Use Console OTP for Testing**:
   - While fixing SMS, use console OTP
   - API returns success so you can continue testing
   - SMS delivery can be fixed separately

---

## ✅ Success Checklist

When SMS is working correctly, you should see:

- ✅ Console shows: "🚀 Attempting to send SMS"
- ✅ Console shows: "📱 SENDING SMS VIA API"
- ✅ Console shows: "📨 SMS API RESPONSE: HTTP Status: 200"
- ✅ Console shows: "✅ SMS SENT SUCCESSFULLY TO YOUR PHONE!"
- ✅ **Your phone receives OTP within 30 seconds**

---

## 💡 Pro Tip

**Development Best Practice**:
- Use console OTP for fast testing (free, instant)
- Test SMS delivery separately with `npm run test:sms:direct`
- Once SMS works, both console and phone will receive OTP
- In production, only SMS is sent (no console logging)

---

## 📚 Related Files

- `SMS_TESTING_GUIDE.md` - Complete SMS testing guide
- `config.json` - SMS API configuration
- `scripts/test-sms-direct.js` - Direct SMS test script
- `src/v1/service/smsService.js` - SMS service implementation
- `src/v1/service/authService.js` - OTP sending logic

---

**Last Updated**: December 11, 2024  
**Status**: Enhanced with better error diagnostics

