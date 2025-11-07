// controllers/categoryGroup.controller.js
const CategoryGroup = require("../model/homeCategoryModel");

// Create a new Category Group
exports.createCategoryGroup = async (req, res) => {
  try {
    const categoryGroup = await CategoryGroup.create(req.body);
    res.status(201).json({ success: true, data: categoryGroup });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all Category Groups
exports.getAllCategoryGroups = async (req, res) => {
  try {
    const groups = await CategoryGroup.find();
    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get a Category Group by ID
exports.getCategoryGroupById = async (req, res) => {
  try {
    const group = await CategoryGroup.findById(req.params.id);
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
exports.updateCategoryGroup = async (req, res) => {
  try {
    const updated = await CategoryGroup.findByIdAndUpdate(
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
exports.deleteCategoryGroup = async (req, res) => {
  try {
    const deleted = await CategoryGroup.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    res.status(200).json({ success: true, message: "Group deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
