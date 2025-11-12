const express = require("express");
const router = express.Router();
const invoiceController = require("../controller/invoiceController");
const authenticateToken = require("../auths/authenticationToken");

// All invoice routes require authentication
router.use(authenticateToken);

// Get user's invoices
router.get("/", invoiceController.getUserInvoices);

// Get invoice by order ID
router.get("/order/:orderId", invoiceController.getInvoiceByOrderId);

// Download invoice PDF
router.get("/:id/download", invoiceController.downloadInvoice);

// Generate invoice for order
router.post("/generate/:orderId", invoiceController.generateInvoice);

module.exports = router;

