const ProductSection = require("../model/homeScreenProductModel");
const CartModel = require("../model/cartList");
const UserModel = require("../model/userModel");
const mongoose = require("mongoose");
// Create a new product section

exports.createProductSection = async (req, res) => {
  try {
    const productSections = req.body;

    // ✅ Validate: should be a non-empty array
    if (!Array.isArray(productSections) || productSections.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Request body must be a non-empty array of product sections."
      });
    }

    // ✅ Check each section has display_name
    for (const section of productSections) {
      if (
        !section.display_name ||
        typeof section.display_name !== "string" ||
        section.display_name.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          error: "Each product section must have a non-empty display_name."
        });
      }
    }

    // ✅ Create all product sections
    const createdSections = await ProductSection.insertMany(productSections);

    return res.status(201).json({
      success: true,
      message: "Product sections created successfully.",
      data: createdSections
    });
  } catch (error) {
    console.error("❌ Error in createProductSections:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error"
    });
  }
};

// Helper: resolve current user (token OR mobileNumber)
async function resolveUserId(req) {
  if (req.user?.userId) return req.user.userId;
  const mobile =
    req.user?.mobileNumber || req.query.mobileNumber || req.body.mobileNumber;
  if (!mobile) return null;
  const user = await UserModel.findOne({ mobileNumber: mobile })
    .select("_id")
    .lean();
  return user?._id || null;
}

exports.getAllProductSections = async (req, res) => {
  try {
    const currentUserId = await resolveUserId(req);

    // 1) Current user's cart
    let userCartItems = [];
    if (currentUserId) {
      const userCart = await CartModel.findOne({ userId: currentUserId })
        .lean()
        .exec();
      userCartItems = userCart?.items || [];
    }
    const userCartIndex = CartModel.buildCartIndex(userCartItems);

    // 2) Global reserved quantities by OTHER users (to calculate available stock)
    const allOtherCarts = await CartModel.find(
      currentUserId ? { userId: { $ne: currentUserId } } : {}
    )
      .select("items.productId items.variantLabel items.quantity")
      .lean()
      .exec();

    const globalIdx = Object.create(null);
    for (const c of allOtherCarts) {
      for (const it of c.items || []) {
        const key = `${String(it.productId)}_${it.variantLabel}`;
        globalIdx[key] = (globalIdx[key] || 0) + it.quantity;
      }
    }

    // 3) Fetch sections with product + variants
    const sections = await ProductSection.find()
      .populate({ path: "products.productId", model: "ProductStyle" })
      .lean()
      .exec();

    // 4) Enrich with user-specific cartQuantity + availableStock
    const enrichedSections = sections.map((section) => {
      const products = section.products.map((p) => {
        const prodDoc = p.productId; // populated ProductStyle
        if (!prodDoc || !Array.isArray(prodDoc.variants)) return p;

        const productId = String(prodDoc._id);

        let totalQuantity = 0;
        let totalPrice = 0;
        const productQuantities = [];

        const variants = prodDoc.variants.map((v) => {
          const key = `${productId}_${v.label}`;
          const userQty = userCartIndex[key] || 0;
          const reservedByOthers = globalIdx[key] || 0;

          // available stock is base stock - reserved by OTHER users
          const availableStock = Math.max(
            0,
            (v.stockQuantity || 0) - reservedByOthers
          );

          totalQuantity += userQty;
          totalPrice += userQty * (v.price || 0);
          productQuantities.push({
            productId,
            variantLabel: v.label,
            variantQuantity: userQty,
            variantPrice: userQty * (v.price || 0)
          });

          return {
            ...v,
            userCartQuantity: userQty, // visible to current user only
            cartQuantity: userQty,
            stockQuantity: availableStock,
            isOutOfStock: availableStock <= 0,
            isInUserCart: userQty > 0
          };
        });

        return {
          ...prodDoc,
          variants,
          cartSummary: {
            totalQuantity,
            totalPrice,
            productQuantities
          }
        };
      });

      return { ...section, products };
    });

    return res.status(200).json({ success: true, data: enrichedSections });
  } catch (error) {
    console.error("getAllProductSections error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Get a single product section by ID
exports.getProductSectionById = async (req, res) => {
  try {
    const mobileNumber =
      req.user?.mobileNumber || req.query.mobileNumber || req.body.mobileNumber;

    let user = null;
    let cartItems = [];

    if (mobileNumber) {
      user = await UserModel.findOne({ mobileNumber });
      if (user) {
        const userCart = await CartModel.findOne({ userId: user._id });
        cartItems = userCart ? userCart.items : [];
      }
    }

    const section = await ProductSection.findById(req.params.id).populate(
      "products.productId"
    );

    if (!section) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found" });
    }

    const updatedProducts = section.products.map((product) => {
      const productId = product.productId?._id?.toString();
      let totalQuantity = 0;
      let totalPrice = 0;
      let productQuantities = [];

      const updatedVariants = product.productId.variants.map((variant) => {
        const cartItem = cartItems.find(
          (item) =>
            item.productId.toString() === productId &&
            item.variantLabel === variant.label
        );

        const userCartQuantity = cartItem ? cartItem.quantity : 0;
        const totalCartQuantity = variant.cartQuantity || 0;

        totalQuantity += userCartQuantity;
        totalPrice += userCartQuantity * variant.price;

        productQuantities.push({
          productId: productId,
          variantLabel: variant.label,
          variantQuantity: userCartQuantity,
          variantPrice: variant.price * userCartQuantity
        });

        return {
          ...variant.toObject(),
          userCartQuantity,
          cartQuantity: cartItem ? totalCartQuantity : 0, // ✅ Only show if in user's cart
          stockQuantity: Math.max(0, variant.stockQuantity - totalCartQuantity),
          isOutOfStock: variant.stockQuantity - totalCartQuantity <= 0
        };
      });

      return {
        ...product.productId.toObject(),
        variants: updatedVariants,
        cartSummary: {
          totalQuantity,
          totalPrice,
          productQuantities
        }
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...section.toObject(),
        products: updatedProducts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update a product section by ID
exports.updateProductSection = async (req, res) => {
  try {
    const updatedSection = await ProductSection.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    if (!updatedSection) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found" });
    }
    res.status(200).json({ success: true, data: updatedSection });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete a product section by ID
exports.deleteProductSection = async (req, res) => {
  try {
    const deletedSection = await ProductSection.findByIdAndDelete(
      req.params.id
    );
    if (!deletedSection) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Section deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
