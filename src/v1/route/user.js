const express = require("express");
const userController = require("../controller/userController");
const router = express.Router();
const authenticateToken = require("../auths/authenticationToken");
const { validate } = require("../middleware/validate");
const {
  createUserSchema,
  updateProfileSchema,
  getUsersQuerySchema
} = require("../validations/userValidation");

router.post("/create", validate(createUserSchema), userController.createUser);

router.get("/list", validate(getUsersQuerySchema, 'query'), userController.getUsers);

router.get("/:id", userController.getUserById);

router.post("/update-profile", authenticateToken, validate(updateProfileSchema), userController.updateProfile);

router.delete("/:id", authenticateToken, userController.deleteUser);

// Profile completeness and avatar
router.get("/profile/completeness", authenticateToken, userController.getProfileWithCompleteness);
router.post("/profile/avatar", authenticateToken, userController.updateAvatar);

// Notification preferences
router.get("/notification-preferences", authenticateToken, userController.getNotificationPreferences);
router.put("/notification-preferences", authenticateToken, userController.updateNotificationPreferences);
router.post("/notification-preferences/toggle", authenticateToken, userController.toggleNotificationChannel);

module.exports = router;
