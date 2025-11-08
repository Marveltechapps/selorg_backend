const path = require("path");
const dotenv = require("dotenv");
const { z } = require("zod");

const appRoot = process.cwd();
const envFile =
  process.env.NODE_ENV && process.env.NODE_ENV !== "production"
    ? `.env.${process.env.NODE_ENV}`
    : ".env";

dotenv.config({ path: path.resolve(appRoot, envFile) });

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    HTTPS_PORT: z.coerce.number().int().positive().default(4433),
    ENABLE_HTTPS: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === "boolean") return val;
        if (typeof val === "string") {
          const lowered = val.toLowerCase();
          if (["true", "1", "yes", "on"].includes(lowered)) return true;
          if (["false", "0", "no", "off"].includes(lowered)) return false;
        }
        return undefined;
      })
      .optional(),
    SSL_KEY_PATH: z.string().optional(),
    SSL_CERT_PATH: z.string().optional(),
    MONGO_URI: z.string().min(1, "MONGO_URI is required"),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    CORS_ORIGIN: z.string().optional(),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().optional(),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().optional(),
    BODY_LIMIT: z.string().optional(),
    DEBUG_MODE: z.coerce.number().int().optional(),
    VIN_API_KEY: z.string().optional(),
    VIN_API_OWNER: z.string().optional(),
    VIN_BASE_URL: z.string().optional(),
    VIN_ORDER_URL: z.string().optional(),
    SMS_VENDOR_URL: z.string().optional(),
    VIN_CACHE_FLAG: z.coerce.number().int().optional()
  })
  .passthrough();

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  /* eslint-disable no-console */
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.format());
  process.exit(1);
}

const env = parsed.data;

module.exports = { env };
