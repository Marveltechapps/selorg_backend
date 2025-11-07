const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderStatusSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  products: [
    {
      SKUCode: {
        type: String,
        required: true
      },
      SKUName: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }
  ],
  deliveryEstimate: { type: Date, required: true },
  deliveryPartner: { type: String, required: true },
  orderSummary: {
    subTotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  orderStatus: {
    type: String,
    enum: ["Packing", "On the way", "Arrived"],
    default: "Packing"
  },
  deliveryTime: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("OrderStatusData", orderStatusSchema);
