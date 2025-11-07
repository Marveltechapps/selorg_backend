const mongoose = require("mongoose");

const notificationPreferencesSchema = new mongoose.Schema(
  {
    orderUpdates: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
    appUpdates: { type: Boolean, default: true }
  },
  { _id: false }
);

const deviceSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    platform: {
      type: String,
      enum: ["android", "ios", "web", "unknown"],
      default: "unknown"
    },
    lastSeenAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
      sparse: true
    },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    isVerified: {
      type: Boolean,
      default: false
    },
    mobileVerifiedAt: { type: Date },
    emailVerifiedAt: { type: Date },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    membershipTier: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum"],
      default: "bronze"
    },
    primaryAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AddressModel"
    },
    preferredStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocationData"
    },
    notificationPreferences: {
      type: notificationPreferencesSchema,
      default: () => ({})
    },
    deviceTokens: {
      type: [deviceSchema],
      default: []
    },
    lastActiveAt: { type: Date },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    }
  },
  {
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
    toObject: {
      virtuals: true
    }
  }
);

userSchema.virtual("isEmailVerified").get(function () {
  return Boolean(this.emailVerifiedAt);
});

userSchema.methods.markMobileVerified = function () {
  this.isVerified = true;
  this.mobileVerifiedAt = new Date();
};

userSchema.index({ membershipTier: 1 });
userSchema.index({ lastActiveAt: -1 });

module.exports = mongoose.model("UserModel", userSchema);
