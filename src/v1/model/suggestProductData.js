const mongoose = require("mongoose");

const suggestProductSchema = new mongoose.Schema({
  SKUName: {
    type: String,
    required: true,
  },
  userComment: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Reviewed"],
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SuggestProductData", suggestProductSchema);
