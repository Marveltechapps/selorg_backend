const mongoose = require("mongoose");

const VariantSchema = new mongoose.Schema({
  label: String,
  price: { type: Number, required: true },
  discountPrice: Number,
  offer: { type: String, required: true },
  isComboPack: { type: Boolean, default: false },
  isMultiPack: { type: Boolean, default: false },
  comboDetails: {
    comboSKUCode: String,
    comboName: String,
    productNames: [String],
    childSkuCodes: [String],
    comboImageURL: String
  },
  stockQuantity: { type: Number, default: 0 },
  imageURL: String,
  cartQuantity: { type: Number, default: 0 }
});

const ProductSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductStyle",
    required: true
  },
  SKUCode: { type: String, required: true },
  SKUName: { type: String, required: true },
  variants: [VariantSchema],
  SKUClassification: { type: String, required: true },
  SKUClassification1: { type: String, required: true },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CategoryData",
    required: false
  },
  subCategory_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategoryData",
    required: true
  },
  price: { type: Number, required: true },
  discountPrice: Number,
  offer: { type: String, required: true },
  description: {
    about: { type: String, required: true },
    healthBenefits: { type: String, required: true },
    nutrition: { type: String, required: true },
    origin: { type: String, required: true }
  }
});

const ProductSectionSchema = new mongoose.Schema(
  {
    display_name: { type: String, required: true },
    products: [ProductSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductSection", ProductSectionSchema);
