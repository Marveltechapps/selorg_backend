const express = require("express");
const router = express.Router();
const subCategoryList = require("../controller/subCategoryList");

router.post("/create", subCategoryList.createSubCategory);
router.get("/list", subCategoryList.getAllSubCategories);
router.get("/", subCategoryList.getSubCategoriesByCategory);

router.get("/:id", subCategoryList.getSubCategoryById);
router.put("/:id", subCategoryList.updateSubCategory);
router.delete("/:id", subCategoryList.deleteSubCategory);

module.exports = router;
