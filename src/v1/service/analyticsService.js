const ActivityModel = require("../model/activityModel");
const ProductStyle = require("../model/productStyle");
const logger = require("../config/logger");

/**
 * AnalyticsService - Handles user activity tracking and analytics
 */
class AnalyticsService {
  /**
   * Track user activity
   * @param {Object} activityData
   * @returns {Promise<Object>}
   */
  async trackActivity(activityData) {
    try {
      const activity = await ActivityModel.create(activityData);
      
      // Update product-specific metrics if applicable
      if (activityData.productId) {
        await this.updateProductMetrics(activityData.productId, activityData.type);
      }
      
      return activity;
    } catch (error) {
      logger.error({ error, activityData }, 'Failed to track activity');
      // Don't throw error - tracking failures shouldn't break the main flow
      return null;
    }
  }

  /**
   * Update product metrics based on activity
   * @param {string} productId
   * @param {string} activityType
   * @returns {Promise<void>}
   */
  async updateProductMetrics(productId, activityType) {
    try {
      const updateFields = {};

      switch (activityType) {
        case 'product_view':
          updateFields.viewCount = 1;
          break;
        case 'cart_add':
          updateFields.purchaseCount = 1;
          break;
        case 'wishlist_add':
          // Could track wishlist count if field exists
          break;
      }

      if (Object.keys(updateFields).length > 0) {
        await ProductStyle.findByIdAndUpdate(
          productId,
          { $inc: updateFields }
        );
      }
    } catch (error) {
      logger.error({ error, productId, activityType }, 'Failed to update product metrics');
    }
  }

  /**
   * Get user's recent product views
   * @param {string} userId
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getRecentlyViewed(userId, limit = 10) {
    const activities = await ActivityModel.find({
      userId,
      type: 'product_view'
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('productId', 'title imageURL price discountPrice')
      .lean();

    return activities
      .filter(a => a.productId) // Filter out deleted products
      .map(a => a.productId);
  }

  /**
   * Get user's search history
   * @param {string} userId
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getSearchHistory(userId, limit = 10) {
    const activities = await ActivityModel.find({
      userId,
      type: 'product_search'
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('data.searchQuery createdAt')
      .lean();

    return activities.map(a => ({
      query: a.data?.searchQuery || '',
      searchedAt: a.createdAt
    }));
  }

  /**
   * Get trending products
   * @param {number} days - Number of days to look back
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getTrendingProducts(days = 7, limit = 10) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const trending = await ActivityModel.aggregate([
      {
        $match: {
          type: { $in: ['product_view', 'cart_add'] },
          productId: { $exists: true },
          createdAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: '$productId',
          score: {
            $sum: {
              $cond: [{ $eq: ['$type', 'cart_add'] }, 3, 1]
            }
          },
          viewCount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'product_view'] }, 1, 0]
            }
          },
          cartAddCount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'cart_add'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { score: -1 }
      },
      {
        $limit: limit
      }
    ]);

    // Populate product details
    const productIds = trending.map(t => t._id);
    const products = await ProductStyle.find({ _id: { $in: productIds } }).lean();

    // Merge analytics with product data
    return trending.map(t => {
      const product = products.find(p => p._id.toString() === t._id.toString());
      return {
        ...product,
        analytics: {
          score: t.score,
          viewCount: t.viewCount,
          cartAddCount: t.cartAddCount
        }
      };
    }).filter(p => p.title || p.SKUName);
  }

  /**
   * Get frequently bought together products
   * @param {string} productId
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async getFrequentlyBoughtTogether(productId, limit = 5) {
    try {
      const OrderModel = require("../model/orderModel");
      
      // Find orders that contain this product
      const orders = await OrderModel.find({
        'items.productId': productId
      })
        .select('items')
        .limit(100)
        .lean();

      // Count frequency of other products in same orders
      const productFrequency = {};

      orders.forEach(order => {
        order.items.forEach(item => {
          const itemId = item.productId.toString();
          if (itemId !== productId.toString()) {
            productFrequency[itemId] = (productFrequency[itemId] || 0) + 1;
          }
        });
      });

      // Sort by frequency
      const sortedProducts = Object.entries(productFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      // Get product details
      const products = await ProductStyle.find({
        _id: { $in: sortedProducts }
      }).lean();

      return products;
    } catch (error) {
      logger.error({ error, productId }, 'Failed to get frequently bought together');
      return [];
    }
  }

  /**
   * Get user activity summary
   * @param {string} userId
   * @param {number} days
   * @returns {Promise<Object>}
   */
  async getUserActivitySummary(userId, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const summary = await ActivityModel.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          createdAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      totalActivities: 0,
      breakdown: {}
    };

    summary.forEach(item => {
      result.breakdown[item._id] = item.count;
      result.totalActivities += item.count;
    });

    return result;
  }
}

module.exports = new AnalyticsService();

