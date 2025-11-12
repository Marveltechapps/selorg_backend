const PaymentMethod = require("../model/paymentMethodModel");
const { ApiError } = require("../utils/apiError");

/**
 * Payment Method Service
 * Handles saved payment methods (cards) management
 * 
 * Security: This service only stores tokenized card references from payment gateways.
 * Never stores raw card numbers, CVV, or full card data.
 */
class PaymentMethodService {
  /**
   * Get all payment methods for a user
   * @param {string} userId
   * @returns {Promise<Array>} Payment methods
   */
  async getPaymentMethods(userId) {
    const paymentMethods = await PaymentMethod.find({ 
      userId, 
      isActive: true 
    })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    // Enhance with virtual fields
    return paymentMethods.map(pm => ({
      ...pm,
      maskedCardNumber: `${pm.cardType} XXXX ${pm.lastFourDigits}`,
      expiryDisplay: `${String(pm.expiryMonth).padStart(2, '0')}/${String(pm.expiryYear).slice(-2)}`,
      isExpired: new Date(pm.expiryYear, pm.expiryMonth - 1) < new Date()
    }));
  }

  /**
   * Get default payment method
   * @param {string} userId
   * @returns {Promise<Object|null>} Default payment method
   */
  async getDefaultPaymentMethod(userId) {
    const paymentMethod = await PaymentMethod.findOne({ 
      userId, 
      isDefault: true,
      isActive: true 
    }).lean();

    if (!paymentMethod) {
      return null;
    }

    return {
      ...paymentMethod,
      maskedCardNumber: `${paymentMethod.cardType} XXXX ${paymentMethod.lastFourDigits}`,
      expiryDisplay: `${String(paymentMethod.expiryMonth).padStart(2, '0')}/${String(paymentMethod.expiryYear).slice(-2)}`
    };
  }

  /**
   * Add new payment method
   * @param {string} userId
   * @param {Object} paymentData
   * @returns {Promise<Object>} Created payment method
   */
  async addPaymentMethod(userId, paymentData) {
    const {
      cardToken,
      gateway = "razorpay",
      cardType,
      lastFourDigits,
      expiryMonth,
      expiryYear,
      cardholderName,
      issuer,
      network,
      isDefault = false,
      gatewayMetadata = {}
    } = paymentData;

    // Validate required fields
    if (!cardToken || !cardType || !lastFourDigits || !expiryMonth || !expiryYear) {
      throw new ApiError(400, "Missing required card details");
    }

    // Check if this token already exists for the user
    const existing = await PaymentMethod.findOne({ userId, cardToken });
    if (existing) {
      throw new ApiError(409, "This payment method is already saved");
    }

    // Check expiry
    const expiry = new Date(expiryYear, expiryMonth - 1);
    if (expiry < new Date()) {
      throw new ApiError(400, "Card has expired");
    }

    // If this is the first payment method, make it default
    const count = await PaymentMethod.countDocuments({ userId, isActive: true });
    const shouldBeDefault = count === 0 || isDefault;

    // Create payment method
    const paymentMethod = new PaymentMethod({
      userId,
      cardToken,
      gateway,
      cardType,
      lastFourDigits,
      expiryMonth,
      expiryYear,
      cardholderName,
      issuer,
      network,
      isDefault: shouldBeDefault,
      gatewayMetadata
    });

    await paymentMethod.save();

    return paymentMethod.toJSON();
  }

  /**
   * Delete payment method
   * @param {string} userId
   * @param {string} paymentMethodId
   * @returns {Promise<Object>} Result
   */
  async deletePaymentMethod(userId, paymentMethodId) {
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      userId
    });

    if (!paymentMethod) {
      throw new ApiError(404, "Payment method not found");
    }

    const wasDefault = paymentMethod.isDefault;

    // Soft delete (mark as inactive)
    paymentMethod.isActive = false;
    await paymentMethod.save();

    // If deleted card was default, set another card as default
    if (wasDefault) {
      const nextCard = await PaymentMethod.findOne({
        userId,
        isActive: true,
        _id: { $ne: paymentMethodId }
      }).sort({ lastUsedAt: -1, createdAt: -1 });

      if (nextCard) {
        nextCard.isDefault = true;
        await nextCard.save();
      }
    }

    return {
      message: "Payment method deleted successfully",
      newDefault: wasDefault ? await this.getDefaultPaymentMethod(userId) : null
    };
  }

  /**
   * Set payment method as default
   * @param {string} userId
   * @param {string} paymentMethodId
   * @returns {Promise<Object>} Updated payment method
   */
  async setDefaultPaymentMethod(userId, paymentMethodId) {
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      userId,
      isActive: true
    });

    if (!paymentMethod) {
      throw new ApiError(404, "Payment method not found");
    }

    // Check if card is expired
    const expiry = new Date(paymentMethod.expiryYear, paymentMethod.expiryMonth - 1);
    if (expiry < new Date()) {
      throw new ApiError(400, "Cannot set expired card as default");
    }

    // Unset other defaults (handled by pre-save hook, but explicit for clarity)
    await PaymentMethod.updateMany(
      { userId, _id: { $ne: paymentMethodId } },
      { $set: { isDefault: false } }
    );

    // Set as default
    paymentMethod.isDefault = true;
    await paymentMethod.save();

    return paymentMethod.toJSON();
  }

  /**
   * Update last used timestamp
   * @param {string} paymentMethodId
   * @returns {Promise<void>}
   */
  async markAsUsed(paymentMethodId) {
    await PaymentMethod.findByIdAndUpdate(paymentMethodId, {
      lastUsedAt: new Date()
    });
  }

  /**
   * Get payment method by ID
   * @param {string} userId
   * @param {string} paymentMethodId
   * @returns {Promise<Object>} Payment method
   */
  async getPaymentMethodById(userId, paymentMethodId) {
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      userId,
      isActive: true
    }).lean();

    if (!paymentMethod) {
      throw new ApiError(404, "Payment method not found");
    }

    return {
      ...paymentMethod,
      maskedCardNumber: `${paymentMethod.cardType} XXXX ${paymentMethod.lastFourDigits}`,
      expiryDisplay: `${String(paymentMethod.expiryMonth).padStart(2, '0')}/${String(paymentMethod.expiryYear).slice(-2)}`
    };
  }

  /**
   * Validate payment method can be used
   * @param {string} paymentMethodId
   * @returns {Promise<Object>} Validation result
   */
  async validatePaymentMethod(paymentMethodId) {
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      isActive: true
    });

    if (!paymentMethod) {
      throw new ApiError(404, "Payment method not found");
    }

    const expiry = new Date(paymentMethod.expiryYear, paymentMethod.expiryMonth - 1);
    const isExpired = expiry < new Date();

    if (isExpired) {
      throw new ApiError(400, "Card has expired. Please add a new payment method.");
    }

    return {
      valid: true,
      paymentMethodId: paymentMethod._id,
      cardType: paymentMethod.cardType,
      lastFourDigits: paymentMethod.lastFourDigits
    };
  }

  /**
   * Clean up expired payment methods (can be run as cron job)
   * @returns {Promise<number>} Number of methods marked inactive
   */
  async cleanupExpiredCards() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const result = await PaymentMethod.updateMany(
      {
        isActive: true,
        $or: [
          { expiryYear: { $lt: currentYear } },
          { expiryYear: currentYear, expiryMonth: { $lt: currentMonth } }
        ]
      },
      { $set: { isActive: false } }
    );

    return result.modifiedCount;
  }
}

module.exports = new PaymentMethodService();



