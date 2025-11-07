const LocationData = require("../model/locationModel");

// Fetch location after login
exports.getLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const location = await LocationData.findOne({ userId });

    if (!location) {
      return res
        .status(404)
        .json({ message: "No location found, please search for one." });
    }

    res.json({ location });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Search locations (Mocked API)
exports.searchLocation = async (req, res) => {
  try {
    const { name } = req.query;

    console.log("Received Query Params:", req.query); // Debugging

    if (!name || name.trim() === "") {
      return res
        .status(400)
        .json({ message: "Name query parameter is required" });
    }

    const locations = await LocationData.find({
      name: { $regex: name, $options: "i" } // Case-insensitive search
    });

    res.status(200).json(locations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error searching locations", error: error.message });
  }
};

// Pin and Save location
exports.saveLocation = async (req, res) => {
  try {
    const { userId, latitude, longitude, address, city } = req.body;

    if (!userId || !latitude || !longitude || !address || !city) {
      return res.status(400).json({
        error:
          "All fields (userId, latitude, longitude, address, city) are required"
      });
    }

    // console.log("Received Data:", {
    //   userId,
    //   latitude,
    //   longitude,
    //   address,
    //   city
    // });

    let location = await LocationData.findOne({ userId });

    if (location) {
      location.latitude = latitude;
      location.longitude = longitude;
      location.address = address;
      location.city = city;
    } else {
      location = new LocationData({
        userId,
        latitude,
        longitude,
        address,
        city
      });
    }

    await location.save();
    res.json({ message: "Location pinned successfully", location });
  } catch (error) {
    console.error("Error Saving Location:", error);
    res.status(500).json({ error: error.message || "Error saving location" });
  }
};
