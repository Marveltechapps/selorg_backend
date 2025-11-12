const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController");
const orderTrackingController = require("../controller/orderTrackingController");
const authenticateToken = require("../auths/authenticationToken"); // ✅ Import token middleware

// ✅ Secure all routes using authenticateToken
router.post("/create", authenticateToken, orderController.createOrder);

router.get("/list", authenticateToken, orderController.getOrders);

router.get("/:id", authenticateToken, orderController.getOrderById);

router.get("/by-user/:id", authenticateToken, orderController.getOrderByUserId);

router.patch(
  "/:id/status",
  authenticateToken,
  orderController.updateOrderStatus
);

router.delete("/:id", authenticateToken, orderController.deleteOrder);

router.post("/reorder/:orderId", authenticateToken, orderController.reorder);

router.get("/:id/track", authenticateToken, orderController.trackOrder);

// Real-time tracking endpoints
router.get("/:id/tracking", authenticateToken, orderTrackingController.getOrderTracking);

// Update delivery partner location (for delivery partner app or webhooks)
router.post("/:id/tracking/location", orderTrackingController.updateDeliveryPartnerLocation);

// Assign delivery partner (admin/system)
router.post("/:id/assign-partner", orderTrackingController.assignDeliveryPartner);

// Start/stop live tracking
router.post("/:id/tracking/start", orderTrackingController.startLiveTracking);
router.post("/:id/tracking/stop", orderTrackingController.stopLiveTracking);

// Get all trackable orders (for admin/delivery dashboard)
router.get("/tracking/active", orderTrackingController.getTrackableOrders);

module.exports = router;
