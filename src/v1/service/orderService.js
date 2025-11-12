const OrderModel = require("../model/orderModel");
const ProductStyle = require("../model/productStyle");
const { ApiError } = require("../utils/apiError");

/**
 * OrderService - Handles order business logic
 */
class OrderService {
  /**
   * Parse number with fallback
   * @param {*} value
   * @param {number} fallback
   * @returns {number}
   */
  parseNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  /**
   * Get enum values from model schema
   * @param {string} path
   * @returns {Array}
   */
  getEnumValues(path) {
    return OrderModel.schema.path(path)?.enumValues || [];
  }

  /**
   * Sanitize status value
   * @param {string} path
   * @param {*} value
   * @returns {string|undefined}
   */
  sanitizeStatus(path, value) {
    if (!value) return undefined;
    const allowed = this.getEnumValues(path);
    const normalized = String(value).toLowerCase();
    return allowed.includes(normalized) ? normalized : undefined;
  }

  /**
   * Sanitize payment method
   * @param {string} method
   * @returns {string}
   */
  sanitizePaymentMethod(method) {
    const allowed = this.getEnumValues("payment.method");
    const normalized = String(method || "").toLowerCase();
    return allowed.includes(normalized) ? normalized : "cod";
  }

  /**
   * Build order items from cart items
   * @param {Array} items - Cart items
   * @param {number} defaultTaxRate
   * @returns {Promise<Object>} Order items and totals
   */
  async buildOrderItems(items = [], defaultTaxRate = 0) {
    if (!Array.isArray(items) || !items.length) {
      throw new ApiError(400, "Order items are required");
    }

    const orderItems = [];
    let subtotal = 0;
    let discountedTotal = 0;
    let totalTax = 0;

    for (const item of items) {
      let product;
      try {
        product = await ProductStyle.findById(item.productId).lean();
      } catch (error) {
        if (error.name === "CastError") {
          throw new ApiError(400, `Invalid productId: ${item.productId}`);
        }
        throw error;
      }
      
      if (!product) {
        throw new ApiError(404, `Product with ID ${item.productId} not found`);
      }

      const quantity = this.parseNumber(item.quantity, 1);
      const price = this.parseNumber(product.price, 0);
      const discountPrice = this.parseNumber(
        item.price ?? product.discountPrice ?? price,
        price
      );
      const taxRate = this.parseNumber(item.taxRate ?? defaultTaxRate, 0);

      subtotal += price * quantity;
      discountedTotal += discountPrice * quantity;
      totalTax += (taxRate / 100) * discountPrice * quantity;

      orderItems.push({
        productId: product._id,
        productName: product.title || product.name || product.productName,
        sku: product.skuCode || product.sku || product.barcode,
        quantity,
        variantLabel: item.variantLabel || product.variantLabel || "",
        imageURL: product.imageURL,
        price,
        discountPrice,
        taxRate,
        lineTotal: Number((discountPrice * quantity).toFixed(2)),
        notes: item.notes
      });
    }

    return {
      orderItems,
      totals: {
        subtotal,
        discountedTotal,
        totalTax
      }
    };
  }

  /**
   * Compute pricing for order
   * @param {Object} totals - Subtotal, discounted total, tax
   * @param {Object} options - Additional pricing options
   * @returns {Object} Complete pricing breakdown
   */
  computePricing(totals, options = {}) {
    const { subtotal, discountedTotal, totalTax } = totals;
    const discount = subtotal - discountedTotal;
    const deliveryFee = this.parseNumber(options.deliveryFee, 0);
    const serviceFee = this.parseNumber(options.serviceFee, 0);
    const tip = this.parseNumber(options.tip, 0);
    const currency = options.currency || "INR";

    const payable = Math.max(
      0,
      Number(
        (
          discountedTotal +
          deliveryFee +
          serviceFee +
          tip +
          totalTax
        ).toFixed(2)
      )
    );

    return {
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      deliveryFee: Number(deliveryFee.toFixed(2)),
      serviceFee: Number(serviceFee.toFixed(2)),
      tip: Number(tip.toFixed(2)),
      tax: Number(totalTax.toFixed(2)),
      payable,
      currency
    };
  }

