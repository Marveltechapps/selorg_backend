const express = require("express");
const router = express.Router();
const couponController = require("../controller/couponController");
const authenticateToken = require("../auths/authenticationToken");
const { validate } = require("../middleware/validate");
const {
  applyCouponSchema,
  removeCouponSchema
} = require("../validations/couponValidation");

// All coupon routes require authentication
router.use(authenticateToken);

// Validate coupon
router.post("/validate", validate(applyCouponSchema), couponController.validateCoupon);

// Apply coupon to cart
router.post("/apply", validate(applyCouponSchema), couponController.applyCoupon);

// Remove coupon from cart
router.delete("/remove", validate(removeCouponSchema), couponController.removeCoupon);

// Get available coupons
router.get("/available", couponController.getAvailableCoupons);

module.exports = router;

