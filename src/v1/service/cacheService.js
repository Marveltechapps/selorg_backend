const logger = require("../config/logger");

/**
 * CacheService - Redis caching implementation
 * Uses node-cache as fallback if Redis is not configured
 */
class CacheService {
  constructor() {
    this.client = null;
    this.isRedisConnected = false;
    this.fallbackCache = null;
    this.initialize();
  }

  /**
   * Initialize cache (try Redis first, fallback to node-cache)
   */
  async initialize() {
    try {
      // Try to initialize Redis if configured
      if (process.env.REDIS_URL) {
        const redis = require('redis');
        
        this.client = redis.createClient({
          url: process.env.REDIS_URL,
          password: process.env.REDIS_PASSWORD || undefined,
          database: parseInt(process.env.REDIS_DB) || 0
        });

        this.client.on('error', (err) => {
          logger.error({ err }, 'Redis client error');
          this.isRedisConnected = false;
        });

        this.client.on('connect', () => {
          logger.info('Redis client connected');
          this.isRedisConnected = true;
        });

        await this.client.connect();
        logger.info('Cache service initialized with Redis');
      } else {
        // Fallback to node-cache
        this.initializeFallback();
      }
    } catch (error) {
      logger.warn({ error }, 'Redis not available, using in-memory cache');
      this.initializeFallback();
    }
  }

  /**
   * Initialize fallback in-memory cache
   */
  initializeFallback() {
    const NodeCache = require('node-cache');
    this.fallbackCache = new NodeCache({
      stdTTL: 600, // 10 minutes default
      checkperiod: 120,
      useClones: false
    });
    logger.info('Cache service initialized with node-cache (in-memory)');
  }

  /**
   * Get value from cache
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      if (this.isRedisConnected && this.client) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } else if (this.fallbackCache) {
        return this.fallbackCache.get(key) || null;
      }
      return null;
    } catch (error) {
      logger.error({ error, key }, 'Cache get error');
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>}
   */
  async set(key, value, ttl = 600) {
    try {
      if (this.isRedisConnected && this.client) {
        await this.client.setEx(key, ttl, JSON.stringify(value));
        return true;
      } else if (this.fallbackCache) {
        return this.fallbackCache.set(key, value, ttl);
      }
      return false;
    } catch (error) {
      logger.error({ error, key }, 'Cache set error');
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async del(key) {
    try {
      if (this.isRedisConnected && this.client) {
        await this.client.del(key);
        return true;
      } else if (this.fallbackCache) {
        return this.fallbackCache.del(key) > 0;
      }
      return false;
    } catch (error) {
      logger.error({ error, key }, 'Cache delete error');
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   * @param {string} pattern
   * @returns {Promise<number>}
   */
  async delPattern(pattern) {
    try {
      if (this.isRedisConnected && this.client) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
          return keys.length;
        }
        return 0;
      } else if (this.fallbackCache) {
        const keys = this.fallbackCache.keys().filter(k => k.includes(pattern.replace('*', '')));
        return this.fallbackCache.del(keys);
      }
      return 0;
    } catch (error) {
      logger.error({ error, pattern }, 'Cache delete pattern error');
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    try {
      if (this.isRedisConnected && this.client) {
        const result = await this.client.exists(key);
        return result === 1;
      } else if (this.fallbackCache) {
        return this.fallbackCache.has(key);
      }
      return false;
    } catch (error) {
      logger.error({ error, key }, 'Cache exists error');
      return false;
    }
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>}
   */
  async flush() {
    try {
      if (this.isRedisConnected && this.client) {
        await this.client.flushDb();
        return true;
      } else if (this.fallbackCache) {
        this.fallbackCache.flushAll();
        return true;
      }
      return false;
    } catch (error) {
      logger.error({ error }, 'Cache flush error');
      return false;
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   * @param {string} key
   * @param {Function} fetchFn
   * @param {number} ttl
   * @returns {Promise<any>}
   */
  async getOrSet(key, fetchFn, ttl = 600) {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      if (cached !== null) {
        logger.debug({ key }, 'Cache hit');
        return cached;
      }

      // Cache miss - fetch data
      logger.debug({ key }, 'Cache miss');
      const data = await fetchFn();
      
      // Store in cache
      await this.set(key, data, ttl);
      
      return data;
    } catch (error) {
      logger.error({ error, key }, 'Cache getOrSet error');
      // If cache fails, just return the fetched data
      return await fetchFn();
    }
  }

  /**
   * Generate cache key
   * @param {string} prefix
   * @param {Object} params
   * @returns {string}
   */
  generateKey(prefix, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(k => `${k}:${params[k]}`)
      .join(':');
    
    return paramString ? `${prefix}:${paramString}` : prefix;
  }

  /**
   * Cache product list
   * @param {Object} filters
   * @param {Array} products
   * @param {number} ttl
   * @returns {Promise<boolean>}
   */
  async cacheProducts(filters, products, ttl = 300) {
    const key = this.generateKey('products', filters);
    return this.set(key, products, ttl);
  }

  /**
   * Get cached products
   * @param {Object} filters
   * @returns {Promise<Array|null>}
   */
  async getCachedProducts(filters) {
    const key = this.generateKey('products', filters);
    return this.get(key);
  }

  /**
   * Invalidate product cache
   * @returns {Promise<number>}
   */
  async invalidateProducts() {
    return this.delPattern('products:*');
  }

  /**
   * Cache categories
   * @param {Array} categories
   * @param {number} ttl
   * @returns {Promise<boolean>}
   */
  async cacheCategories(categories, ttl = 3600) {
    return this.set('categories:all', categories, ttl);
  }

  /**
   * Get cached categories
   * @returns {Promise<Array|null>}
   */
  async getCachedCategories() {
    return this.get('categories:all');
  }

  /**
   * Cache user session
   * @param {string} userId
   * @param {Object} sessionData
   * @param {number} ttl
   * @returns {Promise<boolean>}
   */
  async cacheSession(userId, sessionData, ttl = 3600) {
    return this.set(`session:${userId}`, sessionData, ttl);
  }

  /**
   * Get cached session
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async getCachedSession(userId) {
    return this.get(`session:${userId}`);
  }

  /**
   * Invalidate user session
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async invalidateSession(userId) {
    return this.del(`session:${userId}`);
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getStats() {
    if (this.fallbackCache) {
      return this.fallbackCache.getStats();
    }
    return {
      type: this.isRedisConnected ? 'redis' : 'not-initialized',
      connected: this.isRedisConnected
    };
  }

  /**
   * Close cache connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.client && this.isRedisConnected) {
      await this.client.quit();
      logger.info('Cache service closed');
    }
  }
}

// Export singleton instance
const cacheService = new CacheService();

module.exports = cacheService;

