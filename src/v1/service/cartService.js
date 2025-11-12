const mongoose = require("mongoose");
const CartModel = require("../model/cartList");
const ProductStyle = require("../model/productStyle");
const UserModel = require("../model/userModel");
const { ApiError } = require("../utils/apiError");

/**
 * CartService - Handles cart operations and calculations
 */
class CartService {
  /**
   * Resolve user ID from token or mobile number
   * @param {Object} user - User from token
   * @param {string} mobileNumber - Optional mobile number
   * @returns {Promise<string>} User ID
   */
  async resolveUserId(user, mobileNumber) {
    let userId = user?.userId;
    
    if (!userId && mobileNumber) {
      const userDoc = await UserModel.findOne({ mobileNumber })
        .select("_id")
        .lean();
      if (!userDoc) {
        throw new ApiError(404, "User not found");
      }
      userId = userDoc._id;
    }

    if (!userId) {
      throw new ApiError(400, "User not resolved. Provide auth token or mobileNumber");
    }

    return userId;
  }

  /**
   * Get user's cart
   * @param {string} userId
   * @param {boolean} populate - Whether to populate product details
   * @returns {Promise<Object>} Cart object
   */
  async getCart(userId, populate = true) {
    let query = CartModel.findOne({ userId });
    
    if (populate) {
      query = query.populate("items.productId");
    }

    const cart = await query;
    
    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    return cart;
  }

