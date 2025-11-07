const SimilarProduct = require("../model/similarProductModel");
const ProductStyle = require("../model/productStyle");
const CartModel = require("../model/cartList");
const UserModel = require("../model/userModel");

// Create a similar product entry
exports.createData = async (req, res) => {
  try {
    const { productId, similarProductId } = req.body;

    // Create a new similar product entry
    const newSimilarProduct = new SimilarProduct({
      productId,
      similarProductId
    });

    const savedEntry = await newSimilarProduct.save();

    return res.status(201).send({
      status: 201,
      message: "Similar product entry created successfully",
      data: savedEntry
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: "Failed to create similar product entry",
      error: error.message
    });
  }
};

// Retrieve similar products for a given product ID
exports.getData = async (req, res) => {
  try {
    const { productId, mobileNumber } = req.query;

    if (!productId) {
      return res.status(400).send({
        status: 400,
        message: "Product ID is required"
      });
    }

    let cartItems = [];

    // If mobileNumber is given, fetch user and their cart
    if (mobileNumber) {
      const user = await UserModel.findOne({ mobileNumber });
      if (!user) {
        return res.status(404).send({
          status: 404,
          message: "User not found"
        });
      }

      const userCart = await CartModel.findOne({ userId: user._id });
      cartItems = userCart ? userCart.items : [];
    }

    const similarProductEntries = await SimilarProduct.find({
      productId
    }).populate({
      path: "similarProductId",
      populate: [
        // { path: "main_category_id", select: "name" },
        { path: "category_id", select: "name" },
        { path: "subCategory_id", select: "name" }
      ]
    });

    if (!similarProductEntries.length) {
      return res.status(404).send({
        status: 404,
        message: "No similar products found"
      });
    }

    const similarProducts = similarProductEntries.map((entry) => {
      const similarProduct = entry.similarProductId;
      const updatedVariants = similarProduct.variants.map((variant) => {
        let cartQuantity = 0;

        if (mobileNumber) {
          const cartItem = cartItems.find(
            (item) =>
              item.productId.toString() === similarProduct._id.toString() &&
              item.variantLabel === variant.label
          );
          cartQuantity = cartItem ? cartItem.quantity : 0;
        }

        return {
          ...variant.toObject(),
          cartQuantity,
          stockQuantity: Math.max(0, variant.stockQuantity - cartQuantity),
          isOutOfStock: variant.stockQuantity - cartQuantity <= 0
        };
      });

      return {
        similar_productId: similarProduct._id,
        // main_category_id: similarProduct.main_category_id?._id || null,
        // mainCategoryName: similarProduct.main_category_id?.name || null,
        categoryId: similarProduct.category_id?._id || null,
        categoryName: similarProduct.category_id?.name || null,
        subCategoryId: similarProduct.subCategory_id?._id || null,
        subCategoryName: similarProduct.subCategory_id?.name || null,
        skucode: similarProduct.SKUCode,
        skuName: similarProduct.SKUName,
        offer: similarProduct.offer,
        discountPrice: similarProduct.discountPrice,
        variants: updatedVariants
      };
    });

    return res.status(200).send({
      status: 200,
      message: "Similar products retrieved successfully",
      data: similarProducts
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: "Failed to retrieve similar products",
      error: error.message
    });
  }
};

// Retrieve a specific similar product entry by ID
exports.getDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const { mobileNumber } = req.query;

    let cartItems = [];

    // Only check user and cart if mobileNumber is provided
    if (mobileNumber) {
      const user = await UserModel.findOne({ mobileNumber });
      if (!user) {
        return res.status(404).send({
          status: 404,
          message: "User not found"
        });
      }

      const userCart = await CartModel.findOne({ userId: user._id });
      cartItems = userCart ? userCart.items : [];
    }

    const similarProductEntry = await SimilarProduct.findById(id).populate({
      path: "similarProductId",
      populate: [
        // { path: "main_category_id", select: "name" },
        { path: "category_id", select: "name" },
        { path: "subCategory_id", select: "name" }
      ]
    });

    if (!similarProductEntry) {
      return res.status(404).send({
        status: 404,
        message: "Similar Product Not Found"
      });
    }

    const similarProduct = similarProductEntry.similarProductId;

    const updatedVariants = similarProduct.variants.map((variant) => {
      let cartQuantity = 0;

      if (mobileNumber) {
        const cartItem = cartItems.find(
          (item) =>
            item.productId.toString() === similarProduct._id.toString() &&
            item.variantLabel === variant.label
        );
        cartQuantity = cartItem ? cartItem.quantity : 0;
      }

      return {
        ...variant.toObject(),
        cartQuantity,
        stockQuantity: Math.max(0, variant.stockQuantity - cartQuantity),
        isOutOfStock: variant.stockQuantity - cartQuantity <= 0
      };
    });

    return res.status(200).send({
      status: 200,
      message: "Similar product retrieved successfully",
      data: {
        similar_productId: similarProduct._id,
        // main_category_id: similarProduct.main_category_id?._id || null,
        // mainCategoryName: similarProduct.main_category_id?.name || null,
        categoryId: similarProduct.category_id?._id || null,
        categoryName: similarProduct.category_id?.name || null,
        subCategoryId: similarProduct.subCategory_id?._id || null,
        subCategoryName: similarProduct.subCategory_id?.name || null,
        skucode: similarProduct.SKUCode,
        skuName: similarProduct.SKUName,
        offer: similarProduct.offer,
        discountPrice: similarProduct.discountPrice,
        variants: updatedVariants
      }
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: "Failed to retrieve similar product",
      error: error.message
    });
  }
};

// Update a similar product entry
exports.updateData = async (req, res) => {
  try {
    const updatedData = await SimilarProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("similarProductId");
    if (!updatedData) {
      return res.status(404).send({
        status: 404,
        message: "Similar Product Not found"
      });
    }
    return res.status(200).send({
      status: 200,
      message: "Similar Product updated successfully",
      data: updatedData
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: "Failed to update similar product",
      error: error.message
    });
  }
};

// Delete a similar product entry
exports.deleteData = async (req, res) => {
  try {
    const deletedData = await SimilarProduct.findByIdAndDelete(req.params.id);
    if (!deletedData) {
      return res.status(404).send({
        status: 404,
        message: "Similar Product not found"
      });
    }
    return res.status(200).send({
      status: 200,
      message: "Similar Product deleted successfully",
      data: deletedData
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: "Failed to delete similar product",
      error: error.message
    });
  }
};
