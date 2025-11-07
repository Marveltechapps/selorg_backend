const ProductStyle = require("../model/productStyle");
const CartModel = require("../model/cartList");
const UserModel = require("../model/userModel");
const CategoryData = require("../model/categoryList");
const mongoose = require("mongoose");
// const SubCategoryData = require("../model/subCategoryList");
const Fuse = require("fuse.js");
exports.createData = async (req, res) => {
  try {
    const newData = new ProductStyle(req.body);
    const savedData = await newData.save();
    if (!savedData) {
      return res.send({
        status: 404,
        message: "All the fields are required"
      });
    }

    return res.send({
      status: 201,
      message: "Product created Successfully",
      data: savedData
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error.message });
  }
};

exports.getData = async (req, res) => {
  try {
    const {
      categoryId,
      subCategoryId,
      variantLabel,
      variantPrice,
      page = 1,
      limit = 10,
      mobileNumber
    } = req.query;

    let cartItems = [];
    let user = null;

    if (mobileNumber) {
      user = await UserModel.findOne({ mobileNumber });
      if (user) {
        const userCart = await CartModel.findOne({ userId: user._id });
        cartItems = userCart?.items || [];
      }
    }

    const currentUserId = user?._id?.toString();

    let query = {};
    if (categoryId) query.category_id = categoryId;
    if (subCategoryId) query.subCategory_id = subCategoryId;

    if (variantLabel || variantPrice) {
      query.variants = {};
      if (variantLabel) {
        query.variants.label = { $regex: variantLabel, $options: "i" };
      }
      if (variantPrice) {
        query.variants.price = parseFloat(variantPrice);
      }
    }

    const totalDocuments = await ProductStyle.countDocuments(query);
    const skip = (page - 1) * limit;

    // 🔥 FRESH DATA FETCH - This will get the updated cartQuantity values
    const products = await ProductStyle.find(query)
      .populate([{ path: "subCategory_id", model: "SubCategoryData" }])
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() for better performance

    const productList = [];

    for (const product of products) {
      const productId = product._id.toString();

      let totalQuantity = 0;
      let totalPrice = 0;
      const productQuantities = [];

      const updatedVariants = product.variants.map((variant) => {
        const label = variant.label;
        const cartItem = cartItems.find(
          (item) =>
            item.productId.toString() === productId &&
            item.variantLabel === label
        );

        const userCartQuantity = cartItem ? cartItem.quantity : 0;
        // 🔥 FIXED: Now getting the updated cartQuantity from database
        const totalCartQuantity = variant.cartQuantity || 0;

        // Show cartQuantity only for the current user
        const cartQuantityToShow =
          currentUserId === user?._id?.toString() ? totalCartQuantity : 0;

        totalQuantity += userCartQuantity;
        totalPrice += userCartQuantity * variant.price;

        productQuantities.push({
          productId: product._id,
          variantLabel: label,
          variantQuantity: userCartQuantity,
          variantPrice: variant.price * userCartQuantity
        });

        return {
          ...variant,
          userCartQuantity,
          cartQuantity: cartQuantityToShow,
          stockQuantity: Math.max(0, variant.stockQuantity - totalCartQuantity),
          isOutOfStock: variant.stockQuantity - totalCartQuantity <= 0
        };
      });

      let categoryName = null;
      if (product.category_id) {
        try {
          const categoryIdObj =
            typeof product.category_id === "string"
              ? new mongoose.Types.ObjectId(product.category_id)
              : product.category_id;

          const categoryGroup = await CategoryData.findOne({
            "categories._id": categoryIdObj
          });

          if (categoryGroup) {
            const matchedCategory = categoryGroup.categories.find(
              (cat) => cat._id.toString() === product.category_id.toString()
            );
            categoryName = matchedCategory?.name || null;
          }
        } catch (err) {
          console.error("Error fetching category:", err.message);
        }
      }

      productList.push({
        productId: product._id,
        categoryId: product.category_id || null,
        categoryName,
        subCategoryId: product.subCategory_id?._id || null,
        subCategoryName: product.subCategory_id?.name || null,
        skucode: product.SKUCode,
        skuName: product.SKUName,
        variants: updatedVariants,
        offer: product.offer,
        discountPrice: product.discountPrice,
        cartSummary: {
          totalQuantity,
          totalPrice,
          productQuantities
        }
      });
    }

    if (productList.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "No products match the given criteria"
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Filtered products retrieved successfully",
      data: productList,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalDocuments / limit),
        totalDocuments
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { query, mobileNumber } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    let cartItems = [];

    // Optional: If mobileNumber is provided, fetch user and cart
    if (mobileNumber) {
      const user = await UserModel.findOne({ mobileNumber });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userCart = await CartModel.findOne({ userId: user._id });
      cartItems = userCart ? userCart.items : [];
    }

    // Fetch all products
    const allProducts = await ProductStyle.find().populate([
      // "main_category_id",
      "category_id",
      "subCategory_id"
    ]);

    // Fuse.js search configuration
    const options = {
      keys: ["SKUName"],
      threshold: 0.3
    };

    const fuse = new Fuse(allProducts, options);
    const result = fuse.search(query);

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found matching the query" });
    }

    // Extract and update products
    const updatedProducts = result.map(({ item: product }) => {
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
          cartQuantity: cartQuantity
        };
      });

      return {
        ...product.toObject(),
        variants: updatedVariants
      };
    });

    res.status(200).json({
      status: 200,
      message: "Products retrieved successfully",
      data: updatedProducts
    });
  } catch (err) {
    console.error("Search Error:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
exports.getDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const { mobileNumber } = req.query;

    let cartItems = [];

    if (mobileNumber) {
      const user = await UserModel.findOne({ mobileNumber });
      if (user) {
        const userCart = await CartModel.findOne({ userId: user._id });
        cartItems = userCart?.items || [];
      }
    }

    const product = await ProductStyle.findById(id).populate([
      { path: "category_id", model: "CategoryData" },
      { path: "subCategory_id", model: "SubCategoryData" }
    ]);

    if (!product) {
      return res.status(404).json({
        status: 404,
        message: "Product Not Found"
      });
    }

    let category = product.category_id;

    if (!category && product.subCategory_id?.category_id) {
      try {
        const categoryObjId = new mongoose.Types.ObjectId(
          product.subCategory_id.category_id
        );

        const categoryData = await CategoryData.findOne({
          "categories._id": categoryObjId
        });

        if (categoryData) {
          const matchedCategory = categoryData.categories.find(
            (cat) =>
              cat._id.toString() ===
              product.subCategory_id.category_id.toString()
          );
          if (matchedCategory) {
            category = matchedCategory;
          }
        }
      } catch (err) {
        console.error("Error fetching fallback category:", err.message);
      }
    }

    let overallProductQuantity = 0;
    let overallProductPrice = 0;
    const productDetails = [];

    const updatedVariants = product.variants.map((variant) => {
      const cartItem = cartItems.find(
        (item) =>
          item.productId.toString() === id &&
          item.variantLabel === variant.label
      );

      const userCartQuantity = cartItem ? cartItem.quantity : 0;
      const totalCartQuantity = variant.cartQuantity || 0;

      overallProductQuantity += userCartQuantity;
      overallProductPrice += userCartQuantity * variant.price;

      productDetails.push({
        productId: product._id,
        variantLabel: variant.label,
        variantQuantity: userCartQuantity,
        variantPrice: variant.price * userCartQuantity
      });

      return {
        ...variant.toObject(),
        userCartQuantity,
        cartQuantity: cartItem ? totalCartQuantity : 0, // ✅ Only show for current user
        stockQuantity: variant.stockQuantity,
        isOutOfStock: variant.stockQuantity <= 0
      };
    });

    return res.status(200).json({
      status: 200,
      message: "Product retrieved successfully",
      data: {
        product: {
          ...product.toObject(),
          variants: updatedVariants
        },
        category,
        subCategory: product.subCategory_id
      },
      cartSummary: {
        overallProductQuantity,
        overallProductPrice,
        productDetails
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Failed to retrieve product",
      error: error.message
    });
  }
};

exports.updateData = async (req, res) => {
  try {
    const updatedData = await ProductStyle.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    if (!updatedData) {
      return res.send({
        status: 404,
        message: "Product not found"
      });
    }

    return res.send({
      status: 200,
      message: "Product updated successfully",
      data: updatedData
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Failed to update Product",
      error: error.message
    });
  }
};

exports.deleteData = async (req, res) => {
  try {
    const deletedData = await ProductStyle.findByIdAndDelete(req.params.id);
    if (!deletedData) {
      return res.send({
        status: 404,
        message: "Product not found"
      });
    }
    res.send({
      status: 200,
      message: "Product Deleted successfully",
      data: deletedData
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Failed to delete product",
      error: error.message
    });
  }
};
