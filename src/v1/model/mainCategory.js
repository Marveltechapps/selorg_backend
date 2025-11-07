const mongoose = require("mongoose");

const maincategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("MainCategoryData", maincategorySchema);
