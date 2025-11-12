const express = require("express");
const router = express.Router();
const paymentMethodController = require("../controller/paymentMethodController");
const authenticateToken = require("../auths/authenticationToken");

/**
 * All payment method routes require authentication
 * Card details are never stored directly - only tokenized references
 */

// Get all payment methods
router.get("/", authenticateToken, paymentMethodController.getPaymentMethods);

// Get default payment method
router.get("/default", authenticateToken, paymentMethodController.getDefaultPaymentMethod);

// Add new payment method
// NOTE: Frontend must tokenize card using payment gateway SDK before sending
router.post("/", authenticateToken, paymentMethodController.addPaymentMethod);

// Get payment method by ID
router.get("/:id", authenticateToken, paymentMethodController.getPaymentMethodById);

// Set payment method as default
router.put("/:id/set-default", authenticateToken, paymentMethodController.setDefaultPaymentMethod);

// Delete payment method
router.delete("/:id", authenticateToken, paymentMethodController.deletePaymentMethod);

// Validate payment method
router.get("/:id/validate", authenticateToken, paymentMethodController.validatePaymentMethod);

module.exports = router;



