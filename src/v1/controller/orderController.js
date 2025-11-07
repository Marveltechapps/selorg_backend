const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const OrderModel = require("../model/orderModel");
const ProductStyle = require("../model/productStyle");
const AddressModel = require("../model/addressModel");

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const coerceDate = (value) => {
  if (!value) return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : undefined;

const normalizeUpper = (value) => {
  const trimmed = normalizeString(value);
  return trimmed ? trimmed.toUpperCase() : undefined;
};

const clientError = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });

const resolveErrorStatus = (error, fallback = 500) => {
  if (!error) return fallback;
  if (typeof error.statusCode === "number") {
    return error.statusCode;
  }

  if (
    error instanceof mongoose.Error.ValidationError ||
    error instanceof mongoose.Error.CastError
  ) {
    return 400;
  }

  return fallback;
};

const asPlainObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }
  return value;
};

const generateOrderNumber = () => {
  const prefix = normalizeUpper(process.env.ORDER_PREFIX) || "SEL";
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = uuidv4().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `${prefix}-${timestamp}-${randomPart}`;
};

const transformLegacyAddress = (address) => {
  if (!address || typeof address !== "object") {
    return undefined;
  }

  const detail = address.details || address;
  return {
    label:
      address.label ||
      address.type ||
      (detail.area ? `${detail.area} ${detail.city ?? ""}`.trim() : undefined),
    contactName:
      address.contactName || address.name || detail.name || undefined,
    contactPhone:
      address.contactPhone || address.phone || detail.phone || undefined,
    details: {
      houseNo:
        detail.houseNo ||
        detail.houseNumber ||
        detail.street ||
        detail.addressLine1 ||
        "",
      building: detail.building || detail.addressLine2 || "",
      landmark: detail.landmark || "",
      area: detail.area || detail.locality || "",
      city: detail.city || "",
      state: detail.state || "",
      pincode: detail.pincode || detail.zipCode || detail.postalCode || ""
    },
    coordinates:
      address.coordinates ||
      detail.coordinates || {
        latitude: detail.latitude,
        longitude: detail.longitude
      }
  };
};

const normalizePayment = (paymentPayload = {}, fallbackMode = "COD") => {
  const mode = normalizeUpper(paymentPayload.mode) || fallbackMode;
  const allowedModes = OrderModel.PAYMENT_MODES || ["COD", "UPI", "CARD"];
  const paymentMode = allowedModes.includes(mode) ? mode : fallbackMode;

  const status = normalizeUpper(paymentPayload.status);
  const allowedStatuses =
    OrderModel.PAYMENT_STATUS || ["PENDING", "AUTHORIZED", "PAID"];
  const defaultStatus = paymentMode === "COD" ? "PENDING" : "AUTHORIZED";
  const paymentStatus = status && allowedStatuses.includes(status)
    ? status
    : defaultStatus;

  return {
    mode: paymentMode,
    status: paymentStatus,
    provider: normalizeString(paymentPayload.provider),
    transactionId: normalizeString(paymentPayload.transactionId),
    referenceId: normalizeString(paymentPayload.referenceId),
    paidAt: coerceDate(paymentPayload.paidAt),
    metadata: paymentPayload.metadata || {}
  };
};

const normalizeFulfillment = (fulfillmentPayload = {}) => {
  const type = normalizeUpper(fulfillmentPayload.type) || "IMMEDIATE";

  return {
    type: ["IMMEDIATE", "SCHEDULED"].includes(type) ? type : "IMMEDIATE",
    slotStart: coerceDate(fulfillmentPayload.slotStart),
    slotEnd: coerceDate(fulfillmentPayload.slotEnd),
    promiseTime: coerceDate(fulfillmentPayload.promiseTime),
    deliveredAt: coerceDate(fulfillmentPayload.deliveredAt),
    hubId: normalizeString(fulfillmentPayload.hubId),
    rider: fulfillmentPayload.rider || {}
  };
};

const resolveStatus = (requestedStatus, paymentStatus) => {
  const normalizedStatus = normalizeUpper(requestedStatus);
  if (
    normalizedStatus &&
    (OrderModel.ORDER_STATES || []).includes(normalizedStatus)
  ) {
    return normalizedStatus;
  }

  if (["PAID", "AUTHORIZED"].includes(paymentStatus)) {
    return "CONFIRMED";
  }

  return "CREATED";
};

const buildCharges = (
  rawCharges = {},
  totals = { mrpSubtotal: 0, saleSubtotal: 0, taxAmount: 0 },
  deliveryTip = 0
) => {
  const charges = {
    deliveryFee: toNumber(rawCharges.deliveryFee, 0),
    surgeFee: toNumber(rawCharges.surgeFee, 0),
    tipAmount: toNumber(
      rawCharges.tipAmount != null ? rawCharges.tipAmount : deliveryTip,
      0
    ),
    couponDiscount: toNumber(rawCharges.couponDiscount, 0),
    walletDeduction: toNumber(rawCharges.walletDeduction, 0),
    roundingAdjustment: toNumber(rawCharges.roundingAdjustment, 0)
  };

  if (rawCharges.taxAmount != null) {
    charges.taxAmount = toNumber(rawCharges.taxAmount, totals.taxAmount);
  } else {
    charges.taxAmount = Number(totals.taxAmount.toFixed(2));
  }

  charges.mrpSubtotal = Number(totals.mrpSubtotal.toFixed(2));
  charges.saleSubtotal = Number(totals.saleSubtotal.toFixed(2));
  return charges;
};

