const OrderStatusData = require("../model/orderStatusModel");

// Create a new order status
exports.createOrderStatus = async (req, res) => {
  try {
    const newOrderStatus = new OrderStatusData(req.body);
    await newOrderStatus.save();
    res.status(201).json({ success: true, data: newOrderStatus });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all order statuses
exports.getAllOrderStatuses = async (req, res) => {
  try {
    const orders = await OrderStatusData.find().populate("user");
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single order status by ID
exports.getOrderStatusById = async (req, res) => {
  try {
    const order = await OrderStatusData.findById(req.params.id).populate(
      "user"
    );
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

// Update an order status by ID
exports.updateOrderStatus = async (req, res) => {
  try {
    req.body.updatedAt = Date.now(); // Update timestamp
    const updatedOrder = await OrderStatusData.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete an order status by ID
exports.deleteOrderStatus = async (req, res) => {
  try {
    const deletedOrder = await OrderStatusData.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
