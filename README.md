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

## Testing & Next Steps

- Run `npm run dev` and hit `GET /health` to confirm readiness.
- Populate MongoDB with seed data (coming soon).
- Extend automated tests to cover the richer order lifecycle and loyalty flows.

## Maintainers

- Author: **Gunaseelan M** – cloudguna@gmail.com  
- Current refactor lead: **Cursor AI Assistant (GPT-5 Codex)**
