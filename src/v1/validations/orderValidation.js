const { z } = require("zod");

/**
 * Order item schema
 */
const orderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  variantLabel: z.string().optional(),
  notes: z.string().optional(),
  price: z.number().optional(),
  taxRate: z.number().optional()
});

/**
 * Address schema
 */
const addressSchema = z.object({
  label: z.string().optional(),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  country: z.string().optional(),
  landmark: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  instructions: z.string().optional()
});

/**
 * Validation schema for creating an order
 */
const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  address: addressSchema,
  paymentMethod: z.enum(["cod", "upi", "card", "netbanking", "wallet"]).optional(),
  payment: z.object({
    method: z.enum(["cod", "upi", "card", "netbanking", "wallet"]).optional(),
    transactionId: z.string().optional(),
    reference: z.string().optional(),
    status: z.enum(["pending", "authorized", "paid", "refunded", "failed"]).optional(),
    payload: z.any().optional()
  }).optional(),
  fulfillment: z.object({
    type: z.enum(["delivery", "pickup"]).optional(),
    slot: z.object({
      start: z.string().or(z.date()).optional(),
      end: z.string().or(z.date()).optional()
    }).optional(),
    eta: z.string().or(z.date()).optional(),
    partnerId: z.string().optional(),
    riderDetails: z.object({
      name: z.string().optional(),
      phone: z.string().optional()
    }).optional()
  }).optional(),
  deliveryTip: z.number().optional(),
  deliveryInstructions: z.string().optional(),
  additionalNote: z.string().optional(),
  coupon: z.object({
    code: z.string(),
    savings: z.number().optional(),
    metadata: z.any().optional()
  }).optional(),
  deliveryFee: z.number().optional(),
  serviceFee: z.number().optional(),
  taxRate: z.number().optional(),
  userSnapshot: z.object({
    name: z.string().optional(),
    phone: z.string().optional()
  }).optional(),
  pricingOverrides: z.object({
    deliveryFee: z.number().optional(),
    serviceFee: z.number().optional(),
    currency: z.string().optional()
  }).optional(),
  metadata: z.any().optional()
});

/**
 * Validation schema for updating order status
 */
const updateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "ready_for_dispatch",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "failed",
    "refunded"
  ]).optional(),
  paymentStatus: z.enum([
    "pending",
    "authorized",
    "paid",
    "refunded",
    "failed"
  ]).optional(),
  fulfillmentStatus: z.enum([
    "pending",
    "assigned",
    "picking",
    "packed",
    "dispatched",
    "delivered",
    "cancelled",
    "failed"
  ]).optional(),
  note: z.string().optional(),
  transactionId: z.string().optional(),
  paymentMethod: z.enum(["cod", "upi", "card", "netbanking", "wallet"]).optional(),
  paidAt: z.string().or(z.date()).optional()
});

/**
 * Validation schema for order query parameters
 */
const getOrdersQuerySchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "ready_for_dispatch",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "failed",
    "refunded"
  ]).optional(),
  page: z.string().regex(/^\d+$/, "Page must be a number").optional(),
  limit: z.string().regex(/^\d+$/, "Limit must be a number").optional()
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  getOrdersQuerySchema,
  orderItemSchema,
  addressSchema
};

