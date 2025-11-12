const mongoose = require("mongoose");
const { ApiError } = require("../utils/apiError");

// Wishlist Model will be created later
// For now, creating service with the expected interface

/**
 * WishlistService - Handles wishlist operations
 */
class WishlistService {
  /**
   * Get wishlist model (lazy load to avoid circular dependencies)
   * @returns {Model}
   */
  getWishlistModel() {
    if (!this.WishlistModel) {
      this.WishlistModel = require("../model/wishlistModel");
    }
    return this.WishlistModel;
  }

  /**
   * Get user's wishlist
   * @param {string} userId
   * @returns {Promise<Object>} Wishlist with populated products
   */
  async getWishlist(userId) {
    const WishlistModel = this.getWishlistModel();
    
    let wishlist = await WishlistModel.findOne({ userId })
      .populate('items.productId', 'title imageURL price discountPrice stock category')
      .lean();

    if (!wishlist) {
      // Create empty wishlist if doesn't exist
      wishlist = await WishlistModel.create({
        userId,
        items: []
      });
    }

    return wishlist;
  }

  /**
   * Add product to wishlist
   * @param {string} userId
   * @param {string} productId
   * @param {Object} additionalData - Optional data like variant
   * @returns {Promise<Object>} Updated wishlist
   */
  async addToWishlist(userId, productId, additionalData = {}) {
    const WishlistModel = this.getWishlistModel();
    
    let wishlist = await WishlistModel.findOne({ userId });

    if (!wishlist) {
      wishlist = new WishlistModel({ userId, items: [] });
    }

    // Check if product already in wishlist
    const existingIndex = wishlist.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingIndex > -1) {
      throw new ApiError(400, "Product already in wishlist");
    }

    // Add product to wishlist
    wishlist.items.push({
      productId,
      ...additionalData,
      addedAt: new Date()
    });

    await wishlist.save();
    
    // Populate and return
    await wishlist.populate('items.productId', 'title imageURL price discountPrice stock category');
    return wishlist;
  }

  /**
   * Remove product from wishlist
   * @param {string} userId
   * @param {string} productId
   * @returns {Promise<Object>} Updated wishlist
   */
  async removeFromWishlist(userId, productId) {
    const WishlistModel = this.getWishlistModel();
    
    const wishlist = await WishlistModel.findOne({ userId });

    if (!wishlist) {
      throw new ApiError(404, "Wishlist not found");
    }

    const itemIndex = wishlist.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      throw new ApiError(404, "Product not found in wishlist");
    }

    wishlist.items.splice(itemIndex, 1);
    await wishlist.save();

    await wishlist.populate('items.productId', 'title imageURL price discountPrice stock category');
    return wishlist;
  }

  /**
   * Move item from wishlist to cart
   * @param {string} userId
   * @param {string} productId
   * @returns {Promise<Object>} Result
   */
  async moveToCart(userId, productId) {
    const WishlistModel = this.getWishlistModel();
    const CartService = require("./cartService");
    
    const wishlist = await WishlistModel.findOne({ userId });

    if (!wishlist) {
      throw new ApiError(404, "Wishlist not found");
    }

    const itemIndex = wishlist.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      throw new ApiError(404, "Product not found in wishlist");
    }

    const item = wishlist.items[itemIndex];

    // Add to cart
    await CartService.addToCart(
      { userId },
      {
        productId: item.productId,
        quantity: 1,
        variantLabel: item.variantLabel || "Default"
      }
    );

    // Remove from wishlist
    wishlist.items.splice(itemIndex, 1);
    await wishlist.save();

    return {
      message: "Product moved to cart successfully"
    };
  }

  /**
   * Clear wishlist
   * @param {string} userId
   * @returns {Promise<Object>} Result
   */
  async clearWishlist(userId) {
    const WishlistModel = this.getWishlistModel();
    
    const wishlist = await WishlistModel.findOne({ userId });

    if (!wishlist) {
      return { message: "Wishlist is already empty" };
    }

    wishlist.items = [];
    await wishlist.save();

    return {
      message: "Wishlist cleared successfully"
    };
  }

  /**
   * Check if product is in wishlist
   * @param {string} userId
   * @param {string} productId
   * @returns {Promise<boolean>}
   */
  async isInWishlist(userId, productId) {
    const WishlistModel = this.getWishlistModel();
    
    const wishlist = await WishlistModel.findOne({
      userId,
      'items.productId': productId
    }).lean();

    return !!wishlist;
  }
}

module.exports = new WishlistService();

