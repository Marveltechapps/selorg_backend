const mongoose = require("mongoose");

const { Schema } = mongoose;
const OrderModel = require("./orderModel");

const ORDER_STATES = OrderModel.ORDER_STATES ?? [
  "CREATED",
  "CONFIRMED",
  "OUT_FOR_DELIVERY",
  "DELIVERED"
];

const ProductStatusSchema = new Schema(
  {
    skuCode: { type: String, required: true, alias: "SKUCode" },
    skuName: { type: String, required: true, alias: "SKUName" },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String },
    imageURL: { type: String }
  },
  { _id: false }
);

const RiderSchema = new Schema(
  {
    name: { type: String },
    phone: { type: String },
    vehicleNumber: { type: String },
    location: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  { _id: false }
);

const orderStatusSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true
    },
    products: {
      type: [ProductStatusSchema],
      default: () => []
    },
    deliveryEstimate: { type: Date },
    deliveryPartner: { type: String },
    rider: RiderSchema,
    orderSummary: {
      subTotal: { type: Number, default: 0 },
      deliveryFee: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    status: {
      type: String,
      enum: ORDER_STATES,
      default: "CREATED",
      alias: "orderStatus",
      index: true,
      set(value) {
        return typeof value === "string" ? value.toUpperCase() : value;
      }
    },
    statusChangedAt: { type: Date, default: Date.now },
    deliveryEtaMinutes: { type: Number, alias: "deliveryTime" }
  },
  { timestamps: true }
);

orderStatusSchema.pre("save", function updateStatusTimestamp(next) {
  if (this.isModified("status")) {
    this.statusChangedAt = new Date();
  }
  next();
});

orderStatusSchema.index({ userId: 1, orderId: 1 });
orderStatusSchema.index({ statusChangedAt: -1 });

module.exports = mongoose.model("OrderStatusData", orderStatusSchema);
