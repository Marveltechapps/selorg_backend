const mongoose = require("mongoose");
const OrderStatusData = require("../model/orderStatusModel");

const normalizeStatus = (status) =>
  typeof status === "string" ? status.toUpperCase() : status;

const normalizePayload = (payload = {}) => {
  const nextPayload = { ...payload };

  if (nextPayload.orderStatus && !nextPayload.status) {
    nextPayload.status = nextPayload.orderStatus;
  }

  if (nextPayload.user && !nextPayload.userId) {
    nextPayload.userId = nextPayload.user;
  }

  nextPayload.status = normalizeStatus(nextPayload.status);
  delete nextPayload.orderStatus;
  delete nextPayload.user;

  return nextPayload;
};

// Create a new order status
exports.createOrderStatus = async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const newOrderStatus = new OrderStatusData(payload);
    await newOrderStatus.save();

    return res.status(201).json({
      success: true,
      data: newOrderStatus.toObject()
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Get all order statuses
exports.getAllOrderStatuses = async (req, res) => {
  try {
    const filter = {};

    if (req.query.orderId && mongoose.Types.ObjectId.isValid(req.query.orderId)) {
      filter.orderId = req.query.orderId;
    }

    const orders = await OrderStatusData.find(filter)
      .populate("orderId")
      .populate("userId", "name email mobileNumber")
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single order status by ID
exports.getOrderStatusById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid identifier" });
    }

    const order = await OrderStatusData.findById(id)
      .populate("orderId")
      .populate("userId", "name email mobileNumber")
      .lean();

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order status record not found" });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update an order status by ID
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid identifier" });
    }

    const payload = normalizePayload(req.body);

    const updatedOrder = await OrderStatusData.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true
    });

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order status record not found" });
    }

    return res.status(200).json({
      success: true,
      data: updatedOrder.toObject()
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Delete an order status by ID
exports.deleteOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid identifier" });
    }

    const deletedOrder = await OrderStatusData.findByIdAndDelete(id);
    if (!deletedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order status record not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Order status deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
