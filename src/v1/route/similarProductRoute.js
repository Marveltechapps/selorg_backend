const express = require("express");
const router = express.Router();
const similarProductController = require("../controller/similarProductController");

router.post("/create", similarProductController.createData);

router.get("/list", similarProductController.getData);

router.get("/:id", similarProductController.getDataById);

router.put("/:id", similarProductController.updateData);

router.delete("/:id", similarProductController.deleteData);

module.exports = router;
