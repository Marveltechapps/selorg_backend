const express = require("express");
const router = express.Router();
const returnController = require("../controller/returnController");
const authenticateToken = require("../auths/authenticationToken");

// All return routes require authentication
router.use(authenticateToken);

// Create return request
router.post("/", returnController.createReturn);

// Get user's returns
router.get("/", returnController.getUserReturns);

// Get return by ID
router.get("/:id", returnController.getReturnById);

// Get return status by order ID
router.get("/order/:orderId", returnController.getReturnByOrderId);

// Cancel return request
router.post("/:id/cancel", returnController.cancelReturn);

module.exports = router;

