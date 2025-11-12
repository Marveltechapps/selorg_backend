const notificationService = require("../service/notificationService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Get user notifications
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const options = {
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      unreadOnly: req.query.unreadOnly === 'true'
    };

    const result = await notificationService.getUserNotifications(
      req.user.userId,
      options
    );

    return success(res, {
      message: "Notifications retrieved successfully",
      data: result.notifications,
      meta: {
        pagination: result.pagination,
        unreadCount: result.unreadCount
      }
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve notifications"
    });
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user.userId
    );

    return success(res, {
      message: "Notification marked as read",
      data: notification
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to mark notification as read"
    });
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.userId);

    return success(res, {
      message: result.message,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to mark all as read"
    });
  }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const result = await notificationService.deleteNotification(
      req.params.id,
      req.user.userId
    );

    return success(res, {
      message: result.message
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to delete notification"
    });
  }
};

/**
 * Get unread count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const NotificationModel = require("../model/notificationModel");
    const count = await NotificationModel.countDocuments({
      userId: req.user.userId,
      isRead: false
    });

    return success(res, {
      message: "Unread count retrieved",
      data: { unreadCount: count }
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to get unread count"
    });
  }
};

module.exports = exports;

