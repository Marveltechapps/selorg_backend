const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerProductSchema = new Schema({
  bannerType: {
    type: String,
    enum: ["offer", "festival", "dailyUsage"],
    required: false
  },
  banner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BannerList",
    required: false
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductStyle",
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

module.exports = mongoose.model("BannerProduct", bannerProductSchema);
