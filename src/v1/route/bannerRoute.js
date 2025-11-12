const express = require("express");
const router = express.Router();
const contentController = require("../controller/contentController");

/**
 * Banner Routes
 * Public endpoints for fetching banners
 */

// Get home screen banners
router.get("/home", contentController.getHomeBanners);

// Get category-specific banners
router.get("/category/:categoryId", contentController.getCategoryBanners);

// Get banners by placement
router.get("/placement/:placement", contentController.getBannersByPlacement);

// Track banner impression
router.post("/:bannerId/impression", contentController.trackBannerImpression);

// Track banner click
router.post("/:bannerId/click", contentController.trackBannerClick);

// === ADMIN ROUTES (should be protected with admin middleware) ===
// Note: Add admin authentication middleware when admin panel is implemented

// Create banner
router.post("/", contentController.createBanner);

// Update banner
router.put("/:id", contentController.updateBanner);

// Delete banner
router.delete("/:id", contentController.deleteBanner);

module.exports = router;