const toLeanOrder = async (orderDoc) => {
  if (!orderDoc) return null;
  if (typeof orderDoc.toObject === "function") {
    return orderDoc.toObject({ virtuals: true });
  }
  return orderDoc;
};

async function hydrateOrderItems(rawItems = []) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw clientError("Order must contain at least one item");
  }

  const enrichedItems = await Promise.all(
    rawItems.map(async (item, index) => {
      if (!item.productId) {
        throw clientError(`Item at index ${index} is missing productId`);
      }

      const product = await ProductStyle.findById(item.productId).lean();
      if (!product) {
        throw clientError(`Product with ID ${item.productId} not found`, 404);
      }

      const quantity = toNumber(item.quantity, 1);
      if (quantity <= 0) {
        throw clientError(
          `Quantity for product ${product.SKUName} must be at least 1`
        );
      }

      const variantLabel = normalizeString(item.variantLabel);
      const variant = variantLabel
        ? (product.variants || []).find(
            (variantDoc) =>
              typeof variantDoc.label === "string" &&
              variantDoc.label.toLowerCase() === variantLabel.toLowerCase()
          )
        : null;

      const unitPrice = toNumber(variant?.price ?? product.price);
      const salePrice = toNumber(
        variant?.discountPrice ??
          product.discountPrice ??
          variant?.price ??
          product.price
      );

      if (unitPrice <= 0 || salePrice <= 0) {
        throw clientError(
          `Invalid pricing information for product ${product.SKUName}`
        );
      }

      const imageURL =
        item.imageURL ||
        variant?.imageURL ||
        variant?.comboDetails?.comboImageURL ||
        (product.variants && product.variants[0]
          ? product.variants[0].imageURL
          : undefined);

      const taxRate = toNumber(item.taxRate, 0);
      const lineTotal = Number((salePrice * quantity).toFixed(2));
      const taxAmount =
        item.taxAmount != null
          ? toNumber(item.taxAmount, 0)
          : Number(((lineTotal * taxRate) / 100).toFixed(2));

      return {
        document: {
          productId: item.productId,
          sku: product.SKUCode,
          title: product.SKUName,
          variantLabel: variantLabel || variant?.label || null,
          quantity,
          unitPrice,
          salePrice,
          taxRate,
          taxAmount,
          lineTotal,
          imageURL
        },
        mrpSubtotal: unitPrice * quantity,
        saleSubtotal: salePrice * quantity,
        taxAmount
      };
    })
  );

  const totals = enrichedItems.reduce(
    (acc, entry) => {
      acc.mrpSubtotal += entry.mrpSubtotal;
      acc.saleSubtotal += entry.saleSubtotal;
      acc.taxAmount += entry.taxAmount;
      return acc;
    },
    { mrpSubtotal: 0, saleSubtotal: 0, taxAmount: 0 }
  );

  return {
    items: enrichedItems.map((entry) => entry.document),
    totals
  };
}

async function resolveAddress({ addressId, address, userId }) {
  if (addressId) {
    const addressDoc = await AddressModel.findOne({
      _id: addressId,
      userId
    }).lean();

    if (!addressDoc) {
      throw clientError("Address not found for the authenticated user", 404);
    }

    return {
      addressId,
      snapshot: {
        label: addressDoc.label,
        details: addressDoc.details,
        coordinates: addressDoc.coordinates
      }
    };
  }

  const legacySnapshot = transformLegacyAddress(address);
  if (legacySnapshot) {
    return {
      addressId: undefined,
      snapshot: legacySnapshot
    };
  }

  throw clientError("Shipping address is required");
}

async function fetchOrdersForUser(userId, query = {}) {
  const pipeline = OrderModel.find({ userId, ...query })
    .populate("items.productId", "SKUCode SKUName price discountPrice")
    .populate("addressId")
    .sort({ createdAt: -1 });

  return pipeline.lean({ virtuals: true });
}

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      items: rawItems = [],
      addressId,
      address,
      deliveryInstructions,
      additionalNote,
      payment: paymentPayload,
      fulfillment: fulfillmentPayload,
      charges: rawCharges,
      deliveryTip,
      promoCode,
      status: requestedStatus,
      metadata
    } = req.body;

    const { items, totals } = await hydrateOrderItems(rawItems);
    const { addressId: resolvedAddressId, snapshot } = await resolveAddress({
      addressId,
      address,
      userId
    });

    const payment = normalizePayment(paymentPayload);
    const order = new OrderModel({
      userId,
      items,
      addressId: resolvedAddressId,
      addressSnapshot: snapshot,
      deliveryInstructions: normalizeString(deliveryInstructions) || "",
      additionalNote: normalizeString(additionalNote) || "",
      payment,
      fulfillment: normalizeFulfillment(fulfillmentPayload),
      charges: buildCharges(rawCharges, totals, deliveryTip),
      promoCode: normalizeString(promoCode),
      metadata: asPlainObject(metadata)
    });

    order.orderNumber = generateOrderNumber();
    const initialStatus = resolveStatus(requestedStatus, payment.status);
    order.statusHistory = [];
    order.recordStatusChange({
      state: initialStatus,
      note:
        normalizeString(req.body.statusNote) ||
        "Order created by customer",
      changedBy: {
        actorId: userId,
        actorType: "USER"
      }
    });

    await order.save();

    const savedOrder = await toLeanOrder(order);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: savedOrder
    });
  } catch (error) {
    return res.status(resolveErrorStatus(error, 500)).json({
      success: false,
      message: error.message
    });
  }
};

