const ReturnModel = require("../model/returnModel");
const OrderModel = require("../model/orderModel");
const { ApiError } = require("../utils/apiError");
const logger = require("../config/logger");

/**
 * ReturnService - Handles return and refund operations
 */
class ReturnService {
  /**
   * Create return request
   * @param {string} userId
   * @param {Object} returnData
   * @returns {Promise<Object>}
   */
  async createReturn(userId, returnData) {
    try {
      const { orderId, items, reason, reasonDetails, images } = returnData;

      // Verify order exists and belongs to user
      const order = await OrderModel.findOne({
        _id: orderId,
        userId
      }).lean();

      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      // Check if order is eligible for return (delivered within return window)
      if (order.status !== 'delivered') {
        throw new ApiError(400, "Only delivered orders can be returned");
      }

      // Check if order is within return window (e.g., 7 days)
      const deliveredDate = order.fulfillment?.deliveredAt || order.updatedAt;
      const returnWindow = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      const now = Date.now();

      if (now - new Date(deliveredDate).getTime() > returnWindow) {
        throw new ApiError(400, "Return window has expired. Returns are allowed within 7 days of delivery");
      }

      // Check if return already exists for this order
      const existingReturn = await ReturnModel.findOne({
        orderId,
        status: { $nin: ['cancelled', 'refund_completed'] }
      });

      if (existingReturn) {
        throw new ApiError(400, "Return request already exists for this order");
      }

      // Calculate refund amount
      let refundAmount = 0;
      const returnItems = [];

      for (const item of items) {
        const orderItem = order.items.find(
          oi => oi.productId.toString() === item.productId
        );

        if (!orderItem) {
          throw new ApiError(400, `Product ${item.productId} not found in order`);
        }

        if (item.quantity > orderItem.quantity) {
          throw new ApiError(400, `Cannot return more items than ordered for product ${orderItem.productName}`);
        }

        const itemRefund = orderItem.discountPrice * item.quantity;
        refundAmount += itemRefund;

        returnItems.push({
          productId: item.productId,
          productName: orderItem.productName,
          quantity: item.quantity,
          reason: item.reason,
          images: item.images
        });
      }

      // Create return request
      const returnRequest = await ReturnModel.create({
        orderId,
        userId,
        orderCode: order.orderCode,
        items: returnItems,
        reason,
        reasonDetails,
        images,
        refundAmount,
        refundMethod: returnData.refundMethod || 'original_payment',
        pickupAddress: order.address,
        timeline: [{
          status: 'requested',
          note: 'Return request created',
          createdAt: new Date()
        }]
      });

      logger.info({ returnId: returnRequest.returnId, orderId }, 'Return request created');

      return returnRequest;
    } catch (error) {
      logger.error({ error, userId, returnData }, 'Failed to create return');
      throw error;
    }
  }

  /**
   * Get return by ID
   * @param {string} returnId
   * @param {string} userId - For authorization
   * @returns {Promise<Object>}
   */
  async getReturnById(returnId, userId) {
    const returnRequest = await ReturnModel.findOne({
      _id: returnId,
      userId
    })
      .populate('orderId', 'orderCode finalAmount')
      .populate('items.productId', 'title imageURL')
      .lean();

    if (!returnRequest) {
      throw new ApiError(404, "Return request not found");
    }

    return returnRequest;
  }

  /**
   * Get user's returns
   * @param {string} userId
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async getUserReturns(userId, options = {}) {
    const {
      status,
      page = 1,
      limit = 20
    } = options;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [returns, total] = await Promise.all([
      ReturnModel.find(query)
        .populate('orderId', 'orderCode finalAmount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ReturnModel.countDocuments(query)
    ]);

    return {
      returns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update return status
   * @param {string} returnId
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updateReturnStatus(returnId, updateData) {
    const returnRequest = await ReturnModel.findById(returnId);

    if (!returnRequest) {
      throw new ApiError(404, "Return request not found");
    }

    const { status, adminNotes, refundTransactionId } = updateData;

    if (status) {
      returnRequest.status = status;

      // Update refund status based on return status
      if (status === 'approved') {
        returnRequest.refundStatus = 'initiated';
      } else if (status === 'refund_completed') {
        returnRequest.refundStatus = 'completed';
        returnRequest.refundedAt = new Date();
      } else if (status === 'rejected' || status === 'cancelled') {
        returnRequest.refundStatus = 'failed';
      }
    }

    if (adminNotes) {
      returnRequest.adminNotes = adminNotes;
    }

    if (refundTransactionId) {
      returnRequest.refundTransactionId = refundTransactionId;
    }

    await returnRequest.save();

    logger.info({ returnId, newStatus: status }, 'Return status updated');

    return returnRequest;
  }

  /**
   * Cancel return request
   * @param {string} returnId
   * @param {string} userId - For authorization
   * @returns {Promise<Object>}
   */
  async cancelReturn(returnId, userId) {
    const returnRequest = await ReturnModel.findOne({
      _id: returnId,
      userId
    });

    if (!returnRequest) {
      throw new ApiError(404, "Return request not found");
    }

    if (!['requested', 'approved'].includes(returnRequest.status)) {
      throw new ApiError(400, "Cannot cancel return at this stage");
    }

    returnRequest.status = 'cancelled';
    await returnRequest.save();

    logger.info({ returnId, userId }, 'Return cancelled by user');

    return {
      message: "Return request cancelled successfully",
      return: returnRequest
    };
  }

  /**
   * Get return statistics
   * @param {number} days
   * @returns {Promise<Object>}
   */
  async getReturnStatistics(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const stats = await ReturnModel.aggregate([
      {
        $match: {
          createdAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRefundAmount: { $sum: '$refundAmount' }
        }
      }
    ]);

    const total = await ReturnModel.countDocuments({
      createdAt: { $gte: since }
    });

    return {
      period: `Last ${days} days`,
      total,
      byStatus: stats,
      totalRefundAmount: stats.reduce((sum, s) => sum + s.totalRefundAmount, 0)
    };
  }
}

module.exports = new ReturnService();

