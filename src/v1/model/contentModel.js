const mongoose = require("mongoose");

/**
 * Content Model
 * For managing static and dynamic content across the app
 * Used for: FAQs, Terms & Conditions, Privacy Policy, About Us, Help topics
 */
const contentSchema = new mongoose.Schema({
  // Content type/identifier
  type: {
    type: String,
    required: true,
    unique: true,
    enum: [
      "terms_and_conditions",
      "privacy_policy",
      "about_us",
      "refund_policy",
      "shipping_policy",
      "faq_general",
      "faq_order",
      "faq_payment",
      "faq_shipping",
      "help_topic",
      "announcement",
      "custom"
    ],
    index: true
  },
  
  // Content details
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  content: {
    type: String,
    required: true
  },
  
  // HTML or markdown
  contentFormat: {
    type: String,
    enum: ["html", "markdown", "text"],
    default: "html"
  },
  
  // Summary/excerpt
  excerpt: {
    type: String,
    trim: true
  },
  
  // Icon/Image
  iconUrl: {
    type: String
  },
  
  imageUrl: {
    type: String
  },
  
  // For FAQs
  category: {
    type: String
  },
  
  // For FAQs - Question & Answer format
  qa: {
    question: { type: String },
    answer: { type: String }
  },
  
  // SEO
  metaTitle: {
    type: String
  },
  
  metaDescription: {
    type: String
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  
  publishedAt: {
    type: Date
  },
  
  // Versioning
  version: {
    type: Number,
    default: 1
  },
  
  lastModifiedBy: {
    type: String
  },
  
  // Display order
  priority: {
    type: Number,
    default: 0,
    index: true
  },
  
  // Tags for search/filtering
  tags: [{ type: String }],
  
  // Metadata
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
contentSchema.index({ type: 1, isActive: 1, priority: -1 });
contentSchema.index({ category: 1, isActive: 1 });
contentSchema.index({ tags: 1 });

// Virtual for URL
contentSchema.virtual("url").get(function() {
  return `/content/${this.slug}`;
});

// Pre-save hook to generate slug if not provided
contentSchema.pre("save", function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

// Pre-save hook for publish date
contentSchema.pre("save", function(next) {
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model("Content", contentSchema);



