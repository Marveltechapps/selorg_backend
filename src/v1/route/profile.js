const express = require("express");
const router = express.Router();
const profileController = require("../controller/profileController");



router.post("/create", profileController.createProfile);
router.get("/get", profileController.getProfile);

module.exports = router;