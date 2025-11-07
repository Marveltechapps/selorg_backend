const express = require("express");
const userController = require("../controller/userController");
const router = express.Router();
const authenticateToken = require("../auths/authenticationToken");

router.post("/create", userController.createUser);

router.get("/list", userController.getUsers);

router.get("/:id", userController.getUserById);

router.post("/update-profile", authenticateToken, userController.updateProfile);

router.delete("/:id", authenticateToken, userController.deleteUser);
module.exports = router;
