const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");
const authenticateToken = require("../auths/authenticationToken");
const { validate } = require("../middleware/validate");
const {
  addToCartSchema,
  removeFromCartSchema,
  updateCartItemSchema,
  updateDeliveryTipSchema,
  clearCartQuerySchema
} = require("../validations/cartValidation");

router.post("/add", authenticateToken, validate(addToCartSchema), cartController.addToCart);

router.post(
  "/update-delivery-tip",
  authenticateToken,
  validate(updateDeliveryTipSchema),
  cartController.updateDeliveryTip
);

router.post("/decrease", authenticateToken, validate(removeFromCartSchema), cartController.removeFromCart);

router.post("/update", authenticateToken, validate(updateCartItemSchema), cartController.updateCart);

router.get("/:userId", authenticateToken, cartController.getCart);

router.post("/clear-cart", authenticateToken, validate(clearCartQuerySchema, 'query'), cartController.clearCart);

// Save for later
router.post("/save-for-later", authenticateToken, cartController.moveToSaveForLater);
router.post("/move-to-cart", authenticateToken, cartController.moveToCartFromSaved);

// Validate cart before checkout
router.post("/validate", authenticateToken, cartController.validateCartBeforeCheckout);

// Update delivery instructions
router.put("/delivery-instructions", authenticateToken, cartController.updateDeliveryInstructions);

// Update delivery tip (already exists above but keeping this for consistency)
router.put("/delivery-tip", authenticateToken, cartController.updateDeliveryTip);

module.exports = router;
