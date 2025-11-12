const express = require("express");
const router = express.Router();
const wishlistController = require("../controller/wishlistController");
const authenticateToken = require("../auths/authenticationToken");

// All wishlist routes require authentication
router.use(authenticateToken);

// Get user's wishlist
router.get("/", wishlistController.getWishlist);

// Add product to wishlist
router.post("/add", wishlistController.addToWishlist);

// Remove product from wishlist
router.delete("/remove/:productId", wishlistController.removeFromWishlist);

// Move item to cart
router.post("/move-to-cart/:productId", wishlistController.moveToCart);

// Clear wishlist
router.delete("/clear", wishlistController.clearWishlist);

// Check if product is in wishlist
router.get("/check/:productId", wishlistController.isInWishlist);

module.exports = router;

