const OrderModel = require("../model/orderModel");
const ProductStyle = require("../model/productStyle");
const logger = require("../config/logger");
const { ApiError } = require("../utils/apiError");
const { success, failure } = require("../utils/apiResponse");

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getEnumValues = (path) =>
  OrderModel.schema.path(path)?.enumValues || [];

const sanitizeStatus = (path, value) => {
  if (!value) return undefined;
  const allowed = getEnumValues(path);
  const normalized = String(value).toLowerCase();
  return allowed.includes(normalized) ? normalized : undefined;
};

const sanitizePaymentMethod = (method) => {
  const allowed = getEnumValues("payment.method");
  const normalized = String(method || "").toLowerCase();
  return allowed.includes(normalized) ? normalized : "cod";
};

const buildOrderItems = async (items = [], defaultTaxRate = 0) => {
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

    const quantity = parseNumber(item.quantity, 1);
    const price = parseNumber(product.price, 0);
    const discountPrice = parseNumber(
      item.price ?? product.discountPrice ?? price,
      price
    );
    const taxRate = parseNumber(item.taxRate ?? defaultTaxRate, 0);

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
};

const computePricing = ({ subtotal, discountedTotal, totalTax }, options = {}) => {
  const discount = subtotal - discountedTotal;
  const deliveryFee = parseNumber(options.deliveryFee, 0);
  const serviceFee = parseNumber(options.serviceFee, 0);
  const tip = parseNumber(options.tip, 0);
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
};

const buildOrderPayload = async ({ user, body }) => {
  if (!user?.userId) {
    throw new ApiError(401, "Unauthorized");
  }

  if (!body.address) {
    throw new ApiError(400, "Delivery address is required");
  }

  const {
    orderItems,
    totals
  } = await buildOrderItems(body.items, body.taxRate);

  const pricing = computePricing(totals, {
    deliveryFee: body.deliveryFee ?? body.pricingOverrides?.deliveryFee,
    serviceFee: body.serviceFee ?? body.pricingOverrides?.serviceFee,
    tip: body.deliveryTip,
    currency: body.pricingOverrides?.currency
  });

  const status = sanitizeStatus("status", body.status) ?? "pending";
  const paymentMethod = sanitizePaymentMethod(
    body.payment?.method ?? body.paymentMethod
  );
  const paymentStatus =
    sanitizeStatus("paymentStatus", body.payment?.status) ??
    (paymentMethod !== "cod" ? "authorized" : "pending");
  const fulfillmentStatus =
    sanitizeStatus("fulfillmentStatus", body.fulfillment?.status) ?? "pending";

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
      savings: parseNumber(
        body.coupon.savings ?? pricing.discount,
        pricing.discount
      ),
      metadata: body.coupon.metadata
    };
  }

  return payload;
};

const handleError = (res, error, context) => {
  if (error instanceof ApiError) {
    return failure(res, {
      statusCode: error.statusCode,
      message: error.message
    });
  }

  logger.error({ err: error }, `Failed to ${context}`);
  return failure(res, {
    statusCode: 500,
    message: `Failed to ${context}`
  });
};

exports.createOrder = async (req, res) => {
  try {
    const orderPayload = await buildOrderPayload({
      user: req.user,
      body: req.body
    });

    const order = await OrderModel.create(orderPayload);

    return success(res, {
      statusCode: 201,
      message: "Order created successfully",
      data: order
    });
  } catch (error) {
    return handleError(res, error, "create order");
  }
};

exports.getOrders = async (req, res) => {
  try {
    if (!req.user?.userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const orders = await OrderModel.find({ userId: req.user.userId })
      .populate("items.productId", "title imageURL price discountPrice")
      .sort({ createdAt: -1 });

    return success(res, {
      message: "Orders retrieved successfully",
      data: orders
    });
  } catch (error) {
    return handleError(res, error, "fetch orders");
  }
};

exports.getOrderById = async (req, res) => {
  try {
    if (!req.user?.userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const order = await OrderModel.findOne({
      _id: req.params.id,
      userId: req.user.userId
    })
      .populate("items.productId", "title imageURL price discountPrice")
      .populate("userId", "name email");

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return success(res, {
      message: "Order retrieved successfully",
      data: order
    });
  } catch (error) {
    return handleError(res, error, "fetch order");
  }
};

exports.getOrderByUserId = async (req, res) => {
  try {
    if (!req.user?.userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const orders = await OrderModel.find({ userId: req.user.userId })
      .populate("items.productId", "title imageURL price discountPrice")
      .sort({ createdAt: -1 });

    if (!orders.length) {
      throw new ApiError(404, "No orders found for this user");
    }

    return success(res, {
      message: "Orders fetched successfully",
      data: orders
    });
  } catch (error) {
    return handleError(res, error, "fetch orders");
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await OrderModel.findById(req.params.id);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const status = sanitizeStatus("status", req.body.status);
    const paymentStatus = sanitizeStatus(
      "paymentStatus",
      req.body.paymentStatus
    );
    const fulfillmentStatus = sanitizeStatus(
      "fulfillmentStatus",
      req.body.fulfillmentStatus
    );

    if (!status && !paymentStatus && !fulfillmentStatus && !req.body.note) {
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

    if (req.body.transactionId) {
      order.payment.transactionId = req.body.transactionId;
    }
    if (req.body.paymentMethod) {
      order.payment.method = sanitizePaymentMethod(req.body.paymentMethod);
    }
    if (req.body.paidAt) {
      order.payment.paidAt = req.body.paidAt;
    }

    order.appendTimeline({
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      note: req.body.note || "Order updated"
    });

    await order.save();

    return success(res, {
      message: "Order updated successfully",
      data: order
    });
  } catch (error) {
    return handleError(res, error, "update order");
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    if (!req.user?.userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const order = await OrderModel.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!order) {
      throw new ApiError(404, "Order not found or unauthorized");
    }

    return success(res, {
      message: "Order deleted successfully"
    });
  } catch (error) {
    return handleError(res, error, "delete order");
  }
};

exports.reorder = async (req, res) => {
  try {
    if (!req.user?.userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const previousOrder = await OrderModel.findOne({
      _id: req.params.orderId,
      userId: req.user.userId
    }).lean();

    if (!previousOrder) {
      throw new ApiError(404, "Previous order not found");
    }

    const reorderPayload = await buildOrderPayload({
      user: req.user,
      body: {
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
      }
    });

    const newOrder = await OrderModel.create(reorderPayload);

    return success(res, {
      statusCode: 201,
      message: "Reorder created successfully",
      data: newOrder
    });
  } catch (error) {
    return handleError(res, error, "create reorder");
  }
};
