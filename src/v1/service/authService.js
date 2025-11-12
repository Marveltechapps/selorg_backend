const bcrypt = require("bcryptjs");
const UserModel = require("../model/userModel");
const generateToken = require("../auths/generateToken");
const { ApiError } = require("../utils/apiError");
const smsService = require("./smsService");

/**
 * AuthService - Handles authentication logic including OTP generation, verification
 */
class AuthService {
  /**
   * Generate a 4-digit OTP
   * @returns {string} 4-digit OTP (1000-9999)
   */
  generateOTP() {
    // Generate exactly 4-digit OTP (1000 to 9999)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Verify it's 4 digits (safety check)
    if (otp.length !== 4) {
      console.error('⚠️  OTP generation error - regenerating');
      return this.generateOTP();
    }
    
    console.log('🔢 OTP Generated:', otp, '(4 digits)');
    return otp;
  }

  /**
   * Validate mobile number format
   * @param {string} mobileNumber
   * @returns {boolean}
   */
  validateMobileNumber(mobileNumber) {
    return /^\d{10}$/.test(mobileNumber) && !/^0{10}$/.test(mobileNumber);
  }

  /**
   * Hash OTP for secure storage
   * @param {string} otp - Plain text OTP
   * @returns {Promise<string>} Hashed OTP
   */
  async hashOTP(otp) {
    return await bcrypt.hash(otp, 10);
  }

  /**
   * Verify OTP against hashed value
   * @param {string} plainOTP - Plain text OTP from user
   * @param {string} hashedOTP - Hashed OTP from database
   * @returns {Promise<boolean>}
   */
  async verifyOTP(plainOTP, hashedOTP) {
    return await bcrypt.compare(plainOTP, hashedOTP);
  }

  /**
   * Send OTP via SMS
   * @param {string} mobileNumber
   * @param {string} otp
   * @returns {Promise<void>}
   */
  async sendSMS(mobileNumber, otp) {
    try {
      await smsService.sendOTP(mobileNumber, otp);
    } catch (error) {
      throw new ApiError(500, "Failed to send OTP via SMS", {
        details: error.message
      });
    }
  }

  /**
   * Send OTP to user's mobile number
   * @param {string} mobileNumber
   * @returns {Promise<Object>} Result object
   */
  async sendOTP(mobileNumber) {
    // Validate mobile number
    if (!this.validateMobileNumber(mobileNumber)) {
      throw new ApiError(400, "Invalid mobile number format");
    }

    // Find or create user
    let user = await UserModel.findOne({ mobileNumber });
    if (!user) {
      user = new UserModel({ mobileNumber, isVerified: false });
    }

    // Generate OTP
    const otp = this.generateOTP();
    
    // 🔥 DEVELOPMENT MODE: Log OTP to console
    if (process.env.NODE_ENV === 'development') {
      console.log('\n' + '🔐'.repeat(30));
      console.log(`📱 MOBILE NUMBER: ${mobileNumber}`);
      console.log(`🔑 YOUR OTP: ${otp}`);
      console.log(`⏰ VALID FOR: 5 minutes`);
      console.log(`💡 Use this OTP to verify in Postman/Frontend`);
      console.log('🔐'.repeat(30) + '\n');
    }
    
    // 📱 ALWAYS attempt to send SMS (even in development)
    let smsResult = null;
    try {
      console.log('\n🚀 Attempting to send SMS to:', mobileNumber);
      await this.sendSMS(mobileNumber, otp);
      smsResult = { sent: true };
      
      console.log('\n' + '✅'.repeat(35));
      console.log('✅ SMS SENT SUCCESSFULLY TO YOUR PHONE!');
      console.log('✅ Mobile Number:', mobileNumber);
      console.log('✅ Check your phone for OTP');
      console.log('✅'.repeat(35) + '\n');
    } catch (error) {
      console.error('\n' + '❌'.repeat(35));
      console.error('❌ SMS SENDING FAILED!');
      console.error('❌ Error:', error.message);
      console.error('❌ Mobile Number:', mobileNumber);
      console.error('❌'.repeat(35));
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n💡 DEVELOPMENT MODE FALLBACK:');
        console.log('💡 SMS failed but you can still test with console OTP above');
        console.log('💡 To fix SMS delivery, run: npm run test:sms ' + mobileNumber);
        console.log('💡 Or check SMS_TESTING_GUIDE.md for troubleshooting\n');
        smsResult = { sent: false, reason: error.message, fallback: 'console_otp' };
        
        // Show the specific error to help debug
        console.error('🔍 SMS ERROR DETAILS:', error.stack || error);
      } else {
        // In production, SMS must work - throw error
        throw error;
      }
    }

    // Hash and store OTP
    user.otp = await this.hashOTP(otp);
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    user.isVerified = false;
    await user.save();

    return {
      message: smsResult?.sent 
        ? "OTP sent successfully to your phone" 
        : "OTP generated (check console - SMS delivery failed)",
      expiresIn: 300, // seconds
      devMode: process.env.NODE_ENV === 'development',
      smsDelivery: {
        attempted: true,
        delivered: smsResult?.sent || false,
        channel: smsResult?.sent ? 'SMS' : 'console_only',
        reason: smsResult?.reason || null
      },
      debug: process.env.NODE_ENV === 'development' ? {
        consoleOTP: 'Check server console for OTP',
        smsStatus: smsResult
      } : undefined
    };
  }

  /**
   * Verify OTP and generate JWT token
   * @param {string} mobileNumber
   * @param {string} enteredOTP
   * @returns {Promise<Object>} User and token
   */
  async verifyOTPAndLogin(mobileNumber, enteredOTP) {
    const user = await UserModel.findOne({ mobileNumber });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.otp) {
      throw new ApiError(400, "No OTP found. Please request a new OTP");
    }

    // Check OTP expiry
    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      throw new ApiError(400, "OTP has expired. Please request a new one");
    }

    // Verify OTP
    const isValid = await this.verifyOTP(enteredOTP, user.otp);
    if (!isValid) {
      throw new ApiError(400, "Incorrect OTP");
    }

    // Mark user as verified
    user.isVerified = true;
    user.mobileVerifiedAt = new Date();
    user.otp = null;
    user.otpExpiresAt = null;
    user.lastActiveAt = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user);

    return {
      message: "OTP verified successfully",
      userId: user._id,
      token,
      user: {
        id: user._id,
        mobileNumber: user.mobileNumber,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    };
  }

  /**
   * Resend OTP
   * @param {string} mobileNumber
   * @returns {Promise<Object>}
   */
  async resendOTP(mobileNumber) {
    const user = await UserModel.findOne({ mobileNumber });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Generate new OTP
    const otp = this.generateOTP();
    
    // Send SMS
    await this.sendSMS(mobileNumber, otp);

    // Hash and store OTP
    user.otp = await this.hashOTP(otp);
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    return {
      message: "OTP resent successfully",
      expiresIn: 300
    };
  }
}

module.exports = new AuthService();

