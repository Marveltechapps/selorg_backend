const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const grabEssentialProductSchema = new Schema({
  grabEssential_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GrabEssentials",
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
module.exports = mongoose.model(
  "GrabEssentialProduct",
  grabEssentialProductSchema
);
