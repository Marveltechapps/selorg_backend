const express = require("express");
const router = express.Router();
const categoryListController = require("../controller/categoryListController");

router.post("/create", categoryListController.createCategoryData);
router.get("/list", categoryListController.getAllCategoryDatas);
router.get("/category/:id", categoryListController.getCategoryDataById);
router.put("/update/:id", categoryListController.updateCategoryData);
router.get("/delete/:id", categoryListController.deleteCategoryData);

module.exports = router;
