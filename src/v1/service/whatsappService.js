const axios = require("axios");
const logger = require("../config/logger");
const { ApiError } = require("../utils/apiError");

/**
 * WhatsApp Service
 * Handles WhatsApp Business API integration for notifications
 * 
 * Requirements:
 * - WhatsApp Business API account
 * - Approved message templates
 * - Environment variables:
 *   - WHATSAPP_API_URL
 *   - WHATSAPP_ACCESS_TOKEN
 *   - WHATSAPP_PHONE_NUMBER_ID
 *   - WHATSAPP_BUSINESS_ACCOUNT_ID
 * 
 * Note: WhatsApp requires pre-approved templates for transactional messages
 */
class WhatsAppService {
  constructor() {
    try {
      this.apiUrl = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v18.0";
      this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      this.enabled = !!(this.accessToken && this.phoneNumberId);
      
      if (!this.enabled) {
        console.log('\n' + '⚠️ '.repeat(30));
        console.log('📱 WhatsApp Service: DISABLED (Optional Feature)');
        console.log('💡 The app will work perfectly without WhatsApp!');
        console.log('💡 To enable WhatsApp notifications, add to your .env file:');
        console.log('   - WHATSAPP_ACCESS_TOKEN=your-token');
        console.log('   - WHATSAPP_PHONE_NUMBER_ID=your-phone-id');
        console.log('⚠️ '.repeat(30) + '\n');
        logger.warn("WhatsApp service not configured (optional). App will work without it.");
      } else {
        logger.info("✅ WhatsApp service enabled and ready");
      }
    } catch (error) {
      console.error('⚠️  WhatsApp service initialization error (non-critical):', error.message);
      logger.error({ error: error.message }, "Failed to initialize WhatsApp service - continuing without it");
      this.enabled = false;
      this.apiUrl = null;
      this.accessToken = null;
      this.phoneNumberId = null;
    }
  }

  /**
   * Check if WhatsApp service is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled === true;
  }

  /**
   * Send WhatsApp message using template
   * @param {string} mobileNumber - Recipient mobile number (with country code)
   * @param {string} templateName - Approved template name
   * @param {Array} parameters - Template parameters
   * @returns {Promise<Object>} Result
   */
  async sendTemplateMessage(mobileNumber, templateName, parameters = []) {
    if (!this.enabled) {
      logger.debug("WhatsApp service disabled - skipping message send");
      return {
        success: false,
        skipped: true,
        reason: "WhatsApp service not configured (optional)"
      };
    }

    try {
      // Format mobile number (remove + if present)
      const formattedNumber = mobileNumber.replace(/^\+/, "");

      const payload = {
        messaging_product: "whatsapp",
        to: formattedNumber,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "en"
          },
          components: parameters.length > 0 ? [{
            type: "body",
            parameters: parameters.map(param => ({
              type: "text",
              text: param
            }))
          }] : []
        }
      };