  /**
   * Add item to cart
   * @param {Object} user - Authenticated user
   * @param {Object} itemData - Item to add
   * @param {string} mobileNumber - Optional mobile number
   * @returns {Promise<Object>} Updated cart
   */
  async addToCart(user, itemData, mobileNumber = null) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        productId,
        variantId,
        quantity,
        variantLabel,
        imageURL,
        price,
        discountPrice,
        deliveryInstructions,
        addNotes,
        deliveryTip
      } = itemData;

      // Resolve user ID
      const userId = await this.resolveUserId(user, mobileNumber);

      if (!productId || !quantity) {
        throw new ApiError(400, "productId and quantity are required");
      }

      // If variantId is provided, fetch variant details
      let variantDetails = {
        variantId: variantId || null,
        variantLabel: variantLabel || "",
        imageURL: imageURL || "",
        price: price || 0,
        discountPrice: discountPrice || null
      };

      if (variantId) {
        // Fetch product to get variant details
        const ProductStyle = require("../model/productStyle");
        const product = await ProductStyle.findById(productId).lean().session(session);
        
        if (!product) {
          throw new ApiError(404, "Product not found");
        }

        const variant = product.variants?.find(v => v._id.toString() === variantId);
        
        if (!variant) {
          throw new ApiError(404, "Variant not found");
        }

        // Check stock availability
        if (variant.stockQuantity < quantity) {
          throw new ApiError(400, `Insufficient stock. Only ${variant.stockQuantity} items available`);
        }

        // Use variant details
        variantDetails = {
          variantId: variant._id,
          variantLabel: variant.label,
          imageURL: variant.imageURL || product.imageURL || imageURL,
          price: variant.price,
          discountPrice: variant.discountPrice || variant.price
        };
      } else if (!variantLabel) {
        throw new ApiError(400, "Either variantId or variantLabel is required");
      }

      // Find or create cart
      let cart = await CartModel.findOne({ userId }).session(session);
      if (!cart) {
        cart = new CartModel({ userId, items: [] });
      }

      // Find existing item (check by variantId if available, otherwise by variantLabel)
      const idx = cart.items.findIndex(
        (it) => {
          if (variantDetails.variantId) {
            return String(it.productId) === String(productId) && 
                   String(it.variantId) === String(variantDetails.variantId);
          }
          return String(it.productId) === String(productId) && 
                 it.variantLabel === variantDetails.variantLabel;
        }
      );

      if (idx >= 0) {
        // Update existing item
        cart.items[idx].quantity += Number(quantity);
        if (variantDetails.imageURL) cart.items[idx].imageURL = variantDetails.imageURL;
        if (variantDetails.price) cart.items[idx].price = variantDetails.price;
        if (variantDetails.discountPrice != null) cart.items[idx].discountPrice = variantDetails.discountPrice;
        if (variantDetails.variantId) cart.items[idx].variantId = variantDetails.variantId;
      } else {
        // Add new item
        cart.items.push({
          productId,
          variantId: variantDetails.variantId,
          quantity: Number(quantity),
          variantLabel: variantDetails.variantLabel,
          imageURL: variantDetails.imageURL,
          price: variantDetails.price,
          discountPrice: variantDetails.discountPrice
        });
      }

      // Update cart metadata
      if (deliveryInstructions) cart.deliveryInstructions = deliveryInstructions;
      if (addNotes) cart.addNotes = addNotes;
      if (deliveryTip != null) cart.billSummary.deliveryTip = deliveryTip;

      // Recalculate bill
      cart.recalculateBill();
      await cart.save({ session });

      await session.commitTransaction();
      return cart;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Remove item from cart (decrease quantity)
   * @param {string} userId
   * @param {string} productId
   * @param {string} variantLabel
   * @returns {Promise<Object>} Updated cart
   */
  async removeFromCart(userId, productId, variantLabel) {
    const cart = await CartModel.findOne({ userId });
    
    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        (!variantLabel || item.variantLabel === variantLabel)
    );

    if (itemIndex === -1) {
      throw new ApiError(404, "Item not found in cart");
    }

    // Decrease quantity or remove item
    cart.items[itemIndex].quantity -= 1;
    if (cart.items[itemIndex].quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    }

    // Reset delivery tip if cart is empty
    if (cart.items.length === 0) {
      cart.billSummary.deliveryTip = 0;
    }

    // Recalculate bill
    cart.recalculateBill();
    await cart.save();

    return cart;
  }

  /**
   * Update cart item quantity
   * @param {string} userId
   * @param {string} productId
   * @param {number} quantity
   * @param {string} variantLabel
   * @returns {Promise<Object>} Updated cart
   */
  async updateCartItem(userId, productId, quantity, variantLabel = null) {
    const cart = await CartModel.findOne({ userId });
    
    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    const item = cart.items.find(
      (item) =>
        item.productId.toString() === productId &&
        (!variantLabel || item.variantLabel === variantLabel)
    );

    if (!item) {
      throw new ApiError(404, "Product not found in cart");
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items = cart.items.filter(
        (item) =>
          !(item.productId.toString() === productId &&
            (!variantLabel || item.variantLabel === variantLabel))
      );
    } else {
      item.quantity = quantity;
    }

    // Recalculate bill
    cart.recalculateBill();
    await cart.save();

    return cart;
  }

  /**
   * Update delivery tip
   * @param {string} userId
   * @param {number} deliveryTip
   * @returns {Promise<Object>} Updated cart
   */
  async updateDeliveryTip(userId, deliveryTip) {
    const cart = await CartModel.findOne({ userId });
    
    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    cart.billSummary.deliveryTip = deliveryTip || 0;
    cart.recalculateBill();
    await cart.save();

    return cart;
  }

  /**
   * Clear cart
   * @param {string} userId
   * @returns {Promise<Object>} Empty cart
   */
  async clearCart(userId) {
    const cart = await CartModel.findOne({ userId });
    
    if (!cart) {
      return { message: "Cart is already empty" };
    }

    cart.items = [];
    cart.billSummary = {
      itemTotal: 0,
      GST: 0,
      subtotalWithGST: 0,
      deliveryFee: 50,
      deliveryTip: 0,
      handlingCharges: 10,
      discountAmount: 0,
      totalBill: 0
    };

    await cart.save();
    return cart;
  }

  /**
   * Validate cart before checkout
   * @param {string} userId
   * @returns {Promise<Object>} Validation result
   */
  async validateCart(userId) {
    const cart = await CartModel.findOne({ userId }).populate("items.productId");
    
    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }

    const issues = [];

    for (const item of cart.items) {
      if (!item.productId) {
        issues.push({
          productId: item.productId,
          issue: "Product no longer available"
        });
        continue;
      }

      // Check stock if inventory field exists
      if (item.productId.stock !== undefined && item.productId.stock < item.quantity) {
        issues.push({
          productId: item.productId._id,
          productName: item.productId.title,
          issue: `Only ${item.productId.stock} items available, but ${item.quantity} requested`
        });
      }

      // Check price changes
      const currentPrice = item.productId.discountPrice || item.productId.price;
      if (item.discountPrice && Math.abs(currentPrice - item.discountPrice) > 0.01) {
        issues.push({
          productId: item.productId._id,
          productName: item.productId.title,
          issue: `Price changed from ${item.discountPrice} to ${currentPrice}`
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      cart
    };
  }

  /**
   * Get cart summary
   * @param {string} userId
   * @returns {Promise<Object>} Cart summary
   */
  async getCartSummary(userId) {
    const cart = await CartModel.findOne({ userId });
    
    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    return {
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      uniqueItems: cart.items.length,
      billSummary: cart.billSummary
    };
  }

  /**
   * Move item to save for later
   * @param {string} userId
   * @param {string} productId
   * @param {string} variantLabel
   * @returns {Promise<Object>} Updated cart
   */
  async moveToSaveForLater(userId, productId, variantLabel) {
    const cart = await CartModel.findOne({ userId });
    
    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && 
              (!variantLabel || item.variantLabel === variantLabel)
    );

    if (itemIndex === -1) {
      throw new ApiError(404, "Item not found in cart");
    }

    // Move item to saved for later
    const item = cart.items[itemIndex];
    item.savedForLater = true;
    
    if (!cart.savedForLaterItems) {
      cart.savedForLaterItems = [];
    }
    cart.savedForLaterItems.push(item);
    cart.items.splice(itemIndex, 1);

    // Recalculate bill
    cart.recalculateBill();
    await cart.save();

    return cart;
  }

  /**
   * Move item back to cart from save for later
   * @param {string} userId
   * @param {string} productId
   * @param {string} variantLabel
   * @returns {Promise<Object>} Updated cart
   */
  async moveToCart(userId, productId, variantLabel) {
    const cart = await CartModel.findOne({ userId });
    
    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    const itemIndex = cart.savedForLaterItems?.findIndex(
      item => item.productId.toString() === productId && 
              (!variantLabel || item.variantLabel === variantLabel)
    ) ?? -1;

    if (itemIndex === -1) {
      throw new ApiError(404, "Item not found in saved for later");
    }

    // Move item back to cart
    const item = cart.savedForLaterItems[itemIndex];
    item.savedForLater = false;
    cart.items.push(item);
    cart.savedForLaterItems.splice(itemIndex, 1);

    // Recalculate bill
    cart.recalculateBill();
    await cart.save();

    return cart;
  }

  /**
   * Check if cart is expired
   * @param {Object} cart
   * @returns {boolean}
   */
  isCartExpired(cart) {
    return cart.expiresAt && new Date() > cart.expiresAt;
  }

  /**
   * Extend cart expiry
   * @param {string} userId
   * @returns {Promise<Object>} Updated cart
   */
  async extendCartExpiry(userId) {
    const cart = await CartModel.findOne({ userId });
    
    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    cart.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Extend by 7 days
    cart.lastActivityAt = new Date();
    await cart.save();

    return cart;
  }

  /**
   * Clean up expired carts (should be run by cron job)
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupExpiredCarts() {
    const result = await CartModel.deleteMany({
      expiresAt: { $lt: new Date() },
      'items.0': { $exists: false } // Only delete empty carts
    });

    return {
      deletedCount: result.deletedCount,
      message: `Cleaned up ${result.deletedCount} expired carts`
    };
  }

  /**
   * Update delivery instructions
   * @param {string} userId
   * @param {Object} instructions
   * @returns {Promise<Object>} Updated cart
   */
  async updateDeliveryInstructions(userId, instructions) {
    const cart = await CartModel.findOne({ userId });
    
    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    // Update delivery instructions
    cart.deliveryInstructions = {
      ...cart.deliveryInstructions?.toObject() || {},
      ...instructions
    };

    cart.lastActivityAt = new Date();
    await cart.save();

    return cart;
  }

  /**
   * Update delivery tip
   * @param {string} userId
   * @param {number} tipAmount
   * @returns {Promise<Object>} Updated cart
   */
  async updateDeliveryTip(userId, tipAmount) {
    const cart = await CartModel.findOne({ userId });
    
    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    if (tipAmount < 0) {
      throw new ApiError(400, "Tip amount cannot be negative");
    }

    // Update tip in bill summary
    cart.billSummary.deliveryTip = tipAmount;
    cart.lastActivityAt = new Date();

    // Recalculate total bill
    cart.recalculateBill();
    await cart.save();

    return cart;
  }
}

module.exports = new CartService();

