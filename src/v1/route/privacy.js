const express = require("express");
const router = express.Router();
const privacyController = require("../controller/privacyController"); // Adjust path as needed

router.post("/create", privacyController.createPrivacyPolicy);

router.get("/list", privacyController.getPrivacyPolicy);

// router.get("/:id", privacyController.getPrivacyPolicyById);

router.put("/:id", privacyController.updatePrivacyPolicy);

router.delete("/:id", privacyController.deletePrivacyPolicy);

module.exports = router;
