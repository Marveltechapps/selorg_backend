const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const { validate } = require("../middleware/validate");
const {
  searchProductsSchema,
  getProductsSchema,
  autocompleteSchema,
  checkAvailabilitySchema
} = require("../validations/productValidation");

/**
 * @swagger
 * /v1/products:
 *   get:
 *     summary: Get all products with filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get("/", validate(getProductsSchema, 'query'), productController.getProducts);

// Search products
router.get("/search", validate(searchProductsSchema, 'query'), productController.searchProducts);

// Autocomplete suggestions
router.get("/autocomplete", validate(autocompleteSchema, 'query'), productController.getAutocompleteSuggestions);

// Get featured products
router.get("/featured", productController.getFeaturedProducts);

// Get product by ID
router.get("/:id", productController.getProductById);

// Get product variants
router.get("/:id/variants", productController.getProductVariants);

// Get specific variant
router.get("/:id/variants/:variantId", productController.getVariantById);

// Check variant availability
router.get("/:id/variants/:variantId/availability", productController.checkVariantAvailability);

// Get similar products
router.get("/:id/similar", productController.getSimilarProducts);

// Get products by category
router.get("/category/:category", productController.getProductsByCategory);

// Check product availability
router.post("/check-availability", validate(checkAvailabilitySchema), productController.checkAvailability);

// Get products by user segment
router.get("/segment/:segment", productController.getProductsByUserSegment);

// Get products by health goal
router.get("/health-goal/:goal", productController.getProductsByHealthGoal);

// Get products by certification
router.get("/certification/:certification", productController.getProductsByCertification);

module.exports = router;

