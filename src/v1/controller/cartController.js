// controllers/productStyleController.js
const mongoose = require("mongoose");
const CartModel = require("../model/cartList");
const ProductStyle = require("../model/productStyle");
const ProductSection = require("../model/homeScreenProductModel");
const UserModel = require("../model/userModel");

exports.addToCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      productId,
      quantity,
      variantLabel,
      imageURL,
      price,
      discountPrice,
      deliveryInstructions,
      addNotes,
      deliveryTip
    } = req.body;

    // ---- Consistent user resolution (token OR mobileNumber) ----
    let userId = req.user?.userId;
    if (!userId) {
      const mobile =
        req.body.mobileNumber ||
        req.query.mobileNumber ||
        req.user?.mobileNumber;
      if (!mobile) {
        return res.status(400).json({
          message:
            "User not resolved. Provide auth token or mobileNumber in body/query."
        });
      }
      const user = await UserModel.findOne({ mobileNumber: mobile })
        .select("_id")
        .lean();
      if (!user) return res.status(404).json({ message: "User not found" });
      userId = user._id;
    }

    if (!productId || !quantity || !variantLabel) {
      return res
        .status(400)
        .json({ message: "productId, quantity, variantLabel are required" });
    }

    // ---- Find or create cart ----
    let cart = await CartModel.findOne({ userId }).session(session);
    if (!cart) cart = new CartModel({ userId, items: [] });

    // ---- Upsert item in cart ----
    const idx = cart.items.findIndex(
      (it) =>
        String(it.productId) === String(productId) &&
        it.variantLabel === variantLabel
    );
    if (idx >= 0) {
      cart.items[idx].quantity += Number(quantity);
      if (imageURL) cart.items[idx].imageURL = imageURL;
      if (price) cart.items[idx].price = price;
      if (discountPrice != null) cart.items[idx].discountPrice = discountPrice;
    } else {
      cart.items.push({
        productId,
        quantity: Number(quantity),
        variantLabel,
        imageURL,
        price,
        discountPrice
      });
    }

    // ---- Cart metadata ----
    if (deliveryInstructions) cart.deliveryInstructions = deliveryInstructions;
    if (addNotes) cart.addNotes = addNotes;
    if (deliveryTip != null) cart.billSummary.deliveryTip = deliveryTip;

    // ---- Recalc bill and save ----
    cart.recalculateBill();
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Item added to cart successfully",
      cart
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("addToCart error:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

exports.updateDeliveryTip = async (req, res) => {
  try {
    const { deliveryTip } = req.body;
    const userId = req.user.userId;

    const cart = await CartModel.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found." });

    cart.billSummary.deliveryTip = deliveryTip || 0;

    // ✅ recalc bill correctly
    cart.recalculateBill();

    await cart.save();

    res.status(200).json({
      message: "Delivery Tip updated successfully.",
      cart
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
};

// exports.removeFromCart = async (req, res) => {
//   try {
//     const { productId } = req.body;
//     const userId = req.user.userId;

//     const cart = await CartModel.findOne({ userId });
//     if (!cart) return res.status(404).json({ message: "Cart not found" });

//     const itemIndex = cart.items.findIndex(
//       (item) => item.productId.toString() === productId
//     );

//     if (itemIndex === -1) {
//       return res.status(404).json({ message: "Item not found in cart" });
//     }

//     cart.items[itemIndex].quantity -= 1;

//     if (cart.items[itemIndex].quantity <= 0) {
//       cart.items.splice(itemIndex, 1);
//     }

//     if (cart.items.length === 0) {
//       cart.billSummary.deliveryTip = 0;
//     }

//     cart.calculateBillSummaryForRemove();

//     await cart.save();

//     res
//       .status(200)
//       .json({ message: "Item quantity updated successfully.", cart });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: err.message });
//   }
// };

exports.removeFromCart = async (req, res) => {
  try {
    // ---- Now expect userId & productId from body ----
    const { userId, productId, variantLabel } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        message: "userId and productId are required in request body"
      });
    }

    // ---- Find user’s cart ----
    const cart = await CartModel.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // ---- Find the item (match productId + variantLabel like addToCart) ----
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        (!variantLabel || item.variantLabel === variantLabel) // optional if variantLabel not provided
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // ---- Decrease or remove item ----
    cart.items[itemIndex].quantity -= 1;
    if (cart.items[itemIndex].quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    }

    // ---- Reset deliveryTip if cart empty ----
    if (cart.items.length === 0) {
      cart.billSummary.deliveryTip = 0;
    }

    // ---- Recalc bill ----
    cart.recalculateBill();

    await cart.save();

    return res.status(200).json({
      message: "Item removed from cart successfully.",
      cart
    });
  } catch (err) {
    console.error("removeFromCart error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.userId;

    const cart = await CartModel.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (!item)
      return res.status(404).json({ message: "Product not found in cart" });

    item.quantity = quantity;

    // ✅ correct method
    cart.recalculateBill();

    await cart.save();

    res.status(200).json({
      message: "Cart updated successfully.",
      cart
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
      error: err.message
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cart = await CartModel.findOne({ userId }).populate(
      "items.productId"
    );
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// exports.clearCart = async (req, res) => {
//   try {
//     const mobileNumber = req.user.mobileNumber;

//     const user = await User.findOne({ mobileNumber });
//     if (!user) return res.status(404).json({ message: "User not found." });

//     const cart = await CartModel.findOne({ userId: user._id });

//     if (!cart) {
//       return res.status(200).json({ message: "Cart is already empty." });
//     }

//     cart.items = [];
//     cart.billSummary = {
//       itemTotal: 0,
//       GST: 0,
//       subtotalWithGST: 0,
//       deliveryFee: 50,
//       deliveryTip: 0,
//       handlingCharges: 10,
//       discountAmount: 0,
//       totalBill: 0
//     };
//     await cart.save();

//     res.status(200).json({ message: "Cart cleared successfully." });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: err.message });
//   }
// };

exports.clearCart = async (req, res) => {
  try {
    const { mobileNumber } = req.query; // ✅ take from query instead of params

    if (!mobileNumber) {
      return res
        .status(400)
        .json({ message: "mobileNumber is required in query params" });
    }

    // ---- Find user by mobileNumber ----
    const user = await UserModel.findOne({ mobileNumber }).select("_id");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // ---- Find user’s cart ----
    const cart = await CartModel.findOne({ userId: user._id });
    if (!cart) {
      return res.status(200).json({ message: "Cart is already empty." });
    }

    // ---- Clear items ----
    cart.items = [];

    // ---- Reset bill summary ----
    cart.billSummary = {
      itemTotal: 0,
      GST: 0,
      subtotalWithGST: 0,
      deliveryFee: 50,
      deliveryTip: 0,
      handlingCharges: 10,
      discountAmount: 0,
      totalBill: 0
    };

    await cart.save();

    return res
      .status(200)
      .json({ message: "Cart cleared successfully.", cart });
  } catch (err) {
    console.error("clearCart error:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};
