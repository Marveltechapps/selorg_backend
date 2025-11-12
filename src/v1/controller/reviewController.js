const reviewService = require("../service/reviewService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Create a product review
 */
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment, images } = req.body;

    if (!productId || !rating || !comment) {
      return failure(res, {
        statusCode: 400,
        message: "Product ID, rating, and comment are required"
      });
    }

    const review = await reviewService.createReview(
      req.user.userId,
      productId,
      { rating, comment, images }
    );

    return success(res, {
      statusCode: 201,
      message: "Review created successfully",
      data: review
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to create review"
    });
  }
};

/**
 * Get product reviews
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const options = {
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      minRating: req.query.minRating,
      verifiedOnly: req.query.verifiedOnly === 'true'
    };

    const result = await reviewService.getProductReviews(productId, options);

    return success(res, {
      message: "Reviews retrieved successfully",
      data: result.reviews,
      meta: {
        pagination: result.pagination,
        ratingStats: result.ratingStats
      }
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve reviews"
    });
  }
};

/**
 * Get review by ID
 */
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await reviewService.getReviewById(id);

    return success(res, {
      message: "Review retrieved successfully",
      data: review
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve review"
    });
  }
};

/**
 * Update review
 */
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      rating: req.body.rating,
      comment: req.body.comment,
      images: req.body.images
    };

    const review = await reviewService.updateReview(
      id,
      req.user.userId,
      updateData
    );

    return success(res, {
      message: "Review updated successfully",
      data: review
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to update review"
    });
  }
};

/**
 * Delete review
 */
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await reviewService.deleteReview(id, req.user.userId);

    return success(res, {
      message: result.message
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to delete review"
    });
  }
};

/**
 * Mark review as helpful
 */
exports.markAsHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await reviewService.markAsHelpful(id, req.user.userId);

    return success(res, {
      message: "Review marked as helpful",
      data: review
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to mark review as helpful"
    });
  }
};

/**
 * Get user's reviews
 */
exports.getUserReviews = async (req, res) => {
  try {
    const options = {
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const result = await reviewService.getUserReviews(req.user.userId, options);

    return success(res, {
      message: "User reviews retrieved successfully",
      data: result.reviews,
      meta: result.pagination
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve reviews"
    });
  }
};

module.exports = exports;

