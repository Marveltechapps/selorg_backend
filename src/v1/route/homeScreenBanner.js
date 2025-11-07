const express = require("express");
const router = express.Router();
const homeScreenBannerController = require("../controller/homeScreenBanner");

router.post("/create", homeScreenBannerController.createHomeScreenBanner);
router.get("/list", homeScreenBannerController.getHomeScreenBanner);
router.get("/list/:id", homeScreenBannerController.getHomeScreenBannerById);
router.put("/update/:id", homeScreenBannerController.updateHomeScreenBanner);
router.delete("/:id", homeScreenBannerController.deleteHomeScreenbanner);

module.exports = router;
