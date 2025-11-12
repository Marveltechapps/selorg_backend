# Quick Start: Testing OTP Locally

Get up and running with OTP testing in 2 minutes! 🚀

## Step 1: Configure Environment (30 seconds)

Edit your `.env` file and add:

```env
NODE_ENV=development
```

That's it! This single line enables console OTP logging.

## Step 2: Start the Server (10 seconds)

```bash
npm start
```

Wait for:
```
Server is running on port 5001
MongoDB connected successfully
```

## Step 3: Test with Postman or cURL (1 minute)

### Send OTP Request

**Postman:**
- Method: `POST`
- URL: `http://localhost:5001/v1/otp/send-otp`
- Body (JSON):
  ```json
  {
    "mobileNumber": "9876543210"
  }
  ```

**cURL:**
```bash
curl -X POST http://localhost:5001/v1/otp/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210"}'
```

### Get OTP from Console

Check your server terminal. You'll see:

```
🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐
📱 MOBILE NUMBER: 9876543210
🔑 YOUR OTP: 573829
⏰ VALID FOR: 5 minutes
💡 Use this OTP to verify in Postman/Frontend
🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐
```

**Copy the OTP** (e.g., `573829`)

### Verify OTP

**Postman:**
- Method: `POST`
- URL: `http://localhost:5001/v1/otp/verify-otp`
- Body (JSON):
  ```json
  {
    "mobileNumber": "9876543210",
    "otp": "573829"
  }
  ```

**cURL:**
```bash
curl -X POST http://localhost:5001/v1/otp/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber":"9876543210","otp":"573829"}'
```

### Success Response

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
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

**Copy the `token`** for authenticated requests!

## Step 4: Use the Token (30 seconds)

Test an authenticated endpoint:

**Postman:**
- Method: `GET`
- URL: `http://localhost:5001/v1/users/profile`
- Headers:
  - Key: `Authorization`
  - Value: `Bearer YOUR_TOKEN_HERE`

**cURL:**
```bash
curl -X GET http://localhost:5001/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🎉 Done!

You've successfully tested the complete OTP flow locally!

---

## Automated Testing (Even Faster!)

Instead of manual testing, use our automated scripts:

### Test SMS API

```bash
npm run test:sms 9876543210
```

This tests your SMS provider configuration directly.

### Test Complete OTP Flow

```bash
npm run test:otp 9876543210
```

This runs an interactive test of the entire flow.

---

## Common Issues

### Issue: OTP not showing in console

**Fix**: Make sure `.env` contains `NODE_ENV=development`

### Issue: "Invalid mobile number"

**Fix**: Use a 10-digit Indian mobile number starting with 6-9

### Issue: "Invalid or expired OTP"

**Fix**: 
- OTP expires after 5 minutes - request a new one
- Copy the OTP exactly from console (6 digits)
- Each OTP can only be used once

### Issue: SMS API error in logs

**Fix**: Don't worry! In development mode, this is expected. OTP still works via console.

---

## What's Happening Behind the Scenes?

In **development mode** (`NODE_ENV=development`):

1. ✅ OTP is generated and hashed
2. ✅ OTP is logged to console (for testing)
3. ⚠️ SMS is attempted (may fail - that's OK!)
4. ✅ OTP is saved to database
5. ✅ API returns 200 OK
6. ✅ You test with console OTP

In **production mode** (`NODE_ENV=production`):

1. ✅ OTP is generated and hashed
2. ❌ OTP is NOT logged to console
3. ✅ SMS MUST succeed (or API fails)
4. ✅ OTP is saved to database
5. ✅ API returns 200 OK
6. ✅ User receives SMS

---

## Next Steps

- ✅ Test with your actual mobile number
- ✅ Integrate with your frontend
- ✅ Configure real SMS credentials for production
- ✅ Read [SMS_TESTING_GUIDE.md](SMS_TESTING_GUIDE.md) for advanced testing
- ✅ Read [ENV_SETUP.md](ENV_SETUP.md) for production deployment

---

## Need Help?

- **Environment Setup**: See [ENV_SETUP.md](ENV_SETUP.md)
- **Comprehensive Testing**: See [SMS_TESTING_GUIDE.md](SMS_TESTING_GUIDE.md)
- **Implementation Details**: See [SMS_OTP_FIX_SUMMARY.md](SMS_OTP_FIX_SUMMARY.md)
- **API Documentation**: See [README.md](README.md)

---

**Happy Testing! 🎉**


