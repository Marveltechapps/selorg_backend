const CouponModel = require("../model/couponModel");

exports.validateCoupon = async (couponCode, SKUCode, category) => {
  const coupon = await CouponModel.findOne({
    code: couponCode,
    isActive: true
  });

  if (!coupon) return { isValid: false, message: "Invalid or inactive coupon" };

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return { isValid: false, message: "Coupon has expired" };
  }

  if (
    coupon.eligibleProducts.length &&
    !coupon.eligibleProducts.includes(SKUCode)
  ) {
    return {
      isValid: false,
      message: "Coupon is not applicable to this product"
    };
  }

  if (
    coupon.excludedProducts.length &&
    coupon.excludedProducts.includes(SKUCode)
  ) {
    return {
      isValid: false,
      message: "Coupon cannot be used for this product"
    };
  }

  if (
    coupon.eligibleCategories.length &&
    !coupon.eligibleCategories.includes(category)
  ) {
    return {
      isValid: false,
      message: "Coupon is not applicable to this category"
    };
  }

  if (
    coupon.excludedCategories.length &&
    coupon.excludedCategories.includes(category)
  ) {
    return {
      isValid: false,
      message: "Coupon cannot be used for this category"
    };
  }

  return { isValid: true, discount: coupon.discount };
};
