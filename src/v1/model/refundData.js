const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "TransactionModel"
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "OrderModel"
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "UserModel"
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500
    },
    refundAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending"
    },
    processedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RefundData", refundSchema);
