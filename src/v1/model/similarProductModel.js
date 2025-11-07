const mongoose = require("mongoose");

// Define the SimilarProduct schema
const similarProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductStyle",
    required: true
  },
  similarProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductStyle",
    required: true
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

// Create the SimilarProduct model
const SimilarProduct = mongoose.model("SimilarProduct", similarProductSchema);

module.exports = SimilarProduct;
