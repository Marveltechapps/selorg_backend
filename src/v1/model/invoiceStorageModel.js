const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
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
  pdfUrl: String,
  pdfPath: String,
  invoiceData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  emailedAt: Date,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ orderId: 1 });

module.exports = mongoose.model("InvoiceStorage", invoiceSchema);

