const { ApiError } = require("../utils/apiError");

/**
 * CouponService - Handles coupon validation and application
 */
class CouponService {
  /**
   * Get coupon model (lazy load)
   * @returns {Model}
   */
  getCouponModel() {
    if (!this.CouponModel) {
      this.CouponModel = require("../model/couponModel");
    }
    return this.CouponModel;
  }

  /**
   * Validate coupon code
   * @param {string} code - Coupon code
   * @param {string} userId - User ID
   * @param {Object} cart - Cart data
   * @returns {Promise<Object>} Validation result
   */
  async validateCoupon(code, userId, cart) {
    const CouponModel = this.getCouponModel();
    
    const coupon = await CouponModel.findOne({
      code: code.toUpperCase(),
      isActive: true
    });

    if (!coupon) {
      throw new ApiError(404, "Invalid coupon code");
    }

    // Check expiry
    if (coupon.validUntil && new Date() > coupon.validUntil) {
      throw new ApiError(400, "Coupon has expired");
    }

    if (coupon.validFrom && new Date() < coupon.validFrom) {
      throw new ApiError(400, "Coupon is not yet valid");
    }

    // Check usage limits
    if (coupon.maxUsageTotal && coupon.usageCount >= coupon.maxUsageTotal) {
      throw new ApiError(400, "Coupon usage limit reached");
    }

    // Check per-user usage limit
    if (coupon.maxUsagePerUser) {
      const userUsageCount = coupon.usedBy?.filter(
        u => u.userId.toString() === userId
      ).length || 0;

      if (userUsageCount >= coupon.maxUsagePerUser) {
        throw new ApiError(400, "You have already used this coupon maximum times");
      }
    }

    // Check minimum order value
    const cartTotal = cart.billSummary?.subtotalWithGST || cart.billSummary?.itemTotal || 0;
    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
      throw new ApiError(400, `Minimum order value of ₹${coupon.minOrderValue} required`);
    }

    // Calculate discount
    const discount = this.calculateDiscount(coupon, cart);

    return {
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description
      },
      discount,
      message: `Coupon applied successfully! You saved ₹${discount.toFixed(2)}`
    };
  }

  /**
   * Calculate discount amount
   * @param {Object} coupon - Coupon object
   * @param {Object} cart - Cart data
   * @returns {number} Discount amount
   */
  calculateDiscount(coupon, cart) {
    const cartTotal = cart.billSummary?.subtotalWithGST || cart.billSummary?.itemTotal || 0;
    let discount = 0;

    switch (coupon.discountType) {
      case 'percentage':
        discount = (cartTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount) {
          discount = Math.min(discount, coupon.maxDiscountAmount);
        }
        break;

      case 'fixed':
        discount = coupon.discountValue;
        break;

      case 'free_shipping':
        discount = cart.billSummary?.deliveryFee || 0;
        break;

      default:
        discount = 0;
    }

    return Number(discount.toFixed(2));
  }

  /**
   * Apply coupon to cart
   * @param {string} code - Coupon code
   * @param {string} userId - User ID
   * @param {string} cartId - Cart ID
   * @returns {Promise<Object>} Updated cart with coupon
   */
  async applyCouponToCart(code, userId, cartId) {
    const CartModel = require("../model/cartList");
    
    const cart = await CartModel.findOne({ _id: cartId, userId });

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    // Validate coupon
    const validation = await this.validateCoupon(code, userId, cart);

    // Apply coupon to cart
    cart.appliedCoupon = {
      code: validation.coupon.code,
      discountAmount: validation.discount,
      appliedAt: new Date()
    };

    // Update bill summary with discount
    if (cart.billSummary) {
      cart.billSummary.discountAmount = validation.discount;
      cart.recalculateBill();
    }

    await cart.save();

    return {
      cart,
      coupon: validation.coupon,
      discount: validation.discount
    };
  }

  /**
   * Remove coupon from cart
   * @param {string} userId
   * @param {string} cartId
   * @returns {Promise<Object>} Updated cart
   */
  async removeCouponFromCart(userId, cartId) {
    const CartModel = require("../model/cartList");
    
    const cart = await CartModel.findOne({ _id: cartId, userId });

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    cart.appliedCoupon = undefined;
    if (cart.billSummary) {
      cart.billSummary.discountAmount = 0;
      cart.recalculateBill();
    }

    await cart.save();

    return cart;
  }

  /**
   * Mark coupon as used
   * @param {string} code
   * @param {string} userId
   * @param {string} orderId
   * @returns {Promise<void>}
   */
  async markCouponUsed(code, userId, orderId) {
    const CouponModel = this.getCouponModel();
    
    await CouponModel.findOneAndUpdate(
      { code: code.toUpperCase() },
      {
        $inc: { usageCount: 1 },
        $push: {
          usedBy: {
            userId,
            orderId,
            usedAt: new Date()
          }
        }
      }
    );
  }

  /**
   * Get available coupons for user
   * @param {string} userId
   * @returns {Promise<Array>} Available coupons
   */
  async getAvailableCoupons(userId) {
    const CouponModel = this.getCouponModel();
    
    const coupons = await CouponModel.find({
      isActive: true,
      validFrom: { $lte: new Date() },
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: { $gte: new Date() } }
      ]
    })
      .select('code description discountType discountValue minOrderValue maxDiscountAmount validUntil')
      .lean();

    return coupons;
  }
}

module.exports = new CouponService();

