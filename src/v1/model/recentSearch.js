const mongoose = require("mongoose");

const recentSearchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "UserModel" // Reference to a User collection if applicable
  },
  searches: [
    {
      searchText: { type: String, required: true },
      result: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProductStyle" }],
      searchedAt: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model("RecentSearches", recentSearchSchema);
