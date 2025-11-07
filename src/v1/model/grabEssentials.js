const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const grabEssentialsSchema = new Schema({
  imageURL: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CategoryData",
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

module.exports = mongoose.model("GrabEssentials", grabEssentialsSchema);
