// models/categoryGroup.model.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
    isHighlight: { type: Boolean, default: false },
    index: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const categoryGroupSchema = new mongoose.Schema(
  {
    category_title_name: { type: String, required: true },
    categories: [categorySchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("CategoryGroup", categoryGroupSchema);
