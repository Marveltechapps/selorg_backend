const AddressModel = require("../model/addressModel");

// Create a new address
exports.createAddress = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ Get from JWT
    const { label, details, coordinates, isDefault } = req.body;

    if (isDefault) {
      await AddressModel.updateMany(
        { userId, isDefault: true },
        { $set: { isDefault: false } }
      );
    }

    const newAddress = new AddressModel({
      userId,
      label,
      details,
      coordinates,
      isDefault
    });
    const savedAddress = await newAddress.save();

    res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: savedAddress
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all addresses for the logged-in user
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ Secure source
    const addresses = await AddressModel.find({ userId }).sort({
      isDefault: -1,
      updatedAt: -1
    });
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single address by ID
exports.getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await AddressModel.findById(id);

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    // ✅ Optional: check if it belongs to the logged-in user
    if (address.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get addresses for the logged-in user using token
exports.getByUserId = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ Extracted securely from token

    const addresses = await AddressModel.find({ userId }).sort({
      isDefault: -1,
      updatedAt: -1
    });

    if (!addresses.length) {
      return res.status(404).json({
        success: false,
        message: "No addresses found for this user"
      });
    }

    res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      data: addresses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving addresses",
      error: error.message
    });
  }
};

// Set an address as default
exports.setDefaultAddress = async (req, res) => {
  const userId = req.user.userId;
  const { addressId } = req.body;

  try {
    const address = await AddressModel.findOne({ _id: addressId, userId });
    if (!address) {
      return res
        .status(404)
        .json({ message: "Address not found or does not belong to this user" });
    }

    await AddressModel.updateMany({ userId }, { $set: { isDefault: false } });
    const updatedAddress = await AddressModel.findByIdAndUpdate(
      addressId,
      { isDefault: true },
      { new: true }
    );

    res.status(200).json({
      message: "Default address set successfully",
      data: updatedAddress
    });
  } catch (error) {
    res.status(500).json({
      message: "Error setting default address",
      error: error.message
    });
  }
};

// Update an address
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, details, coordinates, isDefault } = req.body;

    const address = await AddressModel.findById(id);

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    if (address.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (isDefault) {
      await AddressModel.updateMany(
        { userId: req.user.userId },
        { $set: { isDefault: false } }
      );
    }

    address.label = label ?? address.label;
    address.details = details ?? address.details;
    address.coordinates = coordinates ?? address.coordinates;
    address.isDefault = isDefault ?? address.isDefault;
    address.updatedAt = new Date();

    const updatedAddress = await address.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: updatedAddress
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await AddressModel.findById(id);
    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    if (address.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await AddressModel.findByIdAndDelete(id);

    res
      .status(200)
      .json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