      logger.info({ mobileNumber, templateName }, "Sending WhatsApp template message");

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            "Authorization": `Bearer ${this.accessToken}`,
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      );

      logger.info({ mobileNumber, templateName, messageId: response.data.messages?.[0]?.id }, "WhatsApp message sent successfully");

      return {
        success: true,
        messageId: response.data.messages?.[0]?.id,
        status: "sent",
        provider: "whatsapp"
      };
    } catch (error) {
      logger.error({ 
        error: error.message,
        response: error.response?.data,
        mobileNumber,
        templateName
      }, "Failed to send WhatsApp message");
      
      // Return error instead of throwing to prevent app crashes
      return {
        success: false,
        error: error.message,
        reason: "WhatsApp API error"
      };
    }
  }

  /**
   * Send OTP via WhatsApp
   * @param {string} mobileNumber
   * @param {string} otp
   * @returns {Promise<Object>}
   */
  async sendOTP(mobileNumber, otp) {
    // Template: otp_verification
    // Body: Your OTP is {{1}}. Valid for 5 minutes. Do not share this code with anyone.
    return this.sendTemplateMessage(mobileNumber, "otp_verification", [otp]);
  }

  /**
   * Send order confirmation via WhatsApp
   * @param {string} mobileNumber
   * @param {Object} orderData
   * @returns {Promise<Object>}
   */
  async sendOrderConfirmation(mobileNumber, orderData) {
    // Template: order_confirmation
    // Body: Your order {{1}} has been confirmed. Total: ₹{{2}}. Expected delivery: {{3}}.
    const { orderNumber, totalAmount, deliveryTime } = orderData;
    
    return this.sendTemplateMessage(mobileNumber, "order_confirmation", [
      orderNumber,
      totalAmount.toString(),
      deliveryTime
    ]);
  }

  /**
   * Send order status update via WhatsApp
   * @param {string} mobileNumber
   * @param {Object} statusData
   * @returns {Promise<Object>}
   */
  async sendOrderStatusUpdate(mobileNumber, statusData) {
    // Template: order_status_update
    // Body: Your order {{1}} is now {{2}}. Track your order: {{3}}
    const { orderNumber, status, trackingUrl } = statusData;
    
    return this.sendTemplateMessage(mobileNumber, "order_status_update", [
      orderNumber,
      status,
      trackingUrl || "app"
    ]);
  }

  /**
   * Send order out for delivery notification
   * @param {string} mobileNumber
   * @param {Object} deliveryData
   * @returns {Promise<Object>}
   */
  async sendOutForDelivery(mobileNumber, deliveryData) {
    // Template: out_for_delivery
    // Body: Your order {{1}} is out for delivery. Delivery partner: {{2}}, Phone: {{3}}. Arriving in {{4}} mins.
    const { orderNumber, partnerName, partnerPhone, estimatedMinutes } = deliveryData;
    
    return this.sendTemplateMessage(mobileNumber, "out_for_delivery", [
      orderNumber,
      partnerName,
      partnerPhone,
      estimatedMinutes.toString()
    ]);
  }

  /**
   * Send order delivered notification
   * @param {string} mobileNumber
   * @param {Object} deliveryData
   * @returns {Promise<Object>}
   */
  async sendOrderDelivered(mobileNumber, deliveryData) {
    // Template: order_delivered
    // Body: Your order {{1}} has been delivered. Thanks for shopping with Selorg!
    const { orderNumber } = deliveryData;
    
    return this.sendTemplateMessage(mobileNumber, "order_delivered", [orderNumber]);
  }

  /**
   * Send promotional message via WhatsApp
   * @param {string} mobileNumber
   * @param {Object} promoData
   * @returns {Promise<Object>}
   */
  async sendPromotionalMessage(mobileNumber, promoData) {
    // Template: promotional_offer
    // Body: Hi! Check out our latest offer: {{1}}. Use code {{2}} to get {{3}}% off. Valid till {{4}}.
    const { offerTitle, couponCode, discountPercent, validTill } = promoData;
    
    return this.sendTemplateMessage(mobileNumber, "promotional_offer", [
      offerTitle,
      couponCode,
      discountPercent.toString(),
      validTill
    ]);
  }

  /**
   * Send cart abandonment reminder
   * @param {string} mobileNumber
   * @param {Object} cartData
   * @returns {Promise<Object>}
   */
  async sendCartAbandonment(mobileNumber, cartData) {
    // Template: cart_abandonment
    // Body: You left {{1}} items in your cart worth ₹{{2}}. Complete your purchase now!
    const { itemCount, totalAmount } = cartData;
    
    return this.sendTemplateMessage(mobileNumber, "cart_abandonment", [
      itemCount.toString(),
      totalAmount.toString()
    ]);
  }

  /**
   * Verify webhook signature (for receiving delivery status updates)
   * @param {string} signature
   * @param {string} payload
   * @returns {boolean}
   */
  verifyWebhookSignature(signature, payload) {
    // Implement signature verification based on WhatsApp documentation
    // This is a placeholder for actual implementation
    return true;
  }

  /**
   * Handle webhook callback from WhatsApp
   * @param {Object} webhookData
   * @returns {Promise<Object>}
   */
  async handleWebhook(webhookData) {
    const { entry } = webhookData;

    if (!entry || !entry.length) {
      return { acknowledged: true };
    }

    for (const item of entry) {
      const changes = item.changes || [];
      
      for (const change of changes) {
        if (change.field === "messages") {
          const messages = change.value.messages || [];
          
          for (const message of messages) {
            logger.info({ 
              messageId: message.id,
              from: message.from,
              type: message.type
            }, "WhatsApp message received");
            
            // Handle incoming messages (if supporting two-way communication)
            // This would integrate with chat service
          }
        }
        
        if (change.field === "message_status") {
          const statuses = change.value.statuses || [];
          
          for (const status of statuses) {
            logger.info({
              messageId: status.id,
              status: status.status,
              recipient: status.recipient_id
            }, "WhatsApp delivery status update");
            
            // Update message delivery status in database if needed
          }
        }
      }
    }

    return { acknowledged: true };
  }
}

module.exports = new WhatsAppService();



