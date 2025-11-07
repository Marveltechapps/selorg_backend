// src/v1/controllers/grabEssentialsController.js

const GrabEssentials = require("../model/grabEssentials");
const CategoryData = require("../model/categoryList");

const mongoose = require("mongoose");

// ✅ Create Grab Essential
exports.createGrabEssential = async (req, res) => {
  try {
    const { imageURL, name, category_id } = req.body;

    const newItem = new GrabEssentials({ imageURL, name, category_id });
    const savedItem = await newItem.save();

    res.status(201).json({
      status: 201,
      message: "Grab Essential created successfully",
      data: savedItem
    });
  } catch (err) {
    res
      .status(500)
      .json({ status: 500, message: "Create failed", error: err.message });
  }
};

// ✅ Get All Grab Essentials with category lookup
exports.getAllGrabEssentials = async (req, res) => {
  try {
    const essentials = await GrabEssentials.find();

    const populatedItems = await Promise.all(
      essentials.map(async (item) => {
        let categoryInfo = null;

        if (item.category_id) {
          const categoryDoc = await CategoryData.findOne({
            "categories._id": new mongoose.Types.ObjectId(item.category_id)
          });

          if (categoryDoc) {
            const matchedCategory = categoryDoc.categories.find(
              (cat) => cat._id.toString() === item.category_id.toString()
            );

            categoryInfo = {
              categoryGroupTitle: categoryDoc.category_title_name,
              category: matchedCategory
            };
          }
        }

        return {
          ...item.toObject(),
          categoryInfo
        };
      })
    );

    res.status(200).json({
      status: 200,
      message: "Grab Essentials fetched successfully",
      data: populatedItems
    });
  } catch (err) {
    res
      .status(500)
      .json({ status: 500, message: "Fetch failed", error: err.message });
  }
};

// ✅ Get Grab Essential by ID
exports.getGrabEssentialById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await GrabEssentials.findById(id);
    if (!item)
      return res.status(404).json({ status: 404, message: "Not found" });

    let categoryInfo = null;

    if (item.category_id) {
      const categoryDoc = await CategoryData.findOne({
        "categories._id": new mongoose.Types.ObjectId(item.category_id)
      });

      if (categoryDoc) {
        const matchedCategory = categoryDoc.categories.find(
          (cat) => cat._id.toString() === item.category_id.toString()
        );

        categoryInfo = {
          categoryGroupTitle: categoryDoc.category_title_name,
          category: matchedCategory
        };
      }
    }

    res.status(200).json({
      status: 200,
      message: "Item fetched",
      data: {
        ...item.toObject(),
        categoryInfo
      }
    });
  } catch (err) {
    res
      .status(500)
      .json({ status: 500, message: "Fetch by ID failed", error: err.message });
  }
};

// ✅ Update Grab Essential
exports.updateGrabEssential = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageURL, name, category_id } = req.body;

    const updated = await GrabEssentials.findByIdAndUpdate(
      id,
      { imageURL, name, category_id, updatedAt: new Date() },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ status: 404, message: "Not found" });

    res.status(200).json({ status: 200, message: "Updated", data: updated });
  } catch (err) {
    res
      .status(500)
      .json({ status: 500, message: "Update failed", error: err.message });
  }
};

// ✅ Delete Grab Essential
exports.deleteGrabEssential = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await GrabEssentials.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ status: 404, message: "Not found" });

    res.status(200).json({ status: 200, message: "Deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ status: 500, message: "Delete failed", error: err.message });
  }
};
