const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  // name: { type: String, required: true }, // E.g., 'Home', 'Office'
  // address: { type: String, required: true },
  // latitude: { type: Number, required: true },
  // longitude: { type: Number, required: true },
  // createdAt: { type: Date, default: Date.now }

  userId: { type: String, required: true },
  locationName: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  savedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model("Location", locationSchema);