  /**
   * Build complete order payload
   * @param {Object} user - Authenticated user
   * @param {Object} body - Request body
   * @returns {Promise<Object>} Order payload
   */
  async buildOrderPayload(user, body) {
    if (!user?.userId) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!body.address) {
      throw new ApiError(400, "Delivery address is required");
    }

    const { orderItems, totals } = await this.buildOrderItems(
      body.items,
      body.taxRate
    );

    const pricing = this.computePricing(totals, {
      deliveryFee: body.deliveryFee ?? body.pricingOverrides?.deliveryFee,
      serviceFee: body.serviceFee ?? body.pricingOverrides?.serviceFee,
      tip: body.deliveryTip,
      currency: body.pricingOverrides?.currency
    });

    const status = this.sanitizeStatus("status", body.status) ?? "pending";
    const paymentMethod = this.sanitizePaymentMethod(
      body.payment?.method ?? body.paymentMethod
    );
    const paymentStatus =
      this.sanitizeStatus("paymentStatus", body.payment?.status) ??
      (paymentMethod !== "cod" ? "authorized" : "pending");
    const fulfillmentStatus =
      this.sanitizeStatus("fulfillmentStatus", body.fulfillment?.status) ?? "pending";

    const fulfillmentPayload = {
      status: fulfillmentStatus,
      type: body.fulfillment?.type || "delivery"
    };

    const slotSource = body.fulfillment?.slot || body.deliverySlot;
    if (slotSource?.start || slotSource?.end) {
      fulfillmentPayload.slot = {
        start: slotSource.start,
        end: slotSource.end
      };
    }
    if (body.fulfillment?.eta) {
      fulfillmentPayload.eta = body.fulfillment.eta;
    }
    if (body.fulfillment?.partnerId) {
      fulfillmentPayload.partnerId = body.fulfillment.partnerId;
    }
    if (body.fulfillment?.riderDetails) {
      fulfillmentPayload.riderDetails = body.fulfillment.riderDetails;
    }

    const payload = {
      userId: user.userId,
      userSnapshot: {
        name: body.userSnapshot?.name || user.name,
        phone: body.userSnapshot?.phone || user.mobileNumber
      },
      status,
      paymentStatus,
      fulfillmentStatus,
      items: orderItems,
      pricing,
      payment: {
        method: paymentMethod,
        status: paymentStatus,
        transactionId:
          body.payment?.transactionId ?? body.transactionId ?? undefined,
        reference: body.payment?.reference,
        payload: body.payment?.payload
      },
      fulfillment: fulfillmentPayload,
      address: body.address,
      deliveryTip: pricing.tip,
      deliveryInstructions: body.deliveryInstructions || "",
      additionalNote: body.additionalNote || "",
      metadata: body.metadata || {},
      totalPrice: pricing.subtotal,
      discount: pricing.discount,
      finalAmount: pricing.payable
    };

    if (body.coupon?.code) {
      payload.coupon = {
        code: body.coupon.code,
        savings: this.parseNumber(
          body.coupon.savings ?? pricing.discount,
          pricing.discount
        ),
        metadata: body.coupon.metadata
      };
    }

