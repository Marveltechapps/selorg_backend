const couponService = require("../service/couponService");
const cartService = require("../service/cartService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Validate coupon code
 */
exports.validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return failure(res, {
        statusCode: 400,
        message: "Coupon code is required"
      });
    }

    // Get user's cart
    const cart = await cartService.getCart(req.user.userId, false);
    
    const result = await couponService.validateCoupon(
      code.toUpperCase(),
      req.user.userId,
      cart
    );

    return success(res, {
      message: result.message,
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to validate coupon"
    });
  }
};

/**
 * Apply coupon to cart
 */
exports.applyCoupon = async (req, res) => {
  try {
    const { code, cartId } = req.body;

    if (!code) {
      return failure(res, {
        statusCode: 400,
        message: "Coupon code is required"
      });
    }

    // Get cart ID if not provided
    let finalCartId = cartId;
    if (!finalCartId) {
      const cart = await cartService.getCart(req.user.userId, false);
      finalCartId = cart._id;
    }

    const result = await couponService.applyCouponToCart(
      code.toUpperCase(),
      req.user.userId,
      finalCartId
    );

    return success(res, {
      message: "Coupon applied successfully",
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to apply coupon"
    });
  }
};

/**
 * Remove coupon from cart
 */
exports.removeCoupon = async (req, res) => {
  try {
    let { cartId } = req.body;

    // Get cart ID if not provided
    if (!cartId) {
      const cart = await cartService.getCart(req.user.userId, false);
      cartId = cart._id;
    }

    const result = await couponService.removeCouponFromCart(
      req.user.userId,
      cartId
    );

    return success(res, {
      message: "Coupon removed successfully",
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to remove coupon"
    });
  }
};

/**
 * Get available coupons for user
 */
exports.getAvailableCoupons = async (req, res) => {
  try {
    const coupons = await couponService.getAvailableCoupons(req.user.userId);

    return success(res, {
      message: "Available coupons retrieved successfully",
      data: coupons
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve coupons"
    });
  }
};

module.exports = exports;