// Get all orders for logged-in user
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const statusFilter = normalizeUpper(req.query.status);
    const query = {};

    if (
      statusFilter &&
      (OrderModel.ORDER_STATES || []).includes(statusFilter)
    ) {
      query.status = statusFilter;
    }

    const orders = await fetchOrdersForUser(userId, query);

    return res.status(200).json({
      success: true,
      message: orders.length
        ? "Orders retrieved successfully"
        : "No orders found for this user",
      data: orders
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get order by ID (only if it belongs to the user)
exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order identifier" });
    }

    const order = await OrderModel.findOne({ _id: orderId, userId })
      .populate("items.productId", "SKUCode SKUName price discountPrice")
      .populate("addressId")
      .lean({ virtuals: true });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get orders by the authenticated user
exports.getOrderByUserId = exports.getOrders;

// Update order status (admin or service use)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note, changedBy, payment: paymentPayload, fulfillment } =
      req.body;

    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Status is required" });
    }

    const order = await OrderModel.findById(req.params.id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const actor = {
      actorId: changedBy?.actorId || req.user?.userId,
      actorType: normalizeUpper(changedBy?.actorType) || "SYSTEM",
      actorName: changedBy?.actorName
    };

    order.recordStatusChange({
      state: status,
      note: note || `Order moved to ${status}`,
      changedBy: actor
    });

    if (paymentPayload) {
      const existingPayment =
        order.payment && typeof order.payment.toObject === "function"
          ? order.payment.toObject()
          : order.payment || {};

      const nextPayment = normalizePayment(
        paymentPayload,
        existingPayment.mode
      );

      order.payment = { ...existingPayment, ...nextPayment };
    }

    if (fulfillment) {
      const existingFulfillment =
        order.fulfillment && typeof order.fulfillment.toObject === "function"
          ? order.fulfillment.toObject()
          : order.fulfillment || {};

      order.fulfillment = {
        ...existingFulfillment,
        ...normalizeFulfillment(fulfillment)
      };
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      data: await toLeanOrder(order)
    });
  } catch (error) {
    return res
      .status(resolveErrorStatus(error, 400))
      .json({ success: false, message: error.message });
  }
};

// Delete an order (user can delete only their own order)
exports.deleteOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order identifier" });
    }

    const order = await OrderModel.findOneAndDelete({
      _id: orderId,
      userId
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found or unauthorized" });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Reorder a previous order
exports.reorder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orderId = req.params.orderId;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order identifier" });
    }

    const previousOrder = await OrderModel.findOne({
      _id: orderId,
      userId
    }).lean();

    if (!previousOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Previous order not found" });
    }

    const payloadForHydration = previousOrder.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      variantLabel: item.variantLabel,
      taxRate: item.taxRate
    }));

    const { items, totals } = await hydrateOrderItems(payloadForHydration);

    const reorder = new OrderModel({
      userId,
      orderNumber: generateOrderNumber(),
      items,
      addressId: previousOrder.addressId,
      addressSnapshot: previousOrder.addressSnapshot,
      deliveryInstructions: previousOrder.deliveryInstructions,
      additionalNote: previousOrder.additionalNote,
      payment: normalizePayment({ mode: "COD", status: "PENDING" }),
      fulfillment: normalizeFulfillment({ type: "IMMEDIATE" }),
      charges: buildCharges(
        previousOrder.charges,
        totals,
        previousOrder.charges?.tipAmount
      ),
      promoCode: previousOrder.promoCode,
      metadata: {
        ...asPlainObject(previousOrder.metadata),
        reorderOf: orderId
      }
    });

    reorder.statusHistory = [];
    reorder.recordStatusChange({
      state: "CREATED",
      note: "Reorder created by customer",
      changedBy: {
        actorId: userId,
        actorType: "USER"
      }
    });

    await reorder.save();

    return res.status(201).json({
      success: true,
      message: "Reorder created successfully",
      data: await toLeanOrder(reorder)
    });
  } catch (error) {
    return res.status(resolveErrorStatus(error, 400)).json({
      success: false,
      message: "Error while reordering",
      error: error.message
    });
  }
};
