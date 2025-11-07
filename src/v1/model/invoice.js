const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema({
  orderNo: String,
  orderDate: Date,
  externOrderNo: String,
  invoiceDate: Date,
  invoiceNo: String,
  paymentMode: String,
  typeOfSupply: String,
  placeOfSupply: String,
  orderCurrency: String,
  soldBy: {
    name: String,
    address: String,
    email: String,
    contact: String,
    gstin: String,
    pan: String
  },
  billingAddress: {
    name: String,
    address: String,
    contact: String,
    gstin: String,
    pan: String
  },
  shippingAddress: {
    name: String,
    address: String,
    contact: String,
    gstin: String,
    pan: String
  },
  items: [
    {
      itemCode: String,
      hsn: String,
      qty: Number,
      unitPrice: Number,
      discount: Number,
      taxableValue: Number,
      cgstRate: Number,
      cgstAmt: Number,
      sgstRate: Number,
      sgstAmt: Number,
      igstRate: Number,
      igstAmt: Number,
      total: Number
    }
  ],
  totalAmount: Number,
  taxableValue: Number,
  totalTax: Number,
  storeCredit: Number,
  gvValue: Number,
  grandTotal: Number,
  amountInWords: String
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
