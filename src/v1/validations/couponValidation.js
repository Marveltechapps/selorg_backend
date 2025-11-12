const { z } = require("zod");

/**
 * Validation schema for validating/applying a coupon
 */
const applyCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").toUpperCase(),
  cartId: z.string().optional()
});

/**
 * Validation schema for removing a coupon
 */
const removeCouponSchema = z.object({
  cartId: z.string().optional()
});

module.exports = {
  applyCouponSchema,
  removeCouponSchema
};

