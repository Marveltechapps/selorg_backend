const ProductBanner = require("../model/productBanner");

// Create a new product banner
exports.createData = async (req, res) => {
  try {
    const productBanner = new ProductBanner(req.body);
    const savedProductBanner = await productBanner.save();
    res.status(201).json({
      status: 201,
      message: "Product banner created successfully",
      data: savedProductBanner
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
};

// Get product banners with filters and pagination
exports.getData = async (req, res) => {
  try {
    const {
      // main_category_id,
      category_id,
      subCategory_id,
      variantLabel,
      variantPrice,
      banner_id,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    // Add filters dynamically
    // if (main_category_id) query.main_category_id = main_category_id;
    if (category_id) query.category_id = category_id;
    if (subCategory_id) query.subCategory_id = subCategory_id;
    if (banner_id) query.banner_id = banner_id;

    // Add variant filter dynamically
    if (variantLabel || variantPrice) {
      query.variants = {};
      if (variantLabel)
        query["variants.label"] = { $regex: variantLabel, $options: "i" };
      if (variantPrice) query["variants.price"] = parseFloat(variantPrice);
    }

    const skip = (page - 1) * limit;

    // Fetch banners with query
    const results = await ProductBanner.find(query)
      .populate([
        // "main_category_id",
        "category_id",
        "subCategory_id",
        "banner_id"
      ])
      .skip(skip)
      .limit(parseInt(limit));

    const makeArray = results.map((product) => ({
      productId: product._id,
      // main_category_id: product.main_category_id?._id || null,
      // mainCategoryName: product.main_category_id?.name || null,
      categoryId: product.category_id?._id || null,
      categoryName: product.category_id?.name || null,
      subCategoryId: product.subCategory_id?._id || null,
      subCategoryName: product.subCategory_id?.name || null,
      skucode: product.SKUCode,
      skuName: product.SKUName,
      imageurl: product.imageURL,
      banner_id: product.banner_id?._id || null,
      variants: product.variants.map((variant) => ({
        label: variant.label,
        price: variant.price,
        discountPrice: variant.discountPrice || null,
        offer: variant.offer,
        isComboPack: variant.isComboPack,
        isMultiPack: variant.isMultiPack,
        stockQuantity: variant.stockQuantity,
        isOutOfStock: variant.isOutOfStock,
        imageURL: variant.imageURL
      })),
      offer: product.offer,
      discountPrice: product.discountPrice
    }));

    if (!makeArray.length) {
      return res
        .status(404)
        .json({ msg: "No products match the given criteria" });
    }

    const totalDocuments = await ProductBanner.countDocuments(query);

    res.status(200).json({
      status: 200,
      message: "Rice cereals retrieved successfully",
      data: makeArray,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalDocuments / limit),
        totalDocuments
      }
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
};

// Get a product banner by ID
exports.getDataById = async (req, res) => {
  try {
    const productBanner = await ProductBanner.findById(req.params.id).populate([
      // "main_category_id",
      "category_id",
      "subCategory_id"
    ]);
    if (!productBanner) {
      return res
        .status(404)
        .json({ status: 404, message: "Product banner not found" });
    }
    res.status(200).json({
      status: 200,
      message: "Product banner retrieved successfully",
      data: productBanner
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
};

// Update a product banner
exports.updateData = async (req, res) => {
  try {
    const updatedProductBanner = await ProductBanner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProductBanner) {
      return res
        .status(404)
        .json({ status: 404, message: "Product banner not found" });
    }
    res.status(200).json({
      status: 200,
      message: "Product banner updated successfully",
      data: updatedProductBanner
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
};

// Delete a product banner
exports.deleteData = async (req, res) => {
  try {
    const deletedProductBanner = await ProductBanner.findByIdAndDelete(
      req.params.id
    );
    if (!deletedProductBanner) {
      return res
        .status(404)
        .json({ status: 404, message: "Product banner not found" });
    }
    res.status(200).json({
      status: 200,
      message: "Product banner deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ status: 500, message: error.message });
  }
};
