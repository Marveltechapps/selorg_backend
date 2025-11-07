const RefundData = require("../model/refundData");

// Create a refund request
exports.createRefund = async (req, res) => {
  //   console.log("Refund request received"); // Add this for debugging
  try {
    const { transactionId, orderId, userId, reason, refundAmount } = req.body;

    if (!transactionId || !orderId || !userId || !reason || !refundAmount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const refund = new RefundData({
      transactionId,
      orderId,
      userId,
      reason,
      refundAmount
    });

    const savedRefund = await refund.save();
    // console.log("Refund saved:", savedRefund); // Add this for debugging
    res.status(201).json(savedRefund);
  } catch (error) {
    console.log("Error:", error); // Add this for debugging
    res.status(500).json({ message: "Error creating refund", error });
  }
};

// Get all refunds
exports.getAllRefunds = async (req, res) => {
  try {
    const refunds = await RefundData.find().populate(
      "transactionId orderId userId"
    );
    res.status(200).json(refunds);
  } catch (error) {
    res.status(500).json({ message: "Error fetching refunds", error });
  }
};

// Update refund status
exports.updateRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const refund = await RefundData.findByIdAndUpdate(
      id,
      { status, processedAt: status !== "Pending" ? new Date() : null },
      { new: true }
    );

    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    res.status(200).json(refund);
  } catch (error) {
    res.status(500).json({ message: "Error updating refund", error });
  }
};
