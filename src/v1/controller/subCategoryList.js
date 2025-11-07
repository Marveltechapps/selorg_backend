const SubCategoryData = require("../model/subCategoryList");
const CategoryData = require("../model/categoryList");
const mongoose = require("mongoose");
// Create New SubCategory
exports.createSubCategory = async (req, res) => {
  try {
    const { name, imageUrl, category_id } = req.body;

    const newSubCategory = new SubCategoryData({
      name,
      imageUrl,
      // main_category_id,
      category_id
    });

    await newSubCategory.save();

    res.status(201).send({
      status: 201,
      message: "Subcategory created successfully",
      data: newSubCategory
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.message });
  }
};

// Get All SubCategories

exports.getAllSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategoryData.aggregate([
      {
        $lookup: {
          from: "categorydatas", // actual MongoDB collection name for CategoryData
          let: { catId: "$category_id" },
          pipeline: [
            { $unwind: "$categories" },
            {
              $match: {
                $expr: { $eq: ["$categories._id", "$$catId"] }
              }
            },
            {
              $project: {
                _id: 0,
                categoryName: "$categories.name",
                categoryId: "$categories._id"
              }
            }
          ],
          as: "categoryDetails"
        }
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          imageUrl: 1,
          category_id: "$categoryDetails.categoryId",
          category_name: "$categoryDetails.categoryName"
        }
      }
    ]);

    res.status(200).send({
      status: 200,
      message: "Subcategories fetched successfully",
      count: subCategories.length,
      data: subCategories
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.message });
  }
};

// Get SubCategory by ID

exports.getSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const subCategory = await SubCategoryData.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id)
        }
      },
      {
        $lookup: {
          from: "categorydatas", // Actual collection name
          let: { catId: "$category_id" },
          pipeline: [
            { $unwind: "$categories" },
            {
              $match: {
                $expr: { $eq: ["$categories._id", "$$catId"] }
              }
            },
            {
              $project: {
                _id: 0,
                categoryName: "$categories.name",
                categoryId: "$categories._id"
              }
            }
          ],
          as: "categoryDetails"
        }
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          imageUrl: 1,
          category_id: "$categoryDetails.categoryId",
          category_name: "$categoryDetails.categoryName"
        }
      }
    ]);

    if (!subCategory || subCategory.length === 0) {
      return res.status(404).send({ message: "Subcategory not found" });
    }

    res.status(200).send({
      status: 200,
      message: "Subcategory fetched successfully",
      data: subCategory[0] // because aggregate returns array
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.message });
  }
};

// Update SubCategory by ID
exports.updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, imageUrl, category_id } = req.body;

    const updatedSubCategory = await SubCategoryData.findByIdAndUpdate(
      id,
      { name, imageUrl, category_id },
      { new: true, runValidators: true }
    );

    if (!updatedSubCategory) {
      return res.status(404).send({ message: "Subcategory not found" });
    }

    res.status(200).send({
      message: "Subcategory updated successfully",
      data: updatedSubCategory
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.message });
  }
};

// Delete SubCategory by ID
exports.deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSubCategory = await SubCategoryData.findByIdAndDelete(id);

    if (!deletedSubCategory) {
      return res.status(404).send({ message: "Subcategory not found" });
    }

    res.status(200).send({
      message: "Subcategory deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.message });
  }
};

// Get SubCategories by Category ID
// exports.getSubCategoriesByCategory = async (req, res) => {
//   try {
//     const { main_category_id, category_id } = req.params;

//     // Build the query object dynamically based on available parameters
//     const query = {};
//     if (main_category_id) query.main_category_id = main_category_id;
//     if (category_id) query.category_id = category_id;

//     // Fetch subcategories with the query
//     const subCategories = await SubCategoryData.find(query)
//       .populate("main_category_id", "name")
//       .populate("category_id", "name");

//     res.status(200).send({
//       message: "Subcategories fetched successfully",
//       data: subCategories
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: error.message });
//   }
// };

exports.getSubCategoriesByCategory = async (req, res) => {
  try {
    const { category_id } = req.query;

    if (!category_id) {
      return res.status(400).send({
        message: "Please provide category_id"
      });
    }

    const subCategories = await SubCategoryData.aggregate([
      {
        $match: {
          category_id: new mongoose.Types.ObjectId(category_id)
        }
      },
      {
        $lookup: {
          from: "categorydatas", // collection name (lowercase plural of model usually)
          let: { catId: "$category_id" },
          pipeline: [
            { $unwind: "$categories" },
            {
              $match: {
                $expr: { $eq: ["$categories._id", "$$catId"] }
              }
            },
            {
              $project: {
                _id: 0,
                categoryName: "$categories.name",
                categoryId: "$categories._id"
              }
            }
          ],
          as: "categoryDetails"
        }
      },
      {
        $unwind: {
          path: "$categoryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          imageUrl: 1,
          category_id: "$categoryDetails.categoryId",
          category_name: "$categoryDetails.categoryName"
        }
      }
    ]);

    res.status(200).send({
      message: "Subcategories fetched successfully",
      data: subCategories
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: error.message });
  }
};
