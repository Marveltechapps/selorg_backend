const orderTrackingService = require("../service/orderTrackingService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Get order tracking information
 */
exports.getOrderTracking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Optional, for user authorization

    const trackingData = await orderTrackingService.getOrderTracking(id, userId);

    return success(res, {
      message: "Tracking information retrieved successfully",
      data: trackingData
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve tracking information"
    });
  }
};

/**
 * Update delivery partner location
 * NOTE: This endpoint should be called by delivery partner app or webhook
 */
exports.updateDeliveryPartnerLocation = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { latitude, longitude, partnerId } = req.body;

    if (!latitude || !longitude) {
      return failure(res, {
        statusCode: 400,
        message: "Latitude and longitude are required"
      });
    }

    const result = await orderTrackingService.updateDeliveryPartnerLocation(orderId, {
      latitude,
      longitude,
      partnerId
    });

    return success(res, {
      message: "Location updated successfully",
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to update location"
    });
  }
};

/**
 * Assign delivery partner to order
 */
exports.assignDeliveryPartner = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const partnerData = req.body;

    const order = await orderTrackingService.assignDeliveryPartner(orderId, partnerData);

    return success(res, {
      message: "Delivery partner assigned successfully",
      data: {
        orderId: order._id,
        orderCode: order.orderCode,
        deliveryPartner: order.fulfillment.riderDetails
      }
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to assign delivery partner"
    });
  }
};

/**
 * Start live tracking
 */
exports.startLiveTracking = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    const result = await orderTrackingService.startLiveTracking(orderId);

    return success(res, {
      message: result.message,
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to start live tracking"
    });
  }
};

/**
 * Stop live tracking
 */
exports.stopLiveTracking = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    const result = await orderTrackingService.stopLiveTracking(orderId);

    return success(res, {
      message: result.message,
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to stop live tracking"
    });
  }
};

/**
 * Get all trackable orders (for admin or delivery dashboard)
 */
exports.getTrackableOrders = async (req, res) => {
  try {
    const filters = {};
    if (req.query.partnerId) {
      filters["fulfillment.partnerId"] = req.query.partnerId;
    }

    const orders = await orderTrackingService.getTrackableOrders(filters);

    return success(res, {
      message: "Trackable orders retrieved successfully",
      data: orders
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve trackable orders"
    });
  }
};

module.exports = exports;



