const express = require("express");
const router = express.Router();
const orderController = require("../controller/orderController");
const authenticateToken = require("../auths/authenticationToken"); // ✅ Import token middleware

// ✅ Secure all routes using authenticateToken
router.post("/", authenticateToken, orderController.createOrder);
router.post("/create", authenticateToken, orderController.createOrder);

router.get("/list", authenticateToken, orderController.getOrders);
router.get("/mine", authenticateToken, orderController.getOrderByUserId);

router.post(
  "/:orderId/reorder",
  authenticateToken,
  orderController.reorder
);

router.patch(
  "/:id/status",
  authenticateToken,
  orderController.updateOrderStatus
);

router.delete("/:id", authenticateToken, orderController.deleteOrder);
router.get("/:id", authenticateToken, orderController.getOrderById);

module.exports = router;
