const logger = require("../config/logger");
const { ApiError } = require("../utils/apiError");

/**
 * EmailService - Handles email notifications
 * Note: Nodemailer integration ready but not yet configured
 * To enable: npm install nodemailer, configure SMTP settings in .env
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
  }

  /**
   * Initialize email transporter (when credentials are available)
   */
  initializeTransporter() {
    // Uncomment when email credentials are available
    /*
    const nodemailer = require('nodemailer');
    
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    this.isConfigured = true;
    logger.info('Email service initialized');
    */
    
    logger.warn('Email service not configured - emails will be logged only');
  }

  /**
   * Send email (placeholder that logs for now)
   * @param {Object} options - Email options
   * @returns {Promise<Object>}
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.isConfigured) {
      logger.info({ to, subject }, 'Email would be sent (not configured)');
      return {
        success: true,
        message: 'Email logged (service not configured)',
        to,
        subject
      };
    }

    try {
      // Uncomment when transporter is configured
      /*
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@selorg.com',
        to,
        subject,
        text,
        html
      });
      
      logger.info({ to, subject, messageId: info.messageId }, 'Email sent successfully');
      return { success: true, messageId: info.messageId };
      */
      
      return { success: true, message: 'Email service ready but not configured' };
    } catch (error) {
      logger.error({ error, to, subject }, 'Failed to send email');
      throw new ApiError(500, 'Failed to send email');
    }
  }

  /**
   * Welcome email template
   */
  getWelcomeEmailTemplate(name) {
    return {
      subject: 'Welcome to SELORG - Your Organic Products Destination',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2ecc71; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { background: #2ecc71; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SELORG!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name || 'Customer'},</h2>
              <p>Thank you for joining SELORG - your trusted source for 100% organic products!</p>
              <p>We're committed to bringing you the freshest, healthiest organic groceries straight to your doorstep.</p>
              <p>Start shopping now and enjoy:</p>
              <ul>
                <li>✓ 100% Certified Organic Products</li>
                <li>✓ Fast & Reliable Delivery</li>
                <li>✓ Secure Payment Options</li>
                <li>✓ Best Prices Guaranteed</li>
              </ul>
              <a href="https://selorg.com" class="button">Start Shopping</a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SELORG. All rights reserved.</p>
              <p>Need help? Contact us at support@selorg.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to SELORG!\n\nHi ${name || 'Customer'},\n\nThank you for joining SELORG - your trusted source for 100% organic products!`
    };
  }

  /**
   * Order confirmation email template
   */
  getOrderConfirmationTemplate(orderData) {
    const itemsHTML = orderData.items.map(item => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.quantity}</td>
        <td>₹${item.discountPrice || item.price}</td>
        <td>₹${item.lineTotal}</td>
      </tr>
    `).join('');

    return {
      subject: `Order Confirmed - ${orderData.orderCode}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2ecc71; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-details { background: #f9f9f9; padding: 15px; margin: 15px 0; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f0f0f0; font-weight: bold; }
            .total { font-size: 18px; font-weight: bold; color: #2ecc71; }
            .button { background: #2ecc71; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmed!</h1>
            </div>
            <div class="content">
              <p>Thank you for your order!</p>
              <div class="order-details">
                <p><strong>Order Number:</strong> ${orderData.orderCode}</p>
                <p><strong>Order Date:</strong> ${new Date(orderData.createdAt || Date.now()).toLocaleDateString()}</p>
                <p><strong>Delivery Address:</strong><br>
                  ${orderData.address.street}, ${orderData.address.city}<br>
                  ${orderData.address.state}, ${orderData.address.zipCode}
                </p>
              </div>
              
              <h3>Order Items</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
              
              <p class="total">Total Amount: ₹${orderData.finalAmount}</p>
              <p><strong>Payment Method:</strong> ${(orderData.payment?.method || 'COD').toUpperCase()}</p>
              
              <p>We'll notify you once your order is out for delivery.</p>
              <a href="https://selorg.com/orders/${orderData._id}" class="button">Track Order</a>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Order Confirmed!\n\nOrder Number: ${orderData.orderCode}\nTotal: ₹${orderData.finalAmount}`
    };
  }

  /**
   * Order status update email template
   */
  getOrderStatusTemplate(orderData) {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being processed',
      preparing: 'Your order is being prepared',
      ready_for_dispatch: 'Your order is ready for dispatch',
      out_for_delivery: 'Your order is out for delivery',
      delivered: 'Your order has been delivered successfully',
      cancelled: 'Your order has been cancelled',
      refunded: 'Your order has been refunded'
    };

    const message = statusMessages[orderData.status] || 'Your order status has been updated';

    return {
      subject: `Order Update - ${orderData.orderCode}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2ecc71; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .status { background: #f0f0f0; padding: 15px; margin: 15px 0; border-left: 4px solid #2ecc71; }
            .button { background: #2ecc71; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Update</h1>
            </div>
            <div class="content">
              <p>Hi ${orderData.userSnapshot?.name || 'Customer'},</p>
              <div class="status">
                <p><strong>Order ${orderData.orderCode}</strong></p>
                <p>${message}</p>
                <p><strong>Status:</strong> ${orderData.status.replace('_', ' ').toUpperCase()}</p>
              </div>
              <a href="https://selorg.com/orders/${orderData._id}/track" class="button">Track Order</a>
              <p>Thank you for shopping with SELORG!</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Order Update: ${orderData.orderCode}\n${message}`
    };
  }

  /**
   * OTP email template (backup for SMS)
   */
  getOTPEmailTemplate(otp, name) {
    return {
      subject: 'Your SELORG Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2ecc71; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; text-align: center; }
            .otp { font-size: 36px; font-weight: bold; color: #2ecc71; letter-spacing: 8px; margin: 20px 0; }
            .warning { color: #e74c3c; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SELORG Verification</h1>
            </div>
            <div class="content">
              <p>Hi ${name || 'Customer'},</p>
              <p>Your verification code is:</p>
              <div class="otp">${otp}</div>
              <p>This code will expire in 5 minutes.</p>
              <p class="warning">Never share this code with anyone.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Your SELORG verification code is: ${otp}\nValid for 5 minutes.`
    };
  }

  /**
   * Invoice email template
   */
  getInvoiceEmailTemplate(orderData, invoiceURL) {
    return {
      subject: `Invoice for Order ${orderData.orderCode}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2ecc71; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { background: #2ecc71; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Invoice</h1>
            </div>
            <div class="content">
              <p>Dear ${orderData.userSnapshot?.name || 'Customer'},</p>
              <p>Please find attached your invoice for order <strong>${orderData.orderCode}</strong>.</p>
              <p><strong>Amount:</strong> ₹${orderData.finalAmount}</p>
              <a href="${invoiceURL}" class="button">Download Invoice</a>
              <p>Thank you for shopping with SELORG!</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Invoice for Order ${orderData.orderCode}\nAmount: ₹${orderData.finalAmount}\nDownload: ${invoiceURL}`
    };
  }

  /**
   * Return confirmation email template
   */
  getReturnConfirmationTemplate(returnData) {
    return {
      subject: `Return Request Confirmed - ${returnData.orderCode}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2ecc71; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Return Request Confirmed</h1>
            </div>
            <div class="content">
              <p>Your return request for order <strong>${returnData.orderCode}</strong> has been received.</p>
              <p><strong>Return ID:</strong> ${returnData.returnId}</p>
              <p><strong>Reason:</strong> ${returnData.reason}</p>
              <p>We'll process your return request within 24-48 hours.</p>
              <p>Refund will be initiated once we receive and verify the returned items.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Return Request Confirmed for Order ${returnData.orderCode}\nReturn ID: ${returnData.returnId}`
    };
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, name) {
    const template = this.getWelcomeEmailTemplate(name);
    return this.sendEmail({
      to: email,
      ...template
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(email, orderData) {
    const template = this.getOrderConfirmationTemplate(orderData);
    return this.sendEmail({
      to: email,
      ...template
    });
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusEmail(email, orderData) {
    const template = this.getOrderStatusTemplate(orderData);
    return this.sendEmail({
      to: email,
      ...template
    });
  }

  /**
   * Send OTP email
   */
  async sendOTPEmail(email, otp, name) {
    const template = this.getOTPEmailTemplate(otp, name);
    return this.sendEmail({
      to: email,
      ...template
    });
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(email, orderData, invoiceURL) {
    const template = this.getInvoiceEmailTemplate(orderData, invoiceURL);
    return this.sendEmail({
      to: email,
      ...template
    });
  }

  /**
   * Send return confirmation email
   */
  async sendReturnConfirmationEmail(email, returnData) {
    const template = this.getReturnConfirmationTemplate(returnData);
    return this.sendEmail({
      to: email,
      ...template
    });
  }
}

// Initialize service
const emailService = new EmailService();
emailService.initializeTransporter();

module.exports = emailService;

