const mongoose = require("mongoose");

const coordinatesSchema = new mongoose.Schema({
  lat: { type: Number, min: -90, max: 90 },
  lng: { type: Number, min: -180, max: 180 }
}, { _id: false });

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
    index: true
  },
  label: { 
    type: String, 
    enum: ["Home", "Work", "Other"], 
    default: "Home"
  },
  // Support both old and new format
  street: { type: String }, // New format
  details: {
    houseNo: { type: String },
    building: { type: String },
    landmark: { type: String },
    area: { type: String }
  },
  landmark: { type: String }, // New format (duplicated for compatibility)
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true, index: true },
  country: { type: String, default: "India" },
  coordinates: coordinatesSchema,
  instructions: { type: String },
  isDefault: { type: Boolean, default: false, index: true },
  isDeliverable: { type: Boolean, default: true },
  verifiedAt: { type: Date }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtual for full address string
addressSchema.virtual('fullAddress').get(function() {
  const parts = [
    this.street || this.details?.houseNo,
    this.details?.building,
    this.details?.area,
    this.landmark || this.details?.landmark,
    this.city,
    this.state,
    this.zipCode
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Indexes
addressSchema.index({ userId: 1, isDefault: 1 });
addressSchema.index({ zipCode: 1, isDeliverable: 1 });

module.exports = mongoose.model("AddressModel", addressSchema);
