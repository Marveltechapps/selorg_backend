// const axios = require("axios");
// const Location = require("../model/location");
// require("dotenv").config();
// const mongoose = require("mongoose");
// const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// // Create a location
// exports.createLocation = async (req, res) => {
//   const { name, address } = req.body;

//   try {
//     // Construct the Geocoding API URL
//     const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
//       address
//     )}&key=${GOOGLE_API_KEY}`;

//     // Make a request to the Geocoding API
//     const geoResponse = await axios.get(geoUrl);
//     const geoData = geoResponse.data;

//     // Log the raw API response for debugging
//     // console.log("Geocoding API Response:", geoData);

//     // Validate the response
//     if (
//       geoData.status !== "OK" ||
//       !geoData.results ||
//       geoData.results.length === 0
//     ) {
//       return res.status(400).json({
//         error: "Invalid address or address not found"
//       });
//     }

//     // Extract latitude and longitude
//     const { lat, lng } = geoData.results[0].geometry.location;

//     // Create a new location object
//     const location = new Location({
//       name,
//       address,
//       latitude: lat,
//       longitude: lng
//     });

//     await location.save();

//     // Send a success response
//     res.status(201).json({
//       message: "Location created successfully",
//       location
//     });
//   } catch (error) {
//     console.error("Error creating location:", error.message);
//     res.status(500).json({
//       error: "Failed to create location"
//     });
//   }
// };

// // Get all locations
// exports.getLocations = async (req, res) => {
//   try {
//     const locations = await Location.find();
//     res.status(200).json(locations);
//   } catch (error) {
//     console.error("Error fetching locations:", error);
//     res.status(500).json({ error: "Failed to fetch locations" });
//   }
// };

// exports.searchLocation = async (req, res) => {
//   try {
//     const { name } = req.query;

//     console.log("Received Query Params:", req.query); // Debugging

//     if (!name || name.trim() === "") {
//       return res
//         .status(400)
//         .json({ message: "Name query parameter is required" });
//     }

//     const locations = await Location.find({
//       name: { $regex: name, $options: "i" } // Case-insensitive search
//     });

//     res.status(200).json(locations);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error searching locations", error: error.message });
//   }
// };

// // Get a single location by ID

// exports.searchLocation = async (req, res) => {
//   try {
//     const { name } = req.query;

//     console.log("Received Query Params:", req.query); // Debugging

//     // Validate the input query parameter
//     if (!name || name.trim() === "") {
//       return res
//         .status(400)
//         .json({ message: "Name query parameter is required" });
//     }

//     // Perform the search using case-insensitive partial match
//     const locations = await Location.find({
//       name: { $regex: `.*${name}.*`, $options: "i" } // Match anywhere in the string
//     });

//     // Check if locations were found
//     if (locations.length === 0) {
//       return res.status(404).json({ message: "No matching locations found" });
//     }

//     // Return the matched locations
//     res.status(200).json({ message: "Locations found", locations });
//   } catch (error) {
//     // Handle any errors
//     console.error("Error searching locations:", error);
//     res
//       .status(500)
//       .json({ message: "Error searching locations", error: error.message });
//   }
// };

// exports.getLocationById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ message: "Invalid ID format" });
//     }

//     const location = await Location.findById(id);

//     if (!location) {
//       return res.status(404).json({ message: "Location not found" });
//     }

//     res.status(200).json(location);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error fetching location", error: error.message });
//   }
// };

// // Update a location by ID
// exports.updateLocation = async (req, res) => {
//   const { name, address } = req.body;

//   try {
//     // Get lat/lng for updated address
//     const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
//       address
//     )}&key=${GOOGLE_API_KEY}`;
//     const geoResponse = await axios.get(geoUrl);
//     const { lat, lng } = geoResponse.data.results[0].geometry.location;

//     const location = await Location.findByIdAndUpdate(
//       req.params.id,
//       { name, address, latitude: lat, longitude: lng },
//       { new: true }
//     );

//     if (!location) return res.status(404).json({ error: "Location not found" });

//     res
//       .status(200)
//       .json({ message: "Location updated successfully", location });
//   } catch (error) {
//     console.error("Error updating location:", error);
//     res.status(500).json({ error: "Failed to update location" });
//   }
// };

// // Delete a location by ID
// exports.deleteLocation = async (req, res) => {
//   try {
//     const location = await Location.findByIdAndDelete(req.params.id);
//     if (!location) return res.status(404).json({ error: "Location not found" });

//     res.status(200).json({ message: "Location deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting location:", error);
//     res.status(500).json({ error: "Failed to delete location" });
//   }
// };

const Location = require("../model/location");
const axios = require("axios");

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Add a new location
exports.addLocation = async (req, res) => {
  const { userId, locationName, lat, lng } = req.body;

  try {
    const newLocation = new Location({
      userId,
      locationName,
      coordinates: { lat, lng }
    });

    const savedLocation = await newLocation.save();
    res.status(201).json(savedLocation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search places using Google Maps API
exports.searchPlaces = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
      {
        params: {
          input: encodedQuery,
          key: process.env.GOOGLE_API_KEY,
          region: "in", // Optional: Specify the region (e.g., India)
          language: "en" // Optional: Specify the language
        }
      }
    );

    // Log the raw response for debugging
    console.log(response.data);

    res.json(response.data.predictions);
  } catch (error) {
    console.error(
      "Error fetching autocomplete data:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.message });
  }
};

// Get all locations for a user
exports.getUserLocations = async (req, res) => {
  const { userId } = req.params;

  try {
    const locations = await Location.find({ userId });
    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get place details by place ID
exports.getPlaceDetails = async (req, res) => {
  const { placeId } = req.query;

  if (!placeId) {
    return res.status(400).json({ message: "Place ID is required" });
  }

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          place_id: placeId,
          key: GOOGLE_API_KEY
        }
      }
    );

    res.json(response.data.result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
