const SuggestProductData = require("../model/suggestProductData");

// 📌 Submit Product Suggestion
exports.submitSuggestion = async (req, res) => {
  try {
    const { SKUName, userComment } = req.body;

    if (!SKUName || !userComment) {
      return res.status(400).json({
        success: false,
        message: "Product name and comment are required."
      });
    }

    const newSuggestion = new SuggestProductData({ SKUName, userComment });
    await newSuggestion.save();

    res
      .status(201)
      .json({ success: true, message: "Suggestion submitted successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

// 📌 Fetch All Suggestions (Admin Panel)
exports.getSuggestions = async (req, res) => {
  try {
    const suggestions = await SuggestProductData.find().sort({ createdAt: -1 });
    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};
