// models/cartModel.js
const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductStyle",
    required: true
  },
  quantity: { type: Number, required: true, min: 1 },
  variantLabel: { type: String, required: true },
  imageURL: String,
  price: { type: Number, required: true },
  discountPrice: { type: Number }
});

const billSummarySchema = new mongoose.Schema(
  {
    itemTotal: { type: Number, default: 0 },
    GST: { type: Number, default: 0 },
    subtotalWithGST: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 50 },
    deliveryTip: { type: Number, default: 0 },
    handlingCharges: { type: Number, default: 10 },
    discountAmount: { type: Number, default: 0 },
    totalBill: { type: Number, default: 0 },
    savings: { type: Number, default: 0 }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true,
      unique: true
    },
    items: [cartItemSchema],
    deliveryInstructions: String,
    addNotes: String,
    billSummary: { type: billSummarySchema, default: () => ({}) }
  },
  { timestamps: true }
);

// ❌ REMOVE ALL pre-save inventory hooks (they were touching non-existent fields)

// ---------- Helpers ----------
function calculateBillSummary(cart) {
  const bs = cart.billSummary || {};
  const itemTotal = (cart.items || []).reduce(
    (sum, it) => sum + (it.discountPrice ?? it.price) * it.quantity,
    0
  );
  const originalTotal = (cart.items || []).reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );
  const savings = originalTotal - itemTotal;
  const GST = Number((itemTotal * 0.05).toFixed(2));
  const subtotalWithGST = Number((itemTotal + GST).toFixed(2));

  const deliveryFee = bs.deliveryFee ?? 50;
  const deliveryTip = bs.deliveryTip ?? 0;
  const handlingCharges = bs.handlingCharges ?? 10;
  const discountAmount = bs.discountAmount ?? 0;

  const totalBill = Number(
    (
      subtotalWithGST +
      deliveryFee +
      deliveryTip +
      handlingCharges -
      discountAmount
    ).toFixed(2)
  );

  return {
    itemTotal,
    GST,
    subtotalWithGST,
    deliveryFee,
    deliveryTip,
    handlingCharges,
    discountAmount,
    totalBill,
    savings
  };
}

cartSchema.methods.recalculateBill = function () {
  this.billSummary = calculateBillSummary(this);
};

// Useful when joining with products/variants
cartSchema.statics.buildCartIndex = function (items = []) {
  // key = `${productId}_${variantLabel}`
  const idx = Object.create(null);
  for (const it of items) {
    const key = `${String(it.productId)}_${it.variantLabel}`;
    idx[key] = (idx[key] || 0) + it.quantity;
  }
  return idx;
};

module.exports = mongoose.model("CartModel", cartSchema);
