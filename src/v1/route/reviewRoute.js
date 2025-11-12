const express = require("express");
const router = express.Router();
const reviewController = require("../controller/reviewController");
const authenticateToken = require("../auths/authenticationToken");
const { validate } = require("../middleware/validate");
const {
  createReviewSchema,
  updateReviewSchema,
  getReviewsQuerySchema
} = require("../validations/reviewValidation");

// Get product reviews (public)
router.get("/product/:productId", validate(getReviewsQuerySchema, 'query'), reviewController.getProductReviews);

// Get review by ID (public)
router.get("/:id", reviewController.getReviewById);

// All routes below require authentication
router.use(authenticateToken);

// Create review
router.post("/", validate(createReviewSchema), reviewController.createReview);

// Get user's reviews
router.get("/user/me", reviewController.getUserReviews);

// Update review
router.put("/:id", validate(updateReviewSchema), reviewController.updateReview);

// Delete review
router.delete("/:id", reviewController.deleteReview);

// Mark review as helpful
router.post("/:id/helpful", reviewController.markAsHelpful);

module.exports = router;

