const express = require("express");
const router = express.Router();
const productStyleController = require("../controller/productStyleController");

router.post("/create", productStyleController.createData);

router.get("/list", productStyleController.getData);

router.get("/search", productStyleController.searchProducts);

router.get("/:id", productStyleController.getDataById);

router.put("/:id", productStyleController.updateData);

router.delete("/:id", productStyleController.deleteData);

module.exports = router;
