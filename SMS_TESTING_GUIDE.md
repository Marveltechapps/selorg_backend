# SMS & OTP Testing Guide

This guide helps you test the SMS and OTP functionality in development mode.

## Prerequisites

1. **Set up your environment**:
   - Create a `.env` file in the root directory
   - Add `NODE_ENV=development`
   - Add `DEV_SHOW_OTP_IN_CONSOLE=true`

2. **Configure SMS credentials**:
   - Update `config.json` with your SMS provider credentials
   - Ensure the `smsvendor` URL is correctly formatted

3. **Start the server**:
   ```bash
   npm start
   # or
   npm run dev
   ```

---

## Test 1: Direct SMS API Test

Test your SMS provider API directly to verify credentials and connectivity.

### Using cURL

```bash
# Replace YOUR_USER, YOUR_PASSWORD, YOUR_SID, and MOBILE_NUMBER with actual values
curl -X GET "https://www.spearuc.com/SMSAPI/api/mt/SendSMS?user=YOUR_USER&pass=YOUR_PASSWORD&sid=YOUR_SID&to_mobileno=9876543210&sms_text=Test%20SMS%20from%20SELORG"
```

### Using Postman

1. Create a new GET request
2. URL: `https://www.spearuc.com/SMSAPI/api/mt/SendSMS`
3. Add query parameters:
   - `user`: Your SMS provider username
   - `pass`: Your SMS provider password
   - `sid`: Your sender ID
   - `to_mobileno`: Test mobile number (e.g., `9876543210`)
   - `sms_text`: `Test SMS from SELORG`
4. Send the request

### Expected Response

```json
{
  "status": "success",
  "messageId": "abc123xyz",
  "deliveryStatus": "sent"
}
```

### Troubleshooting

| Error | Solution |
|-------|----------|
| `Authentication failed` | Check `user` and `pass` credentials |
| `Invalid sender ID` | Verify `sid` is registered with provider |
| `Insufficient credits` | Top up your SMS account |
| `Template not approved` | Get DLT approval (India specific) |
| Connection timeout | Check network/firewall, increase timeout |

---

## Test 2: OTP Flow via API (Development Mode)

Test the complete OTP flow using the backend API. In development mode, OTP will be logged to console.

### Step 1: Send OTP

**Request:**

```http
POST http://localhost:5001/v1/otp/send-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210"
}
```

**Using cURL:**

```bash
curl -X POST http://localhost:5001/v1/otp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210"}'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "message": "OTP sent successfully",
    "expiresIn": 300,
    "devMode": true,
    "smsStatus": {
      "sent": true
    }
  }
}
```

**Console Output (Development Mode):**

```
🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐
📱 MOBILE NUMBER: 9876543210
🔑 YOUR OTP: 573829
⏰ VALID FOR: 5 minutes
💡 Use this OTP to verify in Postman/Frontend
🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐

======================================================================
📱 SENDING SMS VIA API
To: 9876543210
Message: Your OTP is 573829. Valid for 5 minutes. SELORG
Attempt: 1
API URL: https://www.spearuc.com/SMSAPI/api/mt/SendSMS?user=***&pass=***&...
======================================================================

📨 SMS API RESPONSE:
HTTP Status: 200
Response Data: {
  "status": "success",
  "messageId": "abc123"
}
======================================================================

✅ SMS sent successfully!
✅ SMS also sent successfully to 9876543210
```

**Copy the OTP from the console** (e.g., `573829`)

### Step 2: Verify OTP

**Request:**

```http
POST http://localhost:5001/v1/otp/verify-otp
Content-Type: application/json

{
  "mobileNumber": "9876543210",
  "otp": "573829"
}
```

**Using cURL:**

```bash
curl -X POST http://localhost:5001/v1/otp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210","otp":"573829"}'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "message": "OTP verified successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "mobileNumber": "9876543210",
      "isVerified": true
    }
  }
}
```

**Save the `token` for authenticated requests.**

### Step 3: Test Authenticated Endpoint

Use the JWT token to test authenticated endpoints.

**Request:**

```http
GET http://localhost:5001/v1/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Using cURL:**

```bash
curl -X GET http://localhost:5001/v1/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## Test 3: SMS Failure Scenarios (Development Mode)

Test how the application handles SMS failures in development mode.

### Scenario 1: Invalid SMS Credentials

1. Temporarily change SMS credentials in `config.json` to invalid values
2. Send OTP request
3. **Expected behavior**:
   - ✅ OTP is logged to console
   - ⚠️ SMS failure warning is shown
   - ✅ API returns 200 OK
   - ✅ You can still verify using console OTP

### Scenario 2: SMS Provider Timeout

1. Set a very low timeout in `smsService.js` (e.g., 100ms)
2. Send OTP request
3. **Expected behavior**:
   - ⚠️ Retry attempts are logged
   - ✅ OTP is available in console
   - ✅ Testing can continue

### Scenario 3: Network Disconnected

