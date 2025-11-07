const express = require("express");
const router = express.Router();
const grabEssentialsController = require("../controller/grabEssentialsController");

router.post("/create", grabEssentialsController.createGrabEssential);

router.get("/list", grabEssentialsController.getAllGrabEssentials);

router.get("/:id", grabEssentialsController.getGrabEssentialById);

router.put("/:id", grabEssentialsController.updateGrabEssential);

router.delete("/:id", grabEssentialsController.deleteGrabEssential);

module.exports = router;
