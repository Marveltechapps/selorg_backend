const logger = require("./logger");

/**
 * Validate required environment variables
 */
function validateEnv() {
  const required = [
    "NODE_ENV",
    "PORT",
    "MONGO_URI",
    "JWT_SECRET"
  ];

  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check optional but recommended variables
  const recommended = [
    "HTTPS_PORT",
    "CORS_ORIGIN",
    "LOG_LEVEL",
    "RATE_LIMIT_WINDOW_MS",
    "RATE_LIMIT_MAX"
  ];

  for (const varName of recommended) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  // Report findings
  if (missing.length > 0) {
    logger.error(
      { missing },
      `Missing required environment variables: ${missing.join(", ")}`
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  if (warnings.length > 0) {
    logger.warn(
      { warnings },
      `Missing recommended environment variables: ${warnings.join(", ")}`
    );
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn("JWT_SECRET should be at least 32 characters for security");
  }

  // Validate NODE_ENV
  const validEnvs = ["development", "production", "staging", "test"];
  if (!validEnvs.includes(process.env.NODE_ENV)) {
    logger.warn(
      { NODE_ENV: process.env.NODE_ENV },
      `NODE_ENV should be one of: ${validEnvs.join(", ")}`
    );
  }

  logger.info("Environment variables validated successfully");
}

module.exports = { validateEnv };

