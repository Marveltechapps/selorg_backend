const mongoose = require("mongoose");

/**
 * Payment Method Model
 * Stores user's saved payment methods (cards) securely
 * 
 * Security Notes:
 * - Never store full card numbers or CVV
 * - Only store tokenized references from payment gateway
 * - Card tokens are provided by Razorpay/Stripe/PayU
 */
const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
    index: true
  },
  
  // Payment gateway token (never raw card number)
  cardToken: {
    type: String,
    required: true,
    unique: true
  },
  
  // Payment gateway (razorpay, stripe, payu, etc.)
  gateway: {
    type: String,
    required: true,
    enum: ["razorpay", "stripe", "payu", "cashfree", "phonepe"],
    default: "razorpay"
  },
  
  // Card details (safe to store)
  cardType: {
    type: String,
    required: true,
    enum: ["Visa", "Mastercard", "RuPay", "Amex", "Discover"]
  },
  
  lastFourDigits: {
    type: String,
    required: true,
    match: /^\d{4}$/,
    maxlength: 4
  },
  
  expiryMonth: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  
  expiryYear: {
    type: Number,
    required: true,
    validate: {
      validator: function(year) {
        return year >= new Date().getFullYear();
      },
      message: "Card has expired"
    }
  },
  
  // Optional cardholder name (not sensitive)
  cardholderName: {
    type: String,
    trim: true
  },
  
  // Card issuer/bank
  issuer: {
    type: String,
    trim: true
  },
  
  // Card network (Visa Debit, Mastercard Credit, etc.)
  network: {
    type: String
  },
  
  // Default payment method flag
  isDefault: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Last used timestamp
  lastUsedAt: {
    type: Date
  },
  
  // Metadata from payment gateway
  gatewayMetadata: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.cardToken; // Never expose token in API responses
      delete ret.gatewayMetadata; // Don't expose gateway data
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
paymentMethodSchema.index({ userId: 1, isDefault: 1 });
paymentMethodSchema.index({ userId: 1, cardToken: 1 }, { unique: true });
paymentMethodSchema.index({ createdAt: -1 });

// Virtual for masked card number
paymentMethodSchema.virtual("maskedCardNumber").get(function() {
  return `${this.cardType} XXXX ${this.lastFourDigits}`;
});

// Virtual for card expiry status
paymentMethodSchema.virtual("isExpired").get(function() {
  const now = new Date();
  const expiry = new Date(this.expiryYear, this.expiryMonth - 1);
  return expiry < now;
});

// Virtual for expiry display (MM/YY format)
paymentMethodSchema.virtual("expiryDisplay").get(function() {
  return `${String(this.expiryMonth).padStart(2, '0')}/${String(this.expiryYear).slice(-2)}`;
});

// Pre-save hook: Ensure only one default per user
paymentMethodSchema.pre("save", async function(next) {
  if (this.isDefault && this.isModified("isDefault")) {
    // Unset other default payment methods for this user
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);



