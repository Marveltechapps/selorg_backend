// controllers/CategoryData.controller.js
const CategoryData = require("../model/categoryList");

// Create a new Category Group
exports.createCategoryData = async (req, res) => {
  try {
    const savedData = await CategoryData.create(req.body);
    res.status(201).json({ success: true, data: savedData });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all Category Groups
exports.getAllCategoryDatas = async (req, res) => {
  try {
    const groups = await CategoryData.find();
    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a Category Group by ID
exports.getCategoryDataById = async (req, res) => {
  try {
    const group = await CategoryData.findById(req.params.id);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    res.status(200).json({ success: true, data: group });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update a Category Group by ID
exports.updateCategoryData = async (req, res) => {
  try {
    const updated = await CategoryData.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete a Category Group
exports.deleteCategoryData = async (req, res) => {
  try {
    const deleted = await CategoryData.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    res.status(200).json({ success: true, message: "Group deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
