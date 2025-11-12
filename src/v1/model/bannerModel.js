const mongoose = require("mongoose");

/**
 * Banner Model
 * For managing promotional banners across the app
 * Used in: Home screen, Category pages, Special promotions
 */
const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  subtitle: {
    type: String,
    trim: true
  },
  
  description: {
    type: String,
    trim: true
  },
  
  imageUrl: {
    type: String,
    required: true
  },
  
  // Mobile and desktop versions
  mobileImageUrl: {
    type: String
  },
  
  desktopImageUrl: {
    type: String
  },
  
  // Banner type
  type: {
    type: String,
    enum: ["hero", "category", "promotion", "announcement", "flash_sale"],
    default: "hero"
  },
  
  // Placement
  placement: {
    type: String,
    enum: ["home_top", "home_middle", "home_bottom", "category_top", "product_detail", "cart", "checkout"],
    default: "home_top",
    index: true
  },
  
  // Category association (for category-specific banners)
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CategoryData"
  },
  
  categoryName: {
    type: String
  },
  
  // Action on click
  action: {
    type: {
      type: String,
      enum: ["none", "navigate", "external_link", "product", "category", "search"],
      default: "none"
    },
    target: { type: String }, // URL, productId, categoryId, search term
    params: { type: mongoose.Schema.Types.Mixed }
  },
  
  // Call to action button
  ctaText: {
    type: String,
    default: "Explore Now"
  },
  
  ctaColor: {
    type: String,
    default: "#4CAF50"
  },
  
  // Scheduling
  startDate: {
    type: Date,
    default: Date.now
  },
  
  endDate: {
    type: Date
  },
  
  // Display priority
  priority: {
    type: Number,
    default: 0,
    index: true
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Targeting
  targetAudience: {
    userSegments: [{ type: String }], // e.g., ["tiny_tummies", "adult_wellbeing"]
    minOrderCount: { type: Number }, // Minimum previous orders
    isNewUser: { type: Boolean } // Target only new users
  },
  
  // Analytics
  impressions: {
    type: Number,
    default: 0
  },
  
  clicks: {
    type: Number,
    default: 0
  },
  
  // Metadata
  tags: [{ type: String }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
bannerSchema.index({ placement: 1, isActive: 1, priority: -1 });
bannerSchema.index({ categoryId: 1, isActive: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

// Virtual for checking if banner is currently active
bannerSchema.virtual("isCurrentlyActive").get(function() {
  const now = new Date();
  const isScheduledActive = (!this.startDate || this.startDate <= now) && 
                             (!this.endDate || this.endDate >= now);
  return this.isActive && isScheduledActive;
});

// Virtual for CTR (Click-through rate)
bannerSchema.virtual("ctr").get(function() {
  if (this.impressions === 0) return 0;
  return ((this.clicks / this.impressions) * 100).toFixed(2);
});

module.exports = mongoose.model("Banner", bannerSchema);



