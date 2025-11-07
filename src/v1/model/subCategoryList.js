const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String },
  // main_category_id: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "MainCategoryData",
  //   required: false
  // },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CategoryData",
    required: false
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

module.exports = mongoose.model("SubCategoryData", subCategorySchema);
