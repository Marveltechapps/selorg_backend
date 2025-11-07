const express = require("express");
const router = express.Router();
const mainCategoryController = require("../controller/mainCategoryController");

router.post("/create", mainCategoryController.createCategory);
router.get("/list", mainCategoryController.getAllCategories);
router.get("/category/:id", mainCategoryController.getCategoryById);
router.put("/update/:id", mainCategoryController.updateCategory);
router.get("/delete/:id", mainCategoryController.deleteCategory);

module.exports = router;