    return payload;
  }

  /**
   * Create a new order
   * @param {Object} user - Authenticated user
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  async createOrder(user, orderData) {
    const orderPayload = await this.buildOrderPayload(user, orderData);
    const order = await OrderModel.create(orderPayload);
    return order;
  }

  /**
   * Get user's orders
   * @param {string} userId
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Array>} Orders list
   */
  async getUserOrders(userId, options = {}) {
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [orders, total] = await Promise.all([
      OrderModel.find(query)
        .populate("items.productId", "title imageURL price discountPrice")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      OrderModel.countDocuments(query)
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get order by ID
   * @param {string} orderId
   * @param {string} userId - For authorization
   * @returns {Promise<Object>} Order object
   */
  async getOrderById(orderId, userId) {
    const order = await OrderModel.findOne({
      _id: orderId,
      userId: userId
    })
      .populate("items.productId", "title imageURL price discountPrice")
      .populate("userId", "name email");

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return order;
  }

  /**
   * Update order status
   * @param {string} orderId
   * @param {Object} statusData - Status update data
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, statusData) {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const status = this.sanitizeStatus("status", statusData.status);
    const paymentStatus = this.sanitizeStatus(
      "paymentStatus",
      statusData.paymentStatus
    );
    const fulfillmentStatus = this.sanitizeStatus(
      "fulfillmentStatus",
      statusData.fulfillmentStatus
    );

    if (!status && !paymentStatus && !fulfillmentStatus && !statusData.note) {
      throw new ApiError(400, "No valid updates provided");
    }

    if (status) {
      order.status = status;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      order.payment.status = paymentStatus;
    }
    if (fulfillmentStatus) {
      order.fulfillmentStatus = fulfillmentStatus;
      order.fulfillment.status = fulfillmentStatus;
    }

    if (statusData.transactionId) {
      order.payment.transactionId = statusData.transactionId;
    }
    if (statusData.paymentMethod) {
      order.payment.method = this.sanitizePaymentMethod(statusData.paymentMethod);
    }
    if (statusData.paidAt) {
      order.payment.paidAt = statusData.paidAt;
    }

    order.appendTimeline({
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      note: statusData.note || "Order updated"
    });

    await order.save();
    return order;
  }

  /**
   * Delete order
   * @param {string} orderId
   * @param {string} userId - For authorization
   * @returns {Promise<Object>} Deletion result
   */
  async deleteOrder(orderId, userId) {
    const order = await OrderModel.findOneAndDelete({
      _id: orderId,
      userId: userId
    });

    if (!order) {
      throw new ApiError(404, "Order not found or unauthorized");
    }

    return {
      message: "Order deleted successfully",
      orderId: order._id
    };
  }

  /**
   * Reorder from previous order
   * @param {string} orderId
   * @param {Object} user - Authenticated user
   * @returns {Promise<Object>} New order
   */
  async reorder(orderId, user) {
    const previousOrder = await OrderModel.findOne({
      _id: orderId,
      userId: user.userId
    }).lean();

    if (!previousOrder) {
      throw new ApiError(404, "Previous order not found");
    }

    const reorderPayload = await this.buildOrderPayload(user, {
      items: previousOrder.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        variantLabel: item.variantLabel,
        notes: item.notes
      })),
      address: previousOrder.address,
      deliveryTip: previousOrder.deliveryTip,
      deliveryInstructions: previousOrder.deliveryInstructions,
      additionalNote: previousOrder.additionalNote,
      coupon: previousOrder.coupon?.code
        ? { code: previousOrder.coupon.code }
        : undefined,
      metadata: {
        ...(previousOrder.metadata || {}),
        reorderSource: previousOrder.orderCode
      }
    });

    const newOrder = await OrderModel.create(reorderPayload);
    return newOrder;
  }

  /**
   * Get order tracking information
   * @param {string} orderId
   * @param {string} userId
   * @returns {Promise<Object>} Tracking info
   */
  async getOrderTracking(orderId, userId) {
    const order = await OrderModel.findOne({
      _id: orderId,
      userId: userId
    }).select('orderCode status paymentStatus fulfillmentStatus timeline fulfillment createdAt');

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return {
      orderCode: order.orderCode,
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      timeline: order.timeline,
      estimatedDelivery: order.fulfillment?.eta,
      riderDetails: order.fulfillment?.riderDetails,
      createdAt: order.createdAt
    };
  }
}

module.exports = new OrderService();

