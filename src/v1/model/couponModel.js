const mongoose = require("mongoose");

const usageRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },
    usedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "free_shipping"],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    maxDiscountAmount: {
      type: Number,
      min: 0
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0
    },
    validFrom: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date
    },
    maxUsageTotal: {
      type: Number,
      min: 1
    },
    maxUsagePerUser: {
      type: Number,
      min: 1,
      default: 1
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    },
    usedBy: {
      type: [usageRecordSchema],
      default: []
    },
    applicableCategories: {
      type: [String],
      default: []
    },
    applicableProducts: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "ProductStyle",
      default: []
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
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
        delete ret.usedBy; // Don't expose usage records publicly
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Virtual to check if coupon is expired
couponSchema.virtual("isExpired").get(function () {
  return this.validUntil && new Date() > this.validUntil;
});

// Virtual to check if coupon is valid
couponSchema.virtual("isValid").get(function () {
  if (!this.isActive) return false;
  if (this.validFrom && new Date() < this.validFrom) return false;
  if (this.validUntil && new Date() > this.validUntil) return false;
  if (this.maxUsageTotal && this.usageCount >= this.maxUsageTotal) return false;
  return true;
});

// Indexes for performance
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });

module.exports = mongoose.model("Coupon", couponSchema);

