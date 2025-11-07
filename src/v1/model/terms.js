const mongoose = require("mongoose");

const termsSchema = new mongoose.Schema({
  // title: {
  //   type: String,
  //   required: true,
  //   trim: true
  // },
  content: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Export the model based on the schema
module.exports = mongoose.model("Terms", termsSchema);
