const mongoose = require("mongoose");
const VariantSchema = new mongoose.Schema({
  label: { type: String, required: true },
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  offer: { type: String },
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

const ProductStyleSchema = new mongoose.Schema({
  SKUCode: { type: String, required: true, index: true },
  SKUName: { type: String, required: true },
  title: { type: String }, // Alias for SKUName
  productName: { type: String }, // Alias for SKUName
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
  category: { type: String, index: true }, // Denormalized for faster queries
  mainCategory: { type: String, index: true },
  price: { type: Number, required: true, index: true },
  discountPrice: Number,
  offer: { type: String, required: true },
  description: {
    about: { type: String, required: true },
    healthBenefits: { type: String, required: true },
    nutrition: { type: String, required: true },
    origin: { type: String, required: true }
  },
  imageURL: { type: String },
  images: [{ type: String }],
  
  // Inventory tracking
  stock: { type: Number, default: null, min: 0 }, // null means unlimited stock
  lowStockThreshold: { type: Number, default: 10, min: 0 },
  
  // Analytics
  viewCount: { type: Number, default: 0 },
  purchaseCount: { type: Number, default: 0 },
  
  // Ratings
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0, min: 0 },
  
  // Status
  isActive: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false },
  
  // Certifications (organic, vegan, gluten-free, etc.)
  certifications: [{
    type: String,
    enum: ["organic", "vegan", "gluten_free", "non_gmo", "fair_trade", "kosher", "halal", "lactose_free"]
  }],
  
  // Ingredients list
  ingredients: [{ type: String }],
  
  // User segments this product targets
  userSegments: [{
    type: String,
    enum: ["tiny_tummies", "toddler_treats", "adult_wellbeing", "for_her", "golden_years", "smart_snacking"]
  }],
  
  // Health goals this product supports
  healthGoals: [{
    type: String,
    enum: ["improve_immunity", "skin_glow", "weight_management", "heart_health", "digestive_health", "energy_boost", "bone_health"]
  }],
  
  // Metadata
  tags: [{ type: String }],
  metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) }
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtuals
ProductStyleSchema.virtual("isOutOfStock").get(function() {
  return this.stock !== null && this.stock === 0;
});

ProductStyleSchema.virtual("isLowStock").get(function() {
  return this.stock !== null && this.stock <= this.lowStockThreshold && this.stock > 0;
});

ProductStyleSchema.virtual("inStock").get(function() {
  return this.stock === null || this.stock > 0;
});

// Indexes for search and filtering
ProductStyleSchema.index({ SKUName: 'text', productName: 'text', title: 'text', category: 'text' });
ProductStyleSchema.index({ price: 1, averageRating: -1 });
ProductStyleSchema.index({ isActive: 1, isFeatured: 1 });

module.exports = mongoose.model("ProductStyle", ProductStyleSchema);
