const express = require("express");
const router = express.Router();
const notificationController = require("../controller/notificationController");
const authenticateToken = require("../auths/authenticationToken");

// All notification routes require authentication
router.use(authenticateToken);

// Get user notifications
router.get("/", notificationController.getUserNotifications);

// Get unread count
router.get("/unread/count", notificationController.getUnreadCount);

// Mark notification as read
router.patch("/:id/read", notificationController.markAsRead);

// Mark all as read
router.post("/mark-all-read", notificationController.markAllAsRead);

// Delete notification
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;

