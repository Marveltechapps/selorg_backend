const { z } = require("zod");

/**
 * Validation schema for adding item to cart
 */
const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  variantLabel: z.string().min(1, "Variant label is required"),
  imageURL: z.string().url("Invalid image URL").optional(),
  price: z.number().optional(),
  discountPrice: z.number().optional(),
  deliveryInstructions: z.string().optional(),
  addNotes: z.string().optional(),
  deliveryTip: z.number().optional(),
  mobileNumber: z.string().regex(/^\d{10}$/, "Invalid mobile number").optional()
});

/**
 * Validation schema for removing item from cart
 */
const removeFromCartSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  variantLabel: z.string().optional()
});

/**
 * Validation schema for updating cart item
 */
const updateCartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  variantLabel: z.string().optional()
});

/**
 * Validation schema for updating delivery tip
 */
const updateDeliveryTipSchema = z.object({
  deliveryTip: z.number().min(0, "Delivery tip cannot be negative")
});

/**
 * Validation schema for clear cart query params
 */
const clearCartQuerySchema = z.object({
  mobileNumber: z.string().regex(/^\d{10}$/, "Invalid mobile number")
});

module.exports = {
  addToCartSchema,
  removeFromCartSchema,
  updateCartItemSchema,
  updateDeliveryTipSchema,
  clearCartQuerySchema
};

