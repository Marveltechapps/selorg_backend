const PaymentModel = require("../model/paymentModel");

// Create a new payment (userId from token)
exports.createPayment = async (req, res) => {
  try {
    const userId = req.user.userId; // ✅ from token
    const { orderId, amount, paymentMethod, paymentStatus } = req.body;

    const payment = new PaymentModel({
      userId,
      orderId,
      amount,
      paymentMethod,
      paymentStatus
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all payments of the logged-in user
exports.getAllPayments = async (req, res) => {
  try {
    const userId = req.user.userId;
    const payments = await PaymentModel.find({ userId }).sort({
      createdAt: -1
    });

    res.status(200).json({
      success: true,
      message: "Payments retrieved successfully",
      data: payments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single payment by ID (if it belongs to the user)
exports.getPaymentById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const payment = await PaymentModel.findOne({ _id: req.params.id, userId });

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a payment by ID (if it belongs to the user)
exports.updatePayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const payment = await PaymentModel.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true }
    );

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found or unauthorized" });
    }

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a payment by ID (if it belongs to the user)
exports.deletePayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const payment = await PaymentModel.findOneAndDelete({
      _id: req.params.id,
      userId
    });

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found or unauthorized" });
    }

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
