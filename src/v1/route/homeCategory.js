const express = require("express");
const router = express.Router();
const homeCategory = require("../controller/homeCategory");



router.post("/create", homeCategory.createCategories);
router.get("/list", homeCategory.getHomeCategory);
module.exports = router;