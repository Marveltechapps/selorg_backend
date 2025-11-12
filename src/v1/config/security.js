const crypto = require("crypto");
const logger = require("./logger");

/**
 * Security Configuration and Utilities
 */

/**
 * Encryption key from environment or generate
 */
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const ENCRYPTION_IV_LENGTH = 16;

/**
 * Encrypt sensitive data
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted text
 */
function encrypt(text) {
  try {
    const iv = crypto.randomBytes(ENCRYPTION_IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    logger.error({ error }, 'Encryption failed');
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Text to decrypt
 * @returns {string} Decrypted text
 */
function decrypt(encryptedText) {
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = parts.join(':');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error({ error }, 'Decryption failed');
    throw new Error('Decryption failed');
  }
}

/**
 * Hash password (for future use if needed)
 * @param {string} password
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.hash(password, 10);
}

/**
 * Verify password
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
async function verifyPassword(password, hash) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(password, hash);
}

/**
 * Generate secure random token
 * @param {number} length
 * @returns {string}
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Mask sensitive data for logging
 * @param {string} data
 * @param {number} visibleChars
 * @returns {string}
 */
function maskSensitiveData(data, visibleChars = 4) {
  if (!data || data.length <= visibleChars) return '****';
  
  const visible = data.slice(-visibleChars);
  const masked = '*'.repeat(data.length - visibleChars);
  return masked + visible;
}

/**
 * Security headers configuration
 */
const securityHeaders = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Other security headers
  xFrameOptions: { action: 'DENY' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' }
};

/**
 * Check if secrets are properly configured
 * @returns {Object}
 */
function checkSecretsConfiguration() {
  const checks = {
    jwtSecret: {
      configured: !!process.env.JWT_SECRET,
      length: process.env.JWT_SECRET?.length || 0,
      isSecure: (process.env.JWT_SECRET?.length || 0) >= 32
    },
    encryptionKey: {
      configured: !!process.env.ENCRYPTION_KEY,
      isSecure: !!process.env.ENCRYPTION_KEY
    },
    sessionSecret: {
      configured: !!process.env.SESSION_SECRET,
      isSecure: (process.env.SESSION_SECRET?.length || 0) >= 32
    }
  };

  const allSecure = Object.values(checks).every(check => check.isSecure || !check.configured);

  return {
    secure: allSecure,
    checks,
    warnings: Object.entries(checks)
      .filter(([_, check]) => check.configured && !check.isSecure)
      .map(([name]) => `${name} should be stronger`)
  };
}

/**
 * Log security check results
 */
function logSecurityCheck() {
  const securityCheck = checkSecretsConfiguration();
  
  if (securityCheck.secure) {
    logger.info('Security configuration validated');
  } else {
    logger.warn({ warnings: securityCheck.warnings }, 'Security configuration issues detected');
  }
}

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  maskSensitiveData,
  securityHeaders,
  checkSecretsConfiguration,
  logSecurityCheck
};

