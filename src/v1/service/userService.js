const UserModel = require("../model/userModel");
const { ApiError } = require("../utils/apiError");

/**
 * UserService - Handles user management operations
 */
class UserService {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    try {
      const user = new UserModel(userData);
      user.lastActiveAt = new Date();
      
      if (user.isVerified && !user.mobileVerifiedAt) {
        user.mobileVerifiedAt = new Date();
      }
      
      await user.save();
      return user;
    } catch (error) {
      if (error.code === 11000) {
        throw new ApiError(400, "Mobile number already exists");
      }
      throw new ApiError(400, error.message);
    }
  }

  /**
   * Get all users with pagination
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Users list with metadata
   */
  async getAllUsers(options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [users, total] = await Promise.all([
      UserModel.find()
        .select('-otp -otpExpiresAt')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments()
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get user by ID
   * @param {string} userId
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    const user = await UserModel.findById(userId)
      .select('-otp -otpExpiresAt')
      .lean();
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    
    return user;
  }

  /**
   * Get user by mobile number
   * @param {string} mobileNumber
   * @returns {Promise<Object>} User object
   */
  async getUserByMobile(mobileNumber) {
    const user = await UserModel.findOne({ mobileNumber })
      .select('-otp -otpExpiresAt')
      .lean();
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    
    return user;
  }

  /**
   * Update user profile
   * @param {string} mobileNumber - User's mobile number
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(mobileNumber, updateData) {
    const user = await UserModel.findOne({ mobileNumber });
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Allowed fields to update
    const allowedUpdates = ['name', 'email', 'notificationPreferences', 'preferredStoreId'];
    
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'notificationPreferences' && user.notificationPreferences) {
          // Merge notification preferences
          user.notificationPreferences = {
            ...(user.notificationPreferences.toObject?.() || user.notificationPreferences),
            ...updateData.notificationPreferences
          };
        } else {
          user[key] = updateData[key];
        }
      }
    });

    user.lastActiveAt = new Date();
    await user.save();

    return user;
  }

  /**
   * Delete user account
   * @param {string} mobileNumber
   * @returns {Promise<Object>} Deletion result
   */
  async deleteUser(mobileNumber) {
    const user = await UserModel.findOneAndDelete({ mobileNumber });
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return {
      message: "User deleted successfully",
      userId: user._id
    };
  }

  /**
   * Update user's last active timestamp
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async updateLastActive(userId) {
    await UserModel.findByIdAndUpdate(userId, {
      lastActiveAt: new Date()
    });
  }

  /**
   * Add device token for push notifications
   * @param {string} userId
   * @param {Object} deviceInfo - Device token and platform
   * @returns {Promise<Object>} Updated user
   */
  async addDeviceToken(userId, deviceInfo) {
    const { token, platform = 'unknown' } = deviceInfo;
    
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check if token already exists
    const existingTokenIndex = user.deviceTokens.findIndex(
      dt => dt.token === token
    );

    if (existingTokenIndex > -1) {
      // Update existing token
      user.deviceTokens[existingTokenIndex].lastSeenAt = new Date();
      user.deviceTokens[existingTokenIndex].platform = platform;
    } else {
      // Add new token
      user.deviceTokens.push({
        token,
        platform,
        lastSeenAt: new Date()
      });
    }

    await user.save();
    return user;
  }

  /**
   * Remove device token
   * @param {string} userId
   * @param {string} token
   * @returns {Promise<Object>} Updated user
   */
  async removeDeviceToken(userId, token) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    user.deviceTokens = user.deviceTokens.filter(dt => dt.token !== token);
    await user.save();
    
    return user;
  }

  /**
   * Set primary address for user
   * @param {string} userId
   * @param {string} addressId
   * @returns {Promise<Object>} Updated user
   */
  async setPrimaryAddress(userId, addressId) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { primaryAddressId: addressId },
      { new: true }
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  /**
   * Calculate profile completeness
   * @param {Object} user - User object
   * @returns {Object} Completeness data
   */
  calculateProfileCompleteness(user) {
    const fields = {
      mobileNumber: !!user.mobileNumber,
      name: !!user.name,
      email: !!user.email,
      isVerified: !!user.isVerified,
      primaryAddress: !!user.primaryAddressId,
      avatar: !!user.avatar
    };

    const completedFields = Object.values(fields).filter(Boolean).length;
    const totalFields = Object.keys(fields).length;
    const percentage = Math.round((completedFields / totalFields) * 100);

    return {
      percentage,
      completedFields,
      totalFields,
      missingFields: Object.keys(fields).filter(key => !fields[key])
    };
  }

  /**
   * Get profile with completeness
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getProfileWithCompleteness(userId) {
    const user = await UserModel.findById(userId)
      .select('-otp -otpExpiresAt')
      .lean();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const completeness = this.calculateProfileCompleteness(user);

    return {
      ...user,
      profileCompleteness: completeness
    };
  }

  /**
   * Update avatar
   * @param {string} userId
   * @param {string} avatarUrl
   * @returns {Promise<Object>}
   */
  async updateAvatar(userId, avatarUrl) {
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    );

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user;
  }

  /**
   * Get notification preferences
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getNotificationPreferences(userId) {
    const user = await UserModel.findById(userId)
      .select('notificationPreferences')
      .lean();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user.notificationPreferences || {
      push: true,
      sms: true,
      email: true,
      whatsapp: false,
      orderUpdates: true,
      marketing: false,
      appUpdates: true,
      promotions: false,
      newsletter: false
    };
  }

  /**
   * Update notification preferences
   * @param {string} userId
   * @param {Object} preferences
   * @returns {Promise<Object>}
   */
  async updateNotificationPreferences(userId, preferences) {
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Merge with existing preferences
    user.notificationPreferences = {
      ...user.notificationPreferences?.toObject() || {},
      ...preferences
    };

    await user.save();

    return user.notificationPreferences;
  }

  /**
   * Toggle specific notification channel
   * @param {string} userId
   * @param {string} channel - push, sms, email, whatsapp
   * @param {boolean} enabled
   * @returns {Promise<Object>}
   */
  async toggleNotificationChannel(userId, channel, enabled) {
    const validChannels = ["push", "sms", "email", "whatsapp"];
    
    if (!validChannels.includes(channel)) {
      throw new ApiError(400, `Invalid channel. Must be one of: ${validChannels.join(", ")}`);
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.notificationPreferences) {
      user.notificationPreferences = {};
    }

    user.notificationPreferences[channel] = enabled;
    await user.save();

    return user.notificationPreferences;
  }
}

module.exports = new UserService();

