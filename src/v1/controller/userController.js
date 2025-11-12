const userService = require("../service/userService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Create a new user
 */
exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    
    return success(res, {
      statusCode: 201,
      message: "User created successfully",
      data: user
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 400,
      message: error.message
    });
  }
};

/**
 * Get all users with pagination
 */
exports.getUsers = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query;
    
    const result = await userService.getAllUsers({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sortBy,
      sortOrder
    });

    return success(res, {
      message: "Users retrieved successfully",
      data: result.users,
      meta: result.pagination
    });
  } catch (error) {
    return failure(res, {
      statusCode: 500,
      message: error.message
    });
  }
};

/**
 * Get user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    
    return success(res, {
      message: "User retrieved successfully",
      data: user
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message
    });
  }
};

/**
 * Update user profile (authenticated)
 */
exports.updateProfile = async (req, res) => {
  try {
    const mobileNumber = req.user.mobileNumber;
    const user = await userService.updateProfile(mobileNumber, req.body);

    return success(res, {
      message: "Profile updated successfully",
      data: user
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to update profile"
    });
  }
};

/**
 * Delete user account (authenticated)
 */
exports.deleteUser = async (req, res) => {
  try {
    const mobileNumber = req.user.mobileNumber;
    const result = await userService.deleteUser(mobileNumber);

    return success(res, {
      message: result.message
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message
    });
  }
};

/**
 * Get profile with completeness
 */
exports.getProfileWithCompleteness = async (req, res) => {
  try {
    const profile = await userService.getProfileWithCompleteness(req.user.userId);

    return success(res, {
      message: "Profile retrieved successfully",
      data: profile
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message
    });
  }
};

/**
 * Update avatar
 */
exports.updateAvatar = async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return failure(res, {
        statusCode: 400,
        message: "Avatar URL is required"
      });
    }

    const user = await userService.updateAvatar(req.user.userId, avatarUrl);

    return success(res, {
      message: "Avatar updated successfully",
      data: user
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to update avatar"
    });
  }
};

/**
 * Get notification preferences
 */
exports.getNotificationPreferences = async (req, res) => {
  try {
    const preferences = await userService.getNotificationPreferences(req.user.userId);

    return success(res, {
      message: "Notification preferences retrieved successfully",
      data: preferences
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve notification preferences"
    });
  }
};

/**
 * Update notification preferences
 */
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const preferences = await userService.updateNotificationPreferences(req.user.userId, req.body);

    return success(res, {
      message: "Notification preferences updated successfully",
      data: preferences
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to update notification preferences"
    });
  }
};

/**
 * Toggle notification channel (for UI toggle switches)
 */
exports.toggleNotificationChannel = async (req, res) => {
  try {
    const { channel, enabled } = req.body;

    if (!channel || typeof enabled !== "boolean") {
      return failure(res, {
        statusCode: 400,
        message: "Channel and enabled status are required"
      });
    }

    const preferences = await userService.toggleNotificationChannel(req.user.userId, channel, enabled);

    return success(res, {
      message: `${channel} notifications ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: preferences
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to toggle notification channel"
    });
  }
};
