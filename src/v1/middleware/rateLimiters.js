const rateLimit = require("express-rate-limit");

/**
 * Strict rate limiter for OTP endpoints (prevent abuse)
 */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: "Too many OTP requests. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

/**
 * Auth rate limiter for login/verification
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later."
  }
});

/**
 * Payment route limiter
 */
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    message: "Too many payment requests. Please slow down."
  }
});

/**
 * Create order limiter
 */
const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    message: "Too many order requests. Please slow down."
  }
});

/**
 * Search limiter (prevent scraping)
 */
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    message: "Too many search requests. Please slow down."
  }
});

/**
 * General API limiter (less strict)
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

module.exports = {
  otpLimiter,
  authLimiter,
  paymentLimiter,
  orderLimiter,
  searchLimiter,
  apiLimiter
};

