const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "OrderModel",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true
  },
  address: {
    type: String,
    required: false
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["In Process", "Completed"],
    default: "In Process"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Refund", refundSchema);
