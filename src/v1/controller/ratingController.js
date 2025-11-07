// controllers/ratingController.js
const Rating = require("../model/rating");
const mongoose = require("mongoose");
const OrderModels = require("../model/orderModel");
const UserModel = require("../model/userModel");

// Create a new rating
exports.createRating = async (req, res) => {
  try {
    const { orderId, userId, rating, feedback, positives, negatives } =
      req.body;

    // console.log("Received data:", req.body);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    // Validate order existence
    const order = await OrderModels.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Validate user existence
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create new rating
    const newRating = new Rating({
      orderId,
      userId,
      rating,
      feedback,
      positives,
      negatives
    });

    await newRating.save();
    res
      .status(201)
      .json({ message: "Rating created successfully", rating: newRating });
  } catch (error) {
    console.error("Error creating rating:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get ratings by userId
exports.getRatingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Retrieve ratings and populate the associated order
    const ratings = await Rating.find({ userId }).populate({
      path: "orderId",
      model: "Order" // Use "Order", not "OrderModels"
    });

    if (!ratings.length) {
      return res
        .status(404)
        .json({ message: "No ratings found for this user" });
    }

    res.status(200).json(ratings);
  } catch (error) {
    console.error("Error retrieving ratings:", error);
    res
      .status(500)
      .json({ message: "Error retrieving ratings", error: error.message });
  }
};

// Get ratings for a specific order
exports.getRatingsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const ratings = await Rating.find({ orderId }).populate("userId", "name");
    if (!ratings.length) {
      return res
        .status(404)
        .json({ message: "No ratings found for this order" });
    }

    res.status(200).json({ ratings });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Update a rating
exports.updateRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { rating, feedback, positives, negatives } = req.body;

    const updatedRating = await Rating.findByIdAndUpdate(
      ratingId,
      { rating, feedback, positives, negatives },
      { new: true, runValidators: true }
    );

    if (!updatedRating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    res
      .status(200)
      .json({ message: "Rating updated successfully", rating: updatedRating });
  } catch (error) {
    console.error("Error updating rating:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Delete a rating
exports.deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;

    const deletedRating = await Rating.findByIdAndDelete(ratingId);
    if (!deletedRating) {
      return res.status(404).json({ message: "Rating not found" });
    }

    res.status(200).json({ message: "Rating deleted successfully" });
  } catch (error) {
    console.error("Error deleting rating:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
