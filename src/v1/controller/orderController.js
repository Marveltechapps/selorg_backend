const OrderModel = require("../model/orderModel");
const ProductStyle = require("../model/productStyle");
const mongoose = require("mongoose");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ From token
    const {
      items,
      address,
      deliveryTip,
      deliveryInstructions,
      additionalNote
    } = req.body;

    let totalPrice = 0;
    let finalAmount = 0;

    const orderItems = await Promise.all(
      items.map(async (item) => {
        const product = await ProductStyle.findById(item.productId);
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        const price = product.price;
        const discountPrice = product.discountPrice || price;

        totalPrice += price * item.quantity;
        finalAmount += discountPrice * item.quantity;

        return {
          productId: item.productId,
          quantity: item.quantity,
          variantLabel: item.variantLabel || "",
          imageURL: product.imageURL,
          price,
          discountPrice
        };
      })
    );

    const order = new OrderModel({
      userId,
      items: orderItems,
      totalPrice,
      discount: totalPrice - finalAmount,
      finalAmount,
      deliveryTip,
      deliveryInstructions,
      additionalNote,
      address
    });

    await order.save();
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all orders for logged-in user
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.userId;

    const orders = await OrderModel.find({ userId })
      .populate("userId", "name email")
      .populate("items.productId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get order by ID (only if it belongs to the user)
exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const order = await OrderModel.findOne({ _id: req.params.id, userId })
      .populate("userId", "name email")
      .populate("items.productId");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get orders by userId from token
exports.getOrderByUserId = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ Securely from JWT

    const orders = await OrderModel.find({ userId })
      .populate("items.productId", "title imageURL price discountPrice")
      .sort({ createdAt: -1 });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found for this user"
      });
    }

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve orders",
      error: error.message
    });
  }
};

// Update order status (admin only logic can be added if needed)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await OrderModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated",
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete an order (user can delete only their own order)
exports.deleteOrder = async (req, res) => {
  try {
    const userId = req.user.userId;

    const order = await OrderModel.findOneAndDelete({
      _id: req.params.id,
      userId
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found or unauthorized" });
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reorder a previous order
exports.reorder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orderId = req.params.orderId;

    const previousOrder = await OrderModel.findOne({
      _id: orderId,
      userId
    }).lean();

    if (!previousOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Previous order not found" });
    }

    const updatedItems = await Promise.all(
      previousOrder.items.map(async (item) => {
        const product = await ProductStyle.findById(item.productId).lean();
        return {
          productId: item.productId,
          quantity: item.quantity,
          variantLabel: item.variantLabel,
          price: item.price,
          discountPrice: item.discountPrice,
          imageURL: product ? product.imageURL : item.imageURL
        };
      })
    );

    const newOrder = new OrderModel({
      userId,
      items: updatedItems,
      totalPrice: previousOrder.totalPrice,
      discount: previousOrder.discount,
      finalAmount: previousOrder.finalAmount,
      deliveryTip: previousOrder.deliveryTip,
      deliveryInstructions: previousOrder.deliveryInstructions,
      additionalNote: previousOrder.additionalNote,
      address: previousOrder.address
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Reorder created successfully",
      data: newOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error while reordering",
      error: error.message
    });
  }
};
