const GrabEssentialProduct = require("../model/grabEssentialProduct");

// Create a new GrabEssentialProduct
exports.createGrabEssentialProduct = async (req, res) => {
  try {
    const { grabEssential_id, product_id } = req.body;

    const newProduct = new GrabEssentialProduct({
      grabEssential_id,
      product_id
    });

    await newProduct.save();
    res.status(201).json({
      message: "GrabEssentialProduct created successfully",
      data: newProduct
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating product", error: error.message });
  }
};

// Get all GrabEssentialProducts
exports.getAllGrabEssentialProducts = async (req, res) => {
  try {
    const { grabEssential_id, product_id, page = 1, limit = 10 } = req.query;

    let query = {};

    if (grabEssential_id) query.grabEssential_id = grabEssential_id;
    if (product_id) query.product_id = product_id;

    const skip = (page - 1) * limit;

    // Fetch total count of documents matching the query
    const totalCount = await GrabEssentialProduct.countDocuments(query);

    // Fetch paginated products
    const products = await GrabEssentialProduct.find(query)
      .populate(["grabEssential_id", "product_id"])
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      status: 200,
      message: "Filtered Grab Essential Products retrieved successfully",
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount: totalCount,
      limit: parseInt(limit),
      data: products
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching products",
      error: error.message
    });
  }
};

// Get a single GrabEssentialProduct by ID
exports.getGrabEssentialProductById = async (req, res) => {
  try {
    const product = await GrabEssentialProduct.findById(req.params.id).populate(
      ["grabEssential_id", "product_id"]
    );
    if (!product) return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching product", error: error.message });
  }
};

// Update a GrabEssentialProduct by ID
exports.updateGrabEssentialProduct = async (req, res) => {
  try {
    const updatedProduct = await GrabEssentialProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate(["grabEssential_id", "product_id"]);

    if (!updatedProduct)
      return res.status(404).json({ message: "Product not found" });

    res
      .status(200)
      .json({ message: "Product updated successfully", data: updatedProduct });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
};

// Delete a GrabEssentialProduct by ID
exports.deleteGrabEssentialProduct = async (req, res) => {
  try {
    const deletedProduct = await GrabEssentialProduct.findByIdAndDelete(
      req.params.id
    );
    if (!deletedProduct)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};
