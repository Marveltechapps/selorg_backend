const BannerProduct = require("../model/bannerProductList");
const CartModel = require("../model/cartList");
const UserModel = require("../model/userModel");
const ProductStyle = require("../model/productStyle");
const mongoose = require("mongoose");

// Create a banner product entry
exports.createData = async (req, res) => {
  try {
    const { bannerType, banner_id, product_id } = req.body;

    // Validate product ID
    const product = await ProductStyle.findById(product_id);
    if (!product) {
      return res.status(404).send({
        status: 404,
        message: "Product not found"
      });
    }

    // Create a new banner product entry
    const newBannerProduct = new BannerProduct({
      bannerType,
      banner_id,
      product_id
    });

    const savedEntry = await newBannerProduct.save();

    return res.status(201).send({
      status: 201,
      message: "Banner product entry created successfully",
      data: savedEntry
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: "Failed to create banner product entry",
      error: error.message
    });
  }
};

// Retrieve products based on a banner ID
exports.getData = async (req, res) => {
  try {
    const { banner_id, product_id, mobileNumber } = req.query;

    const query = { banner_id };
    if (product_id) {
      query.product_id = product_id;
    }

    const bannerProductEntries = await BannerProduct.find(query).populate({
      path: "product_id",
      populate: [
        // { path: "main_category_id", select: "name" },
        { path: "category_id", select: "name" },
        { path: "subCategory_id", select: "name" }
      ]
    });

    if (bannerProductEntries.length === 0) {
      return res.status(404).send({
        status: 404,
        message: "No products found for this banner"
      });
    }

    let cartItems = [];

    // Only fetch cart items if mobileNumber is provided
    if (mobileNumber) {
      const user = await UserModel.findOne({ mobileNumber });
      if (user) {
        const userCart = await CartModel.findOne({ userId: user._id });
        cartItems = userCart ? userCart.items : [];
      }
    }

    const products = bannerProductEntries.map((entry) => {
      const product = entry.product_id;
      const updatedVariants = product.variants.map((variant) => {
        let cartQuantity = 0;

        if (mobileNumber) {
          const cartItem = cartItems.find(
            (item) =>
              item.productId.toString() === product._id.toString() &&
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
        productId: product._id,
        // main_category_id: product.main_category_id?._id || null,
        // mainCategoryName: product.main_category_id?.name || null,
        categoryId: product.category_id?._id || null,
        categoryName: product.category_id?.name || null,
        subCategoryId: product.subCategory_id?._id || null,
        subCategoryName: product.subCategory_id?.name || null,
        skucode: product.SKUCode,
        skuName: product.SKUName,
        offer: product.offer,
        discountPrice: product.discountPrice,
        variants: updatedVariants
      };
    });

    return res.status(200).send({
      status: 200,
      message: "Products retrieved successfully based on banner",
      data: products
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: "Failed to retrieve products based on banner",
      error: error.message
    });
  }
};

// Retrieve a specific banner product entry by ID
exports.getDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const { mobileNumber } = req.query;

    const bannerProductEntry = await BannerProduct.findById(id).populate({
      path: "product_id",
      populate: [
        // { path: "main_category_id", select: "name" },
        { path: "category_id", select: "name" },
        { path: "subCategory_id", select: "name" }
      ]
    });

    if (!bannerProductEntry) {
      return res.status(404).send({
        status: 404,
        message: "Banner Product Not Found"
      });
    }

    let cartItems = [];

    if (mobileNumber) {
      const user = await UserModel.findOne({ mobileNumber });
      if (user) {
        const userCart = await CartModel.findOne({ userId: user._id });
        cartItems = userCart ? userCart.items : [];
      }
    }

    const product = bannerProductEntry.product_id;
    const updatedVariants = product.variants.map((variant) => {
      let cartQuantity = 0;

      if (mobileNumber) {
        const cartItem = cartItems.find(
          (item) =>
            item.productId.toString() === product._id.toString() &&
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
      message: "Banner product retrieved successfully",
      data: {
        productId: product._id,
        // main_category_id: product.main_category_id?._id || null,
        // mainCategoryName: product.main_category_id?.name || null,
        categoryId: product.category_id?._id || null,
        categoryName: product.category_id?.name || null,
        subCategoryId: product.subCategory_id?._id || null,
        subCategoryName: product.subCategory_id?.name || null,
        skucode: product.SKUCode,
        skuName: product.SKUName,
        offer: product.offer,
        discountPrice: product.discountPrice,
        variants: updatedVariants
      }
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: "Failed to retrieve banner product",
      error: error.message
    });
  }
};

// Update a banner product entry
exports.updateData = async (req, res) => {
  try {
    const updatedData = await BannerProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("product_id");
    if (!updatedData) {
      return res.status(404).send({
        status: 404,
        message: "Banner Product Not found"
      });
    }
    return res.status(200).send({
      status: 200,
      message: "Banner Product updated successfully",
      data: updatedData
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: "Failed to update banner product",
      error: error.message
    });
  }
};

// Delete a banner product entry
exports.deleteData = async (req, res) => {
  try {
    const deletedData = await BannerProduct.findByIdAndDelete(req.params.id);
    if (!deletedData) {
      return res.status(404).send({
        status: 404,
        message: "Banner Product not found"
      });
    }
    return res.status(200).send({
      status: 200,
      message: "Banner Product deleted successfully",
      data: deletedData
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: "Failed to delete banner product",
      error: error.message
    });
  }
};
