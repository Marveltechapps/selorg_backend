const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");
const authenticateToken = require("../auths/authenticationToken");
router.post("/add", authenticateToken, cartController.addToCart);

router.post(
  "/update-delivery-tip",
  authenticateToken,
  cartController.updateDeliveryTip
);

router.post("/decrease", authenticateToken, cartController.removeFromCart);

router.post("/update", authenticateToken, cartController.updateCart);

router.get("/:userId", authenticateToken, cartController.getCart);

router.post("/clear-cart", authenticateToken, cartController.clearCart);

module.exports = router;

// //  Update Delivery Instructions
// router.post("/update-instructions", cartController.updateDeliveryInstructions);

// Get cart details
// router.get("/:userId", cartController.viewCart);
