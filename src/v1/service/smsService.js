const axios = require("axios");
const logger = require("../config/logger");
const { ApiError } = require("../utils/apiError");
const config = require("../../../config.json");

/**
 * SMSService - Enhanced SMS service with templates and queuing
 */
class SMSService {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * SMS Templates
   */
  templates = {
    otp: (otp) => `Dear Customer, Your OTP for verification is ${otp}. Valid for 5 minutes. Do not share with anyone. SELORG`,
    
    orderConfirmation: (orderCode, amount) => `Your order ${orderCode} has been confirmed. Amount: ₹${amount}. Track your order at selorg.com. SELORG`,
    
    orderPreparing: (orderCode) => `Your order ${orderCode} is being prepared. We'll notify you once it's ready for delivery. SELORG`,
    
    outForDelivery: (orderCode) => `Your order ${orderCode} is out for delivery. Expected delivery within 30 minutes. SELORG`,
    
    delivered: (orderCode) => `Your order ${orderCode} has been delivered successfully. Thank you for shopping with SELORG! Please rate your experience.`,
    
    cancelled: (orderCode, reason) => `Your order ${orderCode} has been cancelled. ${reason ? 'Reason: ' + reason : ''} Refund will be processed if applicable. SELORG`,
    
    refundInitiated: (orderCode, amount) => `Refund of ₹${amount} has been initiated for order ${orderCode}. It will be credited within 5-7 business days. SELORG`,
    
    backInStock: (productName) => `Good news! ${productName} is back in stock. Order now before it's gone! SELORG`,
    
    abandonedCart: (itemCount, amount) => `You left ${itemCount} items in your cart (₹${amount}). Complete your purchase now and get fresh organic products! SELORG`,
    
    lowStock: (productName) => `Hurry! Only few items left of ${productName}. Order now! SELORG`
  };

