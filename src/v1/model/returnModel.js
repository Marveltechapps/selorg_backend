const mongoose = require("mongoose");

const returnItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductStyle",
    required: true
  },
  productName: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  reason: String,
  images: [String]
}, { _id: false });

const returnSchema = new mongoose.Schema({
  returnId: {
    type: String,
    unique: true,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
    index: true
  },
  orderCode: String,
  items: {
    type: [returnItemSchema],
    validate: [
      (items) => Array.isArray(items) && items.length > 0,
      "Return must contain at least one item"
    ]
  },
  reason: {
    type: String,
    enum: [
      "defective",
      "wrong_item",
      "damaged",
      "not_as_described",
      "quality_issue",
      "expired",
      "other"
    ],
    required: true
  },
  reasonDetails: String,
  images: [String],
  status: {
    type: String,
    enum: [
      "requested",
      "approved",
      "rejected",
      "picked_up",
      "received",
      "inspected",
      "refund_initiated",
      "refund_completed",
      "cancelled"
    ],
    default: "requested",
    index: true
  },
  refundAmount: {
    type: Number,
    required: true,
    min: 0
  },
  refundMethod: {
    type: String,
    enum: ["original_payment", "wallet", "bank_transfer"],
    default: "original_payment"
  },
  refundStatus: {
    type: String,
    enum: ["pending", "initiated", "completed", "failed"],
    default: "pending"
  },
  refundTransactionId: String,
  refundedAt: Date,
  pickupAddress: {
    type: mongoose.Schema.Types.Mixed
  },
  timeline: [{
    status: String,
    note: String,
    createdAt: { type: Date, default: Date.now }
  }],
  adminNotes: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  }
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

// Generate unique return ID
returnSchema.pre('save', function(next) {
  if (!this.returnId) {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.returnId = `RET-${datePart}-${randomPart}`;
  }
  
  // Add to timeline on status change
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      note: `Status updated to ${this.status}`,
      createdAt: new Date()
    });
  }
  
  next();
});

// Indexes
returnSchema.index({ userId: 1, status: 1 });
returnSchema.index({ orderId: 1 });
returnSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Return", returnSchema);

