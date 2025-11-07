const mongoose = require("mongoose");

const PrivacyPolicySchema = new mongoose.Schema({
  // effectiveDate: {
  //   type: Date,
  //   required: true
  // },
  // lastUpdated: {
  //   type: Date,
  //   default: Date.now
  // },
  // title: {
  //   type: String,
  //   required: true
  // },
  content: {
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

module.exports = mongoose.model("PrivacyPolicy", PrivacyPolicySchema);
