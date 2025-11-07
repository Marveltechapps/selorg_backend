const MainCategoryData = require("../model/mainCategory");

// categoryController.js
exports.createCategory = async (req, res) => {
  try {
    const { name, imageUrl } = req.body;

    if (!name) {
      throw new Error("Name is required");
    }

    const newCategory = new MainCategoryData({ name, imageUrl });
    await newCategory.save();

    return res.send({
      status: 200,
      message: "Category Created Successfully",
      data: newCategory
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error.message });
  }
};

exports.getAllCategories = async function (req, res) {
  try {
    const getData = await MainCategoryData.find({});
    if (!getData) {
      return res.send({
        status: 404,
        message: "MainCategory not found"
      });
    }
    return res.send({
      status: 200,
      message: "Main Category listed successfully",
      data: getData
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Failed to retrieve Maincategory",
      error: error.message
    });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await MainCategoryData.findById(categoryId);

    if (!category) {
      return res.status(404).send({ error: "Category not found" });
    }

    res.status(200).json({
      status: 200,
      message: "Success",
      data: category
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, status } = req.body;

    const updatedCategory = await MainCategoryData.findByIdAndUpdate(
      categoryId,
      { name, status },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).send({ error: "Category not found" });
    }

    res.status(200).json({
      status: 200,
      message: "Category updated successfully",
      data: updatedCategory
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const deletedCategory = await MainCategoryData.findByIdAndDelete(
      categoryId
    );

    if (!deletedCategory) {
      return res.status(404).send({ error: "Category not found" });
    }

    res.status(200).json({
      status: 200,
      message: "Category deleted successfully",
      data: deletedCategory
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error.message });
  }
};
