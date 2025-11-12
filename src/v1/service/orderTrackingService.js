const Order = require("../model/orderModel");
const { ApiError } = require("../utils/apiError");
const websocketService = require("./websocketService");

/**
 * Order Tracking Service
 * Handles real-time order tracking, delivery partner location updates, and ETA calculations
 */
class OrderTrackingService {
  /**
   * Get order tracking information
   * @param {string} orderId
   * @param {string} userId - Optional user ID for authorization
   * @returns {Promise<Object>} Tracking data
   */
  async getOrderTracking(orderId, userId = null) {
    const query = { _id: orderId };
    if (userId) {
      query.userId = userId;
    }

    const order = await Order.findOne(query).lean();

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Check if order is trackable
    const trackableStatuses = ["out_for_delivery", "ready_for_dispatch"];
    if (!trackableStatuses.includes(order.status)) {
      return {
        orderId: order._id,
        orderCode: order.orderCode,
        status: order.status,
        isTrackable: false,
        message: this.getStatusMessage(order.status),
        timeline: order.timeline
      };
    }

    // Calculate ETA in minutes
    const estimatedMinutes = this.calculateETA(order);

    // Build tracking response
    return {
      orderId: order._id,
      orderCode: order.orderCode,
      status: order.status,
      isTrackable: true,
      estimatedArrival: estimatedMinutes ? `${estimatedMinutes} mins` : null,
      statusMessage: this.getStatusMessage(order.status),
      
      deliveryPartner: order.fulfillment?.riderDetails ? {
        name: order.fulfillment.riderDetails.name || "Delivery Partner",
        phone: order.fulfillment.riderDetails.phone,
        vehicleNumber: order.fulfillment.riderDetails.vehicleNumber,
        vehicleType: order.fulfillment.riderDetails.vehicleType || "bike",
        rating: order.fulfillment.riderDetails.rating || null,
        currentLocation: order.fulfillment?.tracking?.currentLocation ? {
          latitude: order.fulfillment.tracking.currentLocation.latitude,
          longitude: order.fulfillment.tracking.currentLocation.longitude,
          updatedAt: order.fulfillment.tracking.currentLocation.updatedAt
        } : null
      } : null,
      
      deliveryLocation: order.fulfillment?.tracking?.destinationLocation || {
        latitude: order.address?.coordinates?.lat || null,
        longitude: order.address?.coordinates?.lng || null
      },
      
      route: order.fulfillment?.tracking?.route || [],
      
      distanceRemaining: order.fulfillment?.tracking?.distanceRemaining || null,
      
      orderSummary: {
        itemCount: order.items?.length || 0,
        total: order.finalAmount,
        saved: order.discount || 0,
        deliveryAddress: this.formatAddress(order.address)
      },
      
      timeline: order.timeline || []
    };
  }

  /**
   * Update delivery partner location (called by delivery partner app or webhook)
   * @param {string} orderId
   * @param {Object} locationData
   * @returns {Promise<Object>} Updated tracking data
   */
  async updateDeliveryPartnerLocation(orderId, locationData) {
    const { latitude, longitude, partnerId } = locationData;

    if (!latitude || !longitude) {
      throw new ApiError(400, "Latitude and longitude are required");
    }

    const order = await Order.findById(orderId);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Verify partner ID matches (if provided)
    if (partnerId && order.fulfillment?.partnerId !== partnerId) {
      throw new ApiError(403, "Unauthorized to update this order's location");
    }

    // Update current location
    if (!order.fulfillment) {
      order.fulfillment = {};
    }
    if (!order.fulfillment.tracking) {
      order.fulfillment.tracking = {};
    }

    order.fulfillment.tracking.currentLocation = {
      latitude,
      longitude,
      updatedAt: new Date()
    };

    order.fulfillment.tracking.isLive = true;

    // Add to route history (limit to last 50 points)
    if (!order.fulfillment.tracking.route) {
      order.fulfillment.tracking.route = [];
    }
    
    order.fulfillment.tracking.route.push({
      latitude,
      longitude,
      timestamp: new Date()
    });

    // Keep only last 50 route points
    if (order.fulfillment.tracking.route.length > 50) {
      order.fulfillment.tracking.route = order.fulfillment.tracking.route.slice(-50);
    }

    // Calculate distance remaining and ETA
    if (order.fulfillment.tracking.destinationLocation) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        order.fulfillment.tracking.destinationLocation.latitude,
        order.fulfillment.tracking.destinationLocation.longitude
      );
      order.fulfillment.tracking.distanceRemaining = Math.round(distance);
      
