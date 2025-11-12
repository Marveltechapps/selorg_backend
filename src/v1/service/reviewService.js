const { ApiError } = require("../utils/apiError");

/**
 * ReviewService - Handles product reviews and ratings
 */
class ReviewService {
  /**
   * Get rating model (lazy load)
   * @returns {Model}
   */
  getRatingModel() {
    if (!this.RatingModel) {
      this.RatingModel = require("../model/rating");
    }
    return this.RatingModel;
  }

  /**
   * Create a product review
   * @param {string} userId
   * @param {string} productId
   * @param {Object} reviewData
   * @returns {Promise<Object>} Created review
   */
  async createReview(userId, productId, reviewData) {
    const RatingModel = this.getRatingModel();
    
    // Check if user already reviewed this product
    const existingReview = await RatingModel.findOne({
      userId,
      productId
    });

    if (existingReview) {
      throw new ApiError(400, "You have already reviewed this product");
    }

    // Check if user purchased this product (verified purchase)
    const OrderModel = require("../model/orderModel");
    const hasPurchased = await OrderModel.findOne({
      userId,
      'items.productId': productId,
      status: 'delivered'
    }).lean();

    const review = await RatingModel.create({
      userId,
      productId,
      ...reviewData,
      verifiedPurchase: !!hasPurchased,
      createdAt: new Date()
    });

    // Update product average rating
    await this.updateProductAverageRating(productId);

    return review;
  }

  /**
   * Get product reviews
   * @param {string} productId
   * @param {Object} options - Filter and pagination
   * @returns {Promise<Object>} Reviews list
   */
  async getProductReviews(productId, options = {}) {
    const RatingModel = this.getRatingModel();
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minRating,
      verifiedOnly = false
    } = options;

    const query = { productId };
    
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }
    
    if (verifiedOnly) {
      query.verifiedPurchase = true;
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [reviews, total, ratingStats] = await Promise.all([
      RatingModel.find(query)
        .populate('userId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      RatingModel.countDocuments(query),
      this.getProductRatingStats(productId)
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      ratingStats
    };
  }

  /**
   * Get review by ID
   * @param {string} reviewId
   * @returns {Promise<Object>} Review object
   */
  async getReviewById(reviewId) {
    const RatingModel = this.getRatingModel();
    
    const review = await RatingModel.findById(reviewId)
      .populate('userId', 'name')
      .populate('productId', 'title imageURL')
      .lean();

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    return review;
  }

  /**
   * Update review
   * @param {string} reviewId
   * @param {string} userId - For authorization
   * @param {Object} updateData
   * @returns {Promise<Object>} Updated review
   */
  async updateReview(reviewId, userId, updateData) {
    const RatingModel = this.getRatingModel();
    
    const review = await RatingModel.findOne({
      _id: reviewId,
      userId
    });

    if (!review) {
      throw new ApiError(404, "Review not found or unauthorized");
    }

    // Allowed fields to update
    const allowedUpdates = ['rating', 'comment', 'images'];
    
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        review[key] = updateData[key];
      }
    });

    review.updatedAt = new Date();
    await review.save();

    // Update product average rating
    await this.updateProductAverageRating(review.productId);

    return review;
  }

  /**
   * Delete review
   * @param {string} reviewId
   * @param {string} userId - For authorization
   * @returns {Promise<Object>} Deletion result
   */
  async deleteReview(reviewId, userId) {
    const RatingModel = this.getRatingModel();
    
    const review = await RatingModel.findOneAndDelete({
      _id: reviewId,
      userId
    });

    if (!review) {
      throw new ApiError(404, "Review not found or unauthorized");
    }

    // Update product average rating
    await this.updateProductAverageRating(review.productId);

    return {
      message: "Review deleted successfully"
    };
  }

  /**
   * Mark review as helpful
   * @param {string} reviewId
   * @param {string} userId
   * @returns {Promise<Object>} Updated review
   */
  async markAsHelpful(reviewId, userId) {
    const RatingModel = this.getRatingModel();
    
    const review = await RatingModel.findById(reviewId);

    if (!review) {
      throw new ApiError(404, "Review not found");
    }

    // Check if user already marked as helpful
    if (review.helpfulVotes && review.helpfulVotes.includes(userId)) {
      throw new ApiError(400, "You have already marked this review as helpful");
    }

    review.helpfulCount = (review.helpfulCount || 0) + 1;
    if (!review.helpfulVotes) {
      review.helpfulVotes = [];
    }
    review.helpfulVotes.push(userId);

    await review.save();

    return review;
  }

  /**
   * Get product rating statistics
   * @param {string} productId
   * @returns {Promise<Object>} Rating statistics
   */
  async getProductRatingStats(productId) {
    const RatingModel = this.getRatingModel();
    
    const stats = await RatingModel.aggregate([
      { $match: { productId: productId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          rating5: {
            $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
          },
          rating4: {
            $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
          },
          rating3: {
            $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] }
          },
          rating2: {
            $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] }
          },
          rating1: {
            $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }
          }
        }
      }
    ]);

    if (!stats.length) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        }
      };
    }

    const result = stats[0];

    return {
      averageRating: Number(result.averageRating.toFixed(1)),
      totalReviews: result.totalReviews,
      ratingDistribution: {
        5: result.rating5,
        4: result.rating4,
        3: result.rating3,
        2: result.rating2,
        1: result.rating1
      }
    };
  }

  /**
   * Update product's average rating
   * @param {string} productId
   * @returns {Promise<void>}
   */
  async updateProductAverageRating(productId) {
    const ProductStyle = require("../model/productStyle");
    
    const stats = await this.getProductRatingStats(productId);

    await ProductStyle.findByIdAndUpdate(productId, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews
    });
  }

  /**
   * Get user's reviews
   * @param {string} userId
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} User's reviews
   */
  async getUserReviews(userId, options = {}) {
    const RatingModel = this.getRatingModel();
    const { page = 1, limit = 20 } = options;

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      RatingModel.find({ userId })
        .populate('productId', 'title imageURL price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RatingModel.countDocuments({ userId })
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new ReviewService();

