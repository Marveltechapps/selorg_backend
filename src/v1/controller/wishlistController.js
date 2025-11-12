const wishlistService = require("../service/wishlistService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Get user's wishlist
 */
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await wishlistService.getWishlist(req.user.userId);

    return success(res, {
      message: "Wishlist retrieved successfully",
      data: wishlist
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve wishlist"
    });
  }
};

/**
 * Add product to wishlist
 */
exports.addToWishlist = async (req, res) => {
  try {
    const { productId, variantLabel } = req.body;

    if (!productId) {
      return failure(res, {
        statusCode: 400,
        message: "Product ID is required"
      });
    }

    const wishlist = await wishlistService.addToWishlist(
      req.user.userId,
      productId,
      { variantLabel }
    );

    return success(res, {
      statusCode: 201,
      message: "Product added to wishlist successfully",
      data: wishlist
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to add product to wishlist"
    });
  }
};

/**
 * Remove product from wishlist
 */
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return failure(res, {
        statusCode: 400,
        message: "Product ID is required"
      });
    }

    const wishlist = await wishlistService.removeFromWishlist(
      req.user.userId,
      productId
    );

    return success(res, {
      message: "Product removed from wishlist successfully",
      data: wishlist
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to remove product from wishlist"
    });
  }
};

/**
 * Move item from wishlist to cart
 */
exports.moveToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return failure(res, {
        statusCode: 400,
        message: "Product ID is required"
      });
    }

    const result = await wishlistService.moveToCart(
      req.user.userId,
      productId
    );

    return success(res, {
      message: result.message
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to move product to cart"
    });
  }
};

/**
 * Clear wishlist
 */
exports.clearWishlist = async (req, res) => {
  try {
    const result = await wishlistService.clearWishlist(req.user.userId);

    return success(res, {
      message: result.message
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to clear wishlist"
    });
  }
};

/**
 * Check if product is in wishlist
 */
exports.isInWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return failure(res, {
        statusCode: 400,
        message: "Product ID is required"
      });
    }

    const inWishlist = await wishlistService.isInWishlist(
      req.user.userId,
      productId
    );

    return success(res, {
      message: "Check completed",
      data: { inWishlist }
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to check wishlist"
    });
  }
};

module.exports = exports;

