const express = require("express");
const router = express.Router();
const addressController = require("../controller/addressDataController");

// Add New Address
router.post("/create", addressController.addNewAddress);

// Delete Address
router.delete("/:id", addressController.deleteAddress);

// Edit Address
router.put("/:id", addressController.editAddress);

// Search Location
router.get("/search", addressController.searchLocation);

// Pin Location
router.patch("/:id/pin", addressController.pinLocation);

// Change Location Coordinates
router.patch("/:id/location", addressController.changeLocation);

// Define Location with Label
router.patch("/:id/label", addressController.defineLocation);

// Save Location (Retrieve Location by ID)
router.get("/:id", addressController.saveLocation);

module.exports = router;
