const axios = require("axios");
const { ApiError } = require("../utils/apiError");
const logger = require("../config/logger");
const config = require("../../../config.json");
const whatsappService = require("./whatsappService");

/**
 * NotificationService - Handles email, SMS, and push notifications
 */
class NotificationService {
  /**
   * Send SMS notification
   * @param {string} mobileNumber
   * @param {string} message
   * @returns {Promise<Object>} Send result
   */
  async sendSMS(mobileNumber, message) {
    try {
      const smsApiUrl = `${config.smsvendor}to_mobileno=${mobileNumber}&sms_text=${encodeURIComponent(message)}`;
      
      const response = await axios.get(smsApiUrl);
      
      if (!response.data || response.data.status !== "success") {
        throw new Error("SMS sending failed");
      }

      logger.info({ mobileNumber }, "SMS sent successfully");
      
      return {
        success: true,
        message: "SMS sent successfully"
      };
    } catch (error) {
      logger.error({ error, mobileNumber }, "Failed to send SMS");
      throw new ApiError(500, "Failed to send SMS");
    }
  }

  /**
   * Send OTP SMS
   * @param {string} mobileNumber
   * @param {string} otp
   * @returns {Promise<Object>}
   */
  async sendOTPSMS(mobileNumber, otp) {
    const message = `Dear Customer, Your OTP for verification is ${otp}. Valid for 5 minutes. SELORG`;
    return this.sendSMS(mobileNumber, message);
  }

  /**
   * Send order confirmation SMS
   * @param {string} mobileNumber
   * @param {Object} orderData
   * @returns {Promise<Object>}
   */
  async sendOrderConfirmationSMS(mobileNumber, orderData) {
    const message = `Your order ${orderData.orderCode} has been confirmed. Amount: ₹${orderData.finalAmount}. Track your order at selorg.com. SELORG`;
    return this.sendSMS(mobileNumber, message);
  }

  /**
   * Send order status update SMS
   * @param {string} mobileNumber
   * @param {Object} orderData
   * @returns {Promise<Object>}
   */
  async sendOrderStatusSMS(mobileNumber, orderData) {
    let statusMessage = "";
    
    switch (orderData.status) {
      case 'confirmed':
        statusMessage = `Your order ${orderData.orderCode} has been confirmed.`;
        break;
      case 'preparing':
        statusMessage = `Your order ${orderData.orderCode} is being prepared.`;
        break;
      case 'out_for_delivery':
        statusMessage = `Your order ${orderData.orderCode} is out for delivery.`;
        break;
      case 'delivered':
        statusMessage = `Your order ${orderData.orderCode} has been delivered. Thank you for shopping with SELORG!`;
        break;
      default:
        statusMessage = `Your order ${orderData.orderCode} status has been updated.`;
    }

    return this.sendSMS(mobileNumber, statusMessage);
  }

  /**
   * Send email notification (placeholder for future implementation)
   * @param {string} email
   * @param {string} subject
   * @param {string} htmlContent
   * @returns {Promise<Object>}
   */
  async sendEmail(email, subject, htmlContent) {
    // TODO: Implement email service (Nodemailer + SendGrid/AWS SES)
    logger.info({ email, subject }, "Email queued (not yet implemented)");
    
    return {
      success: true,
      message: "Email service not yet implemented",
      email,
      subject
    };
  }

  /**
   * Send welcome email
   * @param {string} email
   * @param {string} name
   * @returns {Promise<Object>}
   */
  async sendWelcomeEmail(email, name) {
    const subject = "Welcome to SELORG!";
    const htmlContent = `
      <h1>Welcome ${name}!</h1>
      <p>Thank you for joining SELORG - Your trusted source for organic products.</p>
    `;
    
    return this.sendEmail(email, subject, htmlContent);
  }

  /**
   * Send order confirmation email
   * @param {string} email
   * @param {Object} orderData
   * @returns {Promise<Object>}
   */
  async sendOrderConfirmationEmail(email, orderData) {
    const subject = `Order Confirmation - ${orderData.orderCode}`;
    const htmlContent = `
      <h1>Order Confirmed!</h1>
      <p>Your order ${orderData.orderCode} has been confirmed.</p>
      <p>Total Amount: ₹${orderData.finalAmount}</p>
    `;
    
    return this.sendEmail(email, subject, htmlContent);
  }

  /**
   * Send push notification via FCM
   * @param {Array<string>} deviceTokens
   * @param {Object} notification
   * @returns {Promise<Object>}
   */
  async sendPushNotification(deviceTokens, notification) {
    const pushService = require("./pushNotificationService");
    
    try {
      const result = await pushService.sendToDevices(deviceTokens, notification);
      return result;
    } catch (error) {
      logger.error({ error, tokensCount: deviceTokens.length }, "Failed to send push notification");
      return {
        success: false,
        message: error.message,
        tokensCount: deviceTokens.length
      };
    }
  }

  /**
   * Send notification to user (multi-channel)
   * @param {Object} user - User object with contact details
   * @param {Object} notification - Notification data
   * @returns {Promise<Object>} Send results
   */
  async sendNotification(user, notification) {
    const results = {
      sms: null,
      email: null,
      push: null
    };

    const { type, data } = notification;

    try {
      // Send SMS if user has mobile number
      if (user.mobileNumber) {
        switch (type) {
          case 'order_confirmation':
            results.sms = await this.sendOrderConfirmationSMS(user.mobileNumber, data);
            break;
          case 'order_status':
            results.sms = await this.sendOrderStatusSMS(user.mobileNumber, data);
            break;
        }
      }

      // Send Email if user has email
      if (user.email) {
        switch (type) {
          case 'order_confirmation':
            results.email = await this.sendOrderConfirmationEmail(user.email, data);
            break;
          case 'welcome':
            results.email = await this.sendWelcomeEmail(user.email, user.name);
            break;
        }
      }

      // Send Push if user has device tokens
      if (user.deviceTokens && user.deviceTokens.length > 0) {
        const tokens = user.deviceTokens.map(dt => dt.token);
        results.push = await this.sendPushNotification(tokens, { type, data });
      }

      return results;
    } catch (error) {
      logger.error({ error, userId: user._id, type }, "Failed to send notification");
      throw error;
    }
  }

