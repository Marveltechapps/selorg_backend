const express = require("express");
const router = express.Router();
const addressController = require("../controller/addressController");
const authenticateToken = require("../auths/authenticationToken");

router.post("/create", authenticateToken, addressController.createAddress);

router.get("/list", authenticateToken, addressController.getAddresses);

router.get("/single/:id", authenticateToken, addressController.getAddressById);

router.get("/by-user/:id", authenticateToken, addressController.getByUserId);

router.post("/default", authenticateToken, addressController.setDefaultAddress);

router.put("/:id", authenticateToken, addressController.updateAddress);

router.delete("/:id", authenticateToken, addressController.deleteAddress);

module.exports = router;
