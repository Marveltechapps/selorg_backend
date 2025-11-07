// // models/Rating.js
// const mongoose = require("mongoose");

// const RatingSchema = new mongoose.Schema(
//   {
//     orderId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Order",
//       required: true
//     },
//     rating: {
//       type: Number,
//       required: true,
//       min: 1,
//       max: 5
//     },
//     feedback: String
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Rating", RatingSchema);

const mongoose = require("mongoose");

const orderRatingSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrderModels",
      required: true
    },
    // Reference to the user who provided the rating
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
      required: true
    },
    // Rating value given by the user
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    // Optional feedback text provided by the user
    feedback: {
      type: String,
      trim: true // Trims whitespace from the feedback
    },
    // List of positive aspects highlighted by the user
    positives: [
      {
        content: { type: String, required: true }, // Description of the positive aspect
        imageUrl: { type: String, required: true } // Image URL related to the positive aspect
      }
    ],
    // List of negative aspects highlighted by the user
    negatives: [
      {
        content: { type: String, required: true }, // Description of the negative aspect
        imageUrl: { type: String, required: true } // Image URL related to the negative aspect
      }
    ]
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

module.exports = mongoose.model("Rating", orderRatingSchema);
