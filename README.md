# Selorg Backend (Quick Commerce)

Modernised Node.js/Express backend for Selorg's organic grocery quick-commerce platform.  
The service now ships with hardened middleware, structured logging, refined domain models, and environment-driven configuration.

## Requirements

- Node.js 18+ (tested with 18 LTS and 20 LTS)
- npm 9+
- MongoDB instance reachable from the server

## Quick Start

```bash
git clone https://git-codecommit.ap-south-1.amazonaws.com/v1/repos/Selorg-Backend
cd Selorg-Backend
cp .env.example .env    # update the values to match your environment
npm install
npm run dev             # runs nodemon with hot reload on port 3000
```

For production bootstrap use:

```bash
npm run start:prod
```

This launches both the HTTP and (optionally) HTTPS servers through `server.js`.  
If `ENABLE_HTTPS=true` and certificates are present, an HTTPS server will start on `HTTPS_PORT` (default `4433`).

## Environment Variables

All configuration is validated when the app boots. Populate `.env` (or supply variables at runtime):

| Variable | Description | Default / Example |
| --- | --- | --- |
| `NODE_ENV` | `development`, `production`, `test` | `development` |
| `PORT` | HTTP port | `3000` |
| `HTTPS_PORT` | HTTPS port | `4433` |
| `ENABLE_HTTPS` | Toggle TLS (`true`/`false`) | `false` (auto-enabled if certs exist) |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/selorg` |
| `LOG_LEVEL` | Pino log level | `info` |
| `CORS_ORIGIN` | `*` or comma-separated allow-list | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window size in ms | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Requests per window/IP | `120` |
| `BODY_LIMIT` | Max JSON payload | `1mb` |
| `VIN_API_KEY` / `VIN_API_OWNER` / `VIN_BASE_URL` / `VIN_ORDER_URL` | Vinculum integration creds | _see `.env.example`_ |
| `SMS_VENDOR_URL` | OTP vendor endpoint | _required for OTP flow_ |

> _Tip:_ Update `certs/server.crt` & `certs/server.key` or override `SSL_KEY_PATH` / `SSL_CERT_PATH` in the `.env` file if you want to serve HTTPS locally.

## Key NPM Scripts

- `npm run dev` – kills lingering port 3000 and starts the API with Nodemon (auto reload)
- `npm start` – Alias for the same behaviour (legacy compatibility)
- `npm run start:prod` – Runs `node server.js` without auto reload (production mode)

## Architecture Highlights

- **Security & Observability**
  - `helmet`, `compression`, rate limiting, and fine-grained CORS rules are now baked in.
  - Request-scoped logging via `pino` + `pino-http` with correlation IDs (`X-Request-Id`).
  - Unified error handling & JSON response helpers ensure consistent API envelopes.
- **Configuration**
  - Strongly typed environment validation powered by `zod`.
  - Single source of truth under `src/v1/config/*` for app config, logging, and Mongo connections.
- **Refined Domain Models**
  - `UserModel` now tracks loyalty tier, device tokens, notification preferences, and audit timestamps.
  - `Order` schema captures payment/fulfilment workflows, pricing breakdowns, coupon snapshots, and timeline history for SLA tracking.
  - Cart and order controllers recalculate totals using the enhanced schema to keep downstream services in sync.
- **Developer Experience**
  - Health probe at `GET /health`.
  - Express auto-registers all v1 routes while keeping backward compatibility (`/v1/...` namespace).

## Project Structure (excerpt)

```
src/
  v1/
    config/        # env validation, logger, database bootstrap
    controller/    # request handlers (orders, users, cart, etc.)
    middleware/    # error handling, not-found, request context
    model/         # mongoose schemas (user, order, cart, etc.)
    route/         # express routers composed in app.js
    utils/         # ApiError, ApiResponse helpers
    view/          # EJS templates (privacy policy, terms)
```

## New Features & Endpoints

### Product Search & Discovery
- `GET /v1/products` - Get all products with advanced filtering
- `GET /v1/products/search?q=term` - Fuzzy search using Fuse.js
- `GET /v1/products/autocomplete?q=term` - Get autocomplete suggestions
- `GET /v1/products/featured` - Get featured products
- `GET /v1/products/:id/similar` - Get similar products
- `POST /v1/products/check-availability` - Check product stock

### Wishlist Management
- `GET /v1/wishlist` - Get user's wishlist
- `POST /v1/wishlist/add` - Add product to wishlist
- `DELETE /v1/wishlist/remove/:productId` - Remove from wishlist
- `POST /v1/wishlist/move-to-cart/:productId` - Move to cart
- `DELETE /v1/wishlist/clear` - Clear entire wishlist

### Coupon System
- `POST /v1/coupons/validate` - Validate coupon code
- `POST /v1/coupons/apply` - Apply coupon to cart
- `DELETE /v1/coupons/remove` - Remove applied coupon
- `GET /v1/coupons/available` - Get available coupons

### Review & Rating System
- `GET /v1/reviews/product/:productId` - Get product reviews
- `POST /v1/reviews` - Create review (auth required)
- `PUT /v1/reviews/:id` - Update review
- `DELETE /v1/reviews/:id` - Delete review
- `POST /v1/reviews/:id/helpful` - Mark review as helpful
- `GET /v1/reviews/user/me` - Get user's reviews

### Notifications
- `GET /v1/notifications` - Get user notifications
- `GET /v1/notifications/unread/count` - Get unread count
- `PATCH /v1/notifications/:id/read` - Mark as read
- `POST /v1/notifications/mark-all-read` - Mark all as read
- `DELETE /v1/notifications/:id` - Delete notification

### Order Tracking
- `GET /v1/orders/:id/track` - Track order status in real-time

### Enhanced Health Endpoints
- `GET /health` - Comprehensive health check with DB status
- `GET /readyz` - Kubernetes readiness probe
- `GET /livez` - Kubernetes liveness probe

## Architecture Enhancements

### Service Layer
The backend now implements a proper service layer pattern:
- **11 Services**: authService, userService, orderService, cartService, productService, addressService, wishlistService, couponService, inventoryService, notificationService, reviewService
- Business logic separated from controllers
- Reusable across multiple contexts

### Validation Layer
- **Zod-based validation** on all critical endpoints
- Type-safe request/response handling
- Automatic error formatting

### Security Improvements
- **OTP Hashing**: Bcrypt with salt rounds
- **OTP Expiry**: 5-minute time window enforced
- **Environment Validation**: Required variables checked at startup
- **Rate Limiting**: Per-endpoint and global limits

### Database Features
- **Inventory Tracking**: Real-time stock management
- **Text Search Indexes**: Fast product search
- **Pagination**: All list endpoints support pagination
- **Aggregations**: Review statistics, rating breakdowns

## Testing

### Quick Health Check

```bash
npm run dev
curl http://localhost:5001/health
```

### SMS & OTP Testing

For local development with OTP authentication:

1. **Configure Environment** (see [ENV_SETUP.md](ENV_SETUP.md) for detailed setup)
   ```env
   NODE_ENV=development
   DEV_SHOW_OTP_IN_CONSOLE=true
   ```

2. **Test SMS API Directly**
   ```bash
   npm run test:sms 9876543210
   # or
   node scripts/test-sms-api.js 9876543210
   ```

3. **Test Complete OTP Flow**
   ```bash
   npm run test:otp 9876543210
   # or
   node scripts/test-otp-flow.js 9876543210
   ```

4. **Development Mode Features**:
   - 🔐 OTP is logged to console for easy testing
   - ✅ SMS failures don't crash the app
   - 📝 Detailed API request/response logs
   - 💡 Test without actual SMS delivery

See [SMS_TESTING_GUIDE.md](SMS_TESTING_GUIDE.md) for comprehensive testing scenarios.

### Unit & Integration Tests

```bash
npm test              # Run all tests with coverage
npm run test:unit     # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:watch    # Watch mode for development
```

### API Testing with Postman

Import the collection from `postman/SELORG_API_Collection.json` and test all endpoints interactively.

## API Authentication

Most endpoints require JWT authentication. Include the token in requests:

```http
Authorization: Bearer <your-jwt-token>
```

### Getting a Token (Development Mode)

1. **Send OTP Request**
   ```bash
   curl -X POST http://localhost:5001/v1/otp/send-otp \
     -H "Content-Type: application/json" \
     -d '{"mobileNumber":"9876543210"}'
   ```

2. **Get OTP from Console**
   
   In development mode (`NODE_ENV=development`), the OTP will be displayed in your server console:
   ```
   🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐
   📱 MOBILE NUMBER: 9876543210
   🔑 YOUR OTP: 573829
   ⏰ VALID FOR: 5 minutes
   🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐🔐
   ```

3. **Verify OTP**
   ```bash
   curl -X POST http://localhost:5001/v1/otp/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"mobileNumber":"9876543210","otp":"573829"}'
   ```

4. **Use the Token**
   
   The response contains a JWT token:
   ```json
   {
     "success": true,
     "data": {
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "user": { ... }
     }
   }
   ```

   Use this token in authenticated requests:
   ```bash
   curl -X GET http://localhost:5001/v1/users/profile \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

### Production Mode

In production (`NODE_ENV=production`), OTP is only sent via SMS and not logged to console. Ensure your SMS provider is properly configured in `config.json`.

## Contributing

See CONTRIBUTING.md for development guidelines (coming soon).
