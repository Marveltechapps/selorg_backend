const mongoose = require("mongoose");

const abandonedCartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true
    },
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CartList"
    },
    cartSnapshot: {
      items: {
        type: mongoose.Schema.Types.Mixed
      },
      billSummary: {
        type: mongoose.Schema.Types.Mixed
      }
    },
    itemCount: {
      type: Number,
      default: 0
    },
    totalValue: {
      type: Number,
      default: 0
    },
    abandonedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    reminders: {
      type: [{
        sentAt: Date,
        channel: {
          type: String,
          enum: ['sms', 'email', 'push', 'notification']
        },
        status: {
          type: String,
          enum: ['sent', 'failed', 'delivered', 'clicked']
        }
      }],
      default: []
    },
    recovered: {
      type: Boolean,
      default: false,
      index: true
    },
    recoveredAt: {
      type: Date
    },
    recoveryOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Indexes
abandonedCartSchema.index({ userId: 1, recovered: 1 });
abandonedCartSchema.index({ abandonedAt: 1, recovered: 1 });

// Auto-delete recovered carts after 30 days
abandonedCartSchema.index({ recoveredAt: 1 }, { 
  expireAfterSeconds: 2592000,
  partialFilterExpression: { recovered: true }
});

module.exports = mongoose.model("AbandonedCart", abandonedCartSchema);