      // Update estimated minutes
      order.fulfillment.estimatedMinutes = this.calculateETAFromDistance(distance);
    }

    await order.save();

    // Broadcast location update via WebSocket
    websocketService.broadcastLocationUpdate(orderId, {
      latitude: order.fulfillment.tracking.currentLocation.latitude,
      longitude: order.fulfillment.tracking.currentLocation.longitude,
      distanceRemaining: order.fulfillment.tracking.distanceRemaining,
      estimatedMinutes: order.fulfillment.estimatedMinutes
    });

    // Broadcast ETA update if changed
    if (order.fulfillment.estimatedMinutes) {
      websocketService.broadcastETAUpdate(orderId, order.fulfillment.estimatedMinutes);
    }

    return {
      success: true,
      currentLocation: order.fulfillment.tracking.currentLocation,
      distanceRemaining: order.fulfillment.tracking.distanceRemaining,
      estimatedMinutes: order.fulfillment.estimatedMinutes
    };
  }

  /**
   * Assign delivery partner to order
   * @param {string} orderId
   * @param {Object} partnerData
   * @returns {Promise<Object>} Updated order
   */
  async assignDeliveryPartner(orderId, partnerData) {
    const { partnerId, name, phone, vehicleNumber, vehicleType = "bike" } = partnerData;

    if (!name || !phone) {
      throw new ApiError(400, "Partner name and phone are required");
    }

    const order = await Order.findById(orderId);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Update fulfillment details
    order.fulfillment.partnerId = partnerId;
    order.fulfillment.riderDetails = {
      name,
      phone,
      vehicleNumber,
      vehicleType
    };
    order.fulfillment.assignedAt = new Date();

    // Set destination location from order address
    if (order.address?.coordinates) {
      if (!order.fulfillment.tracking) {
        order.fulfillment.tracking = {};
      }
      order.fulfillment.tracking.destinationLocation = {
        latitude: order.address.coordinates.lat,
        longitude: order.address.coordinates.lng
      };
    }

    // Update order status
    if (order.status === "confirmed" || order.status === "preparing") {
      order.status = "ready_for_dispatch";
      order.appendTimeline({
        status: "ready_for_dispatch",
        fulfillmentStatus: "assigned",
        note: `Assigned to ${name}`
      });
    }

    await order.save();

    return order;
  }

  /**
   * Start live tracking for order
   * @param {string} orderId
   * @returns {Promise<Object>} Result
   */
  async startLiveTracking(orderId) {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (!order.fulfillment) {
      throw new ApiError(400, "No delivery partner assigned yet");
    }

    order.fulfillment.tracking = order.fulfillment.tracking || {};
    order.fulfillment.tracking.isLive = true;
    order.fulfillment.status = "dispatched";
    
    // Update order status to out for delivery
    order.status = "out_for_delivery";
    order.fulfillment.dispatchedAt = new Date();
    
    order.appendTimeline({
      status: "out_for_delivery",
      fulfillmentStatus: "dispatched",
      note: "Order is on the way"
    });

    await order.save();

    return {
      success: true,
      message: "Live tracking started",
      orderId: order._id
    };
  }

  /**
   * Stop live tracking (when delivered or cancelled)
   * @param {string} orderId
   * @returns {Promise<Object>} Result
   */
  async stopLiveTracking(orderId) {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (order.fulfillment?.tracking) {
      order.fulfillment.tracking.isLive = false;
    }

    await order.save();

    return {
      success: true,
      message: "Live tracking stopped"
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number} Distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Calculate ETA from distance
   * Assumes average speed of 20 km/h for delivery vehicles
   * @param {number} distance - Distance in meters
   * @returns {number} Estimated minutes
   */
  calculateETAFromDistance(distance) {
    const speedKmh = 20; // Average delivery speed
    const speedMs = speedKmh * 1000 / 60; // meters per minute
    const minutes = Math.ceil(distance / speedMs);
    
    // Add buffer time
    return minutes + 3; // Add 3 minutes buffer
  }

  /**
   * Calculate ETA for order
   * @param {Object} order
   * @returns {number|null} Estimated minutes
   */
  calculateETA(order) {
    if (order.fulfillment?.estimatedMinutes) {
      return order.fulfillment.estimatedMinutes;
    }

    if (order.fulfillment?.tracking?.distanceRemaining) {
      return this.calculateETAFromDistance(order.fulfillment.tracking.distanceRemaining);
    }

    // Default ETAs by status
    const defaultETAs = {
      "confirmed": 30,
      "preparing": 25,
      "ready_for_dispatch": 20,
      "out_for_delivery": 15
    };

    return defaultETAs[order.status] || null;
  }

  /**
   * Get status message for UI display
   * @param {string} status
   * @returns {string} User-friendly status message
   */
  getStatusMessage(status) {
    const messages = {
      "pending": "Order received",
      "confirmed": "Order confirmed",
      "preparing": "Your order is getting packed",
      "ready_for_dispatch": "Order ready for pickup",
      "out_for_delivery": "Your order is on the way",
      "delivered": "Order delivered",
      "cancelled": "Order cancelled",
      "failed": "Order failed",
      "refunded": "Order refunded"
    };

    return messages[status] || "Processing";
  }

  /**
   * Format address for display
   * @param {Object} address
   * @returns {string} Formatted address
   */
  formatAddress(address) {
    if (!address) return "";

    const parts = [
      address.street,
      address.landmark,
      address.city,
      address.zipCode
    ].filter(Boolean);

    return parts.join(", ");
  }

  /**
   * Get all trackable orders (for admin or delivery partner)
   * @param {Object} filters
   * @returns {Promise<Array>} List of orders with tracking
   */
  async getTrackableOrders(filters = {}) {
    const query = {
      status: { $in: ["out_for_delivery", "ready_for_dispatch"] },
      ...filters
    };

    const orders = await Order.find(query)
      .select("orderCode status fulfillment address items finalAmount")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return orders.map(order => ({
      orderId: order._id,
      orderCode: order.orderCode,
      status: order.status,
      deliveryPartner: order.fulfillment?.riderDetails?.name || null,
      currentLocation: order.fulfillment?.tracking?.currentLocation || null,
      destinationLocation: order.fulfillment?.tracking?.destinationLocation || null,
      estimatedMinutes: order.fulfillment?.estimatedMinutes || null,
      itemCount: order.items?.length || 0,
      total: order.finalAmount
    }));
  }
}

module.exports = new OrderTrackingService();

