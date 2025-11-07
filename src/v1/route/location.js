// routes/locationRoutes.js
const express = require("express");
const router = express.Router();
const locationController = require("../controller/locationController");

// router.post("/create", locationController);
// router.get("/list", locationController.getLocations);
// router.get("/search", locationController.searchLocation);
// router.get("/:id", locationController.getLocationById);
// router.put("/:id", locationController.updateLocation);
// router.delete("/:id", locationController.deleteLocation);

// Add new location
router.post("/create", locationController.addLocation);

// Search places
router.get("/search", locationController.searchPlaces);

// Get user locations
router.get("/:userId", locationController.getUserLocations);

// Get place details
router.get("/details", locationController.getPlaceDetails);

module.exports = router;
