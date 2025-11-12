const AbandonedCartModel = require("../model/abandonedCartModel");
const CartModel = require("../model/cartList");
const smsService = require("./smsService");
const emailService = require("./emailService");
const logger = require("../config/logger");

/**
 * AbandonedCartService - Handles cart abandonment tracking and recovery
 */
class AbandonedCartService {
  /**
   * Track abandoned cart
   * @param {string} userId
   * @param {string} cartId
   * @returns {Promise<Object>}
   */
  async trackAbandonedCart(userId, cartId) {
    try {
      // Get cart data
      const cart = await CartModel.findById(cartId).lean();
      
      if (!cart || cart.items.length === 0) {
        return null;
      }

      // Check if already tracked
      const existing = await AbandonedCartModel.findOne({
        userId,
        cartId,
        recovered: false
      });

      if (existing) {
        // Update abandoned time
        existing.abandonedAt = new Date();
        await existing.save();
        return existing;
      }

      // Create new abandoned cart record
      const abandoned = await AbandonedCartModel.create({
        userId,
        cartId,
        cartSnapshot: {
          items: cart.items,
          billSummary: cart.billSummary
        },
        itemCount: cart.items.length,
        totalValue: cart.billSummary?.totalBill || 0,
        abandonedAt: new Date()
      });

      logger.info({ userId, cartId }, 'Cart abandonment tracked');
      return abandoned;
    } catch (error) {
      logger.error({ error, userId, cartId }, 'Failed to track abandoned cart');
      return null;
    }
  }

  /**
   * Find carts to send reminders for
   * @param {number} hours - Hours since abandonment
   * @returns {Promise<Array>}
   */
  async findCartsForReminder(hours = 24) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    const abandonedCarts = await AbandonedCartModel.find({
      recovered: false,
      abandonedAt: { $lte: cutoffTime },
      $or: [
        { 'reminders': { $size: 0 } },
        { 
          'reminders': {
            $not: {
              $elemMatch: {
                sentAt: { $gte: cutoffTime }
              }
            }
          }
        }
      ]
    })
      .populate('userId', 'mobileNumber email name')
      .limit(100)
      .lean();

    return abandonedCarts;
  }

  /**
   * Send abandonment reminder
   * @param {Object} abandonedCart
   * @returns {Promise<Object>}
   */
  async sendReminder(abandonedCart) {
    try {
      const user = abandonedCart.userId;
      const results = {
        sms: null,
        email: null
      };

      // Send SMS reminder
      if (user.mobileNumber) {
        try {
          results.sms = await smsService.sendAbandonedCartReminder(
            user.mobileNumber,
            abandonedCart.itemCount,
            abandonedCart.totalValue
          );
        } catch (error) {
          logger.error({ error, userId: user._id }, 'Failed to send SMS reminder');
        }
      }

      // Send email reminder (if email service is configured)
      if (user.email) {
        try {
          results.email = await emailService.sendEmail({
            to: user.email,
            subject: 'You left items in your cart!',
            html: `
              <h2>Hi ${user.name || 'Customer'},</h2>
              <p>You left ${abandonedCart.itemCount} items worth ₹${abandonedCart.totalValue} in your cart.</p>
              <p>Complete your purchase now and get fresh organic products delivered to your doorstep!</p>
              <a href="https://selorg.com/cart">Complete Purchase</a>
            `
          });
        } catch (error) {
          logger.error({ error, userId: user._id }, 'Failed to send email reminder');
        }
      }

      // Update abandoned cart with reminder info
      await AbandonedCartModel.findByIdAndUpdate(abandonedCart._id, {
        $push: {
          reminders: {
            sentAt: new Date(),
            channel: results.sms ? 'sms' : 'email',
            status: 'sent'
          }
        }
      });

      return results;
    } catch (error) {
      logger.error({ error, abandonedCartId: abandonedCart._id }, 'Failed to send reminder');
      throw error;
    }
  }

  /**
   * Mark cart as recovered
   * @param {string} userId
   * @param {string} orderId
   * @returns {Promise<Object>}
   */
  async markAsRecovered(userId, orderId) {
    const result = await AbandonedCartModel.updateMany(
      { userId, recovered: false },
      {
        recovered: true,
        recoveredAt: new Date(),
        recoveryOrderId: orderId
      }
    );

    logger.info({ userId, orderId, count: result.modifiedCount }, 'Abandoned carts marked as recovered');
    return result;
  }

  /**
   * Get abandonment statistics
   * @param {number} days
   * @returns {Promise<Object>}
   */
  async getStatistics(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [total, recovered, totalValue, recoveredValue] = await Promise.all([
      AbandonedCartModel.countDocuments({ createdAt: { $gte: since } }),
      AbandonedCartModel.countDocuments({ 
        createdAt: { $gte: since },
        recovered: true 
      }),
      AbandonedCartModel.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: '$totalValue' } } }
      ]),
      AbandonedCartModel.aggregate([
        { $match: { createdAt: { $gte: since }, recovered: true } },
        { $group: { _id: null, total: { $sum: '$totalValue' } } }
      ])
    ]);

    const recoveryRate = total > 0 ? (recovered / total * 100).toFixed(2) : 0;

    return {
      period: `Last ${days} days`,
      totalAbandoned: total,
      recovered,
      recoveryRate: `${recoveryRate}%`,
      totalValue: totalValue[0]?.total || 0,
      recoveredValue: recoveredValue[0]?.total || 0
    };
  }

  /**
   * Check and track cart abandonment for a user
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async checkAndTrackAbandonment(userId) {
    try {
      const cart = await CartModel.findOne({ userId }).lean();
      
      if (!cart || cart.items.length === 0) {
        return;
      }

      // Check if cart was updated recently (within last 30 minutes)
      const thirtyMinutesAgo = new Date();
      thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

      if (cart.updatedAt < thirtyMinutesAgo) {
        await this.trackAbandonedCart(userId, cart._id.toString());
      }
    } catch (error) {
      logger.error({ error, userId }, 'Failed to check cart abandonment');
    }
  }
}

module.exports = new AbandonedCartService();

