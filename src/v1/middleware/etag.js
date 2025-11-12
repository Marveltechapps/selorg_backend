const crypto = require("crypto");
const logger = require("../config/logger");

/**
 * Generate ETag from data
 * @param {*} data
 * @returns {string}
 */
function generateETag(data) {
  const content = JSON.stringify(data);
  return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
}

/**
 * ETag support middleware
 * Implements HTTP conditional requests for caching
 */
const etagMiddleware = (req, res, next) => {
  // Only apply to GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method
  res.json = function(data) {
    if (res.statusCode === 200) {
      // Generate ETag
      const etag = generateETag(data);
      res.setHeader('ETag', etag);

      // Check If-None-Match header
      const clientETag = req.headers['if-none-match'];
      
      if (clientETag && clientETag === etag) {
        // Content hasn't changed, return 304 Not Modified
        logger.debug({ url: req.url }, 'ETag match - returning 304');
        return res.status(304).end();
      }
    }

    return originalJson(data);
  };

  next();
};

module.exports = { etagMiddleware, generateETag };

