const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      index: true
    },
    sessionId: {
      type: String,
      index: true
    },
    type: {
      type: String,
      enum: [
        'product_view',
        'product_search',
        'cart_add',
        'cart_remove',
        'wishlist_add',
        'order_create',
        'review_create',
        'page_view'
      ],
      required: true,
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductStyle"
    },
    data: {
      type: mongoose.Schema.Types.Mixed
    },
    metadata: {
      userAgent: String,
      ipAddress: String,
      referrer: String,
      device: String,
      platform: String
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes for analytics queries
activitySchema.index({ userId: 1, type: 1, createdAt: -1 });
activitySchema.index({ productId: 1, type: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });

// Auto-delete old activities after 90 days
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("Activity", activitySchema);

