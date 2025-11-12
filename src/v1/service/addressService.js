const AddressModel = require("../model/addressModel");
const { ApiError } = require("../utils/apiError");

/**
 * AddressService - Handles address management operations
 */
class AddressService {
  /**
   * Create a new address
   * @param {string} userId
   * @param {Object} addressData
   * @returns {Promise<Object>} Created address
   */
  async createAddress(userId, addressData) {
    try {
      const address = new AddressModel({
        userId,
        ...addressData
      });

      await address.save();
      return address;
    } catch (error) {
      throw new ApiError(400, error.message);
    }
  }

  /**
   * Get all addresses for a user
   * @param {string} userId
   * @returns {Promise<Array>} User's addresses
   */
  async getUserAddresses(userId) {
    const addresses = await AddressModel.find({ userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return addresses;
  }

  /**
   * Get address by ID
   * @param {string} addressId
   * @param {string} userId - For authorization
   * @returns {Promise<Object>} Address object
   */
  async getAddressById(addressId, userId) {
    const address = await AddressModel.findOne({
      _id: addressId,
      userId: userId
    }).lean();

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    return address;
  }

  /**
   * Update address
   * @param {string} addressId
   * @param {string} userId - For authorization
   * @param {Object} updateData
   * @returns {Promise<Object>} Updated address
   */
  async updateAddress(addressId, userId, updateData) {
    const address = await AddressModel.findOne({
      _id: addressId,
      userId: userId
    });

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    // Update allowed fields
    const allowedUpdates = [
      'label', 'street', 'city', 'state', 'zipCode',
      'country', 'landmark', 'coordinates', 'instructions'
    ];

    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        address[key] = updateData[key];
      }
    });

    await address.save();
    return address;
  }

  /**
   * Delete address
   * @param {string} addressId
   * @param {string} userId - For authorization
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAddress(addressId, userId) {
    const address = await AddressModel.findOneAndDelete({
      _id: addressId,
      userId: userId
    });

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    return {
      message: "Address deleted successfully",
      addressId: address._id
    };
  }

  /**
   * Set address as default
   * @param {string} addressId
   * @param {string} userId
   * @returns {Promise<Object>} Updated address
   */
  async setDefaultAddress(addressId, userId) {
    // First, unset all default addresses for this user
    await AddressModel.updateMany(
      { userId },
      { isDefault: false }
    );

    // Set the specified address as default
    const address = await AddressModel.findOneAndUpdate(
      { _id: addressId, userId },
      { isDefault: true },
      { new: true }
    );

    if (!address) {
      throw new ApiError(404, "Address not found");
    }

    return address;
  }

  /**
   * Get default address
   * @param {string} userId
   * @returns {Promise<Object|null>} Default address or null
   */
  async getDefaultAddress(userId) {
    const address = await AddressModel.findOne({
      userId,
      isDefault: true
    }).lean();

    return address;
  }

  /**
   * Validate address coordinates
   * @param {Object} coordinates
   * @returns {boolean}
   */
  validateCoordinates(coordinates) {
    if (!coordinates || !coordinates.lat || !coordinates.lng) {
      return false;
    }

    const lat = Number(coordinates.lat);
    const lng = Number(coordinates.lng);

    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  /**
   * Check if address is in delivery area
   * @param {string} zipCode
   * @returns {Promise<Object>} Delivery availability
   */
  async checkDeliveryAvailability(zipCode) {
    // This would integrate with a delivery area database
    // For now, return basic validation
    return {
      available: true,
      zipCode,
      estimatedDeliveryTime: '2-3 days',
      deliveryFee: 50
    };
  }
}

module.exports = new AddressService();

