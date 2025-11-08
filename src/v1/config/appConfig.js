const fs = require("fs");
const path = require("path");
const { env } = require("./env");

const rootDir = process.cwd();

const defaultKeyPath = path.join(rootDir, "certs/server.key");
const defaultCertPath = path.join(rootDir, "certs/server.crt");

const certExists =
  fs.existsSync(defaultKeyPath) &&
  fs.existsSync(defaultCertPath);

const sslEnabled =
  typeof env.ENABLE_HTTPS === "boolean" ? env.ENABLE_HTTPS : certExists;

const sslConfig = sslEnabled
  ? {
      enabled: true,
      keyPath: path.resolve(rootDir, env.SSL_KEY_PATH || defaultKeyPath),
      certPath: path.resolve(rootDir, env.SSL_CERT_PATH || defaultCertPath)
    }
  : { enabled: false };

const corsOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : ["*"];

const appConfig = {
  nodeEnv: env.NODE_ENV,
  ports: {
    http: env.PORT,
    https: env.HTTPS_PORT
  },
  mongo: {
    uri: env.MONGO_URI,
    autoIndex: env.NODE_ENV !== "production",
    maxPoolSize: 20
  },
  cors: {
    origin: corsOrigins.includes("*") ? "*" : corsOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "DNT",
      "User-Agent",
      "If-Modified-Since",
      "Cache-Control",
      "Range"
    ],
    exposedHeaders: ["Content-Length", "Content-Range"]
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
    max: env.RATE_LIMIT_MAX || 120,
    standardHeaders: true,
    legacyHeaders: false
  },
  bodyLimit: env.BODY_LIMIT || "1mb",
  logging: {
    level: env.LOG_LEVEL
  },
  ssl: sslConfig
};

module.exports = { appConfig };
