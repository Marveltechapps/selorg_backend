const AddressData = require("../model/addressData");

// Add a New Address
exports.addNewAddress = async (req, res) => {
  try {
    const {
      userId,
      label,
      location,
      addressLine,
      city,
      state,
      country,
      postalCode,
      isPinned
    } = req.body;

    const newAddress = new AddressData({
      userId,
      label,
      location,
      addressLine,
      city,
      state,
      country,
      postalCode,
      isPinned
    });

    const savedAddress = await newAddress.save();
    res
      .status(201)
      .json({ message: "Address added successfully", data: savedAddress });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add address", error: error.message });
  }
};

// Delete Address
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAddress = await AddressData.findByIdAndDelete(id);
    if (!deletedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    res
      .status(200)
      .json({ message: "Address deleted successfully", data: deletedAddress });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete address", error: error.message });
  }
};

// Edit Address
exports.editAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedAddress = await AddressData.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true
      }
    );
    if (!updatedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    res
      .status(200)
      .json({ message: "Address updated successfully", data: updatedAddress });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update address", error: error.message });
  }
};

// Search Location
exports.searchLocation = async (req, res) => {
  try {
    const { query } = req.query;

    const results = await AddressData.find({
      $or: [
        { label: { $regex: query, $options: "i" } },
        { city: { $regex: query, $options: "i" } },
        { state: { $regex: query, $options: "i" } },
        { country: { $regex: query, $options: "i" } }
      ]
    });

    res
      .status(200)
      .json({ message: "Locations retrieved successfully", data: results });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to search locations", error: error.message });
  }
};

// Pin Location
exports.pinLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedAddress = await AddressData.findByIdAndUpdate(
      id,
      { isPinned: true },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    res
      .status(200)
      .json({ message: "Location pinned successfully", data: updatedAddress });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to pin location", error: error.message });
  }
};

// Change Location Coordinates
exports.changeLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { location } = req.body;

    const updatedAddress = await AddressData.findByIdAndUpdate(
      id,
      { location },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({
      message: "Location coordinates updated successfully",
      data: updatedAddress
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update location", error: error.message });
  }
};

// Define Location with Label
exports.defineLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { label } = req.body;

    const updatedAddress = await AddressData.findByIdAndUpdate(
      id,
      { label },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({
      message: "Location label updated successfully",
      data: updatedAddress
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to define location", error: error.message });
  }
};

// Save Location
exports.saveLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await AddressData.findById(id);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res
      .status(200)
      .json({ message: "Location saved successfully", data: address });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to save location", error: error.message });
  }
};
