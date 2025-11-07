const express = require("express");
const router = express.Router();
const spicesSeasoning = require("../controller/spices_seasonings");

router.post("/create", spicesSeasoning.createSpicesSeasoning);

router.get("/list", spicesSeasoning.getSpicesSeasoning);

router.get("/:id", spicesSeasoning.getSpicesSeasoningById);

router.put("/:id", spicesSeasoning.updateSpicesSeasoning);

router.delete("/:id", spicesSeasoning.deleteSpicesSeasoning);

module.exports = router;
