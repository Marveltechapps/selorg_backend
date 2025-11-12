const cacheService = require("../service/cacheService");
const logger = require("../config/logger");

/**
 * Cache middleware factory
 * @param {number} ttl - Time to live in seconds
 * @param {Function} keyGenerator - Optional custom key generator
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (ttl = 600, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator 
        ? keyGenerator(req) 
        : `${req.baseUrl}${req.path}:${JSON.stringify(req.query)}`;

      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        logger.debug({ cacheKey }, 'Serving from cache');
        return res.json(cachedData);
      }

      // Store original send function
      const originalSend = res.json.bind(res);

      // Override json method to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200 && data.success !== false) {
          cacheService.set(cacheKey, data, ttl).catch(err => {
            logger.error({ err, cacheKey }, 'Failed to cache response');
          });
        }
        
        return originalSend(data);
      };

      next();
    } catch (error) {
      logger.error({ error }, 'Cache middleware error');
      next(); // Continue even if caching fails
    }
  };
};

/**
 * Invalidate cache middleware
 * @param {string|Function} pattern - Cache key pattern or generator function
 * @returns {Function} Express middleware
 */
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    const originalSend = res.json.bind(res);

    res.json = async function(data) {
      // Invalidate cache after successful modification
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const keyPattern = typeof pattern === 'function' 
            ? pattern(req) 
            : pattern;
          
          await cacheService.delPattern(keyPattern);
          logger.debug({ keyPattern }, 'Cache invalidated');
        } catch (error) {
          logger.error({ error }, 'Failed to invalidate cache');
        }
      }
      
      return originalSend(data);
    };

    next();
  };
};

module.exports = {
  cacheMiddleware,
  invalidateCache
};

