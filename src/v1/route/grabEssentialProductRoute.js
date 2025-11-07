const express = require("express");
const router = express.Router();
const grabEssentialProductController = require("../controller/grabEssentialProductController");

router.post(
  "/create",
  grabEssentialProductController.createGrabEssentialProduct
);
router.get("/list", grabEssentialProductController.getAllGrabEssentialProducts);
router.get("/:id", grabEssentialProductController.getGrabEssentialProductById);
router.put("/:id", grabEssentialProductController.updateGrabEssentialProduct);
router.delete(
  "/:id",
  grabEssentialProductController.deleteGrabEssentialProduct
);

module.exports = router;
