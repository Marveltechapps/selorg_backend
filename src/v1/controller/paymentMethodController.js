const paymentMethodService = require("../service/paymentMethodService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Get all payment methods for authenticated user
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentMethods = await paymentMethodService.getPaymentMethods(userId);

    return success(res, {
      message: "Payment methods retrieved successfully",
      data: paymentMethods
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve payment methods"
    });
  }
};

/**
 * Get default payment method
 */
exports.getDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentMethod = await paymentMethodService.getDefaultPaymentMethod(userId);

    if (!paymentMethod) {
      return success(res, {
        message: "No default payment method set",
        data: null
      });
    }

    return success(res, {
      message: "Default payment method retrieved successfully",
      data: paymentMethod
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve default payment method"
    });
  }
};

/**
 * Add new payment method
 * 
 * SECURITY NOTE: This endpoint expects a card token from the payment gateway,
 * not raw card details. Frontend must tokenize the card using gateway SDK.
 */
exports.addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentData = {
      ...req.body,
      userId
    };

    const paymentMethod = await paymentMethodService.addPaymentMethod(userId, paymentData);

    return success(res, {
      statusCode: 201,
      message: "Payment method added successfully",
      data: paymentMethod
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to add payment method"
    });
  }
};

/**
 * Delete payment method
 */
exports.deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await paymentMethodService.deletePaymentMethod(userId, id);

    return success(res, {
      message: result.message,
      data: {
        deletedId: id,
        newDefault: result.newDefault
      }
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to delete payment method"
    });
  }
};

/**
 * Set payment method as default
 */
exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const paymentMethod = await paymentMethodService.setDefaultPaymentMethod(userId, id);

    return success(res, {
      message: "Default payment method updated successfully",
      data: paymentMethod
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to set default payment method"
    });
  }
};

/**
 * Get payment method by ID
 */
exports.getPaymentMethodById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const paymentMethod = await paymentMethodService.getPaymentMethodById(userId, id);

    return success(res, {
      message: "Payment method retrieved successfully",
      data: paymentMethod
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve payment method"
    });
  }
};

/**
 * Validate payment method
 */
exports.validatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await paymentMethodService.validatePaymentMethod(id);

    return success(res, {
      message: "Payment method is valid",
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Payment method validation failed"
    });
  }
};

module.exports = exports;



