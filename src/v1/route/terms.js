// routes/termsRouter.js
const express = require("express");
const router = express.Router();
const termsController = require("../controller/termsController");

// Create a new Terms document
router.post("/create", termsController.createTerms);

// Get all Terms documents
router.get("/list", termsController.getAllTerms);

// Get a single Terms document by ID
router.get("/:id", termsController.getTermsById);

// Update a Terms document by ID
router.put("/:id", termsController.updateTerms);

// Delete a Terms document by ID
router.delete("/:id", termsController.deleteTerms);

module.exports = router;
