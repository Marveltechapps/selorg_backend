const authService = require("../service/authService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Send OTP to mobile number
 */
async function sendOTP(req, res) {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return failure(res, {
        statusCode: 400,
        message: "Mobile number is required"
      });
    }

    const result = await authService.sendOTP(mobileNumber.trim());

    return success(res, {
      message: result.message,
      data: { expiresIn: result.expiresIn }
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to send OTP"
    });
  }
}

/**
 * Verify OTP and return JWT token
 */
async function verifyOTP(req, res) {
  try {
    const { mobileNumber, enteredOTP } = req.body;

    if (!mobileNumber || !enteredOTP) {
      return failure(res, {
        statusCode: 400,
        message: "Mobile number and OTP are required"
      });
    }

    const result = await authService.verifyOTPAndLogin(
      mobileNumber.trim(),
      enteredOTP.trim()
    );

    return success(res, {
      message: result.message,
      data: {
        userId: result.userId,
        token: result.token,
        user: result.user
      }
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to verify OTP"
    });
  }
}

/**
 * Resend OTP
 */
async function resendOTP(req, res) {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return failure(res, {
        statusCode: 400,
        message: "Mobile number is required"
      });
    }

    const result = await authService.resendOTP(mobileNumber.trim());

    return success(res, {
      message: result.message,
      data: { expiresIn: result.expiresIn }
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to resend OTP"
    });
  }
}

module.exports = { sendOTP, verifyOTP, resendOTP };
