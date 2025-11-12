const cartService = require("../service/cartService");
const { success, failure } = require("../utils/apiResponse");

exports.addToCart = async (req, res) => {
  try {
    const mobileNumber = req.body.mobileNumber || req.query.mobileNumber;
    const cart = await cartService.addToCart(req.user, req.body, mobileNumber);

    return success(res, {
      message: "Item added to cart successfully",
      data: cart
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to add item to cart"
    });
  }
};

exports.updateDeliveryTip = async (req, res) => {
  try {
    const { deliveryTip } = req.body;
    const cart = await cartService.updateDeliveryTip(
      req.user.userId,
      deliveryTip
    );

    return success(res, {
      message: "Delivery tip updated successfully",
      data: cart
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to update delivery tip"
    });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { userId, productId, variantLabel } = req.body;

    if (!userId || !productId) {
      return failure(res, {
        statusCode: 400,
        message: "userId and productId are required"
      });
    }

    const cart = await cartService.removeFromCart(
      userId,
      productId,
      variantLabel
    );

    return success(res, {
      message: "Item removed from cart successfully",
      data: cart
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to remove item from cart"
    });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { productId, quantity, variantLabel } = req.body;

    if (!productId || quantity === undefined) {
      return failure(res, {
        statusCode: 400,
        message: "productId and quantity are required"
      });
    }

    const cart = await cartService.updateCartItem(
      req.user.userId,
      productId,
      quantity,
      variantLabel
    );

    return success(res, {
      message: "Cart updated successfully",
      data: cart
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to update cart"
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const cart = await cartService.getCart(req.user.userId, true);

    return success(res, {
      message: "Cart retrieved successfully",
      data: cart
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to get cart"
    });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const { mobileNumber } = req.query;

    if (!mobileNumber) {
      return failure(res, {
        statusCode: 400,
        message: "mobileNumber is required in query params"
      });
    }

    const userService = require("../service/userService");
    
    // Get user by mobile number
    const user = await userService.getUserByMobile(mobileNumber);
    
    // Clear cart
    const result = await cartService.clearCart(user.id || user._id);

    return success(res, {
      message: "Cart cleared successfully",
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to clear cart"
    });
  }
};

exports.moveToSaveForLater = async (req, res) => {
  try {
    const { productId, variantLabel } = req.body;
    
    if (!productId) {
      return failure(res, {
        statusCode: 400,
        message: "Product ID is required"
      });
    }

    const cart = await cartService.moveToSaveForLater(
      req.user.userId,
      productId,
      variantLabel
    );

    return success(res, {
      message: "Item moved to save for later",
      data: cart
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to move item"
    });
  }
};

exports.moveToCartFromSaved = async (req, res) => {
  try {
    const { productId, variantLabel } = req.body;
    
    if (!productId) {
      return failure(res, {
        statusCode: 400,
        message: "Product ID is required"
      });
    }

    const cart = await cartService.moveToCart(
      req.user.userId,
      productId,
      variantLabel
    );

    return success(res, {
      message: "Item moved to cart",
      data: cart
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to move item"
    });
  }
};

exports.validateCartBeforeCheckout = async (req, res) => {
  try {
    const validation = await cartService.validateCart(req.user.userId);

    if (!validation.valid) {
      return failure(res, {
        statusCode: 400,
        message: "Cart validation failed",
        errors: validation.issues
      });
    }

    return success(res, {
      message: "Cart is valid for checkout",
      data: validation.cart
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to validate cart"
    });
  }
};

/**
 * Update delivery instructions
 */
exports.updateDeliveryInstructions = async (req, res) => {
  try {
    const cart = await cartService.updateDeliveryInstructions(req.user.userId, req.body);

    return success(res, {
      message: "Delivery instructions updated successfully",
      data: cart
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to update delivery instructions"
    });
  }
};

/**
 * Update delivery tip
 */
exports.updateDeliveryTip = async (req, res) => {
  try {
    const { tipAmount } = req.body;

    if (tipAmount === undefined || typeof tipAmount !== "number") {
      return failure(res, {
        statusCode: 400,
        message: "Tip amount is required and must be a number"
      });
    }

    const cart = await cartService.updateDeliveryTip(req.user.userId, tipAmount);

    return success(res, {
      message: "Delivery tip updated successfully",
      data: cart
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to update delivery tip"
    });
  }
};
