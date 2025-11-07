const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true
  },
  label: { type: String, enum: ["Home", "Work", "Other"], required: true },
  details: {
    houseNo: { type: String, required: true },
    building: { type: String },
    landmark: { type: String },
    area: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  isDefault: { type: Boolean, default: false }, // Added field for default address
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AddressModel", addressSchema);