  /**
   * Send SMS via vendor API
   * @param {string} mobileNumber
   * @param {string} message
   * @param {number} attempt
   * @returns {Promise<Object>}
   */
  async sendSMSViaAPI(mobileNumber, message, attempt = 1) {
    try {
      const smsApiUrl = `${config.smsvendor}to_mobileno=${mobileNumber}&sms_text=${encodeURIComponent(message)}`;
      
      // 📝 Enhanced logging for debugging
      console.log('\n' + '='.repeat(70));
      console.log('📱 SENDING SMS VIA API');
      console.log('To:', mobileNumber);
      console.log('Message:', message);
      console.log('Attempt:', attempt);
      console.log('API URL:', smsApiUrl.replace(/pass=[^&]+/, 'pass=***'));
      console.log('='.repeat(70));
      
      const response = await axios.get(smsApiUrl, {
        timeout: 10000, // Increased timeout to 10 seconds
        validateStatus: false // Don't throw on any HTTP status
      });
      
      // 📝 Log response for debugging
      console.log('\n📨 SMS API RESPONSE:');
      console.log('HTTP Status:', response.status);
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
      console.log('='.repeat(70) + '\n');
      
      logger.info({ 
        mobileNumber, 
        attempt,
        httpStatus: response.status,
        responseData: response.data
      }, "SMS API called");
      
      // ✅ Check multiple response formats (different APIs use different formats)
      const isSuccess = 
        response.data?.status === "success" ||
        response.data?.status === "Success" ||
        response.data?.message === "success" ||
        response.data?.success === true ||
        response.data?.Status === "Success" ||
        response.status === 200;
      
      if (!isSuccess) {
        const errorMsg = response.data?.message || response.data?.error || response.data?.Error || 'Unknown error';
        logger.warn({ 
          response: response.data,
          mobileNumber 
        }, `SMS API returned non-success: ${errorMsg}`);
        
        console.error('❌ SMS API Error:', errorMsg);
        throw new Error(`SMS API error: ${errorMsg}`);
      }

      logger.info({ mobileNumber, attempt }, "✅ SMS sent successfully via API");
      
      console.log('\n' + '✅'.repeat(35));
      console.log('✅ SMS API ACCEPTED THE MESSAGE!');
      console.log('✅ Mobile Number:', mobileNumber);
      console.log('✅ Campaign ID:', response.data?.campaign_id || 'N/A');
      console.log('✅ Status:', response.data?.status || 'success');
      console.log('✅ Message:', response.data?.Message || 'Sent');
      console.log('✅'.repeat(35));
      
      console.log('\n📱 IMPORTANT: CHECK YOUR PHONE NOW!');
      console.log('Phone Number:', mobileNumber);
      console.log('Sender Name: EVOLGN or SELORG');
      console.log('Wait Time: 30-120 seconds');
      console.log('');
      console.log('⚠️  IF SMS NOT RECEIVED AFTER 2 MINUTES:');
      console.log('   1. Your number might be in DND (Do Not Disturb)');
      console.log('   2. Carrier might be blocking EVOLGN sender');
      console.log('   3. Try with different mobile number');
      console.log('   4. Check Spearuc delivery reports');
      console.log('   5. Use console OTP above as fallback\n');
      
      return {
        success: true,
        messageId: response.data?.messageId || response.data?.campaign_id || response.data?.id || Date.now().toString(),
        campaignId: response.data?.campaign_id,
        status: 'sent',
        provider: 'spearuc',
        apiResponse: response.data
      };
    } catch (error) {
      logger.error({ 
        error: error.message,
        mobileNumber, 
        attempt 
      }, "❌ Failed to send SMS");
      
      // 📝 Console logging for visibility
      console.error('\n' + '❌'.repeat(35));
      console.error('SMS SENDING FAILED');
      console.error('Error:', error.message);
      console.error('Mobile:', mobileNumber);
      console.error('Attempt:', attempt + '/' + this.retryAttempts);
      console.error('❌'.repeat(35) + '\n');
      
      // Retry logic
      if (attempt < this.retryAttempts) {
        console.log(`🔄 Retrying SMS send... (attempt ${attempt + 1}/${this.retryAttempts})\n`);
        await this.delay(this.retryDelay * attempt);
        return this.sendSMSViaAPI(mobileNumber, message, attempt + 1);
      }
      
      throw new ApiError(500, `Failed to send SMS after ${this.retryAttempts} attempts: ${error.message}`);
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add SMS to queue
   * @param {Object} smsData
   */
  async queueSMS(smsData) {
    this.queue.push({
      ...smsData,
      queuedAt: new Date(),
      attempts: 0
    });

    logger.info({ queueLength: this.queue.length }, "SMS added to queue");

    // Start processing if not already
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process SMS queue
   */
  async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const sms = this.queue.shift();
      
      try {
        await this.sendSMSViaAPI(sms.mobileNumber, sms.message);
      } catch (error) {
        logger.error({ error, sms }, "Failed to send queued SMS");
      }

      // Small delay between messages
      await this.delay(100);
    }

    this.processing = false;
  }

  /**
   * Send SMS with template
   * @param {string} mobileNumber
   * @param {string} templateName
   * @param {Array} params
   * @param {boolean} queue
   * @returns {Promise<Object>}
   */
  async sendTemplatedSMS(mobileNumber, templateName, params = [], queue = false) {
    const template = this.templates[templateName];
    
    if (!template) {
      throw new ApiError(400, `SMS template '${templateName}' not found`);
    }

    const message = template(...params);

    if (queue) {
      await this.queueSMS({ mobileNumber, message, templateName });
      return { success: true, queued: true };
    }

    return this.sendSMSViaAPI(mobileNumber, message);
  }

  /**
   * Send OTP SMS
   */
  async sendOTP(mobileNumber, otp) {
    return this.sendTemplatedSMS(mobileNumber, 'otp', [otp]);
  }

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmation(mobileNumber, orderCode, amount) {
    return this.sendTemplatedSMS(mobileNumber, 'orderConfirmation', [orderCode, amount], true);
  }

  /**
   * Send order status SMS
   */
  async sendOrderStatus(mobileNumber, orderCode, status) {
    const templateMap = {
      'preparing': 'orderPreparing',
      'out_for_delivery': 'outForDelivery',
      'delivered': 'delivered',
      'cancelled': 'cancelled'
    };

    const templateName = templateMap[status];
    if (templateName) {
      return this.sendTemplatedSMS(mobileNumber, templateName, [orderCode], true);
    }

    logger.warn({ status }, "No SMS template for order status");
    return { success: false, message: "No template for this status" };
  }

  /**
   * Send back in stock alert
   */
  async sendBackInStockAlert(mobileNumber, productName) {
    return this.sendTemplatedSMS(mobileNumber, 'backInStock', [productName], true);
  }

  /**
   * Send abandoned cart reminder
   */
  async sendAbandonedCartReminder(mobileNumber, itemCount, amount) {
    return this.sendTemplatedSMS(mobileNumber, 'abandonedCart', [itemCount, amount], true);
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      oldestInQueue: this.queue[0]?.queuedAt || null
    };
  }
}

module.exports = new SMSService();

