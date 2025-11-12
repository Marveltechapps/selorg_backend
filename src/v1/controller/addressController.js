const addressService = require("../service/addressService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Create a new address
 */
exports.createAddress = async (req, res) => {
  try {
    const address = await addressService.createAddress(req.user.userId, req.body);
    
    // Set as default if requested
    if (req.body.isDefault) {
      await addressService.setDefaultAddress(address._id.toString(), req.user.userId);
    }

    return success(res, {
      statusCode: 201,
      message: "Address created successfully",
      data: address
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to create address"
    });
  }
};

/**
 * Get all addresses for the logged-in user
 */
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await addressService.getUserAddresses(req.user.userId);
    
    return success(res, {
      message: "Addresses retrieved successfully",
      data: addresses
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve addresses"
    });
  }
};

/**
 * Get a single address by ID
 */
exports.getAddressById = async (req, res) => {
  try {
    const address = await addressService.getAddressById(req.params.id, req.user.userId);
    
    return success(res, {
      message: "Address retrieved successfully",
      data: address
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve address"
    });
  }
};

/**
 * Get addresses for the logged-in user
 */
exports.getByUserId = async (req, res) => {
  try {
    const addresses = await addressService.getUserAddresses(req.user.userId);
    
    if (!addresses.length) {
      return failure(res, {
        statusCode: 404,
        message: "No addresses found for this user"
      });
    }

    return success(res, {
      message: "Addresses fetched successfully",
      data: addresses
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve addresses"
    });
  }
};

/**
 * Set an address as default
 */
exports.setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.body;
    
    if (!addressId) {
      return failure(res, {
        statusCode: 400,
        message: "Address ID is required"
      });
    }

    const address = await addressService.setDefaultAddress(addressId, req.user.userId);
    
    return success(res, {
      message: "Default address set successfully",
      data: address
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to set default address"
    });
  }
};

/**
 * Update an address
 */
exports.updateAddress = async (req, res) => {
  try {
    const address = await addressService.updateAddress(
      req.params.id,
      req.user.userId,
      req.body
    );

    return success(res, {
      message: "Address updated successfully",
      data: address
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to update address"
    });
  }
};

/**
 * Delete an address
 */
exports.deleteAddress = async (req, res) => {
  try {
    const result = await addressService.deleteAddress(req.params.id, req.user.userId);
    
    return success(res, {
      message: result.message
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to delete address"
    });
  }
};

/**
 * Check delivery availability for zipcode
 */
exports.checkDeliveryAvailability = async (req, res) => {
  try {
    const { zipCode } = req.body;
    
    if (!zipCode) {
      return failure(res, {
        statusCode: 400,
        message: "Zip code is required"
      });
    }

    const result = await addressService.checkDeliveryAvailability(zipCode);
    
    return success(res, {
      message: "Delivery availability checked",
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to check delivery availability"
    });
  }
};
