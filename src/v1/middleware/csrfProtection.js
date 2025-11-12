const crypto = require("crypto");
const { ApiError } = require("../utils/apiError");

// In-memory token store (in production, use Redis)
const csrfTokens = new Map();

// Token expiry time (15 minutes)
const TOKEN_EXPIRY = 15 * 60 * 1000;

/**
 * Generate CSRF token
 * @returns {string} CSRF token
 */
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get CSRF token endpoint
 */
const getCSRFToken = (req, res) => {
  const token = generateCSRFToken();
  const expiresAt = Date.now() + TOKEN_EXPIRY;
  
  // Store token with expiry
  csrfTokens.set(token, {
    userId: req.user?.userId || 'anonymous',
    expiresAt
  });

  // Clean up expired tokens periodically
  cleanupExpiredTokens();

  res.json({
    success: true,
    csrfToken: token,
    expiresIn: TOKEN_EXPIRY / 1000
  });
};

/**
 * Verify CSRF token middleware
 */
const verifyCSRFToken = (req, res, next) => {
  // Skip for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;

  if (!token) {
    throw new ApiError(403, "CSRF token missing");
  }

  const tokenData = csrfTokens.get(token);

  if (!tokenData) {
    throw new ApiError(403, "Invalid CSRF token");
  }

  if (Date.now() > tokenData.expiresAt) {
    csrfTokens.delete(token);
    throw new ApiError(403, "CSRF token expired");
  }

  // Token is valid, delete it (one-time use)
  csrfTokens.delete(token);

  next();
};

/**
 * Clean up expired tokens
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of csrfTokens.entries()) {
    if (now > data.expiresAt) {
      csrfTokens.delete(token);
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

module.exports = {
  getCSRFToken,
  verifyCSRFToken,
  generateCSRFToken
};

