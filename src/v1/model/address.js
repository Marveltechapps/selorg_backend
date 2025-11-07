const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  customer_id: {
    type: String, // Reference to the customer this address belongs to
    required: true
  },
  address_id: {
    type: String, // Reference to the customer this address belongs to
    required: true
  },
  label: {
    type: String, // Label for the address, e.g., "Home," "Work," "Other"
    required: true
  },
  address1: {
    type: String,
    required: true
  },
  address2: String,
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  zip: {
    type: String,
    required: true
  },
  latitude: String,
  longitude: String,
  landmark: String,
  isDefault: {
    type: Boolean, // Indicates if this address is the default for the customer
    default: false // Default is set to false initially
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Address", addressSchema, "address");
