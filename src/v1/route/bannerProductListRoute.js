const express = require("express");
const router = express.Router();
const bannerProductListController = require("../controller/bannerProductListController");

router.post("/create", bannerProductListController.createData);

router.get("/list", bannerProductListController.getData);

router.get("/:id", bannerProductListController.getDataById);

router.put("/:id", bannerProductListController.updateData);

router.delete("/:id", bannerProductListController.deleteData);

module.exports = router;
