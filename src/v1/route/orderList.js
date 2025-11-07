const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController");
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

module.exports = router;
