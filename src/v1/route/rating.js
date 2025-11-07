const express = require("express");
const router = express.Router();
const ratingController = require("../controller/ratingController");

// Create a rating
router.post("/submit", ratingController.createRating);

// Get ratings for an order
router.get("/order/:orderId", ratingController.getRatingsByOrder);

// Get ratings for a user
router.get("/user/:userId", ratingController.getRatingsByUser);

// Update a rating
router.put("/:ratingId", ratingController.updateRating);

// Delete a rating
router.delete("/:ratingId", ratingController.deleteRating);

module.exports = router;
