const crypto = require("crypto");
const mongoose = require("mongoose");

const ORDER_STATUS = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_dispatch",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "failed",
  "refunded"
];

const PAYMENT_STATUS = [
  "pending",
  "authorized",
  "paid",
  "refunded",
  "failed"
];

const FULFILLMENT_STATUS = [
  "pending",
  "assigned",
  "picking",
  "packed",
  "dispatched",
  "delivered",
  "cancelled",
  "failed"
];

const PAYMENT_METHODS = ["cod", "upi", "card", "netbanking", "wallet"];

const generateOrderCode = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `SEL-${datePart}-${randomPart}`;
};

const coordinatesSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Delivery" },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: "India" },
    landmark: { type: String },
    coordinates: { type: coordinatesSchema, default: undefined },
    instructions: { type: String }
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductStyle",
      required: true
    },
    productName: { type: String },
    sku: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    variantLabel: String,
    imageURL: String,
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    taxRate: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true },
    notes: { type: String }
  },
  { _id: false }
);

const pricingSchema = new mongoose.Schema(
  {
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    serviceFee: { type: Number, default: 0 },
    tip: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    payable: { type: Number, default: 0 },
    currency: { type: String, default: "INR" }
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "cod"
    },
    status: {
      type: String,
      enum: PAYMENT_STATUS,
      default: "pending"
    },
    transactionId: { type: String },
    reference: { type: String },
    paidAt: { type: Date },
    payload: mongoose.Schema.Types.Mixed
  },
  { _id: false }
);

const fulfillmentSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: FULFILLMENT_STATUS,
      default: "pending"
    },
    type: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery"
    },
    slot: {
      start: { type: Date },
      end: { type: Date }
    },
    eta: { type: Date },
    partnerId: { type: String },
    riderDetails: {
      name: { type: String },
      phone: { type: String }
    }
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUS,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS
    },
    fulfillmentStatus: {
      type: String,
      enum: FULFILLMENT_STATUS
    },
    note: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const couponSchema = new mongoose.Schema(
  {
    code: { type: String },
    savings: { type: Number, default: 0 },
    metadata: mongoose.Schema.Types.Mixed
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      unique: true,
      default: generateOrderCode
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true
    },
    userSnapshot: {
      name: { type: String },
      phone: { type: String }
    },
    status: {
      type: String,
      enum: ORDER_STATUS,
      default: "pending",
      index: true
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS,
      default: "pending"
    },
    fulfillmentStatus: {
      type: String,
      enum: FULFILLMENT_STATUS,
      default: "pending"
    },
    items: {
      type: [orderItemSchema],
      validate: [
        (items) => Array.isArray(items) && items.length > 0,
        "Order must contain at least one item"
      ]
    },
    pricing: {
      type: pricingSchema,
      default: () => ({ currency: "INR" })
    },
    payment: {
      type: paymentSchema,
      default: () => ({})
    },
    fulfillment: {
      type: fulfillmentSchema,
      default: () => ({})
    },
    coupon: {
      type: couponSchema,
      default: () => ({})
    },
    address: {
      type: addressSchema,
      required: true
    },
    deliveryTip: { type: Number, default: 0 },
    deliveryInstructions: { type: String, default: "" },
    additionalNote: { type: String, default: "" },
    timeline: {
      type: [timelineSchema],
      default: () => []
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    totalPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true }
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
    toObject: { virtuals: true }
  }
);

orderSchema.virtual("deliveryAddress")
  .get(function () {
    return this.address;
  })
  .set(function (value) {
    this.address = value;
  });

orderSchema.pre("save", function (next) {
  if (!this.orderCode) {
    this.orderCode = generateOrderCode();
  }

  if (!this.timeline.length) {
    this.timeline.push({
      status: this.status,
      paymentStatus: this.paymentStatus,
      fulfillmentStatus: this.fulfillmentStatus,
      note: "Order created"
    });
  }

  next();
});

orderSchema.methods.appendTimeline = function ({
  status = this.status,
  paymentStatus = this.paymentStatus,
  fulfillmentStatus = this.fulfillmentStatus,
  note
}) {
  this.timeline.push({
    status,
    paymentStatus,
    fulfillmentStatus,
    note,
    createdAt: new Date()
  });
};

orderSchema.statics.generateOrderCode = generateOrderCode;

orderSchema.index({ orderCode: 1 }, { unique: true });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("Order", orderSchema);
