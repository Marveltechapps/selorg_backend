const { z } = require("zod");

/**
 * Validation schema for creating a review
 */
const createReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
  comment: z.string().min(1, "Comment is required").max(1000, "Comment must be less than 1000 characters"),
  images: z.array(z.string().url("Invalid image URL")).max(5, "Maximum 5 images allowed").optional()
});

/**
 * Validation schema for updating a review
 */
const updateReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5").optional(),
  comment: z.string().min(1, "Comment is required").max(1000, "Comment must be less than 1000 characters").optional(),
  images: z.array(z.string().url("Invalid image URL")).max(5, "Maximum 5 images allowed").optional()
});

/**
 * Validation schema for getting reviews query parameters
 */
const getReviewsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, "Page must be a number").optional(),
  limit: z.string().regex(/^\d+$/, "Limit must be a number").optional(),
  sortBy: z.enum(["createdAt", "rating", "helpful"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  minRating: z.string().regex(/^[1-5]$/, "Rating must be between 1 and 5").optional(),
  verifiedOnly: z.enum(["true", "false"]).optional()
});

module.exports = {
  createReviewSchema,
  updateReviewSchema,
  getReviewsQuerySchema
};

