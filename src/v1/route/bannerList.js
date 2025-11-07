const express = require("express");
const router = express.Router();
const bannerListController = require("../controller/bannerList");

router.post("/create", bannerListController.addbanner);
router.get("/list", bannerListController.getAllBanners);
router.get("/list/:id", bannerListController.getBannerById);
router.put("/update/:id", bannerListController.updateBannerById);
router.delete("/delete/:id", bannerListController.deleteBannerById);

module.exports = router;
