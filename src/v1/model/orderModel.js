const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProductStyle",
          required: true
        },
        quantity: { type: Number, required: true },
        variantLabel: String,
        imageURL: String,
        price: { type: Number, required: true },
        discountPrice: { type: Number }
      }
    ],
    totalPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 }, // Coupon discount
    finalAmount: { type: Number, required: true }, // Amount after discount
    deliveryTip: { type: Number, default: 0 }, // Optional delivery tip
    deliveryInstructions: { type: String, default: "" }, // No-contact, ring bell, etc.
    additionalNote: { type: String, default: "" }, // User-added note
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending"
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true }
    }
  },
  { timestamps: true }
);

const OrderModels = mongoose.model("Order", OrderSchema);
module.exports = OrderModels;
