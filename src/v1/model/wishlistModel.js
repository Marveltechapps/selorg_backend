const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductStyle",
      required: true
    },
    variantLabel: {
      type: String,
      default: "Default"
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notifyWhenAvailable: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
      unique: true,
      index: true
    },
    items: {
      type: [wishlistItemSchema],
      default: []
    }
  },
  {
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
  }
);

// Virtual for item count
wishlistSchema.virtual("itemCount").get(function () {
  return this.items.length;
});

// Index for faster queries
wishlistSchema.index({ userId: 1 });

module.exports = mongoose.model("Wishlist", wishlistSchema);

