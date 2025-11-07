// routes/product.routes.js
const express = require("express");
const router = express.Router();
const productController = require("../controller/homeScreenProductController");

// CRUD routes
router.post("/create", productController.createProductSection);

router.get("/list", productController.getAllProductSections);

router.get("/:id", productController.getProductSectionById);

router.put("/:id", productController.updateProductSection);

router.delete("/:id", productController.deleteProductSection);

module.exports = router;
