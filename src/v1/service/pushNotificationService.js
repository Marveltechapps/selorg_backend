const logger = require("../config/logger");
const { ApiError } = require("../utils/apiError");

/**
 * PushNotificationService - Firebase Cloud Messaging integration
 * Note: Requires firebase-admin package and FCM credentials
 * To enable: npm install firebase-admin, configure FCM in .env
 */
class PushNotificationService {
  constructor() {
    this.admin = null;
    this.isInitialized = false;
    this.initialize();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initialize() {
    try {
      // Check if FCM credentials are available
      if (!process.env.FCM_SERVER_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        logger.warn('FCM not configured. Push notifications will be logged only');
        return;
      }

      // Uncomment when firebase-admin is installed and configured
      /*
      const admin = require('firebase-admin');
      
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault()
        });
      } else if (process.env.FCM_SERVER_KEY) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FCM_PROJECT_ID,
            clientEmail: process.env.FCM_CLIENT_EMAIL,
            privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n')
          })
        });
      }
      
      this.admin = admin;
      this.isInitialized = true;
      logger.info('Push notification service initialized');
      */
    } catch (error) {
      logger.error({ error }, 'Failed to initialize FCM');
    }
  }

  /**
   * Send push notification to device tokens
   * @param {Array<string>} tokens
   * @param {Object} notification
   * @returns {Promise<Object>}
   */
  async sendToDevices(tokens, notification) {
    if (!this.isInitialized) {
      logger.info({ tokens: tokens.length, notification }, 'Push notification logged (FCM not configured)');
      return {
        success: true,
        message: 'FCM not configured',
        successCount: 0,
        failureCount: tokens.length
      };
    }

    try {
      // Uncomment when firebase-admin is configured
      /*
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl
        },
        data: notification.data || {},
        tokens: tokens.slice(0, 500) // FCM allows max 500 tokens per request
      };

      const response = await this.admin.messaging().sendMulticast(message);
      
      logger.info({
        successCount: response.successCount,
        failureCount: response.failureCount
      }, 'Push notifications sent');

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push({
              token: tokens[idx],
              error: resp.error.code
            });
          }
        });
        
        logger.warn({ failedTokens }, 'Some push notifications failed');
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        results: response.responses
      };
      */

      return {
        success: true,
        message: 'FCM integration ready but not configured',
        successCount: 0,
        failureCount: tokens.length
      };
    } catch (error) {
      logger.error({ error, tokens: tokens.length }, 'Failed to send push notifications');
      throw new ApiError(500, 'Failed to send push notifications');
    }
  }

  /**
   * Send notification to user
   * @param {Object} user - User with deviceTokens
   * @param {Object} notification
   * @returns {Promise<Object>}
   */
  async sendToUser(user, notification) {
    if (!user.deviceTokens || user.deviceTokens.length === 0) {
      return {
        success: false,
        message: 'User has no device tokens'
      };
    }

    const tokens = user.deviceTokens
      .filter(dt => dt.token)
      .map(dt => dt.token);

    return this.sendToDevices(tokens, notification);
  }

  /**
   * Send order notification
   * @param {Object} user
   * @param {Object} orderData
   * @returns {Promise<Object>}
   */
  async sendOrderNotification(user, orderData) {
    const notification = {
      title: 'Order Update',
      body: `Your order ${orderData.orderCode} has been ${orderData.status}`,
      imageUrl: orderData.items[0]?.imageURL,
      data: {
        type: 'order_update',
        orderId: orderData._id.toString(),
        orderCode: orderData.orderCode,
        status: orderData.status
      }
    };

    return this.sendToUser(user, notification);
  }

  /**
   * Send delivery notification
   * @param {Object} user
   * @param {Object} orderData
   * @returns {Promise<Object>}
   */
  async sendDeliveryNotification(user, orderData) {
    const notification = {
      title: 'Out for Delivery',
      body: `Your order ${orderData.orderCode} is out for delivery and will arrive soon!`,
      data: {
        type: 'delivery_update',
        orderId: orderData._id.toString(),
        orderCode: orderData.orderCode
      }
    };

    return this.sendToUser(user, notification);
  }

  /**
   * Send promotional notification
   * @param {Object} user
   * @param {Object} promotion
   * @returns {Promise<Object>}
   */
  async sendPromotionalNotification(user, promotion) {
    const notification = {
      title: promotion.title,
      body: promotion.message,
      imageUrl: promotion.imageUrl,
      data: {
        type: 'promotional',
        promotionId: promotion.id,
        actionUrl: promotion.actionUrl
      }
    };

    return this.sendToUser(user, notification);
  }

  /**
   * Send back-in-stock alert
   * @param {Object} user
   * @param {Object} product
   * @returns {Promise<Object>}
   */
  async sendBackInStockAlert(user, product) {
    const notification = {
      title: 'Back in Stock!',
      body: `${product.title || product.SKUName} is now available. Order now!`,
      imageUrl: product.imageURL,
      data: {
        type: 'back_in_stock',
        productId: product._id.toString()
      }
    };

    return this.sendToUser(user, notification);
  }

  /**
   * Test push notification
   * @param {string} token
   * @returns {Promise<Object>}
   */
  async sendTestNotification(token) {
    const notification = {
      title: 'Test Notification',
      body: 'This is a test notification from SELORG',
      data: {
        type: 'test'
      }
    };

    return this.sendToDevices([token], notification);
  }
}

module.exports = new PushNotificationService();