  /**
   * Create in-app notification
   * @param {string} userId
   * @param {Object} notificationData
   * @returns {Promise<Object>} Created notification
   */
  async createInAppNotification(userId, notificationData) {
    const NotificationModel = require("../model/notificationModel");
    
    const notification = await NotificationModel.create({
      userId,
      ...notificationData,
      createdAt: new Date()
    });

    return notification;
  }

  /**
   * Get user notifications
   * @param {string} userId
   * @param {Object} options - Filter and pagination
   * @returns {Promise<Object>} Notifications list
   */
  async getUserNotifications(userId, options = {}) {
    const NotificationModel = require("../model/notificationModel");
    const { page = 1, limit = 20, unreadOnly = false } = options;

    const query = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      NotificationModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NotificationModel.countDocuments(query),
      NotificationModel.countDocuments({ userId, isRead: false })
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }

  /**
   * Mark notification as read
   * @param {string} notificationId
   * @param {string} userId
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(notificationId, userId) {
    const NotificationModel = require("../model/notificationModel");
    
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    return notification;
  }

  /**
   * Mark all notifications as read
   * @param {string} userId
   * @returns {Promise<Object>} Update result
   */
  async markAllAsRead(userId) {
    const NotificationModel = require("../model/notificationModel");
    
    const result = await NotificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return {
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount
    };
  }

  /**
   * Delete notification
   * @param {string} notificationId
   * @param {string} userId
   * @returns {Promise<Object>} Deletion result
   */
  async deleteNotification(notificationId, userId) {
    const NotificationModel = require("../model/notificationModel");
    
    const notification = await NotificationModel.findOneAndDelete({
      _id: notificationId,
      userId
    });

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    return {
      message: "Notification deleted successfully"
    };
  }

  /**
   * Send multi-channel notification (Email + SMS + WhatsApp + Push)
   * @param {string} userId
   * @param {string} mobileNumber
   * @param {Object} notificationData
   * @param {Object} preferences - User notification preferences
   * @returns {Promise<Object>} Results from all channels
   */
  async sendMultiChannelNotification(userId, mobileNumber, notificationData, preferences = {}) {
    const { 
      title, 
      message, 
      type,
      whatsappTemplate,
      whatsappParams,
      email: emailData
    } = notificationData;

    const results = {
      inApp: false,
      sms: false,
      whatsapp: false,
      email: false,
      push: false
    };

    // In-app notification (always sent)
    try {
      await this.createNotification(userId, { title, message, type });
      results.inApp = true;
    } catch (error) {
      logger.error({ error: error.message }, "Failed to create in-app notification");
    }

    // SMS (if enabled in preferences)
    if (preferences.sms !== false) {
      try {
        await this.sendSMS(mobileNumber, message);
        results.sms = true;
      } catch (error) {
        logger.error({ error: error.message }, "Failed to send SMS");
      }
    }

    // WhatsApp (if enabled in preferences and service is configured)
    if (preferences.whatsapp === true && whatsappService.isEnabled() && whatsappTemplate) {
      try {
        await whatsappService.sendTemplateMessage(mobileNumber, whatsappTemplate, whatsappParams || []);
        results.whatsapp = true;
      } catch (error) {
        logger.error({ error: error.message }, "Failed to send WhatsApp message");
      }
    }

    // Email (if enabled and email address provided)
    if (preferences.email !== false && emailData) {
      try {
        await this.sendEmail(emailData.to, emailData.subject, emailData.html);
        results.email = true;
      } catch (error) {
        logger.error({ error: error.message }, "Failed to send email");
      }
    }

    // Push notification (if enabled)
    if (preferences.push !== false) {
      try {
        await this.sendPushNotification(userId, { title, body: message, data: notificationData });
        results.push = true;
      } catch (error) {
        logger.error({ error: error.message }, "Failed to send push notification");
      }
    }

    return results;
  }

  /**
   * Send order-related WhatsApp notification
   * @param {string} mobileNumber
   * @param {string} eventType
   * @param {Object} orderData
   * @returns {Promise<Object>}
   */
  async sendOrderWhatsAppNotification(mobileNumber, eventType, orderData) {
    if (!whatsappService.isEnabled()) {
      logger.warn("WhatsApp service not enabled");
      return { success: false, reason: "WhatsApp not configured" };
    }

    try {
      switch (eventType) {
        case "order_confirmed":
          return await whatsappService.sendOrderConfirmation(mobileNumber, orderData);
        
        case "out_for_delivery":
          return await whatsappService.sendOutForDelivery(mobileNumber, orderData);
        
        case "delivered":
          return await whatsappService.sendOrderDelivered(mobileNumber, orderData);
        
        case "status_update":
          return await whatsappService.sendOrderStatusUpdate(mobileNumber, orderData);
        
        default:
          logger.warn({ eventType }, "Unknown WhatsApp event type");
          return { success: false, reason: "Unknown event type" };
      }
    } catch (error) {
      logger.error({ error: error.message, eventType }, "Failed to send WhatsApp notification");
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();

