const ProductStyle = require("../model/productStyle"); // Replace with actual path
const RecentSearch = require("../model/recentSearch"); // Replace with actual path

// Search Products
exports.searchProducts = async (req, res) => {
  const { userId, searchText } = req.body;

  try {
    // Find products based on SKUName or similar fields
    const products = await ProductStyle.find({
      SKUName: { $regex: searchText, $options: "i" }
    });

    if (products.length === 0) {
      return res.status(404).json({ message: "No products found." });
    }

    // Update or Add Recent Search
    let recentSearch = await RecentSearch.findOne({ userId });

    if (!recentSearch) {
      // Create new recent search document if not found
      recentSearch = new RecentSearch({ userId, searches: [] });
    }

    // Add the new search to the searches array
    recentSearch.searches.unshift({
      searchText,
      result: products.map((p) => p._id)
    });

    // Keep only the latest 5 searches
    if (recentSearch.searches.length > 5) {
      recentSearch.searches.pop();
    }

    await recentSearch.save();

    res.status(200).json({ message: "Search successful", products });
  } catch (err) {
    console.error("Error during product search:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Recent Searches
exports.getRecentSearches = async (req, res) => {
  const { userId } = req.params;

  try {
    const recentSearch = await RecentSearch.findOne({ userId }).populate(
      "searches.result"
    );

    if (!recentSearch) {
      return res.status(404).json({ message: "No recent searches found." });
    }

    res.status(200).json({ recentSearches: recentSearch.searches });
  } catch (err) {
    console.error("Error fetching recent searches:", err);
    res.status(500).json({ message: "Server error" });
  }
};
