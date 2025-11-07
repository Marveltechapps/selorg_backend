// routes/categoryGroup.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controller/homeCategoryController");

router.post("/create", controller.createCategoryGroup);

router.get("/list", controller.getAllCategoryGroups);

router.get("/:id", controller.getCategoryGroupById);

router.put("/:id", controller.updateCategoryGroup);

router.delete("/:id", controller.deleteCategoryGroup);

module.exports = router;
