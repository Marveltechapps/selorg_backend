const mongoose = require("mongoose");

const { Schema } = mongoose;

const ORDER_STATES = [
  "CREATED",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "FAILED"
];

const PAYMENT_STATUS = [
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "REFUNDED"
];

const PAYMENT_MODES = ["COD", "UPI", "CARD", "NET_BANKING", "WALLET"];

const FULFILLMENT_TYPES = ["IMMEDIATE", "SCHEDULED"];

const OrderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "ProductStyle",
      required: true
    },
    sku: { type: String },
    title: { type: String },
    variantLabel: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true }, // MRP
    salePrice: { type: Number, required: true }, // Selling price after discount
    taxRate: { type: Number, default: 0 }, // percentage e.g. 5
    taxAmount: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true }, // salePrice * quantity
    imageURL: { type: String }
  },
  { _id: false }
);

const ChargesSchema = new Schema(
  {
    mrpSubtotal: { type: Number, default: 0 },
    saleSubtotal: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    surgeFee: { type: Number, default: 0 },
    tipAmount: { type: Number, default: 0 },
    couponDiscount: { type: Number, default: 0 },
    walletDeduction: { type: Number, default: 0 },
    roundingAdjustment: { type: Number, default: 0 },
    totalPayable: { type: Number, default: 0 }
  },
  { _id: false }
);

const PaymentSchema = new Schema(
  {
    mode: { type: String, enum: PAYMENT_MODES, default: "COD" },
    status: { type: String, enum: PAYMENT_STATUS, default: "PENDING" },
    provider: { type: String },
    transactionId: { type: String },
    referenceId: { type: String },
    paidAt: { type: Date },
    metadata: { type: Map, of: Schema.Types.Mixed }
  },
  { _id: false }
);

const FulfillmentSchema = new Schema(
  {
    type: { type: String, enum: FULFILLMENT_TYPES, default: "IMMEDIATE" },
    slotStart: { type: Date },
    slotEnd: { type: Date },
    promiseTime: { type: Date },
    deliveredAt: { type: Date },
    hubId: { type: String },
    rider: {
      id: { type: Schema.Types.Mixed },
      name: { type: String },
      phone: { type: String }
    }
  },
  { _id: false }
);

const StatusHistorySchema = new Schema(
  {
    state: { type: String, enum: ORDER_STATES, required: true },
    note: { type: String },
    changedBy: {
      actorId: { type: Schema.Types.Mixed },
      actorType: {
        type: String,
        enum: ["USER", "SYSTEM", "ADMIN", "RIDER"],
        default: "SYSTEM"
      },
      actorName: { type: String }
    },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const AddressSnapshotSchema = new Schema(
  {
    label: { type: String },
    contactName: { type: String },
    contactPhone: { type: String },
    details: {
      houseNo: { type: String },
      building: { type: String },
      landmark: { type: String },
      area: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String }
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      index: true
    },
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    source: {
      type: String,
      enum: ["MOBILE_APP", "WEB_APP", "CUSTOMER_SUPPORT"],
      default: "MOBILE_APP"
    },
    status: {
      type: String,
      enum: ORDER_STATES,
      default: "CREATED",
      index: true,
      set(value) {
        return typeof value === "string" ? value.toUpperCase() : value;
      }
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: () => []
    },
    items: {
      type: [OrderItemSchema],
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: "Order requires at least one item"
      }
    },
    charges: {
      type: ChargesSchema,
      default: () => ({})
    },
    payment: {
      type: PaymentSchema,
      default: () => ({})
    },
    fulfillment: {
      type: FulfillmentSchema,
      default: () => ({})
    },
    deliveryInstructions: { type: String, default: "" },
    additionalNote: { type: String, default: "" },
    addressId: {
      type: Schema.Types.ObjectId,
      ref: "AddressModel"
    },
    addressSnapshot: AddressSnapshotSchema,
    promoCode: { type: String },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });

OrderSchema.methods.recalculateCharges = function recalculateCharges() {
  const items = Array.isArray(this.items) ? this.items : [];

  const currentCharges = (() => {
    if (!this.charges) {
      return {};
    }

    if (typeof this.charges.toObject === "function") {
      return this.charges.toObject();
    }

    return this.charges;
  })();

  const charges = {
    deliveryFee: 0,
    surgeFee: 0,
    tipAmount: 0,
    couponDiscount: 0,
    walletDeduction: 0,
    roundingAdjustment: 0,
    taxAmount: 0,
    ...currentCharges
  };

  const mrpSubtotal = items.reduce(
    (sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0),
    0
  );
  const saleSubtotal = items.reduce(
    (sum, item) => sum + (item.salePrice || 0) * (item.quantity || 0),
    0
  );
  const taxAmount = items.reduce(
    (sum, item) => sum + (item.taxAmount || 0),
    0
  );

  const savings = Math.max(mrpSubtotal - saleSubtotal, 0);

  charges.mrpSubtotal = Number(mrpSubtotal.toFixed(2));
  charges.saleSubtotal = Number(saleSubtotal.toFixed(2));
  charges.taxAmount = Number(taxAmount.toFixed(2));
  charges.savings = Number(savings.toFixed(2));

  const grossTotal =
    charges.saleSubtotal +
    charges.taxAmount +
    charges.deliveryFee +
    charges.surgeFee +
    charges.tipAmount;

  const netTotal =
    grossTotal -
    charges.couponDiscount -
    charges.walletDeduction +
    charges.roundingAdjustment;

  charges.totalPayable = Number(netTotal.toFixed(2));
  this.charges = charges;
};

OrderSchema.methods.recordStatusChange = function recordStatusChange({
  state,
  note,
  changedBy
}) {
  const normalizedState =
    typeof state === "string" ? state.toUpperCase() : state;

  if (!ORDER_STATES.includes(normalizedState)) {
    const error = new Error(`Invalid order state transition: ${state}`);
    error.statusCode = 400;
    throw error;
  }

  this.status = normalizedState;
  this.statusHistory = this.statusHistory || [];
  this.statusHistory.push({
    state: normalizedState,
    note,
    changedBy,
    changedAt: new Date()
  });
};

OrderSchema.virtual("isPrepaid").get(function isPrepaid() {
  return (
    this.payment &&
    ["AUTHORIZED", "PAID"].includes(this.payment.status || "PENDING")
  );
});

OrderSchema.pre("save", function ensureHistoryAndCharges(next) {
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [
      {
        state: this.status || "CREATED",
        note: "Order created",
        changedBy: { actorType: "SYSTEM" },
        changedAt: new Date()
      }
    ];
  }

  this.recalculateCharges();
  next();
});

const OrderModel = mongoose.model("Order", OrderSchema);

OrderModel.ORDER_STATES = ORDER_STATES;
OrderModel.PAYMENT_STATUS = PAYMENT_STATUS;
OrderModel.PAYMENT_MODES = PAYMENT_MODES;

module.exports = OrderModel;
