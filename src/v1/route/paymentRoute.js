const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentDataController");
const authenticateToken = require("../auths/authenticationToken");

router.post("/create", authenticateToken, paymentController.createPayment);

router.get("/list", authenticateToken, paymentController.getAllPayments);

router.get("/:id", authenticateToken, paymentController.getPaymentById);

router.put("/:id", authenticateToken, paymentController.updatePayment);

router.delete("/:id", authenticateToken, paymentController.deletePayment);

module.exports = router;
