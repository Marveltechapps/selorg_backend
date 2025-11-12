const express = require("express");
const router = express.Router();
const contentController = require("../controller/contentController");

/**
 * Content Routes
 * For static pages, FAQs, help topics, etc.
 */

// Get content by type (e.g., terms_and_conditions, privacy_policy)
router.get("/type/:type", contentController.getContentByType);

// Get single content by slug or ID
router.get("/:slugOrId", contentController.getContent);

// Get FAQs (grouped by category)
router.get("/faqs/all", contentController.getFAQsByCategory);

// Search content
router.get("/search", contentController.searchContent);

// === ADMIN ROUTES ===

// Create content
router.post("/", contentController.createContent);

// Update content
router.put("/:id", contentController.updateContent);

// Delete content
router.delete("/:id", contentController.deleteContent);

module.exports = router;



