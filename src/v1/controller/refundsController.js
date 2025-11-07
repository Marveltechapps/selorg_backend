const Refund = require("../model/refundModel");
const OrderModel = require("../model/orderModel"); // Assuming you have an Order schema

// Create a refund
exports.createRefund = async (req, res) => {
  const { orderId, userId, address, reason } = req.body;

  try {
    // Check if the order exists and is not delivered
    const order = await OrderModel.findOne({
      _id: orderId,
      userId,
      deliveryStatus: "Not Delivered"
    });

    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found or already delivered" });
    }

    // Check if the address matches
    if (order.address !== address) {
      return res
        .status(400)
        .json({ message: "Address does not match the order address" });
    }

    // Create a refund entry
    const refund = new Refund({ orderId, userId, address, reason });
    await refund.save();

    return res
      .status(201)
      .json({ message: "Refund created successfully", refund });
  } catch (error) {
    return res.status(500).json({ message: "Error creating refund", error });
  }
};

// Get refunds for a specific user
exports.getRefundsByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const refunds = await Refund.find({ userId }).sort({ createdAt: -1 });
    if (!refunds.length) {
      return res
        .status(200)
        .json({ message: "No refunds available", refunds: [] });
    }
    return res.status(200).json({ refunds });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving refunds", error });
  }
};

// Update refund status
exports.updateRefundStatus = async (req, res) => {
  const { refundId } = req.params;
  const { status } = req.body;

  try {
    const refund = await Refund.findById(refundId);

    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    refund.status = status;
    refund.updatedAt = Date.now();
    await refund.save();

    return res.status(200).json({ message: "Refund status updated", refund });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error updating refund status", error });
  }
};