1. Disconnect from internet
2. Send OTP request
3. **Expected behavior**:
   - ❌ SMS sending fails
   - ✅ OTP is logged to console
   - ✅ API returns 200 OK in development mode
   - ✅ Testing continues with console OTP

---

## Test 4: Production Mode Testing

**⚠️ Warning**: In production mode, SMS must work. OTP will NOT be logged to console.

### Setup

```env
NODE_ENV=production
```

### Expected Behavior

1. **SMS Success**:
   - OTP is sent via SMS
   - No console logging of OTP
   - API returns 200 OK

2. **SMS Failure**:
   - API returns 500 error
   - Error message indicates SMS failure
   - User cannot proceed without SMS

---

## Common Test Scenarios

### Test Case 1: First Time User

```bash
# 1. Send OTP to new number
curl -X POST http://localhost:5001/v1/otp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9111111111"}'

# 2. Check console for OTP
# 3. Verify OTP
curl -X POST http://localhost:5001/v1/otp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9111111111","otp":"CONSOLE_OTP"}'

# Result: New user created, JWT token received
```

### Test Case 2: Existing User Re-login

```bash
# 1. Send OTP to existing number
curl -X POST http://localhost:5001/v1/otp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210"}'

# 2. Verify OTP
curl -X POST http://localhost:5001/v1/otp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210","otp":"CONSOLE_OTP"}'

# Result: Existing user logged in, JWT token received
```

### Test Case 3: Wrong OTP

```bash
# 1. Send OTP
curl -X POST http://localhost:5001/v1/otp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210"}'

# 2. Try wrong OTP
curl -X POST http://localhost:5001/v1/otp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210","otp":"000000"}'

# Expected: 400 error "Invalid or expired OTP"
```

### Test Case 4: Expired OTP

```bash
# 1. Send OTP
curl -X POST http://localhost:5001/v1/otp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210"}'

# 2. Wait 6 minutes (OTP expires after 5 minutes)
# 3. Try to verify
curl -X POST http://localhost:5001/v1/otp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210","otp":"CONSOLE_OTP"}'

# Expected: 400 error "Invalid or expired OTP"
```

### Test Case 5: Resend OTP

```bash
# 1. Send OTP
curl -X POST http://localhost:5001/v1/otp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210"}'

# Note first OTP from console

# 2. Resend OTP (wait 30 seconds due to rate limiting)
curl -X POST http://localhost:5001/v1/otp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210"}'

# Note new OTP from console

# 3. Try old OTP (should fail)
curl -X POST http://localhost:5001/v1/otp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210","otp":"OLD_OTP"}'

# Expected: 400 error

# 4. Try new OTP (should succeed)
curl -X POST http://localhost:5001/v1/otp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210","otp":"NEW_OTP"}'

# Expected: Success with JWT token
```

---

## Postman Collection

A complete Postman collection is available in `postman/SELORG_API_Collection.json`. Import it to test all endpoints.

### Quick Postman Setup

1. Import the collection: `File > Import > postman/SELORG_API_Collection.json`
2. Create an environment:
   - `baseUrl`: `http://localhost:5001`
   - `token`: (will be set automatically after OTP verification)
3. Run the "Authentication Flow" folder to test OTP

---

## Debugging Tips

### Enable Detailed Logging

```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Check Server Logs

```bash
tail -f logs/app.log
```

### Check MongoDB

```bash
# Connect to MongoDB
mongo mongodb://127.0.0.1:27017/selorg

# Check users collection
db.users.find({ mobileNumber: "9876543210" }).pretty()

# Check OTP and expiry
db.users.find(
  { mobileNumber: "9876543210" },
  { mobileNumber: 1, otp: 1, otpExpiresAt: 1, isVerified: 1 }
).pretty()
```

### Network Request Inspection

Use browser DevTools or Postman Console to inspect:
- Request headers
- Request body
- Response status
- Response body
- Response time

---

## SMS Provider Checklist

Before testing, ensure:

- [ ] SMS provider account is active
- [ ] Account has sufficient credits
- [ ] API credentials are correct in `config.json`
- [ ] Sender ID (SID) is approved
- [ ] Message templates are approved (DLT in India)
- [ ] Test mobile number is not in DND registry
- [ ] API endpoint is reachable from your server
- [ ] Firewall allows outbound HTTPS connections

---

## Success Indicators

✅ **Everything is working if:**

1. Server starts without errors
2. OTP appears in console when requested (development mode)
3. SMS is delivered to mobile (if provider is configured)
4. OTP verification succeeds with correct OTP
5. JWT token is returned after verification
6. Authenticated requests work with the token

---

## Need Help?

1. Check `ENV_SETUP.md` for environment configuration
2. Review `logs/app.log` for detailed error messages
3. Check SMS provider dashboard for delivery status
4. Test SMS API directly with cURL first
5. Ensure `NODE_ENV=development` for console OTP

Remember: In development mode, actual SMS delivery is optional. The console OTP is sufficient for testing!


