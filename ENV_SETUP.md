# Environment Configuration Guide

This guide explains how to set up your environment variables for the SELORG backend application.

## Quick Setup

1. Create a `.env` file in the root directory
2. Copy the variables below and fill in your actual values
3. Never commit the `.env` file to version control

## Required Environment Variables

### Server Configuration

```env
PORT=5001
NODE_ENV=development
```

**Important**: Set `NODE_ENV=development` for local testing. This enables:
- ✅ OTP logging to console for easy testing
- ✅ Graceful SMS failure handling (won't crash if SMS API fails)
- ✅ Detailed API request/response logs
- ✅ Less strict security for easier debugging

For production, set `NODE_ENV=production`.

### Database Configuration

```env
MONGO_URL=mongodb://127.0.0.1:27017/selorg
```

### JWT Configuration

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d
```

### SMS Configuration (Spearuc Gateway)

**Note**: SMS credentials are configured in `config.json`, not `.env`.

The `smsvendor` URL in `config.json` should follow this format:

```
https://www.spearuc.com/SMSAPI/api/mt/SendSMS?user=YOUR_USER&pass=YOUR_PASSWORD&sid=YOUR_SID&
```

For development mode with console OTP logging:

```env
DEV_SHOW_OTP_IN_CONSOLE=true
```

### Email Configuration

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=SELORG <noreply@selorg.com>
```

### Push Notification Configuration (FCM)

```env
FCM_SERVER_KEY=your-firebase-server-key
FCM_PROJECT_ID=your-firebase-project-id
```

### Redis Configuration

```env
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
```

### File Upload Configuration

```env
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

### Security Configuration

```env
# CORS
CORS_ORIGIN=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key
```

### Payment Gateway Configuration

```env
PAYMENT_GATEWAY_KEY=your-payment-gateway-key
PAYMENT_GATEWAY_SECRET=your-payment-gateway-secret
PAYMENT_WEBHOOK_SECRET=your-webhook-secret
```

### Logging Configuration

```env
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log
```

---

## Development Mode Features

When `NODE_ENV=development`, the application includes special features for easier local testing:

### 1. Console OTP Logging

When you send an OTP, it will be displayed in the console like this:

```
🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐
📱 MOBILE NUMBER: 9876543210
🔑 YOUR OTP: 123456
⏰ VALID FOR: 5 minutes
💡 Use this OTP to verify in Postman/Frontend
🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐
```

This allows you to test the OTP flow without needing actual SMS delivery.

### 2. SMS Failure Tolerance

If the SMS API fails in development mode:
- ❌ The error is logged
- ✅ The OTP is still stored in the database
- ✅ You can use the console OTP to continue testing
- ✅ The API returns 200 OK

In production mode, SMS failures will throw errors.

### 3. Detailed SMS API Logging

Every SMS API call shows detailed information:

```
======================================================================
📱 SENDING SMS VIA API
To: 9876543210
Message: Your OTP is 123456. Valid for 5 minutes. SELORG
Attempt: 1
API URL: https://www.spearuc.com/...&pass=***&...
======================================================================

📨 SMS API RESPONSE:
HTTP Status: 200
Response Data: {
  "status": "success",
  "messageId": "abc123"
}
======================================================================
```

---

## SMS Configuration Troubleshooting

If OTP is not being received on mobile during local testing:

### Step 1: Verify Console OTP

1. Set `NODE_ENV=development` in `.env`
2. Make a request to `/v1/otp/send-otp`
3. Check the console for the OTP display
4. Use this OTP to test the verification endpoint

### Step 2: Check SMS API Logs

The console will show detailed logs of SMS API calls. Look for:

- ✅ **API URL**: Is it formatted correctly?
- ✅ **HTTP Status**: Is it 200?
- ✅ **Response Data**: What does the API return?
- ❌ **Error Messages**: Any failures or timeouts?

### Step 3: Verify SMS Provider Credentials

Check your `config.json` file:

```json
{
  "smsvendor": "https://www.spearuc.com/SMSAPI/api/mt/SendSMS?user=YOUR_USER&pass=YOUR_PASSWORD&sid=YOUR_SID&"
}
```

Ensure:
1. `user` is correct
2. `pass` is correct
3. `sid` (Sender ID) is correct
4. Account has sufficient credits
5. Account is active

### Step 4: Test SMS API Directly

Test the SMS API endpoint manually using a tool like Postman or curl:

```bash
curl "https://www.spearuc.com/SMSAPI/api/mt/SendSMS?user=YOUR_USER&pass=YOUR_PASSWORD&sid=YOUR_SID&to_mobileno=9876543210&sms_text=Test%20message"
```

Expected response:

```json
{
  "status": "success",
  "messageId": "..."
}
```

If this fails, contact your SMS provider to verify:
- Account status
- Credentials
- API endpoint
- DLT (Distributed Ledger Technology) approval for templates (required in India)

### Step 5: Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid credentials" | Verify `user` and `pass` in `config.json` |
| "Invalid sender ID" | Verify `sid` is approved by provider |
| "Insufficient balance" | Top up SMS credits |
| "Template not approved" | Get DLT approval for message templates |
| "Number blocked" | Check if number is in DND (Do Not Disturb) |
| Timeout | Check network connectivity, increase timeout |

---

## Optional Services (Won't Crash If Missing)

The following services are **completely optional**. The app will start and work perfectly without them:

### ✅ WhatsApp Business API (OPTIONAL)

**Status**: If not configured, app will show a warning but **continue working normally**.

```env
# Leave these commented out if you don't have WhatsApp Business API
# WHATSAPP_ACCESS_TOKEN=your-token
# WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
# WHATSAPP_API_URL=https://graph.facebook.com/v18.0
```

**What happens without it**:
- ✅ App starts successfully
- ✅ All features work (authentication, cart, orders, etc.)
- ✅ Users can still get SMS and email notifications
- ⚠️  WhatsApp notification toggle in UI won't send messages (will be silently skipped)

**To enable**:
1. Sign up for WhatsApp Business API
2. Get API credentials
3. Add to `.env` file
4. Restart server - it will detect and enable automatically

### ✅ Other Optional Services

All these are also optional and won't crash the app:

- **Redis Caching** - App uses in-memory cache if Redis not available
- **Email Service** - Email notifications won't send but app works
- **Payment Gateway** - Uses mock in development
- **Google Maps API** - Location search uses basic search
- **Firebase Push Notifications** - Push notifications disabled
- **Sentry** - Error tracking disabled

**Bottom Line**: You only need MongoDB, and the app will run! Everything else is optional.

---

## Production Deployment Checklist

Before deploying to production:

### Required
- [ ] Set `NODE_ENV=production`
- [ ] Use strong, random secrets for JWT
- [ ] Configure actual SMS credentials
- [ ] Enable HTTPS

### Recommended (but optional)
- [ ] Set up Redis for caching (improves performance)
- [ ] Configure email service (for better UX)
- [ ] Set up Firebase for push notifications
- [ ] Configure payment gateway (for real payments)
- [ ] Set up WhatsApp Business API (for WhatsApp notifications)
- [ ] Set appropriate CORS origins
- [ ] Set up proper logging
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Never log sensitive data in production

---

## Getting Help

If you're still experiencing issues:

1. Check the server logs in `logs/app.log`
2. Enable debug logging: `LOG_LEVEL=debug`
3. Review the SMS API provider documentation
4. Contact your SMS provider support

For development testing, the console OTP is sufficient—actual SMS delivery is not required.


