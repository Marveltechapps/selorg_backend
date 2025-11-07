const express = require("express");
const router = express.Router();
const locationController = require("../controller/locationControllers");

// Get current location after login
router.get("/fetch", locationController.getLocation);

// Search for a location (e.g., "Adyar")
router.get("/search", locationController.searchLocation);

// Pin & save the current location
router.post("/pin", locationController.saveLocation);

module.exports = router;
