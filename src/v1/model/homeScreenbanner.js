const mongoose = require("mongoose");

const homeScreenBannerSchema = new mongoose.Schema({
  imageURL: {
    type: String,
    required: true
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

module.exports = mongoose.model("HomeScreenBanner", homeScreenBannerSchema);
